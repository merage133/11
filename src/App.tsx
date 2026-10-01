import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Message, ChatSession, FileNode, AppSettings } from './types';
import { DEFAULT_SETTINGS, sendOllamaMessage, sendGigaChatMessage, checkOllamaConnection } from './config';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { SettingsPanel } from './components/SettingsPanel';
import { FileManager } from './components/FileManager';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('ru-ai-studio-settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem('ru-ai-studio-sessions');
    if (saved) {
      const sessions = JSON.parse(saved);
      return sessions.map((s: ChatSession) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        messages: s.messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })),
      }));
    }
  } catch {}
  return [];
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allFiles, setAllFiles] = useState<FileNode[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('ru-ai-studio-settings', JSON.stringify(settings));
  }, [settings]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('ru-ai-studio-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Check Ollama connection on mount and periodically
  useEffect(() => {
    const check = async () => {
      if (settings.provider === 'ollama') {
        const connected = await checkOllamaConnection(settings.ollamaUrl);
        setOllamaConnected(connected);
      } else {
        setOllamaConnected(true); // For non-Ollama providers, assume connected
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [settings.provider, settings.ollamaUrl]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'Новый диалог',
      messages: [],
      createdAt: new Date(),
      model: settings.selectedModel,
      provider: settings.provider,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [settings.selectedModel, settings.provider]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeSessionId) {
        createNewSession();
        return;
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // Build context with attached files
      let fullContent = content;
      if (attachedFileIds.length > 0) {
        const attachedFiles = attachedFileIds
          .map((id) => findFileById(id, allFiles))
          .filter(Boolean);

        if (attachedFiles.length > 0) {
          fullContent = content + '\n\n---\nПрикреплённые файлы:\n';
          attachedFiles.forEach((file) => {
            if (file) {
              fullContent += `\n### ${file.name}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\`\n`;
            }
          });
        }
      }

      // Add user message
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            const updatedMessages = [...s.messages, userMessage];
            const title = s.messages.length === 0 ? content.slice(0, 40) + (content.length > 40 ? '...' : '') : s.title;
            return { ...s, messages: updatedMessages, title };
          }
          return s;
        })
      );

      setIsLoading(true);
      setAttachedFileIds([]);

      try {
        const currentSession = sessions.find((s) => s.id === activeSessionId);
        const history = currentSession?.messages || [];

        const apiMessages = [
          { role: 'system', content: settings.systemPrompt },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: fullContent },
        ];

        let response = '';

        if (settings.provider === 'ollama') {
          response = await sendOllamaMessage(
            settings.ollamaUrl,
            settings.selectedModel,
            apiMessages,
            settings.temperature
          );
        } else if (settings.provider === 'gigachat') {
          response = await sendGigaChatMessage(
            settings.gigachatToken,
            settings.selectedModel,
            apiMessages
          );
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          model: settings.selectedModel,
        };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return { ...s, messages: [...s.messages, assistantMessage] };
            }
            return s;
          })
        );
      } catch (error: any) {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ **Ошибка подключения:**\n\n${error.message}\n\n---\n\n**Решение:**\n1. Убедитесь, что Ollama запущена: \`ollama serve\`\n2. Проверьте URL в настройках: ${settings.ollamaUrl}\n3. Установите модель: \`ollama pull qwen2.5-coder:7b\`\n\nОткройте настройки (⚙️) для помощи с подключением.`,
          timestamp: new Date(),
        };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return { ...s, messages: [...s.messages, errorMessage] };
            }
            return s;
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, sessions, settings, allFiles, attachedFileIds, createNewSession]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleAddFile = useCallback((file: FileNode) => {
    setAllFiles((prev) => [...prev, file]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setAllFiles((prev) => prev.filter((f) => f.id !== id));
    setAttachedFileIds((prev) => prev.filter((fid) => fid !== id));
  }, []);

  const handleToggleAttach = useCallback((id: string, file?: FileNode) => {
    // If file is provided and not in allFiles yet (e.g., from demo repo), add it
    if (file && file.content) {
      setAllFiles((prev) => {
        const exists = findFileById(id, prev);
        if (!exists) {
          return [...prev, file];
        }
        return prev;
      });
    }
    setAttachedFileIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg-primary">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed top-3 left-3 z-40 lg:hidden p-2 rounded-lg bg-bg-secondary border border-border text-text-secondary hover:text-text-primary transition-colors"
      >
        {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`hidden lg:block`}>
        <Sidebar
          sessions={sessions}
          activeSession={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          onOpenSettings={() => setShowSettings(true)}
          onOpenFiles={() => setShowFiles(true)}
          ollamaConnected={ollamaConnected}
          currentModel={settings.selectedModel}
          collapsed={false}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-30 ${sidebarCollapsed ? 'hidden' : ''}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarCollapsed(true)} />
        <div className="relative w-64 h-full">
          <Sidebar
            sessions={sessions}
            activeSession={activeSessionId}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              setSidebarCollapsed(true);
            }}
            onNewSession={() => {
              createNewSession();
              setSidebarCollapsed(true);
            }}
            onDeleteSession={deleteSession}
            onOpenSettings={() => {
              setShowSettings(true);
              setSidebarCollapsed(true);
            }}
            onOpenFiles={() => {
              setShowFiles(true);
              setSidebarCollapsed(true);
            }}
            ollamaConnected={ollamaConnected}
            currentModel={settings.selectedModel}
            collapsed={false}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-bg-secondary/50">
          <div className="lg:hidden w-8" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-green' : 'bg-red'}`} />
            <span className="text-sm text-text-secondary">
              {activeSession ? activeSession.title : 'RU AI Studio'}
            </span>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
            <span className="px-2 py-1 rounded bg-bg-tertiary border border-border code-font">
              {settings.selectedModel}
            </span>
            <span className="px-2 py-1 rounded bg-bg-tertiary border border-border">
              {settings.provider === 'ollama' ? '🏠 Локально' : settings.provider === 'gigachat' ? '🇷🇺 GigaChat' : '🇷🇺 YandexGPT'}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <ChatView
          messages={activeSession?.messages || []}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          attachedFileIds={attachedFileIds}
          onAttachFile={() => setShowFiles(true)}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* File Manager Modal */}
      {showFiles && (
        <FileManager
          files={allFiles}
          allFiles={allFiles}
          onAddFile={handleAddFile}
          onRemoveFile={handleRemoveFile}
          onClose={() => setShowFiles(false)}
          attachedFileIds={attachedFileIds}
          onToggleAttach={handleToggleAttach}
        />
      )}
    </div>
  );
}

// Helper function to find a file by ID in nested structure
function findFileById(id: string, files: FileNode[]): FileNode | null {
  for (const file of files) {
    if (file.id === id) return file;
    if (file.children) {
      const found = findFileById(id, file.children);
      if (found) return found;
    }
  }
  return null;
}
