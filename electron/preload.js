const { contextBridge, ipcRenderer } = require('electron');

// API для доступа к системным функциям
contextBridge.exposeInMainWorld('electronAPI', {
  // Диалоги
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  },

  // Файловая система
  fs: {
    readFile: (filePath, encoding) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
    writeFile: (filePath, content, encoding) => ipcRenderer.invoke('fs:writeFile', filePath, content, encoding),
    readdir: (dirPath) => ipcRenderer.invoke('fs:readdir', dirPath),
    exists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
    stat: (filePath) => ipcRenderer.invoke('fs:stat', filePath)
  },

  // Shell
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path) => ipcRenderer.invoke('shell:openPath', path)
  },

  // Система
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo')
  },

  // Процессы
  process: {
    spawn: (command, args, options) => ipcRenderer.invoke('process:spawn', command, args, options)
  },

  // Буфер обмена
  clipboard: {
    read: () => ipcRenderer.invoke('clipboard:read'),
    write: (text) => ipcRenderer.invoke('clipboard:write', text)
  },

  // Уведомления
  notification: {
    show: (title, body) => ipcRenderer.invoke('notification:show', title, body)
  },

  // Управление приложением
  app: {
    quit: () => ipcRenderer.invoke('app:quit')
  },

  // Управление окном
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
});
