import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, Copy, Check, Bot, User, Paperclip } from 'lucide-react';
import { Message } from '../types';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
  attachedFileIds: string[];
  onAttachFile: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
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
  }, [messages]);

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
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              RU AI Studio
            </h2>
            <p className="text-text-secondary text-sm max-w-md mb-6">
              Локальный AI-ассистент для работы с кодом. Подключён к Ollama — работает без интернета, без VPN, бесплатно.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                'Объясни этот код',
                'Найди баги в функции',
                'Напиши тесты для модуля',
                'Оптимизируй запрос',
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
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
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
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-bg-tertiary hover:bg-bg-hover transition-all"
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
                  <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-purple" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
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
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          {attachedFileIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFileIds.map((fileId: string) => (
                <span
                  key={fileId}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-tertiary border border-border text-xs text-text-secondary"
                >
                  📄 {fileId}
                </span>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-xl p-2 focus-within:border-accent/50 transition-colors">
              <button
                type="button"
                onClick={onAttachFile}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
                title="Прикрепить файл"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спросите что-нибудь о коде... (Shift+Enter для новой строки)"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none outline-none min-h-[36px] max-h-[200px] py-1.5"
                rows={1}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="p-2 rounded-lg bg-red/10 text-red hover:bg-red/20 transition-colors shrink-0"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
          <p className="text-xs text-text-muted mt-2 text-center">
            Работает на Ollama • Полностью локально • Без VPN
          </p>
        </div>
      </div>
    </div>
  );
};
