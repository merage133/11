import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface ActionConfirmationProps {
  ws: WebSocket | null;
}

interface PendingAction {
  actionId: string;
  action: string;
  description: string;
}

export const ActionConfirmation: React.FC<ActionConfirmationProps> = ({ ws }) => {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ACTION_REQUIRED') {
          setPendingAction({
            actionId: data.actionId,
            action: data.action,
            description: data.description,
          });
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const handleResponse = (approved: boolean) => {
    if (ws && pendingAction) {
      ws.send(JSON.stringify({
        type: 'ACTION_RESPONSE',
        actionId: pendingAction.actionId,
        approved,
      }));
      setPendingAction(null);
    }
  };

  if (!pendingAction) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-bg-secondary border-2 border-red/50 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border bg-red/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Требуется подтверждение
              </h2>
              <p className="text-xs text-text-muted">
                AI хочет выполнить опасное действие
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-4">
            <div className="text-sm text-text-secondary mb-2">
              <Shield className="w-4 h-4 inline mr-1.5 text-red" />
              Действие:
            </div>
            <div className="bg-bg-tertiary border border-border rounded-lg p-3">
              <p className="text-sm text-text-primary font-mono">
                {pendingAction.description}
              </p>
            </div>
          </div>

          <div className="bg-orange/5 border border-orange/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-orange">
              ⚠️ Это действие может повлиять на вашу систему. Подтвердите только если вы уверены.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors font-medium"
            >
              Отменить
            </button>
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red text-white hover:bg-red/80 transition-colors font-medium"
            >
              Разрешить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
