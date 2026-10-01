import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, Square, Bot, User, Play, RotateCcw, Code2 } from 'lucide-react';
import { Message } from '../types';
import { CodeBlock } from './CodeBlock';

interface CoderViewProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  streamingContent: string | null;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
  currentModel: string;
}

export const CoderView: React.FC<CoderViewProps> = ({
  isOpen,
  onClose,
  messages,
  streamingContent,
  onSendMessage,
  isLoading,
  onStop,
  currentModel,
}) => {
  const [input, setInput] = useState('');
  const [codeRunner, setCodeRunner] = useState<{ code: string; language: string } | null>(null);
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
    const text = input.trim();
    if (!text || isLoading) return;
    onSendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-primary z-50 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-bg-secondary">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-bold text-text-primary">CODER</h1>
        </div>
        <span className="px-2 py-1 rounded-md bg-bg-tertiary border border-border text-xs text-text-muted code-font">
          {currentModel}
        </span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center mb-5">
                  <Code2 className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">CODER</h2>
                <p className="text-text-secondary text-sm max-w-md mb-6">
                  AI-ассистент для написания кода с предпросмотром и запуском
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    'Напиши функцию сортировки на JavaScript',
                    'Создай HTML страницу с формой',
                    'Напиши CSS анимацию',
                    'Создай React компонент',
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
                          <ReactMarkdown
                            components={{
                              code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const codeString = String(children).replace(/\n$/, '');
                                
                                if (language || codeString.includes('\n')) {
                                  return (
                                    <CodeBlock
                                      code={codeString}
                                      language={language}
                                      onRun={(code, lang) => setCodeRunner({ code, language: lang })}
                                    />
                                  );
                                }
                                
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
                        </div>
                      )}
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
                        <span className="text-xs text-text-muted">Пишу код...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 bg-bg-primary/50">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-xl p-2 focus-within:border-accent/50 transition-colors shadow-lg">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Опишите какой код написать..."
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
                💻 CODER • Предпросмотр и запуск кода
              </p>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-[500px] flex flex-col bg-bg-secondary">
          {codeRunner ? (
            <>
              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-tertiary">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green" />
                  <span className="text-sm font-medium text-text-primary">
                    Предпросмотр ({codeRunner.language})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCodeRunner({ ...codeRunner })}
                    className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                    title="Перезапустить"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCodeRunner(null)}
                    className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                    title="Закрыть предпросмотр"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-hidden bg-white">
                <iframe
                  key={codeRunner.code}
                  srcDoc={generatePreviewHTML(codeRunner.code, codeRunner.language)}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Code Preview"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Code2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted text-sm">Предпросмотр кода</p>
                <p className="text-text-muted text-xs mt-1">
                  Нажмите "Запуск" на блоке кода чтобы увидеть результат
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function generatePreviewHTML(code: string, language: string): string {
  const lang = language.toLowerCase();
  
  if (lang === 'html' || lang === 'htm') {
    return code;
  }
  
  if (lang === 'javascript' || lang === 'js') {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: monospace; 
      padding: 20px; 
      background: #0d1117; 
      color: #e6edf3;
    }
    .log { 
      margin: 5px 0; 
      padding: 5px;
      background: #161b22;
      border-radius: 4px;
    }
    .error { color: #f85149; }
    .info { color: #58a6ff; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    const output = document.getElementById('output');
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      const div = document.createElement('div');
      div.className = 'log info';
      div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      output.appendChild(div);
      originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
      const div = document.createElement('div');
      div.className = 'log error';
      div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      output.appendChild(div);
      originalError.apply(console, args);
    };
    
    try {
      ${code}
    } catch (e) {
      console.error('Ошибка:', e.message);
    }
  </script>
</body>
</html>`;
  }
  
  if (lang === 'typescript' || lang === 'ts') {
    return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.min.js"></script>
  <style>
    body { 
      font-family: monospace; 
      padding: 20px; 
      background: #0d1117; 
      color: #e6edf3;
    }
    .log { 
      margin: 5px 0; 
      padding: 5px;
      background: #161b22;
      border-radius: 4px;
    }
    .error { color: #f85149; }
    .info { color: #58a6ff; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    const output = document.getElementById('output');
    
    function log(...args) {
      const div = document.createElement('div');
      div.className = 'log info';
      div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      output.appendChild(div);
    }
    
    try {
      const jsCode = ts.transpile(\`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
      eval(jsCode);
    } catch (e) {
      const div = document.createElement('div');
      div.className = 'log error';
      div.textContent = 'Ошибка: ' + e.message;
      output.appendChild(div);
    }
  </script>
</body>
</html>`;
  }
  
  if (lang === 'css') {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>${code}</style>
</head>
<body>
  <div class="demo">
    <h1>Демонстрация CSS</h1>
    <p>Это пример текста для демонстрации стилей.</p>
    <button>Кнопка</button>
  </div>
</body>
</html>`;
  }
  
  return `<pre style="padding: 20px; background: #0d1117; color: #e6edf3;">${code}</pre>`;
}
