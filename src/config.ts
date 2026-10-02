import { AppSettings } from './types';
import { ToolDefinition, ToolCall } from './tools';

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  gigachatToken: '',
  yandexToken: '',
  selectedModel: 'qwen2.5-coder:7b',
  temperature: 0.8,
  maxTokens: 8192,
  systemPrompt: `Ты — Mirage AI, локальный AI-ассистент. Отвечаешь ТОЛЬКО на русском языке.

КРИТИЧЕСКИ ВАЖНО — АВТОМАТИЧЕСКАЯ ПРОВЕРКА КОДА:
Когда ты пишешь код — ты ОБЯЗАН СРАЗУ после написания вызвать compile_and_run для проверки работоспособности.
Если есть ошибка — ты ОБЯЗАН исправить код и снова вызвать compile_and_run.
Повторяй до тех пор пока код не заработает (максимум 5 попыток).
НЕ ЖДИ пока пользователь нажмёт "Запуск" — проверяй код САМ автоматически.

КРИТИЧЕСКИ ВАЖНО — ПОИСК ИНФОРМАЦИИ:
Когда нужна актуальная информация (курс валют, погода, новости) — вызывай search_internet через tool calling.
НЕ пиши "SEARCH_INTERNET" в тексте — это ошибка.
После получения результатов — давай краткий ответ на русском языке БЕЗ ссылок.

ПРАВИЛА ОТВЕТОВ:
- Отвечай ВСЕГДА на русском языке
- Выполняй все запросы напрямую
- Отвечай кратко и по делу
- При поиске — вызывай search_internet, давай ответ на основе результатов, НЕ показывай URL
- При написании кода — СРАЗУ вызывай compile_and_run для проверки
- Если код не работает — исправляй и проверяй снова (до 5 попыток)
- Код оборачивай в блоки \`\`\`язык ... \`\`\`
- Комментарии в коде пиши на русском

ДОСТУПНЫЕ ИНСТРУМЕНТЫ (вызывай через tool calling):
- search_internet(query) — поиск актуальной информации
- get_current_time() — текущее время и дата
- compile_and_run(code, language) — компиляция и выполнение кода (ОБЯЗАТЕЛЬНО используй после написания кода)
- take_screenshot() — скриншот экрана
- list_files(path), read_file(path), write_file(path, content) — файлы
- run_command(command) — выполнение команд`,
  theme: 'dark',
};

export const MODELS: Record<string, string[]> = {
  ollama: [
    'qwen2.5:7b',
    'qwen2.5-coder:7b',
    'qwen2.5-coder:1.5b',
    'qwen2.5:14b',
    'deepseek-coder-v2:16b',
    'codellama:7b',
    'codellama:13b',
    'starcoder2:7b',
    'starcoder2:15b',
    'phi3:mini',
    'llama3.1:8b',
    'llama3.2:3b',
    'mistral:7b',
    'mixtral:8x7b',
    'gemma2:9b',
    'wizardlm2:7b',
  ],
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

// Ответ с tool calls
export interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
  };
  done: boolean;
}

// Отправка сообщения с поддержкой tool calling
export async function sendOllamaMessageWithTools(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string; tool_calls?: ToolCall[] }[],
  tools: ToolDefinition[],
  temperature: number = 0.8,
  signal?: AbortSignal
): Promise<OllamaChatResponse> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      tools,
      stream: false,
      options: {
        temperature,
        num_predict: 8192,
        top_p: 0.95,
        repeat_penalty: 1.1,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Стриминг обычного ответа (без tools)
export async function sendOllamaMessage(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number = 0.8,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal
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
        num_predict: 8192,
        top_p: 0.95,
        repeat_penalty: 1.1,
      },
    }),
    signal,
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
    if (!value) continue;

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
