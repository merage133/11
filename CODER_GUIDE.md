# CODER - Расширенные возможности

## 🚀 Поддерживаемые языки программирования

CODER теперь поддерживает компиляцию и выполнение кода на следующих языках:

### Веб-языки (выполняются в браузере)
- **JavaScript** - выполнение в iframe
- **TypeScript** - компиляция в JavaScript и выполнение
- **HTML** - рендеринг в iframe
- **CSS** - применение стилей к демо-странице

### Компилируемые языки (требуют установленные компиляторы)
- **Python** - требует установленный Python
- **C++** - требует g++ (MinGW на Windows)
- **C** - требует gcc (MinGW на Windows)
- **C#** - требует csc (Mono или .NET Framework)
- **Java** - требует JDK (javac и java)
- **Go** - требует Go compiler
- **Rust** - требует rustc

## 🔧 Установка компиляторов

### Python
```bash
# Windows
# Скачайте с https://www.python.org/downloads/
# При установке отметьте "Add Python to PATH"

# Linux
sudo apt-get install python3

# macOS
brew install python
```

### C/C++ (GCC)
```bash
# Windows - установите MinGW
# Скачайте с https://www.mingw-w64.org/
# Добавьте C:\MinGW\bin в PATH

# Linux
sudo apt-get install build-essential

# macOS
xcode-select --install
```

### C#
```bash
# Windows - .NET Framework уже включён
# Или установите Mono: https://www.mono-project.com/

# Linux
sudo apt-get install mono-complete

# macOS
brew install mono
```

### Java
```bash
# Скачайте JDK с https://www.oracle.com/java/technologies/downloads/
# Или используйте OpenJDK:

# Windows
# Установите JDK и добавьте JAVA_HOME в переменные среды

# Linux
sudo apt-get install default-jdk

# macOS
brew install openjdk
```

### Go
```bash
# Windows/macOS/Linux
# Скачайте с https://go.dev/dl/

# Или через пакетный менеджер:
# Linux
sudo apt-get install golang

# macOS
brew install go
```

### Rust
```bash
# Все платформы
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Скачайте rustup-init.exe с https://rustup.rs/
```

## 🔄 Автоматическое исправление ошибок

CODER теперь может автоматически проверять и исправлять код:

### Как это работает:
1. AI пишет код
2. Код автоматически компилируется/выполняется
3. Если есть ошибка - AI анализирует её
4. AI исправляет код
5. Процесс повторяется до успешного выполнения (максимум 3 попытки)

### Включение/выключение:
- Переключатель "Автоисправление" в верхней панели CODER
- По умолчанию включено
- Можно отключить если хотите видеть все ошибки вручную

### Пример:
```
Пользователь: Напиши программу на Python для расчёта факториала

AI: [пишет код с ошибкой]
    [автоматическая проверка]
    [обнаружена ошибка]
    [исправление кода]
    [повторная проверка]
    [код работает!]
```

## 💻 Использование

### 1. Откройте CODER
Нажмите кнопку "CODER" в боковой панели

### 2. Опишите задачу
Например:
- "Напиши функцию сортировки на JavaScript"
- "Создай класс на C++ для работы с матрицами"
- "Напиши программу на Python для парсинга JSON"

### 3. AI напишет код
Код будет отображён в чате с подсветкой синтаксиса

### 4. Запустите код
Нажмите кнопку "▶ Запуск" на блоке кода

### 5. Результат
- Для веб-языков - результат в правой панели
- Для компилируемых языков - вывод в правой панели
- При ошибке - автоматическое исправление (если включено)

## 🎯 Примеры использования

### JavaScript
```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

### Python
```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

### C++
```cpp
#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    cout << "Factorial of 5: " << factorial(5) << endl;
    return 0;
}
```

### C#
```csharp
using System;

class Program {
    static void Main() {
        int[] numbers = { 5, 2, 8, 1, 9 };
        Array.Sort(numbers);
        
        Console.WriteLine("Sorted array:");
        foreach (int num in numbers) {
            Console.Write(num + " ");
        }
    }
}
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum 1 to 10: " + sum);
    }
}
```

### Go
```go
package main

import "fmt"

func main() {
    numbers := []int{5, 2, 8, 1, 9}
    
    fmt.Println("Before:", numbers)
    
    // Простая сортировка
    for i := 0; i < len(numbers); i++ {
        for j := i + 1; j < len(numbers); j++ {
            if numbers[i] > numbers[j] {
                numbers[i], numbers[j] = numbers[j], numbers[i]
            }
        }
    }
    
    fmt.Println("After:", numbers)
}
```

### Rust
```rust
fn main() {
    let mut numbers = vec![5, 2, 8, 1, 9];
    
    println!("Before: {:?}", numbers);
    
    numbers.sort();
    
    println!("After: {:?}", numbers);
}
```

## ⚠️ Ограничения

1. **Таймаут выполнения** - 10 секунд для выполнения, 15-20 секунд для компиляции
2. **Безопасность** - код выполняется в изолированной среде
3. **Нет доступа к сети** - код не может обращаться к интернету
4. **Ограниченная память** - зависит от системы
5. **Нет GUI** - только консольный вывод

## 🔍 Отладка

### Если код не компилируется:
1. Проверьте что компилятор установлен
2. Проверьте что компилятор добавлен в PATH
3. Проверьте синтаксис кода
4. Включите автоисправление для автоматических исправлений

### Если компилятор не найден:
```bash
# Проверьте установку:
g++ --version      # C++
python --version   # Python
csc --version      # C#
javac -version     # Java
go version         # Go
rustc --version    # Rust
```

### Если автоисправление не работает:
1. Проверьте что переключатель включён
2. Проверьте что сервер запущен (node server.cjs)
3. Проверьте логи в консоли браузера

## 📊 Статистика

- **Поддерживаемых языков**: 10
- **Максимум попыток исправления**: 3
- **Таймаут выполнения**: 10 секунд
- **Таймаут компиляции**: 15-20 секунд

## 🎓 Советы

1. **Начинайте с простых задач** - AI лучше справляется с чёткими запросами
2. **Указывайте язык** - "напиши на Python" лучше чем просто "напиши"
3. **Используйте автоисправление** - экономит время на отладке
4. **Проверяйте результат** - даже автоматическое исправление может ошибаться
5. **Экспериментируйте** - пробуйте разные языки и задачи

---

**Версия**: 2.2  
**Дата**: 2024  
**Статус**: ✅ Все функции работают
