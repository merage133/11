# Обновление установщика: Автоматическая установка компиляторов

## Дата: 2024
## Версия: 2.2.1

---

## Что добавлено

### 1. Автоматическая проверка компиляторов

Установщик теперь автоматически проверяет наличие следующих компиляторов:

- ✅ **Python** (python, python3)
- ✅ **GCC/G++** (gcc, g++) - для C/C++
- ✅ **C#** (csc, mcs, dotnet) - для C#
- ✅ **Java** (javac, java) - для Java
- ✅ **Go** (go) - для Go
- ✅ **Rust** (rustc) - для Rust

### 2. Интерактивное меню установки

После проверки компиляторов установщик показывает:

```
=== Checking compilers for CODER... ===
[OK] Installed compilers:
  ✓ Python: Python 3.12.0
  ✓ GCC/G++ (C/C++): gcc version 13.2.0

[WARN] 4 compiler(s) not installed

Available compilers for installation:
  1. C# (Mono/.NET)
  2. Java (JDK)
  3. Go
  4. Rust
  0. Skip compiler installation

Select compilers to install (comma-separated numbers, e.g., 1,2,3 or 0 to skip):
```

Пользователь может:
- Выбрать конкретные компиляторы (например: `1,3`)
- Установить все (`1,2,3,4`)
- Пропустить установку (`0`)

### 3. Автоматическая установка

#### Windows (через winget)
```powershell
# Python
winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements

# GCC/G++ (через MSYS2)
winget install MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements

# C# (.NET SDK)
winget install Microsoft.DotNet.SDK.8 --accept-package-agreements --accept-source-agreements

# Java (Adoptium JDK)
winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements

# Go
winget install GoLang.Go --accept-package-agreements --accept-source-agreements

# Rust
winget install Rustlang.Rust --accept-package-agreements --accept-source-agreements
```

#### Linux (через apt)
```bash
# Python
sudo apt-get update && sudo apt-get install -y python3 python3-pip

# GCC/G++
sudo apt-get update && sudo apt-get install -y build-essential

# C# (Mono)
sudo apt-get update && sudo apt-get install -y mono-complete

# Java
sudo apt-get update && sudo apt-get install -y default-jdk

# Go
sudo apt-get update && sudo apt-get install -y golang

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

#### macOS (через brew)
```bash
# Python
brew install python

# GCC/G++
brew install gcc

# C# (Mono)
brew install mono

# Java
brew install openjdk

# Go
brew install go

# Rust
brew install rustup
```

### 4. Улучшенный вывод

После установки установщик показывает:

```
================================================
     Installation completed successfully!
================================================

[OK] Shortcut created on desktop

[OK] Installed compilers for CODER:
  ✓ Python
  ✓ GCC/G++ (C/C++)
  ✓ C# (Mono/.NET)
  ✓ Java (JDK)
  ✓ Go
  ✓ Rust

To launch:
  1. Double-click "Mirage AI" shortcut on desktop
  2. Or run manually:
     ollama serve
     node server.cjs
     Open http://localhost:3001 in browser

Features:
  • Main chat with AI assistant
  • CODER - code editor with auto-fix
  • Voice input (Chrome/Edge)
  • File management
  • Internet search
  • Knowledge base

Documentation: README.md, CODER_GUIDE.md
```

---

## Изменения в файлах

### installer.js

#### Добавлены функции:

1. **`checkCompilers()`**
   - Проверяет наличие всех компиляторов
   - Возвращает объект с информацией о каждом компиляторе
   - Определяет версию установленного компилятора

2. **`installCompilers()`**
   - Показывает список доступных компиляторов
   - Предлагает выбрать компиляторы для установки
   - Устанавливает выбранные компиляторы
   - Поддерживает Windows, Linux, macOS

#### Изменения в `main()`:

Добавлен новый шаг **6. Install compilers**:
```javascript
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
```

#### Обновлены имена:
- `RU AI Studio` → `Mirage AI`
- `RU AI Studio.bat` → `Mirage AI.bat`
- `ru-ai-studio.sh` → `mirage-ai.sh`
- `RU AI Studio.command` → `Mirage AI.command`

---

## Новые файлы документации

### 1. COMPILERS_INSTALL.md
Подробное руководство по установке компиляторов:
- Автоматическая установка через установщик
- Ручная установка для Windows, Linux, macOS
- Проверка установки
- Решение проблем
- Поддерживаемые версии

### 2. INSTALLATION_GUIDE.md
Полное руководство по установке:
- Требования
- Автоматическая установка
- Ручная установка
- Установка компиляторов
- Первый запуск
- Решение проблем
- Обновление
- Удаление

---

## Обновлённые файлы документации

### README.md
Добавлены разделы:
- "Автоматическая установка компиляторов"
- Обновлена структура проекта
- Добавлены новые компоненты (CoderView, CodeBlock, CodeRunner, BranchManager)
- Добавлен раздел "Код не компилируется в CODER"
- Обновлена версия до 2.2.1

---

## Преимущества

### Для пользователя

1. **Полная автоматизация**
   - Не нужно вручную искать и устанавливать компиляторы
   - Установщик сам предложит установить нужные компоненты

2. **Гибкость**
   - Можно выбрать только нужные компиляторы
   - Можно пропустить установку и установить позже

3. **Кроссплатформенность**
   - Работает на Windows, Linux, macOS
   - Использует стандартные пакетные менеджеры

4. **Прозрачность**
   - Показывает какие компиляторы уже установлены
   - Показывает версии установленных компиляторов
   - Показывает какие компиляторы будут установлены

### Для разработчика

1. **Модульность**
   - Функции проверки и установки разделены
   - Легко добавить новые компиляторы
   - Легко изменить команды установки

2. **Расширяемость**
   - Можно добавить проверку других инструментов
   - Можно добавить установку других зависимостей
   - Можно добавить дополнительные шаги установки

3. **Надёжность**
   - Обработка ошибок при установке
   - Продолжает работу даже если установка не удалась
   - Предлагает ручную установку в случае проблем

---

## Использование

### Запуск установщика

```cmd
node installer.js
```

### Выбор компиляторов

Когда установщик спросит:
```
Select compilers to install (comma-separated numbers, e.g., 1,2,3 or 0 to skip):
```

Введите:
- `1,2,3` - установить компиляторы 1, 2 и 3
- `1,2,3,4,5,6` - установить все компиляторы
- `0` - пропустить установку

### После установки

1. Найдите ярлык "Mirage AI" на рабочем столе
2. Двойной клик для запуска
3. Откройте CODER и попробуйте написать код на любом языке

---

## Тестирование

### Проверка установки компиляторов

После установки проверьте:

```cmd
python --version
gcc --version
csc --version
javac -version
go version
rustc --version
```

### Проверка работы в CODER

1. Откройте CODER
2. Напишите простой код:
   ```python
   print("Hello, World!")
   ```
3. Нажмите "Запустить"
4. Должен появиться результат: `Hello, World!`

---

## Известные ограничения

1. **Windows: winget**
   - Требуется Windows 10 версии 1709 или выше
   - Требуется подключение к интернету
   - Некоторые компиляторы могут требовать перезагрузки

2. **Linux: apt**
   - Требуется sudo права
   - Требуется подключение к интернету
   - Может потребоваться обновление списков пакетов

3. **macOS: brew**
   - Требуется Homebrew
   - Требуется подключение к интернету
   - Некоторые компиляторы могут требовать Xcode

4. **Rust**
   - Установка через rustup может потребовать перезапуска терминала
   - После установки нужно выполнить `source $HOME/.cargo/env`

---

## Будущие улучшения

- [ ] Добавить поддержку дополнительных языков (Kotlin, Swift, Scala)
- [ ] Добавить проверку версий компиляторов
- [ ] Добавить автоматическое обновление компиляторов
- [ ] Добавить установку IDE (VS Code, IntelliJ)
- [ ] Добавить установку дополнительных библиотек
- [ ] Добавить графический интерфейс для установщика

---

**Версия**: 2.2.1  
**Дата**: 2024  
**Статус**: ✅ Готово к использованию
