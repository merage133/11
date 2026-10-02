# 🎭 Mirage AI Desktop - Полное руководство

## 📋 Содержание

1. [Обзор](#обзор)
2. [Установка](#установка)
3. [Возможности](#возможности)
4. [API Reference](#api-reference)
5. [Примеры](#примеры)
6. [Сборка](#сборка)
7. [Решение проблем](#решение-проблем)

---

## 🎯 Обзор

**Mirage AI Desktop** - это полноценное десктопное приложение на Electron, которое предоставляет:

- ✅ Полный доступ к файловой системе
- ✅ Управление процессами и командами
- ✅ Системные диалоги и уведомления
- ✅ Нативный интерфейс
- ✅ Автономную работу без браузера

---

## 🚀 Установка

### Требования

- Node.js 18+
- npm или yarn
- Git (опционально)

### Шаги установки

#### 1. Клонируйте репозиторий

```bash
git clone https://github.com/your-repo/mirage-ai.git
cd mirage-ai
```

#### 2. Установите зависимости

```bash
# Основные зависимости
npm install

# Electron зависимости
npm install --save-dev electron electron-builder concurrently
```

#### 3. Обновите package.json

```bash
# Windows
copy package.electron.json package.json

# Linux/Mac
cp package.electron.json package.json
```

#### 4. Создайте иконки

Создайте папку `build/` и добавьте иконки:

```bash
mkdir build
```

Добавьте файлы:
- `build/icon.ico` (Windows, 256x256 px)
- `build/icon.icns` (macOS, 512x512 px)
- `build/icon.png` (Linux, 512x512 px)

Можно конвертировать существующую `mirage_icon.png`:
- https://convertio.co/png-ico/
- https://iconifier.net/

#### 5. Запустите в режиме разработки

```bash
# Один терминал: сервер
npm run server

# Второй терминал: React
npm run dev:react

# Третий терминал: Electron
npm start
```

Или одной командой:
```bash
npm run dev
```

#### 6. Соберите приложение

```bash
npm run build:electron
```

Результат в папке `dist-electron/`:
- Windows: `Mirage AI Setup 2.3.1.exe`
- macOS: `Mirage AI-2.3.1.dmg`
- Linux: `Mirage AI-2.3.1.AppImage`

---

## 🎨 Возможности

### 1. Файловая система

#### Выбор файла через системный диалог

```javascript
const result = await window.electronAPI.dialog.openFile({
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'Documents', extensions: ['pdf', 'doc', 'txt'] }
  ]
});

if (!result.canceled && result.filePaths.length > 0) {
  const filePath = result.filePaths[0];
  console.log('Выбран файл:', filePath);
}
```

#### Чтение файла

```javascript
const { success, content, error } = await window.electronAPI.fs.readFile(
  'C:/path/to/file.txt',
  'utf-8'
);

if (success) {
  console.log('Содержимое:', content);
} else {
  console.error('Ошибка:', error);
}
```

#### Запись файла

```javascript
const { success, error } = await window.electronAPI.fs.writeFile(
  'C:/path/to/file.txt',
  'Новое содержимое',
  'utf-8'
);

if (success) {
  console.log('Файл записан');
}
```

#### Список файлов в папке

```javascript
const { success, files, error } = await window.electronAPI.fs.readdir('C:/Users');

if (success) {
  files.forEach(file => {
    console.log(`${file.name} - ${file.isDirectory ? 'Папка' : 'Файл'}`);
  });
}
```

#### Информация о файле

```javascript
const { success, stat, error } = await window.electronAPI.fs.stat('C:/path/to/file.txt');

if (success) {
  console.log('Размер:', stat.size, 'байт');
  console.log('Создан:', stat.created);
  console.log('Изменён:', stat.modified);
}
```

---

### 2. Управление процессами

#### Запуск команды

```javascript
const result = await window.electronAPI.process.spawn(
  'python',
  ['script.py', 'arg1', 'arg2'],
  {
    cwd: 'C:/workspace',
    timeout: 30000 // 30 секунд
  }
);

if (result.success) {
  console.log('Вывод:', result.stdout);
} else {
  console.error('Ошибка:', result.stderr || result.error);
}
```

#### Запуск с таймаутом

```javascript
const result = await window.electronAPI.process.spawn(
  'ping',
  ['google.com', '-t'],
  { timeout: 5000 } // 5 секунд
);

// Автоматически остановится через 5 секунд
```

---

### 3. Системные диалоги

#### Выбор папки

```javascript
const { canceled, filePaths } = await window.electronAPI.dialog.openDirectory();

if (!canceled && filePaths.length > 0) {
  console.log('Выбрана папка:', filePaths[0]);
}
```

#### Сохранение файла

```javascript
const { canceled, filePath } = await window.electronAPI.dialog.saveFile({
  defaultPath: 'document.txt',
  filters: [
    { name: 'Text Files', extensions: ['txt'] },
    { name: 'All Files', extensions: ['*'] }
  ]
});

if (!canceled) {
  console.log('Сохранить в:', filePath);
}
```

---

### 4. Буфер обмена

#### Чтение из буфера

```javascript
const text = await window.electronAPI.clipboard.read();
console.log('В буфере:', text);
```

#### Запись в буфер

```javascript
await window.electronAPI.clipboard.write('Текст для копирования');
console.log('Скопировано в буфер');
```

---

### 5. Системная информация

```javascript
const { success, info, error } = await window.electronAPI.system.getInfo();

if (success) {
  // CPU
  console.log('CPU:', info.cpu.brand);
  console.log('Ядра:', info.cpu.cores);
  console.log('Частота:', info.cpu.speed, 'GHz');
  
  // RAM
  const totalGB = (info.memory.total / 1024 / 1024 / 1024).toFixed(1);
  const freeGB = (info.memory.free / 1024 / 1024 / 1024).toFixed(1);
  console.log(`RAM: ${freeGB} / ${totalGB} GB`);
  
  // Диски
  info.disks.forEach(disk => {
    const sizeGB = (disk.size / 1024 / 1024 / 1024).toFixed(1);
    const freeGB = (disk.available / 1024 / 1024 / 1024).toFixed(1);
    console.log(`${disk.mount}: ${freeGB} / ${sizeGB} GB`);
  });
  
  // ОС
  console.log('ОС:', info.os.distro, info.os.release);
  console.log('Архитектура:', info.os.arch);
}
```

---

### 6. Управление окном

```javascript
// Свернуть
await window.electronAPI.window.minimize();

// Развернуть/свернуть
await window.electronAPI.window.maximize();

// Закрыть
await window.electronAPI.window.close();
```

---

### 7. Уведомления

```javascript
await window.electronAPI.notification.show(
  'Mirage AI',
  'Задача выполнена успешно!'
);
```

---

### 8. Внешние ссылки

```javascript
// Открыть URL в браузере
await window.electronAPI.shell.openExternal('https://example.com');

// Открыть папку в проводнике
await window.electronAPI.shell.openPath('C:/Users');
```

---

## 📚 API Reference

### dialog

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `openFile(options)` | Открыть файл | `options.filters` | `{canceled, filePaths}` |
| `openDirectory()` | Открыть папку | - | `{canceled, filePaths}` |
| `saveFile(options)` | Сохранить файл | `options.defaultPath`, `options.filters` | `{canceled, filePath}` |

### fs

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `readFile(path, encoding)` | Прочитать файл | `path`, `encoding` | `{success, content, error}` |
| `writeFile(path, content, encoding)` | Записать файл | `path`, `content`, `encoding` | `{success, error}` |
| `readdir(path)` | Список файлов | `path` | `{success, files, error}` |
| `exists(path)` | Проверить существование | `path` | `boolean` |
| `stat(path)` | Информация о файле | `path` | `{success, stat, error}` |

### process

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `spawn(command, args, options)` | Запустить процесс | `command`, `args`, `options` | `{success, stdout, stderr, error}` |

### clipboard

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `read()` | Читать буфер | - | `string` |
| `write(text)` | Записать в буфер | `text` | `{success}` |

### system

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `getInfo()` | Системная информация | - | `{success, info, error}` |

### window

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `minimize()` | Свернуть | - | - |
| `maximize()` | Развернуть | - | - |
| `close()` | Закрыть | - | - |

### notification

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `show(title, body)` | Показать уведомление | `title`, `body` | `{success}` |

### shell

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `openExternal(url)` | Открыть URL | `url` | `{success}` |
| `openPath(path)` | Открыть папку | `path` | `{success}` |

### app

| Метод | Описание | Параметры | Возвращает |
|-------|----------|-----------|------------|
| `quit()` | Выйти из приложения | - | - |

---

## 💡 Примеры

### Пример 1: Выбор и чтение файла

```javascript
// Открыть диалог выбора
const result = await window.electronAPI.dialog.openFile({
  filters: [{ name: 'Text Files', extensions: ['txt'] }]
});

if (!result.canceled && result.filePaths.length > 0) {
  // Прочитать файл
  const { success, content, error } = await window.electronAPI.fs.readFile(
    result.filePaths[0],
    'utf-8'
  );
  
  if (success) {
    console.log('Содержимое файла:', content);
  } else {
    console.error('Ошибка чтения:', error);
  }
}
```

### Пример 2: Запуск Python скрипта

```javascript
const result = await window.electronAPI.process.spawn(
  'python',
  ['script.py'],
  {
    cwd: 'C:/workspace',
    timeout: 30000
  }
);

if (result.success) {
  console.log('Результат:', result.stdout);
  await window.electronAPI.notification.show(
    'Mirage AI',
    'Скрипт выполнен успешно!'
  );
} else {
  console.error('Ошибка:', result.stderr);
  await window.electronAPI.notification.show(
    'Mirage AI',
    'Ошибка выполнения скрипта'
  );
}
```

### Пример 3: Мониторинг системы

```javascript
const { info } = await window.electronAPI.system.getInfo();

const cpuUsage = info.cpu.speed;
const ramUsage = ((info.memory.used / info.memory.total) * 100).toFixed(1);
const diskUsage = info.disks.map(d => ({
  mount: d.mount,
  percent: ((d.used / d.size) * 100).toFixed(1)
}));

console.log(`CPU: ${cpuUsage} GHz`);
console.log(`RAM: ${ramUsage}%`);
diskUsage.forEach(d => {
  console.log(`${d.mount}: ${d.percent}%`);
});
```

### Пример 4: Интеграция с React

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';

function App() {
  const [systemInfo, setSystemInfo] = useState(null);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (isElectron) {
      loadSystemInfo();
    }
  }, []);

  const loadSystemInfo = async () => {
    const { info } = await window.electronAPI.system.getInfo();
    setSystemInfo(info);
  };

  const handleFileSelect = async () => {
    const result = await window.electronAPI.dialog.openFile();
    if (!result.canceled && result.filePaths.length > 0) {
      const { content } = await window.electronAPI.fs.readFile(result.filePaths[0]);
      console.log(content);
    }
  };

  return (
    <div>
      {isElectron && (
        <>
          <button onClick={handleFileSelect}>Выбрать файл</button>
          {systemInfo && (
            <div>
              <p>CPU: {systemInfo.cpu.brand}</p>
              <p>RAM: {(systemInfo.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 📦 Сборка

### Для Windows

```bash
npm run dist -- --win
```

Создаст:
- `Mirage AI Setup 2.3.1.exe` (NSIS установщик)
- `Mirage AI 2.3.1.exe` (portable версия)

### Для macOS

```bash
npm run dist -- --mac
```

Создаст:
- `Mirage AI-2.3.1.dmg` (DMG образ)
- `Mirage AI.app` (приложение)

### Для Linux

```bash
npm run dist -- --linux
```

Создаст:
- `Mirage AI-2.3.1.AppImage` (portable версия)
- `mirage-ai_2.3.1_amd64.deb` (Debian/Ubuntu)
- `mirage-ai-2.3.1.x86_64.rpm` (Fedora/RHEL)

---

## 🐛 Решение проблем

### Electron не запускается

```bash
# Переустановите Electron
npm install --save-dev electron

# Очистите кэш
npm cache clean --force
```

### Ошибка сборки

```bash
# Удалите node_modules
rm -rf node_modules package-lock.json

# Переустановите
npm install

# Пересоберите
npm run build:electron
```

### Иконки не отображаются

- Убедитесь что файлы в папке `build/`
- Проверьте форматы: `.ico`, `.icns`, `.png`
- Размеры: 256x256 (ico), 512x512 (icns, png)
- Пересоберите приложение

### Приложение не видит сервер

- Убедитесь что сервер запущен: `npm run server`
- Проверьте порт 3001: `netstat -ano | findstr :3001`
- Проверьте логи в консоли

### WebSocket не подключается

- Проверьте порт 3002: `netstat -ano | findstr :3002`
- Убедитесь что сервер запущен
- Перезапустите приложение

---

## 📚 Документация

- **ELECTRON_GUIDE.md** - этот файл (полное руководство)
- **ELECTRON_SETUP.md** - инструкция по установке
- **ELECTRON_QUICK_START.md** - быстрый старт
- **MAJOR_UPDATE.md** - описание всех функций
- **README.md** - основная документация

### Внешние ресурсы

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Electron Fiddle](https://www.electronjs.org/fiddle)
- [Electron API Demos](https://github.com/electron/electron-api-demos)

---

## 🎯 Преимущества десктопной версии

| Функция | Веб | Десктоп |
|---------|-----|---------|
| Доступ к файлам | ⚠️ Ограниченный | ✅ Полный |
| Системные диалоги | ❌ | ✅ |
| Буфер обмена | ⚠️ Ограниченный | ✅ Полный |
| Управление процессами | ❌ | ✅ |
| Уведомления | ⚠️ Ограниченные | ✅ Нативные |
| Автозапуск | ❌ | ✅ |
| Работа оффлайн | ⚠️ | ✅ |
| Установка | ❌ | ✅ |
| Скорость | ⚠️ | ✅ |
| Интеграция с ОС | ❌ | ✅ |

---

**Версия**: 2.3.1  
**Платформа**: Windows, macOS, Linux  
**Лицензия**: MIT  
**Автор**: Mirage AI Team  
**Статус**: ✅ Готово к использованию
