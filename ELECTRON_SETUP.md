# 🖥️ Mirage AI Desktop - Полноценное десктопное приложение

## 📋 Что это?

Полноценное десктопное приложение на Electron с:
- ✅ Полным доступом к файловой системе
- ✅ Управлением процессами
- ✅ Системными диалогами
- ✅ Буфером обмена
- ✅ Уведомлениями
- ✅ Нативным интерфейсом

---

## 🚀 Установка

### Шаг 1: Установка зависимостей

```bash
# Установите Electron и electron-builder
npm install --save-dev electron electron-builder concurrently
```

### Шаг 2: Обновите package.json

Замените содержимое `package.json` на содержимое из `package.electron.json`:

```bash
# Windows
copy package.electron.json package.json

# Linux/Mac
cp package.electron.json package.json
```

### Шаг 3: Создайте иконки

Создайте папку `build/` и добавьте иконки:
- `build/icon.ico` (Windows) - 256x256 px
- `build/icon.icns` (macOS) - 512x512 px
- `build/icon.png` (Linux) - 512x512 px

Можно использовать онлайн-конвертеры:
- https://convertio.co/png-ico/
- https://iconifier.net/

### Шаг 4: Запуск в режиме разработки

```bash
# Терминал 1: Запуск сервера
npm run server

# Терминал 2: Запуск React
npm run dev:react

# Терминал 3: Запуск Electron
npm start
```

Или одной командой:
```bash
npm run dev
```

### Шаг 5: Сборка приложения

```bash
# Сборка для текущей платформы
npm run build:electron

# Или для конкретной платформы
npm run dist
```

Результат будет в папке `dist-electron/`:
- Windows: `Mirage AI Setup 2.3.1.exe`
- macOS: `Mirage AI-2.3.1.dmg`
- Linux: `Mirage AI-2.3.1.AppImage`

---

## 🎯 Возможности десктопного приложения

### 1. Полный доступ к файловой системе

```javascript
// Открыть диалог выбора файла
const result = await window.electronAPI.dialog.openFile({
  filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
});

// Прочитать файл
const { content } = await window.electronAPI.fs.readFile('C:/path/to/file.txt');

// Записать файл
await window.electronAPI.fs.writeFile('C:/path/to/file.txt', 'Содержимое');

// Список файлов в папке
const { files } = await window.electronAPI.fs.readdir('C:/Users');
```

### 2. Управление процессами

```javascript
// Запуск команды
const result = await window.electronAPI.process.spawn('python', ['script.py'], {
  cwd: 'C:/workspace',
  timeout: 30000
});

console.log(result.stdout); // Вывод программы
console.log(result.stderr); // Ошибки
```

### 3. Системные диалоги

```javascript
// Выбор папки
const { filePaths } = await window.electronAPI.dialog.openDirectory();

// Сохранение файла
const { filePath } = await window.electronAPI.dialog.saveFile({
  defaultPath: 'document.txt',
  filters: [{ name: 'Text Files', extensions: ['txt'] }]
});
```

### 4. Буфер обмена

```javascript
// Чтение из буфера
const text = await window.electronAPI.clipboard.read();

// Запись в буфер
await window.electronAPI.clipboard.write('Текст для копирования');
```

### 5. Системная информация

```javascript
const { info } = await window.electronAPI.system.getInfo();

console.log(info.cpu); // Информация о CPU
console.log(info.memory); // Информация о RAM
console.log(info.disks); // Информация о дисках
console.log(info.os); // Информация об ОС
```

### 6. Управление окном

```javascript
// Свернуть окно
await window.electronAPI.window.minimize();

// Развернуть/свернуть
await window.electronAPI.window.maximize();

// Закрыть окно
await window.electronAPI.window.close();
```

### 7. Уведомления

```javascript
await window.electronAPI.notification.show(
  'Mirage AI',
  'Задача выполнена успешно!'
);
```

### 8. Открытие внешних ссылок

```javascript
// Открыть URL в браузере
await window.electronAPI.shell.openExternal('https://example.com');

// Открыть папку в проводнике
await window.electronAPI.shell.openPath('C:/Users');
```

---

## 🔧 Интеграция с существующим кодом

### Обновите src/App.tsx

Добавьте проверку на Electron:

```typescript
// Проверка что мы в Electron
const isElectron = () => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

// Пример использования
if (isElectron()) {
  // Используем нативные диалоги
  const result = await window.electronAPI.dialog.openFile();
} else {
  // Используем веб-версию
  // ...
}
```

### Обновите src/components/FileManager.tsx

Добавьте нативный выбор файлов:

```typescript
const handleNativeFileSelect = async () => {
  if (isElectron()) {
    const result = await window.electronAPI.dialog.openFile({
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const { content } = await window.electronAPI.fs.readFile(filePath);
      // Обработка файла
    }
  }
};
```

---

## 📦 Сборка для разных платформ

### Windows

```bash
npm run dist -- --win
```

Создаст:
- `Mirage AI Setup 2.3.1.exe` (NSIS установщик)
- `Mirage AI 2.3.1.exe` (portable версия)

### macOS

```bash
npm run dist -- --mac
```

Создаст:
- `Mirage AI-2.3.1.dmg` (DMG образ)
- `Mirage AI.app` (приложение)

### Linux

```bash
npm run dist -- --linux
```

Создаст:
- `Mirage AI-2.3.1.AppImage` (portable версия)
- `mirage-ai_2.3.1_amd64.deb` (Debian/Ubuntu)
- `mirage-ai-2.3.1.x86_64.rpm` (Fedora/RHEL)

---

## 🎨 Кастомизация

### Изменение иконки

1. Создайте иконку 512x512 px
2. Конвертируйте в нужные форматы
3. Поместите в папку `build/`
4. Пересоберите приложение

### Изменение названия

В `package.electron.json`:
```json
{
  "name": "your-app-name",
  "productName": "Your App Name",
  "build": {
    "appId": "com.yourcompany.yourapp"
  }
}
```

### Изменение размеров окна

В `electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1600,  // Измените размер
  height: 1000,
  minWidth: 800,
  minHeight: 600,
  // ...
});
```

---

## 🐛 Решение проблем

### "Electron not found"
```bash
npm install --save-dev electron
```

### "electron-builder not found"
```bash
npm install --save-dev electron-builder
```

### Ошибка сборки
```bash
# Очистите кэш
npm cache clean --force

# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

### Приложение не запускается
```bash
# Проверьте что сервер запущен
npm run server

# Проверьте что React собран
npm run build

# Запустите Electron
npm start
```

---

## 📊 Сравнение веб и десктоп версий

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

---

## 🚀 Преимущества десктопной версии

1. **Полный доступ к системе**
   - Чтение/запись любых файлов
   - Запуск любых команд
   - Управление процессами

2. **Нативный UX**
   - Системные диалоги
   - Нативные уведомления
   - Интеграция с ОС

3. **Автономность**
   - Работает без браузера
   - Не зависит от интернета
   - Быстрый запуск

4. **Безопасность**
   - Изолированная среда
   - Контроль доступа
   - Песочница для кода

---

## 📚 Документация

- **ELECTRON_SETUP.md** - этот файл
- **MAJOR_UPDATE.md** - описание всех функций
- **README.md** - основная документация
- [Electron Docs](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)

---

## 🎯 Следующие шаги

1. ✅ Установите зависимости
2. ✅ Создайте иконки
3. ✅ Протестируйте в режиме разработки
4. ✅ Соберите приложение
5. ✅ Протестируйте установщик
6. ✅ Распространяйте!

---

**Версия**: 2.3.1  
**Платформа**: Windows, macOS, Linux  
**Лицензия**: MIT  
**Статус**: ✅ Готово к использованию
