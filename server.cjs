/**
 * RU AI Studio — Локальный сервер для системных команд
 * 
 * Запуск: node server.cjs
 * 
 * Этот сервер даёт AI доступ к:
 * - Файловой системе
 * - Выполнению команд
 * - Управлению компьютером (выключение/перезагрузка)
 * - Автоматизации браузера (через puppeteer, если установлен)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, execSync } = require('child_process');

const PORT = 3001;
const HOST = '127.0.0.1'; // Только локальный доступ

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Парсинг JSON тела запроса
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        // Обрабатываем пустое тело
        if (!body || body.trim() === '') {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (e) {
        reject(new Error(`Ошибка парсинга JSON: ${e.message}`));
      }
    });
    req.on('error', reject);
  });
}

// Отправка JSON ответа
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, CORS_HEADERS);
  res.end(JSON.stringify(data));
}

// Выполнение shell-команды
function runCommand(cmd, timeout = 30000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
}

// Безопасная проверка пути (не даём выходить за пределы)
function safePath(inputPath) {
  // Разрешаем абсолютные пути — пользователь сам решает
  return path.resolve(inputPath);
}

// Поиск в интернете через DuckDuckGo (бесплатно, без API ключа)
function searchInternet(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    https.get(url, { headers: { 'User-Agent': 'RU-AI-Studio/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = [];
          
          // Основной ответ
          if (json.AbstractText) {
            results.push({
              title: json.Heading || 'Результат',
              snippet: json.AbstractText,
              url: json.AbstractURL || ''
            });
          }
          
          // Ответ из других источников
          if (json.Answer) {
            results.push({
              title: 'Быстрый ответ',
              snippet: json.Answer,
              url: json.AnswerURL || ''
            });
          }
          
          // Определения
          if (json.Definition) {
            results.push({
              title: 'Определение',
              snippet: json.Definition,
              url: json.DefinitionURL || ''
            });
          }
          
          // Связанные темы
          if (json.RelatedTopics && json.RelatedTopics.length > 0) {
            json.RelatedTopics.slice(0, 5).forEach((topic) => {
              if (topic.Text) {
                results.push({
                  title: topic.FirstURL ? topic.FirstURL.split('/').pop() : 'Результат',
                  snippet: topic.Text,
                  url: topic.FirstURL || ''
                });
              }
            });
          }
          
          if (results.length === 0) {
            resolve({ success: false, results: [], message: 'Ничего не найдено' });
          } else {
            resolve({ success: true, results });
          }
        } catch (e) {
          reject(new Error('Ошибка парсинга результатов: ' + e.message));
        }
      });
    }).on('error', (e) => {
      reject(new Error('Ошибка запроса: ' + e.message));
    });
  });
}

// Получение содержимого URL
function fetchUrlContent(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
      } 
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          // Извлекаем title
          const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : url;
          
          // Извлекаем основной текст (упрощенно)
          const bodyMatch = data.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          let content = '';
          
          if (bodyMatch) {
            // Убираем скрипты и стили
            content = bodyMatch[1]
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 5000); // Ограничиваем размер
          }
          
          resolve({ title, content: content || 'Не удалось извлечь содержимое' });
        } catch (e) {
          reject(new Error('Ошибка парсинга: ' + e.message));
        }
      });
    }).on('error', (e) => {
      reject(new Error('Ошибка запроса: ' + e.message));
    });
  });
}

// Поиск через Wikipedia API
function searchWikipedia(query) {
  return new Promise((resolve, reject) => {
    const url = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
    
    https.get(url, { headers: { 'User-Agent': 'RU-AI-Studio/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = [];
          
          if (json.query && json.query.search && json.query.search.length > 0) {
            json.query.search.forEach((item) => {
              results.push({
                title: item.title,
                snippet: item.snippet.replace(/<[^>]+>/g, ''), // Убираем HTML теги
                url: `https://ru.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
              });
            });
          }
          
          resolve({ success: results.length > 0, results });
        } catch (e) {
          reject(new Error('Ошибка парсинга Wikipedia: ' + e.message));
        }
      });
    }).on('error', (e) => {
      reject(new Error('Ошибка запроса Wikipedia: ' + e.message));
    });
  });
}

// Поиск через SearXNG (мета-поисковик, агрегирует Google, Bing, DuckDuckGo)
function searchSearXNG(query) {
  return new Promise((resolve, reject) => {
    // Используем публичные инстансы SearXNG
    const instances = [
      'https://search.bus-hit.me',
      'https://searx.be',
      'https://search.ononoki.org'
    ];
    
    const tryInstance = (index) => {
      if (index >= instances.length) {
        resolve({ success: false, results: [] });
        return;
      }
      
      const url = `${instances[index]}/search?q=${encodeURIComponent(query)}&format=json&language=ru`;
      
      https.get(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
        } 
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const results = [];
            
            if (json.results && json.results.length > 0) {
              json.results.slice(0, 5).forEach((item) => {
                results.push({
                  title: item.title || 'Без названия',
                  snippet: item.content || '',
                  url: item.url || ''
                });
              });
            }
            
            if (results.length > 0) {
              resolve({ success: true, results });
            } else {
              tryInstance(index + 1);
            }
          } catch (e) {
            tryInstance(index + 1);
          }
        });
      }).on('error', () => {
        tryInstance(index + 1);
      });
    };
    
    tryInstance(0);
  });
}

// Дополнительный поиск через HTML DuckDuckGo (для более сложных запросов)
function searchInternetLite(query) {
  return new Promise((resolve, reject) => {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const results = [];
          
          // Парсим результаты из HTML
          const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
          let match;
          
          while ((match = resultRegex.exec(data)) !== null && results.length < 8) {
            const url = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0];
            const title = match[2].replace(/<[^>]+>/g, '').trim();
            const snippet = match[3].replace(/<[^>]+>/g, '').trim();
            
            if (title && snippet) {
              results.push({ title, snippet, url: decodeURIComponent(url) });
            }
          }
          
          if (results.length === 0) {
            resolve({ success: false, results: [], message: 'Ничего не найдено' });
          } else {
            resolve({ success: true, results });
          }
        } catch (e) {
          reject(new Error('Ошибка парсинга: ' + e.message));
        }
      });
    }).on('error', (e) => {
      reject(new Error('Ошибка запроса: ' + e.message));
    });
  });
}

// MIME типы для статических файлов
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Отдача статических файлов из dist/
function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'dist', filePath);
  
  // Защита от выхода за пределы папки
  if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
    res.writeHead(403, CORS_HEADERS);
    res.end('Forbidden');
    return true;
  }
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': contentType });
    res.end(content);
    return true;
  }
  return false;
}

// Обработка запросов
async function handleRequest(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  // Сначала пробуем отдать статический файл
  if (!pathname.startsWith('/api/')) {
    if (serveStatic(req, res)) return;
  }

  try {
    // Health check
    if (pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', platform: os.platform(), uptime: process.uptime() });
      return;
    }

    // Получение содержимого URL
    if (pathname === '/api/fetch-url' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.url) {
        sendJson(res, 400, { error: 'Не указан URL' });
        return;
      }
      
      try {
        const result = await fetchUrlContent(body.url);
        sendJson(res, 200, result);
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // Поиск в интернете
    if (pathname === '/api/search' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.query) {
        sendJson(res, 400, { error: 'Не указан поисковый запрос' });
        return;
      }
      
      try {
        // Сначала пробуем SearXNG (мета-поисковик с Google, Bing, DuckDuckGo)
        let result = await searchSearXNG(body.query);
        
        // Если ничего не найдено, пробуем Wikipedia
        if (!result.success || result.results.length === 0) {
          try {
            const wikiResult = await searchWikipedia(body.query);
            if (wikiResult.success && wikiResult.results.length > 0) {
              result = wikiResult;
            }
          } catch (wikiError) {
            // Игнорируем ошибки Wikipedia
          }
        }
        
        // Если все еще ничего не найдено, пробуем DuckDuckGo Instant Answer
        if (!result.success || result.results.length === 0) {
          try {
            result = await searchInternet(body.query);
          } catch (ddgError) {
            // Игнорируем ошибки
          }
        }
        
        // Если все еще ничего не найдено, пробуем HTML поиск
        if (!result.success || result.results.length === 0) {
          result = await searchInternetLite(body.query);
        }
        
        if (result.success && result.results.length > 0) {
          const formatted = result.results.map((r, i) => 
            `${i + 1}. ${r.title}\n   ${r.snippet}\n   URL: ${r.url}`
          ).join('\n\n');
          
          sendJson(res, 200, { 
            result: `Результаты поиска по запросу "${body.query}":\n\n${formatted}`,
            success: true 
          });
        } else {
          sendJson(res, 200, { 
            result: `По запросу "${body.query}" ничего не найдено.`,
            success: false 
          });
        }
      } catch (err) {
        sendJson(res, 500, { error: `Ошибка поиска: ${err.message}` });
      }
      return;
    }

    // Системная информация
    if (pathname === '/api/system-info' && req.method === 'GET') {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const disks = os.platform() === 'win32' 
        ? await runCommand('wmic logicaldisk get size,freespace,caption')
        : await runCommand('df -h /');

      sendJson(res, 200, {
        result: [
          `ОС: ${os.type()} ${os.release()} (${os.platform()})`,
          `Хост: ${os.hostname()}`,
          `Архитектура: ${os.arch()}`,
          `CPU: ${cpus[0]?.model || 'N/A'} x${cpus.length}`,
          `RAM: ${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB (свободно: ${(freeMem / 1024 / 1024 / 1024).toFixed(1)} GB)`,
          `Домашняя папка: ${os.homedir()}`,
          `Диски: ${disks.output.trim()}`,
          `Время работы: ${(os.uptime() / 3600).toFixed(1)} часов`,
        ].join('\n'),
      });
      return;
    }

    // Список файлов
    if (pathname === '/api/files' && req.method === 'POST') {
      const body = await parseBody(req);
      let dirPath = body.path || os.homedir();
      
      // Обработка относительных путей
      if (dirPath === '/' || dirPath === '~' || dirPath === '.') {
        dirPath = os.homedir();
      }
      dirPath = safePath(dirPath);

      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const files = entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? 'folder' : 'file',
          path: path.join(dirPath, entry.name),
          size: entry.isFile() ? fs.statSync(path.join(dirPath, entry.name)).size : null,
        }));

        sendJson(res, 200, {
          result: `Папка: ${dirPath}\n\n${files.map((f) => `${f.type === 'folder' ? '📁' : '📄'} ${f.name}${f.size ? ` (${(f.size / 1024).toFixed(1)} KB)` : ''}`).join('\n')}`,
        });
      } catch (err) {
        sendJson(res, 400, { error: `Ошибка чтения папки: ${err.message}` });
      }
      return;
    }

    // Чтение файла
    if (pathname === '/api/file/read' && req.method === 'POST') {
      const body = await parseBody(req);
      const filePath = safePath(body.path);
      
      if (!fs.existsSync(filePath)) {
        sendJson(res, 404, { error: `Файл не найден: ${filePath}` });
        return;
      }
      
      const stat = fs.statSync(filePath);
      if (stat.size > 1024 * 1024) { // 1 MB limit
        sendJson(res, 200, { result: `[Файл слишком большой: ${(stat.size / 1024 / 1024).toFixed(1)} MB. Прочитаны первые 100 KB]\n\n${fs.readFileSync(filePath, 'utf-8').slice(0, 100000)}` });
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        sendJson(res, 200, { result: content });
      }
      return;
    }

    // Запись файла
    if (pathname === '/api/file/write' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.path) {
        sendJson(res, 400, { error: 'Не указан путь файла' });
        return;
      }
      
      const filePath = safePath(body.path);
      
      try {
        // Создаём директорию если не существует
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, body.content || '', 'utf-8');
        sendJson(res, 200, { result: `Файл записан: ${filePath} (${(body.content || '').length} символов)` });
      } catch (err) {
        sendJson(res, 500, { error: `Ошибка записи файла: ${err.message}` });
      }
      return;
    }

    // Выполнение команды
    if (pathname === '/api/command' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = await runCommand(body.command, 60000);
      sendJson(res, result.success ? 200 : 200, {
        result: result.output || '(нет вывода)',
        success: result.success,
      });
      return;
    }

    // Выключение ПК
    if (pathname === '/api/shutdown' && req.method === 'POST') {
      const body = await parseBody(req);
      const delay = body.delay || '5';
      
      let cmd;
      if (os.platform() === 'win32') {
        cmd = `shutdown /s /t ${delay}`;
      } else if (os.platform() === 'darwin') {
        cmd = `sudo shutdown -h +${Math.ceil(parseInt(delay) / 60)}`;
      } else {
        cmd = `shutdown -h +${Math.ceil(parseInt(delay) / 60)}`;
      }

      exec(cmd);
      sendJson(res, 200, { result: `Компьютер будет выключен через ${delay} секунд.` });
      return;
    }

    // Перезагрузка ПК
    if (pathname === '/api/restart' && req.method === 'POST') {
      const body = await parseBody(req);
      const delay = body.delay || '5';
      
      let cmd;
      if (os.platform() === 'win32') {
        cmd = `shutdown /r /t ${delay}`;
      } else if (os.platform() === 'darwin') {
        cmd = `sudo shutdown -r +${Math.ceil(parseInt(delay) / 60)}`;
      } else {
        cmd = `shutdown -r +${Math.ceil(parseInt(delay) / 60)}`;
      }

      exec(cmd);
      sendJson(res, 200, { result: `Компьютер будет перезагружен через ${delay} секунд.` });
      return;
    }

    // Автоматизация браузера — клик
    if (pathname === '/api/browser/click' && req.method === 'POST') {
      const body = await parseBody(req);
      
      // Пытаемся использовать puppeteer если установлен
      try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
        const pages = await browser.pages();
        const page = pages[pages.length - 1];
        
        if (body.url) {
          await page.goto(body.url);
        }
        
        // Пробуем как CSS-селектор, потом как текст
        try {
          await page.click(body.selector);
        } catch {
          // Ищем по тексту
          const clicked = await page.evaluate((text) => {
            const elements = [...document.querySelectorAll('a, button, input, [role="button"]')];
            const el = elements.find(e => e.textContent?.includes(text) || e.value?.includes(text));
            if (el) el.click();
            return !!el;
          }, body.selector);
          
          if (!clicked) {
            sendJson(res, 200, { result: `Элемент "${body.selector}" не найден на странице.` });
            return;
          }
        }
        
        sendJson(res, 200, { result: `Клик выполнен: ${body.selector}` });
      } catch (e) {
        sendJson(res, 200, { 
          result: `Puppeteer не доступен. Установите: npm install puppeteer\nИ запустите Chrome с: chrome --remote-debugging-port=9222\n\nОшибка: ${e.message}` 
        });
      }
      return;
    }

    // Автоматизация браузера — ввод текста
    if (pathname === '/api/browser/type' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.selector || body.text === undefined) {
        sendJson(res, 400, { error: 'Не указаны selector или text' });
        return;
      }
      
      try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
        const pages = await browser.pages();
        const page = pages[pages.length - 1];
        
        await page.type(body.selector, body.text);
        sendJson(res, 200, { result: `Текст введён в ${body.selector}: "${body.text}"` });
      } catch (e) {
        sendJson(res, 200, { 
          result: `Puppeteer не доступен. Установите: npm install puppeteer\nИ запустите Chrome с: chrome --remote-debugging-port=9222\n\nОшибка: ${e.message}` 
        });
      }
      return;
    }

    // Компиляция и выполнение кода
    if (pathname === '/api/compile' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.code || !body.language) {
        sendJson(res, 400, { error: 'Не указан код или язык' });
        return;
      }

      const tempDir = path.join(os.tmpdir(), 'mirage-coder-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        let result = '';
        let success = true;
        const lang = body.language.toLowerCase();

        if (lang === 'javascript' || lang === 'js') {
          const tempFile = path.join(tempDir, 'script.js');
          fs.writeFileSync(tempFile, body.code);
          const execResult = await runCommand(`node "${tempFile}"`, 30000);
          result = execResult.output;
          success = execResult.success;
        } 
        else if (lang === 'python' || lang === 'py') {
          const tempFile = path.join(tempDir, 'script.py');
          fs.writeFileSync(tempFile, body.code);
          // Пробуем разные команды для Python
          let execResult = await runCommand(`python "${tempFile}"`, 30000);
          if (!execResult.success) {
            execResult = await runCommand(`python3 "${tempFile}"`, 30000);
          }
          if (!execResult.success) {
            result = '❌ Python не установлен или не найден в PATH.\n\nУстановите Python:\n- Windows: winget install Python.Python.3.12\n- Linux: sudo apt-get install python3\n- macOS: brew install python\n\nИли скачайте с https://www.python.org/downloads/';
            success = false;
          } else {
            result = execResult.output;
            success = execResult.success;
          }
        }
        else if (lang === 'c++' || lang === 'cpp' || lang === 'c') {
          const tempFile = path.join(tempDir, 'program.cpp');
          const exeFile = path.join(tempDir, 'program.exe');
          fs.writeFileSync(tempFile, body.code);
          
          // Компиляция с увеличенным таймаутом
          const compileResult = await runCommand(`g++ "${tempFile}" -o "${exeFile}"`, 60000);
          if (!compileResult.success) {
            if (compileResult.output.includes('not recognized') || compileResult.output.includes('not found') || compileResult.output.includes('command not found')) {
              result = '❌ GCC/G++ не установлен или не найден в PATH.\n\nУстановите GCC:\n- Windows: winget install MSYS2.MSYS2\n- Linux: sudo apt-get install build-essential\n- macOS: xcode-select --install';
            } else {
              result = 'Ошибка компиляции:\n' + compileResult.output;
            }
            success = false;
          } else {
            const execResult = await runCommand(`"${exeFile}"`, 30000);
            result = execResult.output;
            success = execResult.success;
          }
        }
        else if (lang === 'c#' || lang === 'csharp') {
          const tempFile = path.join(tempDir, 'Program.cs');
          const exeFile = path.join(tempDir, 'program.exe');
          fs.writeFileSync(tempFile, body.code);
          
          // Пробуем разные компиляторы C#
          let compileResult = await runCommand(`csc "${tempFile}" /out:"${exeFile}"`, 60000);
          if (!compileResult.success) {
            compileResult = await runCommand(`mcs "${tempFile}" /out:"${exeFile}"`, 60000);
          }
          
          if (!compileResult.success) {
            if (compileResult.output.includes('not recognized') || compileResult.output.includes('not found') || compileResult.output.includes('command not found')) {
              result = '❌ C# компилятор (csc/mcs) не установлен или не найден в PATH.\n\nУстановите C#:\n- Windows: winget install Microsoft.DotNet.SDK.8\n- Linux: sudo apt-get install mono-complete\n- macOS: brew install mono';
            } else {
              result = 'Ошибка компиляции:\n' + compileResult.output;
            }
            success = false;
          } else {
            const execResult = await runCommand(`"${exeFile}"`, 30000);
            result = execResult.output;
            success = execResult.success;
          }
        }
        else if (lang === 'java') {
          const tempFile = path.join(tempDir, 'Main.java');
          fs.writeFileSync(tempFile, body.code);
          
          const compileResult = await runCommand(`javac "${tempFile}"`, 60000);
          if (!compileResult.success) {
            if (compileResult.output.includes('not recognized') || compileResult.output.includes('not found') || compileResult.output.includes('command not found')) {
              result = '❌ Java JDK не установлен или не найден в PATH.\n\nУстановите Java JDK:\n- Windows: winget install EclipseAdoptium.Temurin.21.JDK\n- Linux: sudo apt-get install default-jdk\n- macOS: brew install openjdk\n\nИли скачайте с https://adoptium.net/';
            } else {
              result = 'Ошибка компиляции:\n' + compileResult.output;
            }
            success = false;
          } else {
            const execResult = await runCommand(`java -cp "${tempDir}" Main`, 30000);
            result = execResult.output;
            success = execResult.success;
          }
        }
        else if (lang === 'go') {
          const tempFile = path.join(tempDir, 'main.go');
          fs.writeFileSync(tempFile, body.code);
          const execResult = await runCommand(`go run "${tempFile}"`, 60000);
          if (!execResult.success) {
            if (execResult.output.includes('not recognized') || execResult.output.includes('not found') || execResult.output.includes('command not found')) {
              result = '❌ Go не установлен или не найден в PATH.\n\nУстановите Go:\n- Windows: winget install GoLang.Go\n- Linux: sudo apt-get install golang\n- macOS: brew install go\n\nИли скачайте с https://go.dev/dl/';
            } else {
              result = 'Ошибка выполнения:\n' + execResult.output;
            }
            success = false;
          } else {
            result = execResult.output;
            success = execResult.success;
          }
        }
        else if (lang === 'rust' || lang === 'rs') {
          const tempFile = path.join(tempDir, 'main.rs');
          const exeFile = path.join(tempDir, 'main.exe');
          fs.writeFileSync(tempFile, body.code);
          
          const compileResult = await runCommand(`rustc "${tempFile}" -o "${exeFile}"`, 60000);
          if (!compileResult.success) {
            if (compileResult.output.includes('not recognized') || compileResult.output.includes('not found') || compileResult.output.includes('command not found')) {
              result = '❌ Rust не установлен или не найден в PATH.\n\nУстановите Rust:\n- Все платформы: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\n- Windows: winget install Rustlang.Rust\n\nИли скачайте с https://www.rust-lang.org/tools/install';
            } else {
              result = 'Ошибка компиляции:\n' + compileResult.output;
            }
            success = false;
          } else {
            const execResult = await runCommand(`"${exeFile}"`, 30000);
            result = execResult.output;
            success = execResult.success;
          }
        }
        else {
          result = `Язык ${body.language} не поддерживается. Установите компилятор и попробуйте снова.`;
          success = false;
        }

        // Очистка временных файлов
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}

        sendJson(res, 200, { 
          result: result || '(нет вывода)', 
          success: success,
          language: body.language
        });
      } catch (err) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
        
        sendJson(res, 500, { 
          error: 'Ошибка выполнения: ' + err.message,
          success: false
        });
      }
      return;
    }

    // 404
    sendJson(res, 404, { error: `Unknown endpoint: ${pathname}` });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

// Запуск сервера
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('================================================');
  console.log('     Mirage AI - Local Server');
  console.log('------------------------------------------------');
  console.log('  [OK] Server running: http://' + HOST + ':' + PORT);
  console.log('');
  console.log('  Available tools:');
  console.log('  - File system (read/write/list)');
  console.log('  - Execute commands');
  console.log('  - Shutdown / restart PC');
  console.log('  - System information');
  console.log('  - Browser automation (puppeteer)');
  console.log('');
  console.log('  For browser automation:');
  console.log('  1. npm install puppeteer');
  console.log('  2. chrome --remote-debugging-port=9222');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('================================================');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('[ERROR] Port ' + PORT + ' is already in use. Close another server or change PORT.');
  } else {
    console.error('[ERROR] Server error:', err);
  }
  process.exit(1);
});
