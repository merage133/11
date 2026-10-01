import { ProviderConfig, AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  gigachatToken: '',
  yandexToken: '',
  selectedModel: 'qwen2.5-coder:7b',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Ты — AI-ассистент для программирования. Отвечай на русском языке. Помогай с кодом, объясняй ошибки, предлагай улучшения. Если прикреплены файлы репозитория — анализируй их структуру и содержимое.',
  theme: 'dark',
};

export const PROVIDERS: ProviderConfig[] = [
  {
    type: 'ollama',
    name: 'Ollama (Локально)',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5-coder:7b',
    available: true,
    description: 'Полностью локальная нейросеть. Работает без интернета, без VPN, без токенов. Бесплатно навсегда.',
    setupInstructions: `# Установка Ollama (1 команда):

## Windows / macOS:
Скачайте с https://ollama.com/download

## Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Загрузка модели для кода:
ollama pull qwen2.5-coder:7b

# Или более лёгкая модель:
ollama pull codellama:7b

# Запуск сервера (автоматически):
ollama serve

# Проверка:
curl http://localhost:11434/api/tags`,
  },
  {
    type: 'gigachat',
    name: 'GigaChat (Сбер)',
    baseUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
    model: 'GigaChat',
    available: true,
    description: 'Российский AI от Сбера. Бесплатный тариф — 1000 запросов/день. Работает без VPN.',
    setupInstructions: `# Получение токена GigaChat:

1. Перейдите на https://developers.sber.ru/studio/workbench
2. Создайте проект "GigaChat API"
3. Получите Authorization Key (бесплатно)
4. Вставьте ключ в настройки приложения

# Бесплатный тариф:
- 1000 запросов в день
- Без привязки карты
- Работает в России без VPN`,
  },
  {
    type: 'yandexgpt',
    name: 'YandexGPT (Яндекс)',
    baseUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    model: 'yandexgpt',
    available: true,
    description: 'Российский AI от Яндекса. Бесплатный пробный период. Работает без VPN.',
    setupInstructions: `# Получение токена YandexGPT:

1. Перейдите на https://console.cloud.yandex.ru/
2. Создайте каталог (бесплатно)
3. Создайте сервисный аккаунт с ролью "ai.languageModels.user"
4. Получите IAM-токен:
   yc iam create-token

# Бесплатный период:
- 1 000 000 токенов на первый месяц
- Далее — по минимальным тарифам
- Работает в России без VPN`,
  },
];

export const MODELS: Record<string, string[]> = {
  ollama: [
    'qwen2.5-coder:7b',
    'qwen2.5-coder:1.5b',
    'codellama:7b',
    'codellama:13b',
    'deepseek-coder-v2:16b',
    'starcoder2:7b',
    'phi3:mini',
    'llama3.1:8b',
    'mistral:7b',
  ],
  gigachat: ['GigaChat', 'GigaChat-Plus', 'GigaChat-Pro'],
  yandexgpt: ['yandexgpt', 'yandexgpt-lite', 'summarization'],
};

export async function checkOllamaConnection(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function sendOllamaMessage(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number = 0.7,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature,
        num_predict: 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          fullResponse += json.message.content;
          onChunk?.(json.message.content);
        }
      } catch {
        // skip invalid JSON
      }
    }
  }

  return fullResponse;
}

export async function sendGigaChatMessage(
  token: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`GigaChat error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || 'Нет ответа';
  onChunk?.(content);
  return content;
}
