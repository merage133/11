# 📦 Файлы установщика Windows

Этот пакет содержит все необходимые файлы для создания профессионального установщика Windows для RU AI Studio.

## 📋 Содержимое

| Файл | Описание |
|------|----------|
| `setup.iss` | Скрипт Inno Setup для компиляции установщика |
| `LICENSE.txt` | Лицензия MIT |
| `build_installer.bat` | Скрипт для автоматической сборки установщика |
| `INSTALLER_README.md` | Подробная инструкция по созданию установщика |
| `CUSTOMIZATION.md` | Инструкция по кастомизации (картинки, иконки) |

## 🚀 Быстрый старт

### Вариант 1: Автоматическая сборка

```cmd
build_installer.bat
```

Скрипт автоматически:
1. Проверит Node.js
2. Установит зависимости
3. Соберёт проект
4. Скомпилирует установщик

### Вариант 2: Ручная сборка

```cmd
# 1. Соберите проект
npm install
npm run build

# 2. Откройте setup.iss в Inno Setup Compiler
# 3. Нажмите Build → Compile (Ctrl+F9)
```

## 📦 Результат

После сборки в папке `installer_output` появится:

```
RU_AI_Studio_Setup_1.0.0.exe
```

## 🎯 Что делает установщик

### При установке:
- ✅ Проверяет наличие Node.js и Ollama
- ✅ Копирует файлы в Program Files
- ✅ Создаёт ярлыки (Пуск + рабочий стол)
- ✅ Предлагает установить модель qwen2.5:7b
- ✅ Предлагает запустить программу

### При удалении:
- ✅ Удаляет все файлы
- ✅ Удаляет ярлыки
- ✅ Очищает реестр

## 🎨 Кастомизация

### Добавить картинки

1. Создайте папку `images/`
2. Добавьте:
   - `wizard_image.bmp` (164x314 px)
   - `wizard_small.bmp` (55x58 px)
   - `app.ico` (256x256 px)
3. Раскомментируйте строки в `setup.iss`

Подробная инструкция: [CUSTOMIZATION.md](CUSTOMIZATION.md)

### Изменить версию

Откройте `setup.iss` и измените:

```pascal
#define MyAppVersion "1.0.0"
```

### Изменить название

```pascal
#define MyAppName "RU AI Studio"
```

## 📚 Документация

- [INSTALLER_README.md](INSTALLER_README.md) — полная инструкция
- [CUSTOMIZATION.md](CUSTOMIZATION.md) — кастомизация внешнего вида
- [INSTALL.md](INSTALL.md) — инструкция для пользователей
- [USAGE.md](USAGE.md) — как использовать программу

## 🔧 Требования

- **Inno Setup 6.x** — https://jrsoftware.org/isdl.php
- **Node.js 18+** — https://nodejs.org/
- **Ollama** — https://ollama.com/download

## 🐛 Решение проблем

### "Inno Setup not found"
Установите Inno Setup с официального сайта.

### Ошибка компиляции
Проверьте пути в `setup.iss` и наличие всех файлов.

### Установщик не запускается
Запустите от имени администратора.

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте [INSTALLER_README.md](INSTALLER_README.md)
2. Проверьте [CUSTOMIZATION.md](CUSTOMIZATION.md)
3. Убедитесь что все зависимости установлены

---

**Версия:** 1.0  
**Платформа:** Windows  
**Лицензия:** MIT
