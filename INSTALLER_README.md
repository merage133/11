# 📦 Инструкция по созданию установщика Windows

## Требования

- **Inno Setup 6.x или выше** — скачать с https://jrsoftware.org/isdl.php
- **Node.js** — для сборки проекта
- **Ollama** — для проверки зависимостей

## Установка Inno Setup

1. Скачайте Inno Setup с официального сайта: https://jrsoftware.org/isdl.php
2. Запустите установщик
3. Установите все компоненты (включая русскую локализацию)

## Создание установщика

### Шаг 1: Соберите проект

```cmd
npm install
npm run build
```

### Шаг 2: Откройте скрипт в Inno Setup

1. Запустите **Inno Setup Compiler**
2. Откройте файл `setup.iss` (File → Open)

### Шаг 3: Скомпилируйте установщик

1. Нажмите **Build → Compile** (или Ctrl+F9)
2. Дождитесь завершения компиляции
3. Готовый установщик будет в папке `installer_output`

### Альтернатива: Командная строка

```cmd
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss
```

## Структура установщика

```
installer_output/
└── RU_AI_Studio_Setup_1.0.0.exe
```

## Что делает установщик

### При установке:
1. ✅ Проверяет наличие Node.js
2. ✅ Проверяет наличие Ollama
3. ✅ Копирует файлы в Program Files
4. ✅ Создаёт ярлык в меню Пуск
5. ✅ Создаёт ярлык на рабочем столе (опционально)
6. ✅ Предлагает установить модель qwen2.5:7b
7. ✅ Предлагает запустить программу

### При удалении:
1. ✅ Удаляет все файлы
2. ✅ Удаляет ярлыки
3. ✅ Удаляет записи из реестра
4. ✅ Очищает временные файлы

## Настройка скрипта

### Изменение версии

Откройте `setup.iss` и измените:

```pascal
#define MyAppVersion "1.0.0"
```

### Изменение названия

```pascal
#define MyAppName "RU AI Studio"
```

### Добавление кастомных картинок

1. Создайте картинки:
   - `wizard_image.bmp` — 164x314 px (большое изображение слева)
   - `wizard_small.bmp` — 55x58 px (маленькое изображение вверху)

2. Раскомментируйте строки в `setup.iss`:

```pascal
WizardImageFile=images\wizard_image.bmp
WizardSmallImageFile=images\wizard_small.bmp
```

### Изменение иконки

1. Создайте `app.ico` (256x256 px)
2. Добавьте в `setup.iss`:

```pascal
SetupIconFile=app.ico
UninstallDisplayIcon={app}\app.ico
```

## Проверка перед распространением

### Тестирование установщика

1. Запустите `RU_AI_Studio_Setup_1.0.0.exe`
2. Пройдите все шаги мастера
3. Проверьте:
   - ✅ Файлы скопированы в Program Files
   - ✅ Ярлык в меню Пуск работает
   - ✅ Ярлык на рабочем столе работает
   - ✅ Программа запускается
   - ✅ Деинсталлятор удаляет всё

### Тестирование деинсталляции

1. Запустите деинсталлятор (Пуск → RU AI Studio → Uninstall)
2. Проверьте:
   - ✅ Все файлы удалены
   - ✅ Ярлыки удалены
   - ✅ Записи в реестре удалены

## Распространение

### Вариант 1: Прямая раздача

Загрузите `RU_AI_Studio_Setup_1.0.0.exe` на:
- GitHub Releases
- Ваш сайт
- Файлообменники

### Вариант 2: Подпись кода (рекомендуется)

Для удаления предупреждения Windows SmartScreen:

1. Получите сертификат кода (Code Signing Certificate)
2. Подпишите установщик:

```cmd
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com RU_AI_Studio_Setup_1.0.0.exe
```

## Решение проблем

### "Inno Setup not found"

Установите Inno Setup с официального сайта.

### "Node.js not found" при установке

Установщик предупреждает, но позволяет продолжить. Пользователь должен установить Node.js отдельно.

### "Ollama not found" при установке

Установщик предупреждает, но позволяет продолжить. Пользователь должен установить Ollama отдельно.

### Ошибка компиляции

Проверьте:
- Все файлы существуют
- Пути указаны правильно
- Нет опечаток в скрипте

### Установщик не запускается

- Проверьте требования к системе (Windows 7+)
- Запустите от имени администратора
- Отключите антивирус временно

## Дополнительные возможности

### Добавление драйверов

```pascal
[Files]
Source: "drivers\*.sys"; DestDir: "{sys}\drivers"; Flags: driver

[Dirs]
Name: "{commonappdata}\MyApp"
```

### Регистрация расширений файлов

```pascal
[Registry]
Root: HKCR; Subkey: ".myext"; ValueType: string; ValueName: ""; ValueData: "MyAppFile"
Root: HKCR; Subkey: "MyAppFile"; ValueType: string; ValueName: ""; ValueData: "My App File"
Root: HKCR; Subkey: "MyAppFile\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\app.exe,0"
Root: HKCR; Subkey: "MyAppFile\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\app.exe"" ""%1"""
```

### Добавление переменных окружения

```pascal
[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: string; ValueName: "MYAPP_PATH"; ValueData: "{app}"; Flags: preservestringtype
```

### Автозапуск при загрузке Windows

```pascal
[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "RU AI Studio"; ValueData: """{app}\start.bat"""; Flags: uninsdeletevalue
```

## Полезные ссылки

- [Документация Inno Setup](https://jrsoftware.org/ishelp/)
- [Примеры скриптов](https://jrsoftware.org/files/is/inno-setup-examples.exe)
- [Inno Setup на GitHub](https://github.com/jrsoftware/issrc)

---

**Версия:** 1.0  
**Платформа:** Windows  
**Требования:** Inno Setup 6.x+
