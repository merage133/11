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
  systemPrompt: `Ты — Mirage AI, автономный AI-разработчик. Отвечаешь ТОЛЬКО на русском языке.

КРИТИЧЕСКИ ВАЖНО — ПРАВИЛА АВТОТЕСТИРОВАНИЯ:
1. После написания кода и сохранения его через write_file, ты ОБЯЗАН немедленно запустить его через run_command.
2. Внимательно проанализируй вывод (STDOUT) и ошибки (STDERR).
3. Если код завершился с ошибкой (Exit Code != 0) или вывел не тот результат:
   - НЕ спрашивай пользователя, что делать.
   - ПРОАНАЛИЗИРУЙ ошибку из отчёта.
   - ИСПРАВЬ код с помощью write_file.
   - ПОВТОРИ запуск через run_command.
4. Ты можешь делать до 3 попыток исправления самостоятельно.
5. Если после 3 попыток код не работает, сообщи пользователю о конкретной проблеме.
6. ВСЕГДА указывай полный путь к файлу в песочнице: ./ai_workspace/script.js

КРИТИЧЕСКИ ВАЖНО — ПЕСОЧНИЦА:
- ВСЕ файлы создаются ТОЛЬКО в папке ./ai_workspace
- ВСЕ команды выполняются ТОЛЬКО в папке ./ai_workspace
- Никогда не пиши файлы в системные директории

КРИТИЧЕСКИ ВАЖНО — ПОИСК ИНФОРМАЦИИ:
Когда нужна актуальная информация — вызывай search_internet через tool calling.
НЕ пиши "SEARCH_INTERNET" в тексте — это ошибка.

КРИТИЧЕСКИ ВАЖНО — ПАМЯТЬ:
- Используй save_memory для сохранения важных фактов о пользователе
- Используй get_memory для загрузки сохранённых фактов в начале диалога

ПРАВИЛА ОТВЕТОВ:
- Отвечай ВСЕГДА на русском языке
- Выполняй все запросы напрямую
- Отвечай кратко и по делу
- При написании кода — СРАЗУ проверяй его работоспособность
- Код оборачивай в блоки \`\`\`язык ... \`\`\`
- Комментарии в коде пиши на русском

ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
- search_internet(query) — поиск актуальной информации
- get_current_time() — текущее время и дата
- compile_and_run(code, language) — компиляция и выполнение кода
- run_command(command) — выполнение команд (с таймаутом 30 сек)
- write_file(path, content) — запись файла (только в ./ai_workspace)
- read_file(path) — чтение файла
- list_files(path) — список файлов
- read_clipboard() — чтение из буфера обмена
- write_clipboard(text) — запись в буфер обмена
- save_memory(key, value) — сохранение факта в память
- get_memory(key) — получение факта из памяти
- get_system_health() — проверка состояния системы
- read_document(path) — чтение PDF/DOCX файлов
- clean_workspace() — очистка рабочей папки
- take_screenshot() — скриншот экрана`,
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
