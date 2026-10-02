const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

// Запуск сервера
function startServer() {
  const serverPath = path.join(__dirname, '..', 'server.cjs');
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
  });
}

// Остановка сервера
function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
}

// Создание главного окна
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    title: 'Mirage AI',
    backgroundColor: '#0d1117'
  });

  // Загрузка приложения
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Обработка внешних ссылок
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC обработчики для доступа к системе

// Выбор файла
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  return result;
});

// Выбор папки
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

// Сохранение файла
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options?.defaultPath || 'untitled',
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  return result;
});

// Чтение файла
ipcMain.handle('fs:readFile', async (event, filePath, encoding = 'utf-8') => {
  try {
    const content = fs.readFileSync(filePath, encoding);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Запись файла
ipcMain.handle('fs:writeFile', async (event, filePath, content, encoding = 'utf-8') => {
  try {
    fs.writeFileSync(filePath, content, encoding);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Список файлов в директории
ipcMain.handle('fs:readdir', async (event, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile(),
      path: path.join(dirPath, file.name)
    }));
    return { success: true, files: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Проверка существования пути
ipcMain.handle('fs:exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

// Получение информации о файле
ipcMain.handle('fs:stat', async (event, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    return {
      success: true,
      stat: {
        size: stat.size,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        created: stat.birthtime,
        modified: stat.mtime,
        accessed: stat.atime
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Открытие URL в браузере
ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// Открытие папки в проводнике
ipcMain.handle('shell:openPath', async (event, pathToOpen) => {
  await shell.openPath(pathToOpen);
  return { success: true };
});

// Получение информации о системе
ipcMain.handle('system:getInfo', async () => {
  const si = require('systeminformation');
  try {
    const [cpu, mem, disk, osInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.osInfo()
    ]);

    return {
      success: true,
      info: {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          speed: cpu.speed
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used
        },
        disks: disk.map(d => ({
          mount: d.mount,
          size: d.size,
          used: d.used,
          available: d.available
        })),
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch
        }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Запуск процесса
ipcMain.handle('process:spawn', async (event, command, args = [], options = {}) => {
  return new Promise((resolve) => {
    try {
      const proc = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      // Таймаут
      if (options.timeout) {
        setTimeout(() => {
          proc.kill();
          resolve({
            success: false,
            error: 'Process timeout'
          });
        }, options.timeout);
      }
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
});

// Буфер обмена
ipcMain.handle('clipboard:read', async () => {
  const { clipboard } = require('electron');
  return clipboard.readText();
});

ipcMain.handle('clipboard:write', async (event, text) => {
  const { clipboard } = require('electron');
  clipboard.writeText(text);
  return { success: true };
});

// Уведомления
ipcMain.handle('notification:show', async (event, title, body) => {
  const { Notification } = require('electron');
  new Notification({ title, body }).show();
  return { success: true };
});

// Закрытие приложения
ipcMain.handle('app:quit', () => {
  app.quit();
});

// Сворачивание окна
ipcMain.handle('window:minimize', () => {
  mainWindow.minimize();
});

// Разворачивание окна
ipcMain.handle('window:maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// Закрытие окна
ipcMain.handle('window:close', () => {
  mainWindow.close();
});

// Инициализация приложения
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});
