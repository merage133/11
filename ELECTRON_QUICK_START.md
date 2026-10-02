# 🚀 Mirage AI Desktop - Быстрая установка

## ⚡ Быстрый старт (5 минут)

### 1. Установите Electron

```bash
npm install --save-dev electron electron-builder concurrently
```

### 2. Обновите package.json

```bash
# Windows
copy package.electron.json package.json

# Linux/Mac
cp package.electron.json package.json
```

### 3. Создайте иконки

Создайте папку `build/` и добавьте:
- `build/icon.ico` (Windows)
- `build/icon.icns` (macOS)
- `build/icon.png` (Linux)

Используйте существующую `mirage_icon.png` и конвертируйте:
- https://convertio.co/png-ico/

### 4. Запустите

```bash
# Терминал 1: Сервер
npm run server

# Терминал 2: React
npm run dev:react

# Терминал 3: Electron
npm start
```

Или одной командой:
```bash
npm run dev
```

### 5. Соберите установщик

```bash
npm run build:electron
```

Готово! Файл `Mirage AI Setup 2.3.1.exe` будет в папке `dist-electron/`

---

## 📦 Что вы получите

### Десктопное приложение с:

✅ **Полным доступом к файловой системе**
- Чтение/запись любых файлов
- Системные диалоги выбора файлов
- Управление папками

✅ **Управлением процессами**
- Запуск любых команд
- Контроль процессов
- Таймауты

✅ **Нативным интерфейсом**
- Системные уведомления
- Интеграция с ОС
- Нативные диалоги

✅ **Буфером обмена**
- Чтение/запись
- Интеграция с системой

✅ **Системной информацией**
- CPU, RAM, диски
- Информация об ОС
- Мониторинг в реальном времени

---

## 🎯 Примеры использования

### Выбор файла через системный диалог

```javascript
const result = await window.electronAPI.dialog.openFile({
  filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
});

if (!result.canceled) {
  const filePath = result.filePaths[0];
  const { content } = await window.electronAPI.fs.readFile(filePath);
  console.log(content);
}
```

### Запуск команды

```javascript
const result = await window.electronAPI.process.spawn('python', ['script.py'], {
  cwd: 'C:/workspace',
  timeout: 30000
});

console.log('Вывод:', result.stdout);
console.log('Ошибки:', result.stderr);
```

### Системная информация

```javascript
const { info } = await window.electronAPI.system.getInfo();

console.log('CPU:', info.cpu.brand);
console.log('RAM:', (info.memory.total / 1024 / 1024 / 1024).toFixed(1), 'GB');
console.log('ОС:', info.os.distro);
```

---

## 🔧 Интеграция с существующим кодом

### Проверка на Electron

```typescript
// src/App.tsx
const isElectron = () => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

// Использование
if (isElectron()) {
  // Нативные функции
  const result = await window.electronAPI.dialog.openFile();
} else {
  // Веб-версия
  // ...
}
```

### Обновите FileManager

```typescript
// src/components/FileManager.tsx
const handleNativeFileSelect = async () => {
  if (isElectron()) {
    const result = await window.electronAPI.dialog.openFile();
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const { content } = await window.electronAPI.fs.readFile(filePath);
      // Обработка файла
    }
  }
};
```

---

## 📊 Сравнение версий

| Функция | Веб | Десктоп |
|---------|-----|---------|
| Доступ к файлам | ⚠️ Ограниченный | ✅ Полный |
| Системные диалоги | ❌ | ✅ |
| Буфер обмена | ⚠️ | ✅ Полный |
| Управление процессами | ❌ | ✅ |
| Уведомления | ⚠️ | ✅ Нативные |
| Работа оффлайн | ⚠️ | ✅ |
| Установка | ❌ | ✅ |

---

## 🐛 Решение проблем

### Electron не запускается
```bash
npm install --save-dev electron
```

### Ошибка сборки
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build:electron
```

### Иконки не отображаются
- Убедитесь что файлы в папке `build/`
- Проверьте форматы: `.ico`, `.icns`, `.png`
- Пересоберите приложение

---

## 📚 Документация

- **ELECTRON_SETUP.md** - полная инструкция
- **ELECTRON_QUICK_START.md** - этот файл
- [Electron Docs](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)

---

**Версия**: 2.3.1  
**Платформа**: Windows, macOS, Linux  
**Статус**: ✅ Готово к использованию
