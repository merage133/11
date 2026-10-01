/**
 * RU AI Studio — Локальный сервер для системных команд
 * 
 * Запуск: node server.js
 * 
 * Этот сервер даёт AI доступ к:
 * - Файловой системе
 * - Выполнению команд
 * - Управлению компьютером (выключение/перезагрузка)
 * - Автоматизации браузера (через puppeteer, если установлен)
 */

const http = require('http');
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
  console.log('     RU AI Studio - Local Server');
  console.log('------------------------------------------------');
  console.log(`  [OK] Server running: http://${HOST}:${PORT}`);
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
    console.error(`[ERROR] Port ${PORT} is already in use. Close another server or change PORT.`);
  } else {
    console.error('[ERROR] Server error:', err);
  }
  process.exit(1);
});
