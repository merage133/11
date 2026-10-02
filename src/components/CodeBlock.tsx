import React, { useState } from 'react';
import { Copy, Check, Play, Code2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  onRun?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onRun }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRun = () => {
    if (onRun && language) {
      onRun(code, language);
    }
  };

  const canRun = language && [
    'javascript', 'js', 'html', 'css', 'typescript', 'ts',
    'python', 'py', 'c++', 'cpp', 'c', 'c#', 'csharp', 'java', 'go', 'rust', 'rs'
  ].includes(language.toLowerCase());

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border bg-bg-tertiary">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-primary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted font-mono">
            {language || 'code'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canRun && (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-green hover:bg-green/10 transition-colors"
              title="Запустить код"
            >
              <Play className="w-3 h-3" />
              <span>Запуск</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
            title="Копировать код"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green" />
                <span className="text-green">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Code */}
      <pre className="p-3 overflow-x-auto text-sm">
        <code className={`language-${language || 'text'}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};
