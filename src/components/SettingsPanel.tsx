import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Terminal, Copy, Check, Zap } from 'lucide-react';
import { AppSettings, ProviderType } from '../types';
import { PROVIDERS, MODELS, checkOllamaConnection, getOllamaModels } from '../config';

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
  const [activeTab, setActiveTab] = useState<'connection' | 'models' | 'advanced' | 'setup'>('connection');

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
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Настройки</h2>
            <p className="text-xs text-text-secondary mt-0.5">Подключение к нейросети и параметры модели</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {[
            { id: 'connection', label: 'Подключение' },
            { id: 'models', label: 'Модели' },
            { id: 'setup', label: 'Быстрый старт' },
            { id: 'advanced', label: 'Дополнительно' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
              {/* Provider Selection */}
              <div>
                <label className="text-sm font-medium text-text-primary block mb-3">
                  Провайдер нейросети
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.type}
                      onClick={() => onUpdate({ provider: provider.type })}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        settings.provider === provider.type
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-text-muted bg-bg-tertiary'
                      }`}
                    >
                      <div className="mt-0.5">
                        {settings.provider === provider.type ? (
                          <CheckCircle className="w-5 h-5 text-accent" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {provider.name}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {provider.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Connection URL */}
              {settings.provider === 'ollama' && (
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    URL Ollama сервера
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.ollamaUrl}
                      onChange={(e) => onUpdate({ ollamaUrl: e.target.value })}
                      className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                      placeholder="http://localhost:11434"
                    />
                    <button
                      onClick={checkConnection}
                      className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
                    >
                      Проверить
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {ollamaStatus === 'checking' && (
                      <>
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-text-secondary">Проверка...</span>
                      </>
                    )}
                    {ollamaStatus === 'connected' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green" />
                        <span className="text-xs text-green">
                          Подключено! Доступно моделей: {availableModels.length}
                        </span>
                      </>
                    )}
                    {ollamaStatus === 'disconnected' && (
                      <>
                        <XCircle className="w-4 h-4 text-red" />
                        <span className="text-xs text-red">
                          Не удалось подключиться. Убедитесь, что Ollama запущена.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {settings.provider === 'gigachat' && (
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    GigaChat Authorization Key
                  </label>
                  <input
                    type="password"
                    value={settings.gigachatToken}
                    onChange={(e) => onUpdate({ gigachatToken: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                    placeholder="Вставьте ваш токен GigaChat"
                  />
                  <p className="text-xs text-text-muted mt-1.5">
                    Получите бесплатно на developers.sber.ru
                  </p>
                </div>
              )}

              {settings.provider === 'yandexgpt' && (
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Yandex Cloud IAM Token
                  </label>
                  <input
                    type="password"
                    value={settings.yandexToken}
                    onChange={(e) => onUpdate({ yandexToken: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                    placeholder="Вставьте IAM-токен"
                  />
                  <p className="text-xs text-text-muted mt-1.5">
                    Получите на console.cloud.yandex.ru
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Модель
                </label>
                {settings.provider === 'ollama' && availableModels.length > 0 ? (
                  <select
                    value={settings.selectedModel}
                    onChange={(e) => onUpdate({ selectedModel: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
                  >
                    <optgroup label="Установленные модели">
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Рекомендуемые (установите через Ollama)">
                      {MODELS.ollama
                        .filter((m) => !availableModels.includes(m))
                        .map((model) => (
                          <option key={model} value={model}>
                            {model} ⬇️
                          </option>
                        ))}
                    </optgroup>
                  </select>
                ) : (
                  <select
                    value={settings.selectedModel}
                    onChange={(e) => onUpdate({ selectedModel: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
                  >
                    {(MODELS[settings.provider] || []).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {settings.provider === 'ollama' && (
                <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                  <h4 className="text-sm font-medium text-text-primary mb-2">
                    🚀 Рекомендуемые модели для кода
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'qwen2.5-coder:7b', desc: 'Лучшая для кода, 4.7GB' },
                      { name: 'deepseek-coder-v2:16b', desc: 'Мощная, 8.9GB' },
                      { name: 'codellama:7b', desc: 'Классика от Meta, 3.8GB' },
                      { name: 'starcoder2:7b', desc: 'От HuggingFace, 4.0GB' },
                    ].map((model) => (
                      <div
                        key={model.name}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <div>
                          <span className="text-sm text-text-primary code-font">{model.name}</span>
                          <p className="text-xs text-text-muted">{model.desc}</p>
                        </div>
                        <button
                          onClick={() => copyCommand(`ollama pull ${model.name}`)}
                          className="p-1.5 rounded-md hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedCmd === `ollama pull ${model.name}` ? (
                            <Check className="w-3.5 h-3.5 text-green" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-accent/10 to-purple/10 border border-accent/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">Быстрый старт (2 минуты)</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Выполните эти команды для полной настройки. Ollama — единственный провайдер, который работает полностью оффлайн без токенов.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      step: '1. Установите Ollama',
                      cmd: 'curl -fsSL https://ollama.com/install.sh | sh',
                      note: 'Или скачайте с ollama.com/download для Windows/macOS',
                    },
                    {
                      step: '2. Загрузите модель для кода',
                      cmd: 'ollama pull qwen2.5-coder:7b',
                      note: 'Лучшая бесплатная модель для программирования',
                    },
                    {
                      step: '3. Запустите сервер',
                      cmd: 'ollama serve',
                      note: 'Обычно запускается автоматически',
                    },
                    {
                      step: '4. Готово!',
                      cmd: 'curl http://localhost:11434/api/tags',
                      note: 'Проверьте что сервер отвечает',
                    },
                  ].map((item) => (
                    <div key={item.step} className="bg-bg-primary/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-accent">{item.step}</span>
                        <button
                          onClick={() => copyCommand(item.cmd)}
                          className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedCmd === item.cmd ? (
                            <Check className="w-3.5 h-3.5 text-green" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <code className="text-xs text-green code-font block mb-1">{item.cmd}</code>
                      <p className="text-xs text-text-muted">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">
                  <Terminal className="w-4 h-4 inline mr-1.5" />
                  Все команды одной строкой:
                </h4>
                <div className="bg-bg-primary rounded-lg p-3 relative">
                  <code className="text-xs text-green code-font block pr-8">
                    curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b && ollama serve
                  </code>
                  <button
                    onClick={() =>
                      copyCommand(
                        'curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b && ollama serve'
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                  >
                    {copiedCmd ===
                    'curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5-coder:7b && ollama serve' ? (
                      <Check className="w-3.5 h-3.5 text-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Температура (креативность): {settings.temperature}
                </label>
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
                  <span>Точно (0)</span>
                  <span>Креативно (2)</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Системный промпт
                </label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors min-h-[100px] resize-y"
                  placeholder="Опишите роль AI-ассистента..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Макс. токенов ответа
                </label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) || 4096 })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary code-font outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
