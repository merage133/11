# Установка компиляторов для CODER

## Автоматическая установка

Установщик Mirage AI автоматически предлагает установить все необходимые компиляторы. При запуске `node installer.js` вам будет предложено выбрать компиляторы для установки.

## Ручная установка

Если автоматическая установка не сработала, вы можете установить компиляторы вручную.

### Windows

#### Python
```powershell
winget install Python.Python.3.12
```
Или скачайте с https://www.python.org/downloads/

#### GCC/G++ (C/C++)
```powershell
winget install MSYS2.MSYS2
```
После установки откройте MSYS2 и выполните:
```bash
pacman -S mingw-w64-x86_64-gcc
```

#### C# (.NET SDK)
```powershell
winget install Microsoft.DotNet.SDK.8
```

#### Java (JDK)
```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

#### Go
```powershell
winget install GoLang.Go
```

#### Rust
```powershell
winget install Rustlang.Rust
```

### Linux (Ubuntu/Debian)

#### Все компиляторы одной командой
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip build-essential mono-complete default-jdk golang curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

#### По отдельности
```bash
# Python
sudo apt-get install -y python3 python3-pip

# GCC/G++ (C/C++)
sudo apt-get install -y build-essential

# C# (Mono)
sudo apt-get install -y mono-complete

# Java (JDK)
sudo apt-get install -y default-jdk

# Go
sudo apt-get install -y golang

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

### macOS

#### Все компиляторы одной командой
```bash
brew install python gcc mono openjdk go rustup
```

#### По отдельности
```bash
# Python
brew install python

# GCC/G++ (C/C++)
brew install gcc

# C# (Mono)
brew install mono

# Java (JDK)
brew install openjdk

# Go
brew install go

# Rust
brew install rustup
```

## Проверка установки

После установки проверьте, что все компиляторы доступны:

```bash
python --version      # или python3 --version
gcc --version         # или g++ --version
csc --version         # или dotnet --version
javac -version        # или java -version
go version
rustc --version
```

## Проблемы и решения

### Компилятор не найден после установки

1. **Перезапустите терминал** - новые переменные PATH могут не примениться
2. **Перезапустите компьютер** - некоторые установки требуют перезагрузки
3. **Проверьте PATH** - убедитесь, что путь к компилятору добавлен в PATH

### Windows: winget не работает

Обновите winget:
```powershell
winget upgrade --all
```

Или используйте альтернативные методы установки через официальные сайты.

### Linux: apt-get не работает

Обновите списки пакетов:
```bash
sudo apt-get update
```

### macOS: brew не работает

Установите Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Поддерживаемые версии

- **Python**: 3.8+
- **GCC/G++**: 9.0+
- **C#**: .NET 6.0+ или Mono 6.0+
- **Java**: JDK 11+
- **Go**: 1.16+
- **Rust**: 1.50+

## Дополнительные ресурсы

- [Python](https://www.python.org/)
- [GCC](https://gcc.gnu.org/)
- [.NET](https://dotnet.microsoft.com/)
- [Mono](https://www.mono-project.com/)
- [Java](https://www.oracle.com/java/)
- [Go](https://go.dev/)
- [Rust](https://www.rust-lang.org/)

---

**Версия**: 2.2.1  
**Дата**: 2024
