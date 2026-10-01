import React from 'react';
import {
  MessageSquare,
  Plus,
  Settings,
  FolderTree,
  Cpu,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSession: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenFiles: () => void;
  ollamaConnected: boolean;
  currentModel: string;
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenSettings,
  onOpenFiles,
  ollamaConnected,
  currentModel,
  collapsed,
}) => {
  const [sessionsExpanded, setSessionsExpanded] = React.useState(true);

  if (collapsed) return null;

  return (
    <div className="w-64 h-full bg-bg-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-accent" />
          <h1 className="text-sm font-bold text-text-primary">RU AI Studio</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              ollamaConnected ? 'bg-green animate-pulse-dot' : 'bg-red'
            }`}
          />
          <span className="text-text-secondary">
            {ollamaConnected ? currentModel : 'Не подключено'}
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новый чат
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3">
        <button
          onClick={() => setSessionsExpanded(!sessionsExpanded)}
          className="flex items-center gap-1 text-xs text-text-muted uppercase tracking-wider mb-2 hover:text-text-secondary transition-colors"
        >
          {sessionsExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Диалоги ({sessions.length})
        </button>
        {sessionsExpanded && (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeSession === session.id
                    ? 'bg-bg-hover text-text-primary'
                    : 'text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate flex-1">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-text-muted px-3 py-2">
                Нет диалогов. Создайте новый!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={onOpenFiles}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm"
        >
          <FolderTree className="w-4 h-4" />
          Файлы репозитория
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Настройки
        </button>
      </div>
    </div>
  );
};
