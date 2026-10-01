import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Message, ChatSession, FileNode, AppSettings } from './types';
import { DEFAULT_SETTINGS, sendOllamaMessage, sendOllamaMessageWithTools, checkOllamaConnection } from './config';
import { TOOL_DEFINITIONS, executeTool } from './tools';
import { captureScreen } from './hooks/useVoice';
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
  } catch { /* empty */ }
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
  } catch { /* empty */ }
  return [];
}

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
  const [streamingContent, setStreamingContent] = useState('');
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem('ru-ai-studio-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ru-ai-studio-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    const check = async () => {
      const connected = await checkOllamaConnection(settings.ollamaUrl);
      setOllamaConnected(connected);
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, [settings.ollamaUrl]);

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
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setStreamingContent('');
  }, [settings.selectedModel]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setStreamingContent('');
    }
  }, [activeSessionId]);

  // Добавить сообщение в сессию
  const addMessageToSession = useCallback((sessionId: string, msg: Message) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedMessages = [...s.messages, msg];
          const title = s.messages.length === 0 && msg.role === 'user'
            ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
            : s.title;
          return { ...s, messages: updatedMessages, title };
        }
        return s;
      })
    );
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const newSession: ChatSession = {
          id: generateId(),
          title: content.slice(0, 40),
          messages: [],
          createdAt: new Date(),
          model: settings.selectedModel,
        };
        setSessions((prev) => [newSession, ...prev]);
        sessionId = newSession.id;
        setActiveSessionId(newSession.id);
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      addMessageToSession(sessionId, userMessage);
      setIsLoading(true);
      setStreamingContent('');
      setAttachedFileIds([]);
      setStatusText('Думаю...');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Получаем текущую историю
        const currentSession = sessions.find((s) => s.id === sessionId);
        const history = currentSession?.messages || [];

        // Строим контекст с файлами
        let fullContent = content;
        if (attachedFileIds.length > 0) {
          const attachedFiles = attachedFileIds
            .map((id) => findFileById(id, allFiles))
            .filter(Boolean) as FileNode[];
          if (attachedFiles.length > 0) {
            fullContent += '\n\n---\n📎 Прикреплённые файлы:\n';
            attachedFiles.forEach((file) => {
              fullContent += `\n### ${file.name}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\`\n`;
            });
          }
        }

        // Формируем сообщения для API
        const apiMessages = [
          { role: 'system', content: settings.systemPrompt },
          ...history.map((m) => ({
            role: m.role === 'tool' ? 'tool' as const : m.role,
            content: m.content,
          })),
          { role: 'user', content: fullContent },
        ];

        // Пытаемся с tool calling
        let finalResponse = '';
        let usedTools = false;

        try {
          setStatusText('Анализирую запрос...');
          const toolResponse = await sendOllamaMessageWithTools(
            settings.ollamaUrl,
            settings.selectedModel,
            apiMessages,
            TOOL_DEFINITIONS,
            settings.temperature,
            controller.signal
          );

          // Проверяем есть ли tool calls
          if (toolResponse.message.tool_calls && toolResponse.message.tool_calls.length > 0) {
            usedTools = true;
            const toolMessages = [...apiMessages, toolResponse.message];

            // Выполняем каждый tool call
            for (const toolCall of toolResponse.message.tool_calls) {
              const toolName = toolCall.function.name;
              setStatusText(`⚡ Выполняю: ${toolName}...`);

              const result = await executeTool(toolCall, async () => {
                return captureScreen();
              });

              // Добавляем сообщение о результате инструмента
              const toolResultMsg: Message = {
                id: generateId(),
                role: 'tool',
                content: result.content,
                timestamp: new Date(),
                toolName: result.name,
                image: result.image,
              };
              addMessageToSession(sessionId!, toolResultMsg);

              // Добавляем результат в контекст
              toolMessages.push({
                role: 'tool',
                content: result.content,
              });
            }

            // Финальный запрос с результатами инструментов — стримим ответ
            setStatusText('Формирую ответ...');
            finalResponse = await sendOllamaMessage(
              settings.ollamaUrl,
              settings.selectedModel,
              toolMessages,
              settings.temperature,
              (chunk) => setStreamingContent((prev) => prev + chunk),
              controller.signal
            );
          } else {
            // Нет tool calls — стримим обычный ответ
            finalResponse = toolResponse.message.content;
            if (finalResponse) {
              // Стримим для UX
              const words = finalResponse.split(' ');
              let accumulated = '';
              for (const word of words) {
                accumulated += word + ' ';
                setStreamingContent(accumulated);
                await new Promise((r) => setTimeout(r, 20));
              }
            }
          }
        } catch (toolError) {
          // Если tool calling не поддерживается моделью — fallback на обычный стриминг
          if (toolError instanceof Error && toolError.message.includes('tools')) {
            setStatusText('Отвечаю...');
            finalResponse = await sendOllamaMessage(
              settings.ollamaUrl,
              settings.selectedModel,
              apiMessages,
              settings.temperature,
              (chunk) => setStreamingContent((prev) => prev + chunk),
              controller.signal
            );
          } else {
            throw toolError;
          }
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: finalResponse || streamingContent,
          timestamp: new Date(),
          model: settings.selectedModel,
        };

        addMessageToSession(sessionId, assistantMessage);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (streamingContent) {
            const partialMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: streamingContent + '\n\n*[Остановлено]*',
              timestamp: new Date(),
              model: settings.selectedModel,
            };
            addMessageToSession(sessionId, partialMessage);
          }
        } else {
          const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
          const errorMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: `⚠️ **Ошибка:**\n\n\`${err.message}\`\n\n---\n\n**Решение:**\n1. Убедитесь что Ollama запущена: \`ollama serve\`\n2. Проверьте URL: ${settings.ollamaUrl}\n3. Установите модель: \`ollama pull qwen2.5:7b\`\n4. Для системных команд запустите: \`node server.js\``,
            timestamp: new Date(),
          };
          addMessageToSession(sessionId, errorMessage);
        }
      } finally {
        setIsLoading(false);
        setStreamingContent('');
        setStatusText('');
        abortRef.current = null;
      }
    },
    [activeSessionId, sessions, settings, allFiles, attachedFileIds, streamingContent, addMessageToSession]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleAddFile = useCallback((file: FileNode) => {
    setAllFiles((prev) => [...prev, file]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setAllFiles((prev) => prev.filter((f) => f.id !== id));
    setAttachedFileIds((prev) => prev.filter((fid) => fid !== id));
  }, []);

  const handleToggleAttach = useCallback((id: string, file?: FileNode) => {
    if (file && file.content) {
      setAllFiles((prev) => {
        const exists = findFileById(id, prev);
        if (!exists) return [...prev, file];
        return prev;
      });
    }
    setAttachedFileIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  }, []);

  const handleScreenshot = useCallback((base64: string) => {
    // Добавляем скриншот как сообщение пользователя
    if (activeSessionId) {
      const msg: Message = {
        id: generateId(),
        role: 'user',
        content: '[Скриншот экрана]',
        timestamp: new Date(),
        image: base64,
      };
      addMessageToSession(activeSessionId, msg);
      // Отправляем с указанием что это скриншот
      handleSendMessage('Пользователь сделал скриншот экрана. Посмотри на него и опиши что видишь. Скриншот прикреплён к сообщению выше.');
    }
  }, [activeSessionId, addMessageToSession, handleSendMessage]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          sessions={sessions}
          activeSession={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setStreamingContent('');
          }}
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
        <div className="relative w-72 h-full">
          <Sidebar
            sessions={sessions}
            activeSession={activeSessionId}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              setStreamingContent('');
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
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-bg-secondary/50 backdrop-blur-sm">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-green' : 'bg-red'} ${ollamaConnected ? 'animate-pulse-dot' : ''}`} />
            <span className="text-sm text-text-secondary truncate">
              {activeSession ? activeSession.title : 'RU AI Studio'}
            </span>
          </div>
          <div className="flex-1" />
          {statusText && (
            <span className="text-xs text-accent animate-pulse hidden sm:block">{statusText}</span>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-bg-tertiary border border-border text-xs text-text-muted code-font">
              {settings.selectedModel}
            </span>
            <span className="px-2 py-1 rounded-md bg-green/5 border border-green/20 text-xs text-green">
              🔒 Локально
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <ChatView
          messages={activeSession?.messages || []}
          streamingContent={isLoading ? streamingContent : null}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          attachedFileIds={attachedFileIds}
          onAttachFile={() => setShowFiles(true)}
          onScreenshot={handleScreenshot}
        />
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

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
