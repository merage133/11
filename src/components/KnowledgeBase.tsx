import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, ExternalLink } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  url: string;
  title: string;
  addedAt: Date;
  content?: string;
}

interface KnowledgeBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Загружаем базу знаний из localStorage
    const saved = localStorage.getItem('knowledge-base');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.map((item: any) => ({ ...item, addedAt: new Date(item.addedAt) })));
      } catch (e) {
        console.error('Failed to load knowledge base:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Сохраняем базу знаний в localStorage
    localStorage.setItem('knowledge-base', JSON.stringify(items));
  }, [items]);

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    setIsLoading(true);
    try {
      // Пытаемся получить содержимое страницы через наш сервер
      const response = await fetch('http://localhost:3001/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        const newItem: KnowledgeItem = {
          id: Date.now().toString(),
          url: newUrl,
          title: data.title || newUrl,
          addedAt: new Date(),
          content: data.content,
        };
        setItems([...items, newItem]);
        setNewUrl('');
      } else {
        // Если не удалось получить содержимое, добавляем просто ссылку
        const newItem: KnowledgeItem = {
          id: Date.now().toString(),
          url: newUrl,
          title: newUrl,
          addedAt: new Date(),
        };
        setItems([...items, newItem]);
        setNewUrl('');
      }
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      // Добавляем просто ссылку
      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        url: newUrl,
        title: newUrl,
        addedAt: new Date(),
      };
      setItems([...items, newItem]);
      setNewUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">База знаний</h2>
              <p className="text-xs text-text-secondary">Добавьте ссылки для обучения AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add URL */}
        <div className="p-5 border-b border-border">
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              placeholder="https://example.com/article"
              className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleAddUrl}
              disabled={isLoading || !newUrl.trim()}
              className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Добавить
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">База знаний пуста</p>
              <p className="text-text-muted text-xs mt-1">Добавьте ссылки на статьи, документацию или любые материалы</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-tertiary border border-border rounded-lg p-4 hover:border-text-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-purple shrink-0" />
                        <h3 className="text-sm font-medium text-text-primary truncate">
                          {item.title}
                        </h3>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {item.url}
                      </a>
                      {item.content && (
                        <p className="text-xs text-text-muted mt-2 line-clamp-2">
                          {item.content.slice(0, 200)}...
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        Добавлено: {item.addedAt.toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red/10 text-text-muted hover:text-red transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-tertiary">
          <p className="text-xs text-text-muted text-center">
            AI будет использовать эти материалы для ответов на ваши вопросы
          </p>
        </div>
      </div>
    </div>
  );
};
