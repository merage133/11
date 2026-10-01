#!/usr/bin/env node

/**
 * RU AI Studio - Installer
 * 
 * Run: node installer.js
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

function success(msg) { console.log(COLORS.green + '[OK] ' + msg + COLORS.reset); }
function error(msg) { console.log(COLORS.red + '[ERROR] ' + msg + COLORS.reset); }
function warning(msg) { console.log(COLORS.yellow + '[WARN] ' + msg + COLORS.reset); }
function info(msg) { console.log(COLORS.cyan + '[INFO] ' + msg + COLORS.reset); }
function step(msg) { console.log('\n' + COLORS.blue + '=== ' + msg + ' ===' + COLORS.reset); }

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
    const desktop = path.join(home, 'Desktop');
    if (!fs.existsSync(desktop)) {
      fs.mkdirSync(desktop, { recursive: true });
    }
    return desktop;
  } else if (os.platform() === 'darwin') {
    return path.join(home, 'Desktop');
  } else {
    const ruDesktop = path.join(home, 'Рабочий стол');
    const enDesktop = path.join(home, 'Desktop');
    
    if (fs.existsSync(ruDesktop)) {
      return ruDesktop;
    } else if (fs.existsSync(enDesktop)) {
      return enDesktop;
    } else {
      return enDesktop;
    }
  }
}

function createWindowsShortcut(projectPath) {
  const desktop = getDesktopPath();
  
  if (!fs.existsSync(desktop)) {
    fs.mkdirSync(desktop, { recursive: true });
  }
  
  const shortcutPath = path.join(desktop, 'RU AI Studio.bat');
  
  const batContent = `@echo off
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
  
  const startShPath = path.join(projectPath, 'start.sh');
  if (fs.existsSync(startShPath)) {
    fs.copyFileSync(startShPath, shortcutPath);
    fs.chmodSync(shortcutPath, 0o755);
  } else {
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
  
  const startShPath = path.join(projectPath, 'start.sh');
  if (fs.existsSync(startShPath)) {
    fs.copyFileSync(startShPath, shortcutPath);
    fs.chmodSync(shortcutPath, 0o755);
  } else {
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
  console.log(COLORS.bright + COLORS.cyan + '================================================');
  console.log('     RU AI Studio - Installer');
  console.log('================================================' + COLORS.reset);
  console.log('');

  const projectPath = process.cwd();
  info('Project path: ' + projectPath);

  // 1. Check Node.js
  step('Checking Node.js...');
  if (!checkCommand('node --version')) {
    error('Node.js not installed!');
    info('Download from: https://nodejs.org/');
    process.exit(1);
  }
  const nodeVersion = execSync('node --version').toString().trim();
  success('Node.js ' + nodeVersion);

  // 2. Install dependencies
  step('Installing npm dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    success('Dependencies installed');
  } catch {
    error('Failed to install dependencies');
    process.exit(1);
  }

  // 3. Build project
  step('Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Project built');
  } catch {
    error('Build failed');
    process.exit(1);
  }

  // 4. Check Ollama
  step('Checking Ollama...');
  let ollamaInstalled = false;
  let ollamaVersion = '';
  
  if (os.platform() === 'win32') {
    try {
      const whereResult = execSync('where ollama', { stdio: 'pipe' }).toString().trim();
      if (whereResult) {
        ollamaInstalled = true;
        try {
          ollamaVersion = execSync('ollama --version', { stdio: 'pipe' }).toString().trim();
        } catch {
          ollamaVersion = 'installed';
        }
      }
    } catch {
      ollamaInstalled = false;
    }
  } else {
    ollamaInstalled = checkCommand('command -v ollama');
    if (ollamaInstalled) {
      try {
        ollamaVersion = execSync('ollama --version', { stdio: 'pipe' }).toString().trim();
      } catch {
        ollamaVersion = 'installed';
      }
    }
  }
  
  if (!ollamaInstalled) {
    warning('Ollama not installed!');
    info('');
    info('Install Ollama:');
    if (os.platform() === 'win32') {
      info('  1. Download: https://ollama.com/download');
      info('  2. Run installer');
      info('  3. Run this installer again');
    } else {
      info('  curl -fsSL https://ollama.com/install.sh | sh');
    }
    info('');
    info('After installation, run installer again.');
  } else {
    success('Ollama ' + ollamaVersion);

    // 5. Check models
    step('Checking models...');
    let modelsOutput = '';
    try {
      modelsOutput = execSync('ollama list', { stdio: 'pipe' }).toString();
    } catch {
      if (os.platform() === 'win32') {
        try {
          modelsOutput = execSync('powershell -Command "ollama list"', { stdio: 'pipe' }).toString();
        } catch {
          warning('Failed to get model list');
        }
      }
    }
    
    if (modelsOutput && modelsOutput.includes('qwen2.5')) {
      success('Model qwen2.5 already installed');
    } else {
      warning('Model qwen2.5 not found');
      info('');
      info('Recommended model for work:');
      info('  ollama pull qwen2.5:7b');
      info('');
      info('Size: ~4.7 GB');
      info('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Install model now? (y/n): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        info('Installing model (this will take a few minutes)...');
        try {
          execSync('ollama pull qwen2.5:7b', { stdio: 'inherit' });
          success('Model installed');
        } catch {
          error('Failed to install model');
          info('You can install it later: ollama pull qwen2.5:7b');
        }
      }
    }
  }

  // 6. Create desktop shortcut
  step('Creating desktop shortcut...');
  try {
    let shortcutPath;
    if (os.platform() === 'win32') {
      shortcutPath = createWindowsShortcut(projectPath);
    } else if (os.platform() === 'darwin') {
      shortcutPath = createMacShortcut(projectPath);
    } else {
      shortcutPath = createLinuxShortcut(projectPath);
    }
    success('Shortcut created: ' + shortcutPath);
  } catch (err) {
    error('Failed to create shortcut: ' + err.message);
  }

  // 7. Check server
  step('Checking server...');
  
  info('Starting server for test...');
  const serverProcess = exec('node server.cjs', { cwd: projectPath });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
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
              success('Server is working');
            } else {
              warning('Server responded, but status is not ok');
            }
          } catch {
            warning('Server responded, but failed to parse response');
          }
          resolve();
        });
      });
      req.on('error', () => {
        warning('Server not responding (port may be busy)');
        resolve();
      });
      req.setTimeout(3000, () => {
        req.destroy();
        warning('Server not responding (timeout)');
        resolve();
      });
    });
  } catch {
    warning('Failed to check server');
  }
  
  serverProcess.kill();

  // Final message
  console.log('');
  console.log(COLORS.bright + COLORS.green + '================================================');
  console.log('     Installation completed successfully!');
  console.log('================================================' + COLORS.reset);
  console.log('');
  success('Shortcut created on desktop');
  info('');
  info('To launch:');
  info('  1. Double-click "RU AI Studio" shortcut on desktop');
  info('  2. Or run manually:');
  info('     ollama serve');
  info('     node server.cjs');
  info('     Open dist/index.html in browser');
  info('');
  info('Documentation: INSTALL.md');
  console.log('');
}

main().catch(err => {
  error('Critical error: ' + err.message);
  process.exit(1);
});
