# 🎯 Создание Mirage.exe

## Быстрый способ (рекомендуется)

### Метод 1: Bat To Exe Converter (самый простой)

1. **Скачайте Bat To Exe Converter:**
   - https://www.battoexeconverter.com/
   - Или: https://github.com/alexrj/Bat-To-Exe-Converter

2. **Запустите программу**

3. **Настройте:**
   - **Source file:** выберите `start.bat`
   - **Output file:** укажите `Mirage.exe`
   - **Icon file:** выберите `mirage_icon.png` (или конвертируйте в .ico)
   - **Version:** 1.0.0
   - **Product name:** Mirage AI

4. **Нажмите "Compile"**

5. **Готово!** `Mirage.exe` создан

---

### Метод 2: PowerShell скрипт (автоматически)

1. **Откройте PowerShell от имени администратора**

2. **Перейдите в папку проекта:**
   ```powershell
   cd "C:\path\to\mirage-ai"
   ```

3. **Запустите скрипт:**
   ```powershell
   .\create_exe.ps1
   ```

4. **Следуйте инструкциям**

---

### Метод 3: IExpress (встроен в Windows)

1. **Нажмите Win+R**

2. **Введите:**
   ```
   iexpress
   ```

3. **Создайте новый пакет:**
   - Create new Self Extraction Directive file
   - Extract files and run an installation command
   - Package name: `Mirage`
   - Prompt user with: `Mirage AI Launcher`

4. **Добавьте файлы:**
   - `MirageAI.vbs`
   - `start.bat`

5. **Install Program:**
   ```
   MirageAI.vbs
   ```

6. **Output:**
   - Save package: `Mirage.exe`

---

### Метод 4: Ручная компиляция (C#)

Если у вас установлен .NET Framework:

1. **Создайте файл `MirageLauncher.cs`:**
   ```csharp
   using System;
   using System.Diagnostics;
   using System.IO;
   using System.Reflection;

   class MirageLauncher
   {
       static void Main(string[] args)
       {
           try
           {
               string dir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
               string batPath = Path.Combine(dir, "start.bat");
               
               if (File.Exists(batPath))
               {
                   ProcessStartInfo psi = new ProcessStartInfo();
                   psi.FileName = "cmd.exe";
                   psi.Arguments = "/c \"" + batPath + "\"";
                   psi.WorkingDirectory = dir;
                   psi.WindowStyle = ProcessWindowStyle.Hidden;
                   Process.Start(psi);
               }
               else
               {
                   Console.WriteLine("Error: start.bat not found!");
                   Console.ReadKey();
               }
           }
           catch (Exception ex)
           {
               Console.WriteLine("Error: " + ex.Message);
               Console.ReadKey();
           }
       }
   }
   ```

2. **Скомпилируйте:**
   ```cmd
   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /out:Mirage.exe MirageLauncher.cs
   ```

3. **Готово!**

---

## 🎨 Создание иконки

### Вариант 1: Использовать готовую

Файл `mirage_icon.png` уже создан.

### Вариант 2: Конвертировать PNG в ICO

**Онлайн конвертеры:**
- https://convertio.co/png-ico/
- https://icoconvert.com/
- https://www.favicon-generator.org/

**Программы:**
- GIMP (File → Export As → .ico)
- IcoFX
- Paint.NET (с плагином)

### Вариант 3: Создать свою

Используйте любой графический редактор:
- Размер: 256x256 px
- Формат: ICO (multi-size: 16x16, 32x32, 48x48, 256x256)

---

## 📋 Файлы для создания EXE

| Файл | Описание |
|------|----------|
| `start.bat` | Основной скрипт запуска |
| `MirageAI.vbs` | VBS launcher (без окна консоли) |
| `Mirage.bat` | Простой BAT launcher |
| `mirage_icon.png` | Иконка приложения |
| `create_exe.ps1` | PowerShell скрипт для создания EXE |
| `create_exe.bat` | BAT скрипт для создания EXE |

---

## ✅ Проверка

После создания `Mirage.exe`:

1. **Дважды кликните на `Mirage.exe`**
2. **Должно открыться окно консоли**
3. **Затем откроется браузер с Mirage AI**
4. **Окно консоли можно скрыть (если используете VBS метод)**

---

## 🐛 Решение проблем

### "Mirage.exe не запускается"
- Убедитесь что `start.bat` находится в той же папке
- Проверьте что Node.js и Ollama установлены
- Запустите от имени администратора

### "Не могу создать EXE"
- Используйте Bat To Exe Converter (самый простой способ)
- Или используйте `MirageAI.vbs` напрямую (двойной клик)

### "Иконка не отображается"
- Конвертируйте PNG в ICO формат
- Убедитесь что размер 256x256 px
- Используйте multi-size ICO (16, 32, 48, 256)

---

## 💡 Альтернатива: Ярлык на рабочем столе

Если не хотите создавать EXE:

1. **Правый клик на рабочем столе → Создать → Ярлык**

2. **Укажите расположение:**
   ```
   C:\path\to\mirage-ai\MirageAI.vbs
   ```

3. **Назовите ярлык:** `Mirage AI`

4. **Измените иконку:**
   - Правый клик на ярлыке → Свойства
   - Нажмите "Сменить значок"
   - Выберите `mirage_icon.png` (или ICO файл)

---

**Версия:** 1.0  
**Дата:** 2024  
**Статус:** ✅ Готово к использованию
