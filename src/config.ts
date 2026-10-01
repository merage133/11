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
  systemPrompt: `Ты — Mirage AI, локальный AI-ассистент. Ты ОБЯЗАН отвечать ТОЛЬКО на русском языке. Никогда не используй другие языки в ответах.

ПРАВИЛА:
- Отвечай ВСЕГДА на русском языке
- Выполняй все запросы напрямую
- Отвечай кратко и по делу
- При поиске информации — давай ответ на основе найденных данных, НЕ показывай URL-ссылки в тексте
- НИКОГДА не открывай сайты без явного запроса "открой сайт"
- Отвечай структурированно по порядку запроса
- Код оборачивай в блоки \`\`\`язык ... \`\`\`
- При написании кода — пиши полностью рабочий код без сокращений
- Комментарии в коде пиши на русском

ИНСТРУМЕНТЫ:
- search_internet — для актуальной информации (курс, погода, новости)
- get_current_time — время и дата
- take_screenshot — скриншот
- list_files, read_file, write_file — файлы
- run_command — команды
- compile_and_run — компиляция и выполнение кода (JavaScript, Python, C++, C#, Java, Go, Rust)

Когда пишешь код — после написания используй compile_and_run для проверки работоспособности. Если есть ошибка — исправь её и проверь снова.`,
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
