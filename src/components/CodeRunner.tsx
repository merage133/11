import React, { useState } from 'react';
import { X, Play, RotateCcw } from 'lucide-react';

interface CodeRunnerProps {
  isOpen: boolean;
  code: string;
  language: string;
  onClose: () => void;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ isOpen, code, language, onClose }) => {
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  const generateHTML = () => {
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
    
    return `<pre>${code}</pre>`;
  };

  const handleRestart = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-bg-secondary border-l border-border flex flex-col shadow-2xl z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-green" />
          <span className="text-sm font-medium text-text-primary">
            Запуск кода ({language})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Перезапустить"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden bg-white">
        <iframe
          key={iframeKey}
          srcDoc={generateHTML()}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Code Preview"
        />
      </div>
    </div>
  );
};
