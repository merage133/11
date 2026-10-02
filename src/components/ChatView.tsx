import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, Copy, Check, Bot, User, Paperclip, Monitor, Mic, MicOff } from 'lucide-react';
import { Message } from '../types';
import { useVoice, captureScreen } from '../hooks/useVoice';
import { CodeBlock } from './CodeBlock';
import { CodeRunner } from './CodeRunner';

interface ChatViewProps {
  messages: Message[];
  streamingContent: string | null;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
  attachedFileIds: string[];
  onAttachFile: () => void;
  onScreenshot: (base64: string) => void;
  statusText?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  streamingContent,
  onSendMessage,
  isLoading,
  onStop,
  attachedFileIds,
  onAttachFile,
  onScreenshot,
  statusText,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeRunner, setCodeRunner] = useState<{ code: string; language: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    interimTranscript,
    toggleListening,
    isSupported: voiceSupported,
  } = useVoice((finalText) => {
    setInput((prev) => prev + finalText);
  });



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onSendMessage(text);
    setInput('');
    // Если голос активен — не останавливаем, пусть продолжает слушать
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback для старых браузеров или iframe
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (e) {
        console.error('Не удалось скопировать:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleScreenCapture = async () => {
    const image = await captureScreen();
    if (image) {
      onScreenshot(image);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center mb-5 shadow-lg">
              <Bot className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Mirage AI
            </h2>
            <p className="text-text-secondary text-sm max-w-md mb-2">
              AI с полным доступом к вашему компьютеру
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-xs border border-green/20">
                🎤 Голос
              </span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs border border-accent/20">
                🖥️ Экран
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple/10 text-purple text-xs border border-purple/20">
                📁 Файлы
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange/10 text-orange text-xs border border-orange/20">
                ⚡ Команды
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red/10 text-red text-xs border border-red/20">
                🔒 Приватно
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                'Сделай скриншот и опиши что видишь',
                'Покажи файлы на рабочем столе',
                'Выключи компьютер через 10 секунд',
                'Открой Google и найди погоду',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="px-4 py-3 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary hover:border-accent/30 transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-slide-up ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                )}
                <div
                  className={`group relative max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-sm px-4 py-3'
                      : 'bg-bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Screenshot"
                          className="mt-2 rounded-lg max-w-full border border-border"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            const codeString = String(children).replace(/\n$/, '');
                            
                            // Если это блочный код (с language или многострочный)
                            if (language || codeString.includes('\n')) {
                              return (
                                <CodeBlock
                                  code={codeString}
                                  language={language}
                                  onRun={(code, lang) => setCodeRunner({ code, language: lang })}
                                />
                              );
                            }
                            
                            // Инлайн код
                            return (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Screenshot"
                          className="mt-2 rounded-lg max-w-full border border-border"
                        />
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-bg-tertiary hover:bg-bg-hover transition-all"
                    title="Копировать"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </button>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-purple" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <div className="markdown-content text-sm">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <span className="text-xs text-text-muted">{statusText || 'Думаю...'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-bg-primary/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {attachedFileIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFileIds.map((fileId: string) => (
                <span
                  key={fileId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent"
                >
                  📄 {fileId.length > 20 ? fileId.slice(0, 20) + '...' : fileId}
                </span>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-xl p-2 focus-within:border-accent/50 transition-colors shadow-lg">
              <button
                type="button"
                onClick={onAttachFile}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
                title="Прикрепить файлы"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleScreenCapture}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
                title="Скриншот экрана"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input + (isListening && interimTranscript ? ' ' + interimTranscript : '')}
                onChange={(e) => {
                  if (isListening && interimTranscript) {
                    const newValue = e.target.value;
                    if (!newValue.includes(interimTranscript)) {
                      setInput(newValue);
                    }
                  } else {
                    setInput(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎤 Говорите...' : 'Спросите что-нибудь...'}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none outline-none min-h-[36px] max-h-[200px] py-1.5"
                rows={1}
              />
              
              {/* Voice indicator */}
              {isListening && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red/10 border border-red/20 shrink-0">
                  <div className="w-2 h-2 bg-red rounded-full animate-pulse-dot" />
                  <span className="text-xs text-red">Слушаю...</span>
                </div>
              )}
              
              {/* Voice button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isListening
                      ? 'bg-red/10 text-red hover:bg-red/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}
                  title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="p-2 rounded-lg bg-red/10 text-red hover:bg-red/20 transition-colors shrink-0"
                  title="Остановить"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && !interimTranscript}
                  className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  title="Отправить"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
          <p className="text-[10px] text-text-muted mt-2 text-center tracking-wide">
            🔒 Локально • 🖥️ Экран • 📁 Файлы • ⚡ Команды • 🔍 Поиск • Ollama
          </p>
        </div>
      </div>

      {/* Code Runner */}
      {codeRunner && (
        <CodeRunner
          isOpen={true}
          code={codeRunner.code}
          language={codeRunner.language}
          onClose={() => setCodeRunner(null)}
        />
      )}
    </div>
  );
};
