// Система инструментов для AI — tool calling через Ollama

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, string>;
  };
}

export interface ToolResult {
  name: string;
  content: string;
  success: boolean;
  image?: string; // base64 image
}

// Определения инструментов для Ollama
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'take_screenshot',
      description: 'Сделать скриншот экрана пользователя. Используй когда нужно увидеть что на экране, проанализировать UI, помочь с регистрацией или любым действием на сайте.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'Показать список файлов и папок по указанному пути на компьютере пользователя.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Путь к папке. Используй "/" для корня или домашней директории.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Прочитать содержимое файла на компьютере пользователя.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Полный путь к файлу' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Записать или создать файл на компьютере пользователя.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Полный путь к файлу' },
          content: { type: 'string', description: 'Содержимое файла' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Выполнить команду в терминале/консоли компьютера. Используй для установки программ, запуска скриптов, проверки системы.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Команда для выполнения' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'shutdown_pc',
      description: 'Выключить компьютер пользователя. Используй ТОЛЬКО когда пользователь явно попросил выключить.',
      parameters: {
        type: 'object',
        properties: {
          delay: { type: 'string', description: 'Задержка в секундах перед выключением. По умолчанию 5.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'restart_pc',
      description: 'Перезагрузить компьютер пользователя. Используй ТОЛЬКО когда пользователь явно попросил перезагрузить.',
      parameters: {
        type: 'object',
        properties: {
          delay: { type: 'string', description: 'Задержка в секундах перед перезагрузкой. По умолчанию 5.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_url',
      description: 'Открыть URL в браузере пользователя.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL для открытия' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_click',
      description: 'Кликнуть на элемент на странице в браузере пользователя. Нужен CSS-селектор или текст элемента.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS-селектор или текст кнопки/ссылки' },
          url: { type: 'string', description: 'URL страницы (если нужно сначала перейти)' },
        },
        required: ['selector'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_type',
      description: 'Ввести текст в поле на странице в браузере пользователя.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS-селектор поля ввода' },
          text: { type: 'string', description: 'Текст для ввода' },
        },
        required: ['selector', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_system_info',
      description: 'Получить информацию о системе пользователя: ОС, RAM, диск, процессы.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_internet',
      description: 'Найти информацию в интернете. Используй когда пользователь спрашивает о текущих событиях, курсе валют, погоде, новостях, или любой информации которую нужно найти онлайн.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Поисковый запрос на русском или английском языке' },
        },
        required: ['query'],
      },
    },
  },
];

// Локальный сервер
const SERVER_URL = 'http://localhost:3001';

async function serverAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Выполнение инструмента
export async function executeTool(
  toolCall: ToolCall,
  screenCaptureFn?: () => Promise<string | null>
): Promise<ToolResult> {
  const { name, arguments: args } = toolCall.function;
  let parsedArgs: Record<string, string>;
  
  try {
    parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});
  } catch {
    return { name, content: `Ошибка парсинга аргументов: ${JSON.stringify(args)}`, success: false };
  }

  try {
    switch (name) {
      case 'take_screenshot': {
        if (screenCaptureFn) {
          const image = await screenCaptureFn();
          if (image) {
            return { name, content: 'Скриншот сделан успешно.', success: true, image };
          }
          return { name, content: 'Пользователь отменил захват экрана.', success: false };
        }
        return { name, content: 'Функция скриншота недоступна в этом окружении.', success: false };
      }

      case 'list_files': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: parsedArgs.path }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Запустите: node server.cjs', success: false };
      }

      case 'read_file': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/file/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: parsedArgs.path }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Запустите: node server.cjs', success: false };
      }

      case 'write_file': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/file/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: parsedArgs.path, content: parsedArgs.content }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Запустите: node server.cjs', success: false };
      }

      case 'run_command': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: parsedArgs.command }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Запустите: node server.cjs', success: false };
      }

      case 'shutdown_pc': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const delay = parsedArgs.delay || '5';
          const res = await fetch(`${SERVER_URL}/api/shutdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delay }),
          });
          const data = await res.json();
          return { name, content: data.result || `Компьютер будет выключен через ${delay} сек.`, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Выключение невозможно.', success: false };
      }

      case 'restart_pc': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const delay = parsedArgs.delay || '5';
          const res = await fetch(`${SERVER_URL}/api/restart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delay }),
          });
          const data = await res.json();
          return { name, content: data.result || `Компьютер будет перезагружен через ${delay} сек.`, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Перезагрузка невозможна.', success: false };
      }

      case 'open_url': {
        window.open(parsedArgs.url, '_blank');
        return { name, content: `Открыт URL: ${parsedArgs.url}`, success: true };
      }

      case 'browser_click': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/browser/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selector: parsedArgs.selector, url: parsedArgs.url }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Автоматизация браузера недоступна.', success: false };
      }

      case 'browser_type': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/browser/type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selector: parsedArgs.selector, text: parsedArgs.text }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Автоматизация браузера недоступна.', success: false };
      }

      case 'get_system_info': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/system-info`);
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        // Fallback — браузерная информация
        const nav = navigator as Navigator & { deviceMemory?: number };
        const info = `Браузер: ${navigator.userAgent}\nЯзык: ${navigator.language}\nПлатформа: ${navigator.platform}\nПамять: ${nav.deviceMemory || 'неизвестно'} GB\nЯдра CPU: ${navigator.hardwareConcurrency || 'неизвестно'}`;
        return { name, content: info, success: true };
      }

      case 'search_internet': {
        const hasServer = await serverAvailable();
        if (hasServer) {
          const res = await fetch(`${SERVER_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: parsedArgs.query }),
          });
          const data = await res.json();
          return { name, content: data.result || data.error, success: res.ok };
        }
        return { name, content: 'Сервер не запущен. Запустите: node server.cjs', success: false };
      }

      default:
        return { name, content: `Неизвестный инструмент: ${name}`, success: false };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { name, content: `Ошибка выполнения: ${msg}`, success: false };
  }
}
