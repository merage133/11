import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Copy, Check, Zap, Terminal, Shield } from 'lucide-react';
import { AppSettings } from '../types';
import { MODELS, checkOllamaConnection, getOllamaModels } from '../config';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'voice' | 'wakeword' | 'setup' | 'params'>('connection');

  useEffect(() => {
    checkConnection();
  }, [settings.ollamaUrl]);

  const checkConnection = async () => {
    setOllamaStatus('checking');
    const connected = await checkOllamaConnection(settings.ollamaUrl);
    setOllamaStatus(connected ? 'connected' : 'disconnected');
    if (connected) {
      const models = await getOllamaModels(settings.ollamaUrl);
      setAvailableModels(models);
    } else {
      setAvailableModels([]);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Настройки</h2>
              <p className="text-xs text-text-secondary">Подключение • Приватность • Параметры</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Banner */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-green/5 border border-green/20 flex items-start gap-3">
          <Shield className="w-4 h-4 text-green shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-green font-medium">Полная приватность</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Все данные хранятся только на вашем компьютере. Ничего не отправляется в интернет.
              Ollama работает полностью оффлайн.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 mt-4 overflow-x-auto">
          {[
            { id: 'connection', label: 'Подключение' },
            { id: 'setup', label: 'Установка' },
            { id: 'params', label: 'Параметры' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'connection' && (
            <div className="space-y-5">
              {/* Connection Status */}
              <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary">Ollama сервер</span>
                  <div className="flex items-center gap-2">
                    {ollamaStatus === 'checking' && (
                      <span className="text-xs text-text-muted flex items-center gap-1.5">
                        <div className="w-2 h-2 border border-accent border-t-transparent rounded-full animate-spin" />
                        Проверка...
                      </span>
                    )}
                    {ollamaStatus === 'connected' && (
                      <span className="text-xs text-green flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Подключено
                      </span>
                    )}
                    {ollamaStatus === 'disconnected' && (
                      <span className="text-xs text-red flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Не подключено
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.ollamaUrl}
                    onChange={(e) => onUpdate({ ollamaUrl: e.target.value })}
                    className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                    placeholder="http://localhost:11434"
                  />
                  <button
                    onClick={checkConnection}
                    className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors whitespace-nowrap"
                  >
                    Перепроверить
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Модель
                </label>
                <select
                  value={settings.selectedModel}
                  onChange={(e) => onUpdate({ selectedModel: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
                >
                  {availableModels.length > 0 && (
                    <optgroup label="Установленные">
                      {availableModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Рекомендуемые (установите через Ollama)">
                    {MODELS.ollama
                      .filter((m) => !availableModels.includes(m))
                      .map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                  </optgroup>
                </select>
                {availableModels.length === 0 && (
                  <p className="text-xs text-text-muted mt-2">
                    Модели не найдены. Перейдите во вкладку «Установка» для инструкций.
                  </p>
                )}
              </div>

              {/* Quick Install Commands */}
              <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Быстрая установка моделей
                </h4>
                <div className="space-y-2">
                  {[
                    { name: 'qwen2.5-coder:7b', desc: 'Лучшая для кода • 4.7 GB', cmd: 'ollama pull qwen2.5-coder:7b' },
                    { name: 'deepseek-coder-v2:16b', desc: 'Мощная • 8.9 GB', cmd: 'ollama pull deepseek-coder-v2:16b' },
                    { name: 'qwen2.5-coder:1.5b', desc: 'Лёгкая • 1.0 GB', cmd: 'ollama pull qwen2.5-coder:1.5b' },
                  ].map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary/50 hover:bg-bg-primary transition-colors"
                    >
                      <div>
                        <span className="text-sm text-text-primary code-font">{model.name}</span>
                        <p className="text-xs text-text-muted">{model.desc}</p>
                      </div>
                      <button
                        onClick={() => copyCommand(model.cmd)}
                        className="p-2 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                      >
                        {copiedCmd === model.cmd ? (
                          <Check className="w-4 h-4 text-green" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-accent/5 to-purple/5 border border-accent/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  Установка Ollama (2 минуты)
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Установите Ollama',
                      cmd: 'curl -fsSL https://ollama.com/install.sh | sh',
                      note: 'Linux. Для Windows/macOS — скачайте с ollama.com/download',
                    },
                    {
                      step: '2',
                      title: 'Загрузите модель',
                      cmd: 'ollama pull qwen2.5-coder:7b',
                      note: 'Лучшая бесплатная модель для программирования',
                    },
                    {
                      step: '3',
                      title: 'Запустите сервер',
                      cmd: 'ollama serve',
                      note: 'Обычно запускается автоматически при установке',
                    },
                  ].map((item) => (
                    <div key={item.step} className="bg-bg-primary/60 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                            {item.step}
                          </span>
                          <span className="text-sm font-medium text-text-primary">{item.title}</span>
                        </div>
                        <button
                          onClick={() => copyCommand(item.cmd)}
                          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedCmd === item.cmd ? (
                            <Check className="w-3.5 h-3.5 text-green" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <code className="text-xs text-green code-font block bg-bg-primary/50 rounded px-2 py-1.5 mb-1.5">
                        {item.cmd}
                      </code>
                      <p className="text-xs text-text-muted">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-bg-primary/40 rounded-lg border border-border">
                  <p className="text-xs text-text-muted mb-1.5">Всё одной командой:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-green code-font">
                      curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b
                    </code>
                    <button
                      onClick={() => copyCommand('curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b')}
                      className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors shrink-0 ml-2"
                    >
                      {copiedCmd === 'curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b' ? (
                        <Check className="w-3.5 h-3.5 text-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Требования</h4>
                <ul className="text-xs text-text-secondary space-y-1.5">
                  <li>• <strong>RAM:</strong> 8 GB минимум (16 GB рекомендуется)</li>
                  <li>• <strong>Диск:</strong> 5-10 GB для модели</li>
                  <li>• <strong>GPU:</strong> Опционально, но сильно ускоряет (NVIDIA 4GB+ VRAM)</li>
                  <li>• <strong>Интернет:</strong> Не нужен после установки модели</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">
                    Температура
                  </label>
                  <span className="text-sm text-accent code-font">{settings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Точные ответы</span>
                  <span>Креативные ответы</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Системный промпт
                </label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors min-h-[150px] resize-y code-font leading-relaxed"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Этот промпт задаёт поведение AI. Текущий — без ограничений и цензуры.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Макс. длина ответа (токены)
                </label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) || 8192 })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
