# ✅ Установщик обновлён: Автоматическая установка компиляторов

## Что нового

Теперь установщик Mirage AI **автоматически устанавливает все необходимые компиляторы** для работы CODER!

---

## 🎯 Что делает установщик

При запуске `node installer.js` установщик:

1. ✅ Проверяет Node.js
2. ✅ Устанавливает зависимости npm
3. ✅ Собирает проект
4. ✅ Проверяет Ollama
5. ✅ Устанавливает AI модель (qwen2.5:7b)
6. ✅ **Проверяет компиляторы** ← НОВОЕ
7. ✅ **Предлагает установить компиляторы** ← НОВОЕ
8. ✅ **Устанавливает выбранные компиляторы** ← НОВОЕ
9. ✅ Создаёт ярлык на рабочем столе
10. ✅ Проверяет сервер

---

## 📦 Поддерживаемые компиляторы

### Автоматическая установка:

| Компилятор | Язык | Windows | Linux | macOS |
|------------|------|---------|-------|-------|
| Python | Python | ✅ winget | ✅ apt | ✅ brew |
| GCC/G++ | C/C++ | ✅ winget | ✅ apt | ✅ brew |
| .NET SDK | C# | ✅ winget | ✅ apt | ✅ brew |
| OpenJDK | Java | ✅ winget | ✅ apt | ✅ brew |
| Go | Go | ✅ winget | ✅ apt | ✅ brew |
| Rust | Rust | ✅ winget | ✅ curl | ✅ brew |

---

## 🚀 Как использовать

### 1. Запустите установщик

```cmd
node installer.js
```

### 2. Дождитесь проверки компиляторов

Установщик покажет:

```
=== Checking compilers for CODER... ===
[OK] Installed compilers:
  ✓ Python: Python 3.12.0

[WARN] 5 compiler(s) not installed

Available compilers for installation:
  1. GCC/G++ (C/C++)
  2. C# (Mono/.NET)
  3. Java (JDK)
  4. Go
  5. Rust
  0. Skip compiler installation

Select compilers to install (comma-separated numbers, e.g., 1,2,3 or 0 to skip):
```

### 3. Выберите компиляторы

Введите номера через запятую:

- `1,2,3,4,5` - установить все компиляторы
- `1,3,5` - установить только GCC, Java и Rust
- `0` - пропустить установку

### 4. Дождитесь установки

Установщик автоматически:
- Скачает компиляторы
- Установит их
- Проверит установку

### 5. Готово!

После установки:

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
```

---

## 💻 Использование CODER

После установки компиляторов:

### 1. Откройте CODER
Нажмите кнопку **CODER** в боковой панели

### 2. Напишите код
Например:
```
Напиши программу на Python для расчёта факториала
```

### 3. Запустите код
Нажмите кнопку **▶ Запуск** на блоке кода

### 4. Увидите результат
Результат появится в правой панели

### 5. Автоматическое исправление
Если есть ошибка:
- AI анализирует ошибку
- Исправляет код
- Проверяет снова
- Повторяет до 3 попыток

---

## 📝 Примеры кода

### Python
```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

### C#
```csharp
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Go
```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

### Rust
```rust
fn main() {
    println!("Hello, World!");
}
```

---

## 🔧 Ручная установка компиляторов

Если автоматическая установка не сработала:

### Windows
```powershell
# Все компиляторы одной командой
winget install Python.Python.3.12 MSYS2.MSYS2 Microsoft.DotNet.SDK.8 EclipseAdoptium.Temurin.21.JDK GoLang.Go Rustlang.Rust
```

### Linux
```bash
# Все компиляторы одной командой
sudo apt-get update
sudo apt-get install -y python3 build-essential mono-complete default-jdk golang
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

### macOS
```bash
# Все компиляторы одной командой
brew install python gcc mono openjdk go rustup
```

Подробнее см. [COMPILERS_INSTALL.md](COMPILERS_INSTALL.md)

---

## 📚 Документация

### Новые файлы:
- **COMPILERS_INSTALL.md** - подробная инструкция по установке компиляторов
- **INSTALLATION_GUIDE.md** - полное руководство по установке
- **INSTALLER_UPDATE.md** - описание изменений в установщике

### Обновлённые файлы:
- **README.md** - добавлена информация об автоматической установке
- **installer.js** - добавлена установка компиляторов

---

## ✅ Преимущества

### Раньше:
❌ Нужно было вручную искать и устанавливать компиляторы  
❌ Нужно было читать документацию для каждого компилятора  
❌ Нужно было настраивать PATH  
❌ Можно было забыть установить какой-то компилятор  

### Теперь:
✅ Установщик сам предлагает установить компиляторы  
✅ Можно выбрать только нужные компиляторы  
✅ Автоматическая настройка PATH  
✅ Проверка установки после каждого компилятора  
✅ Работает на Windows, Linux, macOS  

---

## 🎉 Итого

Теперь установка Mirage AI стала **полностью автоматизированной**:

1. Запустите `node installer.js`
2. Выберите компиляторы для установки
3. Дождитесь окончания установки
4. Используйте CODER с любыми языками программирования

**Всё готово к работе!** 🚀

---

**Версия**: 2.2.1  
**Дата**: 2024  
**Статус**: ✅ Готово к использованию
