#!/usr/bin/env node

/**
 * Mirage AI - Installer
 * 
 * Run: node installer.js
 * 
 * This installer will:
 * 1. Check and install Node.js dependencies
 * 2. Build the project
 * 3. Check Ollama installation
 * 4. Install AI model
 * 5. Install compilers for CODER (Python, C++, C#, Java, Go, Rust)
 * 6. Create desktop shortcut
 * 7. Test server
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

// Проверка наличия компиляторов
function checkCompilers() {
  const compilers = {
    python: {
      name: 'Python',
      commands: ['python --version', 'python3 --version'],
      installed: false,
      version: ''
    },
    gcc: {
      name: 'GCC/G++ (C/C++)',
      commands: ['gcc --version', 'g++ --version'],
      installed: false,
      version: ''
    },
    csharp: {
      name: 'C# (Mono/.NET)',
      commands: ['csc --version', 'mcs --version', 'dotnet --version'],
      installed: false,
      version: ''
    },
    java: {
      name: 'Java (JDK)',
      commands: ['javac -version', 'java -version'],
      installed: false,
      version: ''
    },
    go: {
      name: 'Go',
      commands: ['go version'],
      installed: false,
      version: ''
    },
    rust: {
      name: 'Rust',
      commands: ['rustc --version'],
      installed: false,
      version: ''
    }
  };

  for (const [key, compiler] of Object.entries(compilers)) {
    for (const cmd of compiler.commands) {
      try {
        const output = execSync(cmd, { stdio: 'pipe' }).toString();
        compiler.installed = true;
        compiler.version = output.split('\n')[0].trim();
        break;
      } catch {
        // Команда не найдена, пробуем следующую
      }
    }
  }

  return compilers;
}

// Установка компиляторов
async function installCompilers() {
  const compilers = checkCompilers();
  const notInstalled = Object.entries(compilers).filter(([_, c]) => !c.installed);

  if (notInstalled.length === 0) {
    success('All compilers are already installed');
    return;
  }

  console.log('');
  info('Available compilers for installation:');
  console.log('');

  notInstalled.forEach(([key, compiler], index) => {
    console.log(`  ${index + 1}. ${compiler.name}`);
  });
  console.log('  0. Skip compiler installation');
  console.log('');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('Select compilers to install (comma-separated numbers, e.g., 1,2,3 or 0 to skip): ', resolve);
  });
  rl.close();

  if (answer.trim() === '0') {
    info('Skipping compiler installation');
    return;
  }

  const selected = answer.split(',').map(s => parseInt(s.trim())).filter(n => n > 0 && n <= notInstalled.length);

  if (selected.length === 0) {
    warning('No compilers selected');
    return;
  }

  const platform = os.platform();

  for (const idx of selected) {
    const [key, compiler] = notInstalled[idx - 1];
    console.log('');
    info(`Installing ${compiler.name}...`);

    try {
      if (platform === 'win32') {
        // Windows - используем winget
        const wingetCommands = {
          python: 'winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements',
          gcc: 'winget install MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements',
          csharp: 'winget install Microsoft.DotNet.SDK.8 --accept-package-agreements --accept-source-agreements',
          java: 'winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements',
          go: 'winget install GoLang.Go --accept-package-agreements --accept-source-agreements',
          rust: 'winget install Rustlang.Rust --accept-package-agreements --accept-source-agreements'
        };

        if (wingetCommands[key]) {
          execSync(wingetCommands[key], { stdio: 'inherit' });
          success(`${compiler.name} installed successfully`);
        }
      } else if (platform === 'darwin') {
        // macOS - используем brew
        const brewCommands = {
          python: 'brew install python',
          gcc: 'brew install gcc',
          csharp: 'brew install mono',
          java: 'brew install openjdk',
          go: 'brew install go',
          rust: 'brew install rustup'
        };

        if (brewCommands[key]) {
          execSync(brewCommands[key], { stdio: 'inherit' });
          success(`${compiler.name} installed successfully`);
        }
      } else {
        // Linux - используем apt
        const aptCommands = {
          python: 'sudo apt-get update && sudo apt-get install -y python3 python3-pip',
          gcc: 'sudo apt-get update && sudo apt-get install -y build-essential',
          csharp: 'sudo apt-get update && sudo apt-get install -y mono-complete',
          java: 'sudo apt-get update && sudo apt-get install -y default-jdk',
          go: 'sudo apt-get update && sudo apt-get install -y golang',
          rust: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'
        };

        if (aptCommands[key]) {
          execSync(aptCommands[key], { stdio: 'inherit' });
          success(`${compiler.name} installed successfully`);
        }
      }
    } catch (err) {
      error(`Failed to install ${compiler.name}: ${err.message}`);
      info(`You can install it manually later`);
    }
  }

  console.log('');
  success('Compiler installation completed');
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
  
  const shortcutPath = path.join(desktop, 'Mirage AI.bat');
  
  const batContent = `@echo off
title Mirage AI
cd /d "${projectPath}"
call start.bat
`;
  fs.writeFileSync(shortcutPath, batContent, 'utf-8');
  
  return shortcutPath;
}

function createLinuxShortcut(projectPath) {
  const desktop = getDesktopPath();
  const shortcutPath = path.join(desktop, 'mirage-ai.sh');
  
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
  const shortcutPath = path.join(desktop, 'Mirage AI.command');
  
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
  console.log('     Mirage AI - Installer');
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

  // 6. Install compilers
  step('Checking compilers for CODER...');
  const compilers = checkCompilers();
  const installedCompilers = Object.entries(compilers).filter(([_, c]) => c.installed);
  const notInstalledCompilers = Object.entries(compilers).filter(([_, c]) => !c.installed);

  if (installedCompilers.length > 0) {
    success('Installed compilers:');
    installedCompilers.forEach(([_, compiler]) => {
      console.log(`  ✓ ${compiler.name}: ${compiler.version}`);
    });
  }

  if (notInstalledCompilers.length > 0) {
    warning(`${notInstalledCompilers.length} compiler(s) not installed`);
    await installCompilers();
  } else {
    success('All compilers are installed');
  }

  // 7. Create desktop shortcut
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

  // 8. Check server
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
  
  // Показываем установленные компиляторы
  const finalCompilers = checkCompilers();
  const installed = Object.entries(finalCompilers).filter(([_, c]) => c.installed);
  
  if (installed.length > 0) {
    console.log('');
    success('Installed compilers for CODER:');
    installed.forEach(([_, compiler]) => {
      console.log(`  ✓ ${compiler.name}`);
    });
  }
  
  info('');
  info('To launch:');
  info('  1. Double-click "Mirage AI" shortcut on desktop');
  info('  2. Or run manually:');
  info('     ollama serve');
  info('     node server.cjs');
  info('     Open http://localhost:3001 in browser');
  info('');
  info('Features:');
  info('  • Main chat with AI assistant');
  info('  • CODER - code editor with auto-fix');
  info('  • Voice input (Chrome/Edge)');
  info('  • File management');
  info('  • Internet search');
  info('  • Knowledge base');
  info('');
  info('Documentation: README.md, CODER_GUIDE.md');
  console.log('');
}

main().catch(err => {
  error('Critical error: ' + err.message);
  process.exit(1);
});
