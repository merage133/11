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
    return path.join(home, 'Desktop');
  } else if (os.platform() === 'darwin') {
    return path.join(home, 'Desktop');
  } else {
    // Linux
    return path.join(home, 'Рабочий стол') || path.join(home, 'Desktop');
  }
}

function createWindowsShortcut(projectPath) {
  const desktop = getDesktopPath();
  const shortcutPath = path.join(desktop, 'RU AI Studio.bat');
  
  // Просто копируем start.bat на рабочий стол
  const startBatPath = path.join(projectPath, 'start.bat');
  if (fs.existsSync(startBatPath)) {
    fs.copyFileSync(startBatPath, shortcutPath);
  } else {
    // Если start.bat нет, создаём простой ярлык
    const batContent = `@echo off
cd /d "${projectPath}"
call start.bat
`;
    fs.writeFileSync(shortcutPath, batContent, 'utf-8');
  }
  
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
  if (!checkCommand('ollama --version')) {
    warning('Ollama не установлена!');
    info('');
    info('Установите Ollama:');
    if (os.platform() === 'win32') {
      info('  Скачайте с: https://ollama.com/download');
    } else {
      info('  curl -fsSL https://ollama.com/install.sh | sh');
    }
    info('');
    info('После установки запустите установщик снова.');
  } else {
    const ollamaVersion = execSync('ollama --version').toString().trim();
    success(`Ollama ${ollamaVersion}`);

    // 5. Предлагаем установить модель
    step('Проверка моделей...');
    try {
      const modelsOutput = execSync('ollama list').toString();
      if (modelsOutput.includes('qwen2.5')) {
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
    } catch {
      warning('Не удалось получить список моделей');
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
  
  // Проверяем сервер
  try {
    const response = execSync('curl -s http://localhost:3001/api/health').toString();
    const health = JSON.parse(response);
    if (health.status === 'ok') {
      success('Сервер работает');
    } else {
      warning('Сервер ответил, но статус не ok');
    }
  } catch {
    warning('Сервер не отвечает (возможно, порт занят)');
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
