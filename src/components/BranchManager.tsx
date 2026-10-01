import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GitBranch, MessageSquare } from 'lucide-react';
import { ChatSession } from '../types';

interface Branch {
  id: string;
  name: string;
  sessionIds: string[];
  createdAt: Date;
}

interface BranchManagerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  branches: Branch[];
  onCreateBranch: (name: string) => void;
  onDeleteBranch: (id: string) => void;
  onAddSessionToBranch: (branchId: string, sessionId: string) => void;
  onRemoveSessionFromBranch: (branchId: string, sessionId: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  isOpen,
  onClose,
  sessions,
  branches,
  onCreateBranch,
  onDeleteBranch,
  onAddSessionToBranch,
  onRemoveSessionFromBranch,
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      onCreateBranch(newBranchName.trim());
      setNewBranchName('');
    }
  };

  const unassignedSessions = sessions.filter(
    (s) => !branches.some((b) => b.sessionIds.includes(s.id))
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple/10 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Ветки и проекты</h2>
              <p className="text-xs text-text-secondary">Организуйте диалоги в ветки</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Branches List */}
          <div className="w-64 border-r border-border overflow-y-auto p-3">
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                  placeholder="Новая ветка..."
                  className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
                />
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim()}
                  className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedBranch === branch.id
                      ? 'bg-bg-hover border border-border'
                      : 'hover:bg-bg-hover/50'
                  }`}
                  onClick={() => setSelectedBranch(branch.id)}
                >
                  <GitBranch className="w-4 h-4 text-purple shrink-0" />
                  <span className="text-sm text-text-primary flex-1 truncate">
                    {branch.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {branch.sessionIds.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBranch(branch.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red/10 text-text-muted hover:text-red transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions in Branch */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedBranch ? (
              <>
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  Диалоги в ветке "{branches.find((b) => b.id === selectedBranch)?.name}"
                </h3>
                <div className="space-y-2 mb-4">
                  {branches
                    .find((b) => b.id === selectedBranch)
                    ?.sessionIds.map((sessionId) => {
                      const session = sessions.find((s) => s.id === sessionId);
                      if (!session) return null;
                      return (
                        <div
                          key={sessionId}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-border"
                        >
                          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-sm text-text-primary flex-1 truncate">
                            {session.title}
                          </span>
                          <button
                            onClick={() => onRemoveSessionFromBranch(selectedBranch, sessionId)}
                            className="p-1 rounded hover:bg-red/10 text-text-muted hover:text-red transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                <h3 className="text-sm font-medium text-text-primary mb-3">
                  Доступные диалоги
                </h3>
                <div className="space-y-2">
                  {unassignedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-border hover:border-accent/30 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text-secondary flex-1 truncate">
                        {session.title}
                      </span>
                      <button
                        onClick={() => onAddSessionToBranch(selectedBranch, session.id)}
                        className="p-1 rounded hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {unassignedSessions.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">
                      Нет доступных диалогов
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <GitBranch className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted text-sm">Выберите ветку для просмотра</p>
                  <p className="text-text-muted text-xs mt-1">
                    Или создайте новую ветку слева
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
