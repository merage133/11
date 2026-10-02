# 🚀 Полное руководство по установке Mirage AI

## Содержание
1. [Требования](#требования)
2. [Автоматическая установка](#автоматическая-установка)
3. [Ручная установка](#ручная-установка)
4. [Установка компиляторов](#установка-компиляторов)
5. [Первый запуск](#первый-запуск)
6. [Решение проблем](#решение-проблем)

---

## Требования

### Системные требования
- **ОС**: Windows 10/11, Linux, macOS
- **RAM**: 8 GB минимум (16 GB рекомендуется)
- **Диск**: 10 GB свободного места
- **Интернет**: Только для первичной установки

### Обязательные компоненты
- **Node.js** 18+ (устанавливается автоматически)
- **Ollama** (устанавливается автоматически)
- **Компиляторы** (устанавливаются автоматически через установщик)

---

## Автоматическая установка

### Шаг 1: Запустите установщик

Откройте командную строку (CMD или PowerShell) в папке проекта:

```cmd
node installer.js
```

### Шаг 2: Следуйте инструкциям

Установщик автоматически:

1. ✅ **Проверит Node.js**
   - Если не установлен - скачает и установит
   
2. ✅ **Установит зависимости npm**
   - Выполнит `npm install`
   
3. ✅ **Соберёт проект**
   - Выполнит `npm run build`
   
4. ✅ **Проверит Ollama**
   - Если не установлен - предложит скачать
   - Скачайте с https://ollama.com/download
   
5. ✅ **Установит AI модель**
   - Предложит установить `qwen2.5:7b` (4.7 GB)
   - Модель нужна для работы AI
   
6. ✅ **Установит компиляторы**
   - Предложит выбрать компиляторы для CODER
   - Python, C++, C#, Java, Go, Rust
   
7. ✅ **Создаст ярлык**
   - Создаст ярлык "Mirage AI" на рабочем столе
   
8. ✅ **Проверит сервер**
   - Запустит сервер для проверки
   - Убедится что всё работает

### Шаг 3: Запустите Mirage AI

После установки:

**Вариант 1: Через ярлык**
- Найдите ярлык "Mirage AI" на рабочем столе
- Двойной клик для запуска

**Вариант 2: Через скрипт**
```cmd
start.bat
```

**Вариант 3: Вручную**
```cmd
# Терминал 1
ollama serve

# Терминал 2
node server.cjs

# Откройте браузер
http://localhost:3001
```

---

## Ручная установка

Если автоматическая установка не работает:

### 1. Установите Node.js
```cmd
# Windows
winget install OpenJS.NodeJS.LTS

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node
```

### 2. Установите Ollama
```cmd
# Windows
# Скачайте с https://ollama.com/download

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama
```

### 3. Установите зависимости
```cmd
npm install
```

### 4. Соберите проект
```cmd
npm run build
```

### 5. Установите модель
```cmd
ollama pull qwen2.5:7b
```

### 6. Запустите
```cmd
# Терминал 1
ollama serve

# Терминал 2
node server.cjs
```

---

## Установка компиляторов

### Автоматическая установка (рекомендуется)

Запустите установщик:
```cmd
node installer.js
```

Выберите компиляторы для установки:
```
Available compilers for installation:
  1. Python
  2. GCC/G++ (C/C++)
  3. C# (Mono/.NET)
  4. Java (JDK)
  5. Go
  6. Rust
  0. Skip compiler installation

Select compilers to install (comma-separated numbers, e.g., 1,2,3 or 0 to skip):
```

Введите номера через запятую, например: `1,2,3,4,5,6`

### Ручная установка

См. [COMPILERS_INSTALL.md](COMPILERS_INSTALL.md) для подробной инструкции.

#### Быстрая установка всех компиляторов

**Windows:**
```powershell
winget install Python.Python.3.12 MSYS2.MSYS2 Microsoft.DotNet.SDK.8 EclipseAdoptium.Temurin.21.JDK GoLang.Go Rustlang.Rust
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y python3 build-essential mono-complete default-jdk golang
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

**macOS:**
```bash
brew install python gcc mono openjdk go rustup
```

---

## Первый запуск

### 1. Запустите Ollama
```cmd
ollama serve
```

### 2. Запустите сервер
```cmd
node server.cjs
```

### 3. Откройте браузер
```
http://localhost:3001
```

### 4. Начните общение

Попробуйте:
- "Привет! Как дела?"
- "Какой курс доллара сегодня?"
- "Который час?"
- "Покажи файлы на рабочем столе"

### 5. Откройте CODER

Нажмите кнопку **CODER** в боковой панели:
- "Напиши функцию сортировки на Python"
- "Создай класс на C++ для работы с матрицами"
- "Напиши программу на Java для расчёта факториала"

---

## Решение проблем

### Ollama не запускается
```cmd
# Проверьте установку
ollama --version

# Переустановите
# Windows: https://ollama.com/download
# Linux: curl -fsSL https://ollama.com/install.sh | sh
```

### Модель не найдена
```cmd
# Установите модель
ollama pull qwen2.5:7b

# Проверьте список
ollama list
```

### Сервер не запускается
```cmd
# Проверьте порт
netstat -ano | findstr :3001

# Убейте процесс
taskkill /F /PID <PID>

# Запустите снова
node server.cjs
```

### Код не компилируется в CODER
```cmd
# Проверьте компиляторы
python --version
gcc --version
csc --version
javac -version
go version
rustc --version

# Установите недостающие
node installer.js
```

### Голосовой ввод не работает
- Используйте Chrome или Edge
- Разрешите доступ к микрофону
- Проверьте что микрофон работает

### AI отвечает на другом языке
- Перезапустите сервер
- Проверьте что используется модель `qwen2.5:7b`

---

## Обновление

### Обновление проекта
```cmd
git pull
npm install
npm run build
```

### Обновление модели
```cmd
ollama pull qwen2.5:7b
```

### Обновление компиляторов
```cmd
# Windows
winget upgrade --all

# Linux
sudo apt-get update && sudo apt-get upgrade

# macOS
brew upgrade
```

---

## Удаление

### Удаление Mirage AI
```cmd
# Удалите папку проекта
rmdir /s /q "путь\к\mirage-ai"

# Удалите ярлык с рабочего стола
del "%USERPROFILE%\Desktop\Mirage AI.bat"
```

### Удаление Ollama
```cmd
# Windows
winget uninstall Ollama.Ollama

# Linux
sudo systemctl stop ollama
sudo rm -rf /usr/local/bin/ollama
sudo rm -rf ~/.ollama

# macOS
brew uninstall ollama
rm -rf ~/.ollama
```

### Удаление компиляторов
```cmd
# Windows
winget uninstall Python.Python.3.12
winget uninstall MSYS2.MSYS2
winget uninstall Microsoft.DotNet.SDK.8
winget uninstall EclipseAdoptium.Temurin.21.JDK
winget uninstall GoLang.Go
winget uninstall Rustlang.Rust

# Linux
sudo apt-get remove python3 build-essential mono-complete default-jdk golang
rm -rf ~/.cargo ~/.rustup

# macOS
brew uninstall python gcc mono openjdk go rustup
rm -rf ~/.cargo ~/.rustup
```

---

## Поддержка

### Документация
- [README.md](README.md) - основная документация
- [CODER_GUIDE.md](CODER_GUIDE.md) - руководство по CODER
- [COMPILERS_INSTALL.md](COMPILERS_INSTALL.md) - установка компиляторов
- [CREATE_EXE_GUIDE.md](CREATE_EXE_GUIDE.md) - создание EXE

### Полезные ссылки
- [Ollama](https://ollama.com/) - локальный AI
- [Node.js](https://nodejs.org/) - среда выполнения
- [qwen2.5](https://huggingface.co/Qwen) - AI модель

---

**Версия**: 2.2.1  
**Дата**: 2024  
**Лицензия**: MIT  
**Автор**: Mirage AI Team
