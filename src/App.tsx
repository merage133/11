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
import { KnowledgeBase } from './components/KnowledgeBase';
import { BranchManager } from './components/BranchManager';
import { CoderView } from './components/CoderView';
import { ActionConfirmation } from './components/ActionConfirmation';

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
        messages: (s.messages || []).map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })),
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
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [showCoder, setShowCoder] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; sessionIds: string[]; createdAt: Date }>>([]);
  const [coderMessages, setCoderMessages] = useState<Message[]>([]);
  const [coderStreaming, setCoderStreaming] = useState<string | null>(null);
  const [coderLoading, setCoderLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allFiles, setAllFiles] = useState<FileNode[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [statusText, setStatusText] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  const abortRef = useRef<AbortController | null>(null);  const streamingContentRef = useRef('');
  const sessionsRef = useRef(sessions);
  
  // Обновляем ref при изменении streamingContent
  useEffect(() => {
    streamingContentRef.current = streamingContent;
  }, [streamingContent]);
  
  // Обновляем ref при изменении sessions
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);



  useEffect(() => {
    localStorage.setItem('ru-ai-studio-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ru-ai-studio-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // WebSocket подключение для подтверждения опасных действий
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3002');
    
    websocket.onopen = () => {
      console.log('[WS] Connected to server');
      setWs(websocket);
    };
    
    websocket.onclose = () => {
      console.log('[WS] Disconnected from server');
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
    
    return () => {
      websocket.close();
    };
  }, []);

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
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          const updatedMessages = [...s.messages, msg];
          const title = s.messages.length === 0 && msg.role === 'user'
            ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
            : s.title;
          return { ...s, messages: updatedMessages, title };
        }
        return s;
      });
      // Обновляем ref синхронно
      sessionsRef.current = updated;
      return updated;
    });
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
        // Получаем текущую историю (addMessageToSession уже обновил sessionsRef)
        const currentSession = sessionsRef.current.find((s) => s.id === sessionId);
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

        try {
          setStatusText('Анализирую запрос...');
          let toolResponse = await sendOllamaMessageWithTools(
            settings.ollamaUrl,
            settings.selectedModel,
            apiMessages,
            TOOL_DEFINITIONS,
            settings.temperature,
            controller.signal
          );

          // Проверяем есть ли tool calls
          if (toolResponse.message.tool_calls && toolResponse.message.tool_calls.length > 0) {
            let toolMessages = [...apiMessages, toolResponse.message];
            let hasMoreToolCalls = true;
            let iterations = 0;
            const maxIterations = 10; // Максимум 10 итераций для автоматической проверки кода

            // Цикл для автоматической проверки и исправления кода
            while (hasMoreToolCalls && iterations < maxIterations) {
              iterations++;
              setStatusText(`⚡ Итерация ${iterations}: Выполняю инструменты...`);

              // Выполняем каждый tool call
              const currentToolCalls = toolResponse.message.tool_calls || [];
              for (const toolCall of currentToolCalls) {
                const toolName = toolCall.function.name;
                
                // Улучшенные индикаторы выполнения
                const toolIndicators: Record<string, string> = {
                  'search_internet': '🔍 AI ищет в интернете...',
                  'get_exchange_rate': '💱 AI получает курс валют...',
                  'get_weather': '🌤️ AI проверяет погоду...',
                  'get_current_time': '🕐 AI узнаёт время...',
                  'take_screenshot': '📸 AI делает скриншот...',
                  'list_files': '📁 AI просматривает файлы...',
                  'read_file': '📖 AI читает файл...',
                  'write_file': '✍️ AI записывает файл...',
                  'run_command': '💻 AI выполняет команду...',
                  'compile_and_run': '⚙️ AI компилирует и запускает код...',
                  'search_knowledge_base': '📚 AI ищет в базе знаний...',
                  'shutdown_pc': '⚠️ AI запрашивает выключение...',
                  'restart_pc': '⚠️ AI запрашивает перезагрузку...',
                };
                
                setStatusText(toolIndicators[toolName] || `⚡ Выполняю: ${toolName}...`);

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

              // Отправляем результаты обратно в AI для проверки
              setStatusText('Анализирую результаты...');
              const nextResponse = await sendOllamaMessageWithTools(
                settings.ollamaUrl,
                settings.selectedModel,
                toolMessages,
                TOOL_DEFINITIONS,
                settings.temperature,
                controller.signal
              );

              // Проверяем есть ли ещё tool calls
              if (nextResponse.message.tool_calls && nextResponse.message.tool_calls.length > 0) {
                toolMessages.push(nextResponse.message);
                toolResponse = nextResponse;
              } else {
                // Нет больше tool calls - получаем финальный ответ
                hasMoreToolCalls = false;
                finalResponse = nextResponse.message.content;
                
                // Стримим финальный ответ
                if (finalResponse) {
                  setStreamingContent(finalResponse);
                }
              }
            }

            // Если достигли лимита итераций
            if (iterations >= maxIterations && hasMoreToolCalls) {
              setStatusText('Достигнут лимит итераций');
              finalResponse = toolResponse.message.content || 'Достигнут лимит автоматических проверок.';
              if (finalResponse) {
                setStreamingContent(finalResponse);
              }
            }
          } else {
            // Нет tool calls — показываем ответ сразу
            finalResponse = toolResponse.message.content;
            if (finalResponse) {
              setStreamingContent(finalResponse);
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
          content: finalResponse || streamingContentRef.current,
          timestamp: new Date(),
          model: settings.selectedModel,
        };

        addMessageToSession(sessionId, assistantMessage);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (streamingContentRef.current) {
            const partialMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: streamingContentRef.current + '\n\n*[Остановлено]*',
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
            content: `⚠️ **Ошибка:**\n\n\`${err.message}\`\n\n---\n\n**Решение:**\n1. Убедитесь что Ollama запущена: \`ollama serve\`\n2. Проверьте URL: ${settings.ollamaUrl}\n3. Установите модель: \`ollama pull qwen2.5:7b\`\n4. Для системных команд запустите: \`node server.cjs\``,
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
    [activeSessionId, settings, allFiles, attachedFileIds, addMessageToSession, streamingContentRef]
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

  const handleCoderMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setCoderMessages((prev) => [...prev, userMessage]);
    setCoderLoading(true);
    setCoderStreaming('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = [
        { role: 'system', content: 'Ты — AI-ассистент для написания кода. Пиши код качественно, с комментариями. Оборачивай код в блоки ```язык ... ```.' },
        ...coderMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ];

      const response = await sendOllamaMessage(
        settings.ollamaUrl,
        settings.selectedModel,
        apiMessages,
        settings.temperature,
        (chunk) => setCoderStreaming((prev) => (prev || '') + chunk),
        controller.signal
      );

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response || coderStreaming || '',
        timestamp: new Date(),
        model: settings.selectedModel,
      };

      setCoderMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Ошибка: ${err.message}`,
        timestamp: new Date(),
      };
      setCoderMessages((prev) => [...prev, errorMessage]);
    } finally {
      setCoderLoading(false);
      setCoderStreaming(null);
      abortRef.current = null;
    }
  }, [coderMessages, coderStreaming, settings]);

  const handleScreenshot = useCallback(async (base64: string) => {
    // Добавляем скриншот как сообщение пользователя
    let sessionId = activeSessionId;
    
    if (!sessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: 'Скриншот экрана',
        messages: [],
        createdAt: new Date(),
        model: settings.selectedModel,
      };
      setSessions((prev) => [newSession, ...prev]);
      sessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const msg: Message = {
      id: generateId(),
      role: 'user',
      content: 'Пользователь сделал скриншот экрана. Посмотри на него и опиши что видишь.',
      timestamp: new Date(),
      image: base64,
    };
    addMessageToSession(sessionId, msg);
    
    // Отправляем запрос к AI напрямую (не через handleSendMessage чтобы избежать stale closure)
    setIsLoading(true);
    setStreamingContent('');
    setStatusText('Анализирую скриншот...');
    
    const controller = new AbortController();
    abortRef.current = controller;
    
    try {
      // Получаем историю из ref (addMessageToSession уже обновил sessionsRef)
      const currentSession = sessionsRef.current.find((s) => s.id === sessionId);
      const history = currentSession?.messages || [];
      
      const apiMessages = [
        { role: 'system', content: settings.systemPrompt },
        ...history.map((m) => ({
          role: m.role === 'tool' ? 'tool' as const : m.role,
          content: m.content,
        })),
      ];
      
      const response = await sendOllamaMessage(
        settings.ollamaUrl,
        settings.selectedModel,
        apiMessages,
        settings.temperature,
        (chunk) => setStreamingContent((prev) => prev + chunk),
        controller.signal
      );
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response || streamingContentRef.current,
        timestamp: new Date(),
        model: settings.selectedModel,
      };
      
      addMessageToSession(sessionId, assistantMessage);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Ошибка');
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Ошибка: ${err.message}`,
        timestamp: new Date(),
      };
      addMessageToSession(sessionId, errorMessage);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStatusText('');
      abortRef.current = null;
    }
  }, [activeSessionId, addMessageToSession, settings, sessionsRef]);

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
          onOpenKnowledge={() => setShowKnowledge(true)}
          onOpenBranches={() => setShowBranches(true)}
          onOpenCoder={() => setShowCoder(true)}
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
            onOpenKnowledge={() => {
              setShowKnowledge(true);
              setSidebarCollapsed(true);
            }}
            onOpenBranches={() => {
              setShowBranches(true);
              setSidebarCollapsed(true);
            }}
            onOpenCoder={() => {
              setShowCoder(true);
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
              {activeSession ? activeSession.title : 'Mirage AI'}
            </span>
          </div>
          <div className="flex-1" />
          {statusText && (
            <span className="text-xs text-accent animate-pulse hidden sm:block">{statusText}</span>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="px-2 py-1 rounded-md bg-bg-tertiary border border-border text-xs text-text-muted code-font hover:bg-bg-hover hover:border-accent/30 transition-colors cursor-pointer"
              title="Нажмите для смены модели"
            >
              {settings.selectedModel}
            </button>
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

      {showKnowledge && (
        <KnowledgeBase
          isOpen={showKnowledge}
          onClose={() => setShowKnowledge(false)}
        />
      )}

      {showBranches && (
        <BranchManager
          isOpen={showBranches}
          onClose={() => setShowBranches(false)}
          sessions={sessions}
          branches={branches}
          onCreateBranch={(name) => {
            const newBranch = {
              id: generateId(),
              name,
              sessionIds: [],
              createdAt: new Date(),
            };
            setBranches([...branches, newBranch]);
          }}
          onDeleteBranch={(id) => {
            setBranches(branches.filter((b) => b.id !== id));
          }}
          onAddSessionToBranch={(branchId, sessionId) => {
            setBranches(
              branches.map((b) =>
                b.id === branchId
                  ? { ...b, sessionIds: [...b.sessionIds, sessionId] }
                  : b
              )
            );
          }}
          onRemoveSessionFromBranch={(branchId, sessionId) => {
            setBranches(
              branches.map((b) =>
                b.id === branchId
                  ? { ...b, sessionIds: b.sessionIds.filter((id) => id !== sessionId) }
                  : b
              )
            );
          }}
        />
      )}

      {showCoder && (
        <CoderView
          isOpen={showCoder}
          onClose={() => setShowCoder(false)}
          messages={coderMessages}
          streamingContent={coderStreaming}
          onSendMessage={handleCoderMessage}
          isLoading={coderLoading}
          onStop={() => abortRef.current?.abort()}
          currentModel={settings.selectedModel}
        />
      )}

      {/* Подтверждение опасных действий */}
      <ActionConfirmation ws={ws} />

    </div>
  );
}
