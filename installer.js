#!/usr/bin/env node

/**
 * RU AI Studio — Установщик
 * 
 * Запуск: node installer.js
 * 
 * Что делает:
 * 1. Проверяет Node.js
 * 2. Устанавливает npm зависимости
 * 3. Проверяет наличие Ollama
 * 4. Предлагает установить модель
 * 5. Создаёт ярлык на рабочем столе
 * 6. Проверяет работоспособность
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function success(msg) { log(COLORS.green, `✅ ${msg}`); }
function error(msg) { log(COLORS.red, `❌ ${msg}`); }
function warning(msg) { log(COLORS.yellow, `⚠️  ${msg}`); }
function info(msg) { log(COLORS.cyan, `ℹ️  ${msg}`); }
function step(msg) { log(COLORS.blue, `\n📦 ${msg}`); }

function checkCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getDesktopPath() {
  const home = os.homedir();
  if (os.platform() === 'win32') {
    // Windows: проверяем несколько вариантов
    const possiblePaths = [
      path.join(home, 'Desktop'),
      path.join(home, 'OneDrive', 'Desktop'),
      path.join(home, 'OneDrive', 'Рабочий стол'),
      path.join(home, 'Рабочий стол'),
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    // Если ни один не найден, создаём Desktop
    const desktop = path.join(home, 'Desktop');
    if (!fs.existsSync(desktop)) {
      fs.mkdirSync(desktop, { recursive: true });
    }
    return desktop;
  } else if (os.platform() === 'darwin') {
    return path.join(home, 'Desktop');
  } else {
    // Linux — проверяем существование папки
    const ruDesktop = path.join(home, 'Рабочий стол');
    const enDesktop = path.join(home, 'Desktop');
    
    if (fs.existsSync(ruDesktop)) {
      return ruDesktop;
    } else if (fs.existsSync(enDesktop)) {
      return enDesktop;
    } else {
      // Если ни одной нет, создаём Desktop
      return enDesktop;
    }
  }
}

function createWindowsShortcut(projectPath) {
  const desktop = getDesktopPath();
  
  // Создаём папку Desktop если не существует
  if (!fs.existsSync(desktop)) {
    fs.mkdirSync(desktop, { recursive: true });
  }
  
  const shortcutPath = path.join(desktop, 'RU AI Studio.bat');
  
  // Создаём bat файл для рабочего стола, который запускает start.bat из папки проекта
  const batContent = `@echo off
chcp 65001 >nul
title RU AI Studio
cd /d "${projectPath}"
call start.bat
`;
  fs.writeFileSync(shortcutPath, batContent, 'utf-8');
  
  return shortcutPath;
}

function createLinuxShortcut(projectPath) {
  const desktop = getDesktopPath();
  const shortcutPath = path.join(desktop, 'ru-ai-studio.sh');
  
  // Просто копируем start.sh на рабочий стол
  const startShPath = path.join(projectPath, 'start.sh');
  if (fs.existsSync(startShPath)) {
    fs.copyFileSync(startShPath, shortcutPath);
    fs.chmodSync(shortcutPath, 0o755);
  } else {
    // Если start.sh нет, создаём простой ярлык
    const shContent = `#!/bin/bash
cd "${projectPath}"
bash start.sh
`;
    fs.writeFileSync(shortcutPath, shContent, { mode: 0o755 });
  }
  
  return shortcutPath;
}

function createMacShortcut(projectPath) {
  const desktop = getDesktopPath();
  const shortcutPath = path.join(desktop, 'RU AI Studio.command');
  
  // Просто копируем start.sh на рабочий стол (переименовываем в .command для macOS)
  const startShPath = path.join(projectPath, 'start.sh');
  if (fs.existsSync(startShPath)) {
    fs.copyFileSync(startShPath, shortcutPath);
    fs.chmodSync(shortcutPath, 0o755);
  } else {
    // Если start.sh нет, создаём простой ярлык
    const shContent = `#!/bin/bash
cd "${projectPath}"
bash start.sh
`;
    fs.writeFileSync(shortcutPath, shContent, { mode: 0o755 });
  }
  
  return shortcutPath;
}

async function main() {
  console.log('');
  log(COLORS.bright + COLORS.cyan, '╔══════════════════════════════════════════════╗');
  log(COLORS.bright + COLORS.cyan, '║     RU AI Studio — Установщик               ║');
  log(COLORS.bright + COLORS.cyan, '╚══════════════════════════════════════════════╝');
  console.log('');

  const projectPath = process.cwd();
  info(`Путь проекта: ${projectPath}`);

  // 1. Проверяем Node.js
  step('Проверка Node.js...');
  if (!checkCommand('node --version')) {
    error('Node.js не установлен!');
    info('Скачайте с: https://nodejs.org/');
    process.exit(1);
  }
  const nodeVersion = execSync('node --version').toString().trim();
  success(`Node.js ${nodeVersion}`);

  // 2. Устанавливаем зависимости
  step('Установка npm зависимостей...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    success('Зависимости установлены');
  } catch {
    error('Ошибка установки зависимостей');
    process.exit(1);
  }

  // 3. Собираем проект
  step('Сборка проекта...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Проект собран');
  } catch {
    error('Ошибка сборки');
    process.exit(1);
  }

  // 4. Проверяем Ollama
  step('Проверка Ollama...');
  let ollamaInstalled = false;
  let ollamaVersion = '';
  
  if (os.platform() === 'win32') {
    // Windows: используем where для проверки
    try {
      const whereResult = execSync('where ollama', { stdio: 'pipe' }).toString().trim();
      if (whereResult) {
        ollamaInstalled = true;
        try {
          ollamaVersion = execSync('ollama --version', { stdio: 'pipe' }).toString().trim();
        } catch {
          ollamaVersion = 'установлена';
        }
      }
    } catch {
      ollamaInstalled = false;
    }
  } else {
    // Linux/macOS: используем command -v
    ollamaInstalled = checkCommand('command -v ollama');
    if (ollamaInstalled) {
      try {
        ollamaVersion = execSync('ollama --version', { stdio: 'pipe' }).toString().trim();
      } catch {
        ollamaVersion = 'установлена';
      }
    }
  }
  
  if (!ollamaInstalled) {
    warning('Ollama не установлена!');
    info('');
    info('Установите Ollama:');
    if (os.platform() === 'win32') {
      info('  1. Скачайте с: https://ollama.com/download');
      info('  2. Запустите установщик');
      info('  3. Перезапустите этот установщик');
    } else {
      info('  curl -fsSL https://ollama.com/install.sh | sh');
    }
    info('');
    info('После установки запустите установщик снова.');
  } else {
    success(`Ollama ${ollamaVersion}`);

    // 5. Предлагаем установить модель
    step('Проверка моделей...');
    let modelsOutput = '';
    try {
      modelsOutput = execSync('ollama list', { stdio: 'pipe' }).toString();
    } catch {
      // Если команда не сработала, пробуем через PowerShell на Windows
      if (os.platform() === 'win32') {
        try {
          modelsOutput = execSync('powershell -Command "ollama list"', { stdio: 'pipe' }).toString();
        } catch {
          warning('Не удалось получить список моделей');
        }
      }
    }
    
    if (modelsOutput && modelsOutput.includes('qwen2.5')) {
      success('Модель qwen2.5 уже установлена');
    } else {
      warning('Модель qwen2.5 не найдена');
      info('');
      info('Рекомендуется установить модель для работы:');
      info('  ollama pull qwen2.5:7b');
      info('');
      info('Размер: ~4.7 GB');
      info('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Установить модель сейчас? (y/n): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        info('Устанавливаю модель (это займёт несколько минут)...');
        try {
          execSync('ollama pull qwen2.5:7b', { stdio: 'inherit' });
          success('Модель установлена');
        } catch {
          error('Ошибка установки модели');
          info('Вы можете установить её позже: ollama pull qwen2.5:7b');
        }
      }
    }
  }

  // 6. Создаём ярлык на рабочем столе
  step('Создание ярлыка на рабочем столе...');
  try {
    let shortcutPath;
    if (os.platform() === 'win32') {
      shortcutPath = createWindowsShortcut(projectPath);
    } else if (os.platform() === 'darwin') {
      shortcutPath = createMacShortcut(projectPath);
    } else {
      shortcutPath = createLinuxShortcut(projectPath);
    }
    success(`Ярлык создан: ${shortcutPath}`);
  } catch (err) {
    error(`Не удалось создать ярлык: ${err.message}`);
  }

  // 7. Проверяем работоспособность
  step('Проверка работоспособности...');
  
  // Запускаем сервер в фоне
  info('Запускаю сервер для проверки...');
  const serverProcess = exec('node server.js', { cwd: projectPath });
  
  // Ждём 3 секунды
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Проверяем сервер с помощью Node.js (кроссплатформенно)
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.status === 'ok') {
              success('Сервер работает');
            } else {
              warning('Сервер ответил, но статус не ok');
            }
          } catch {
            warning('Сервер ответил, но не удалось распарсить ответ');
          }
          resolve();
        });
      });
      req.on('error', () => {
        warning('Сервер не отвечает (возможно, порт занят)');
        resolve();
      });
      req.setTimeout(3000, () => {
        req.destroy();
        warning('Сервер не отвечает (таймаут)');
        resolve();
      });
    });
  } catch {
    warning('Не удалось проверить сервер');
  }
  
  // Останавливаем сервер
  serverProcess.kill();

  // Финальное сообщение
  console.log('');
  log(COLORS.bright + COLORS.green, '╔══════════════════════════════════════════════╗');
  log(COLORS.bright + COLORS.green, '║     ✅ Установка завершена!                 ║');
  log(COLORS.bright + COLORS.green, '╚══════════════════════════════════════════════╝');
  console.log('');
  success('Ярлык создан на рабочем столе');
  info('');
  info('Для запуска:');
  info('  1. Дважды кликните на ярлык "RU AI Studio"');
  info('  2. Или запустите вручную:');
  info('     ollama serve');
  info('     node server.js');
  info('     Откройте dist/index.html в браузере');
  info('');
  info('Документация: INSTALL.md');
  console.log('');
}

main().catch(err => {
  error(`Критическая ошибка: ${err.message}`);
  process.exit(1);
});
