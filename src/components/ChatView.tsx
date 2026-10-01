import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, Copy, Check, Bot, User, Paperclip } from 'lucide-react';
import { Message } from '../types';

interface ChatViewProps {
  messages: Message[];
  streamingContent: string | null;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
  attachedFileIds: string[];
  onAttachFile: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  streamingContent,
  onSendMessage,
  isLoading,
  onStop,
  attachedFileIds,
  onAttachFile,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
              RU AI Studio
            </h2>
            <p className="text-text-secondary text-sm max-w-md mb-2">
              Локальный AI-ассистент для работы с кодом
            </p>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-xs border border-green/20">
                🔒 Приватно
              </span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs border border-accent/20">
                ⚡ Без цензуры
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple/10 text-purple text-xs border border-purple/20">
                🏠 Оффлайн
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                'Напиши REST API на Express',
                'Объясни этот код и найди баги',
                'Создай React компонент с хуками',
                'Оптимизируй SQL запрос',
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
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
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

            {/* Loading indicator (before first chunk) */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
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
                title="Прикрепить файлы из репозитория"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спросите что-нибудь... (Shift+Enter — новая строка)"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none outline-none min-h-[36px] max-h-[200px] py-1.5"
                rows={1}
              />
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
                  disabled={!input.trim()}
                  className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  title="Отправить"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
          <p className="text-[10px] text-text-muted mt-2 text-center tracking-wide">
            🔒 Полностью локально • Данные не покидают ваш компьютер • Ollama
          </p>
        </div>
      </div>
    </div>
  );
};
