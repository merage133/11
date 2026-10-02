# 🔧 Ручная установка AI Agent (если автоматическая не работает)

## Шаг 1: Проверьте Python

Откройте командную строку (cmd) и выполните:

```bash
python --version
```

Должно показать: `Python 3.10.x` или выше

**Если Python не установлен:**
1. Скачайте с https://www.python.org/downloads/
2. При установке **ОБЯЗАТЕЛЬНО** отметьте "Add Python to PATH"
3. Перезапустите командную строку

---

## Шаг 2: Проверьте Ollama

```bash
ollama --version
```

**Если Ollama не установлена:**
1. Скачайте с https://ollama.com/download
2. Установите
3. Перезапустите командную строку

---

## Шаг 3: Загрузите модель

```bash
# В первом окне cmd запустите сервер
ollama serve

# В ВТОРОМ окне cmd загрузите модель
ollama pull qwen2.5:7b
```

Проверьте что модель загружена:
```bash
ollama list
```

Должно показать: `qwen2.5:7b`

---

## Шаг 4: Перейдите в папку проекта

```bash
cd путь\к\папке\ai_agent
```

Например:
```bash
cd C:\Users\ВашеИмя\Desktop\project\ai_agent
```

---

## Шаг 5: Создайте виртуальное окружение

```bash
python -m venv venv
```

Если появится ошибка "python не найден", попробуйте:
```bash
py -m venv venv
```

Или:
```bash
python3 -m venv venv
```

---

## Шаг 6: Активируйте виртуальное окружение

**Windows:**
```bash
venv\Scripts\activate
```

В начале строки должно появиться `(venv)`

**Если ошибка "не удаётся найти указанный путь":**
```bash
call venv\Scripts\activate.bat
```

---

## Шаг 7: Установите зависимости

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Это установит все необходимые библиотеки. Может занять 2-5 минут.

**Если ошибка с PyQt6:**
```bash
pip install PyQt6 --force-reinstall
```

**Если ошибка с vosk:**
```bash
pip install vosk --force-reinstall
```

---

## Шаг 8: Проверьте что всё работает

```bash
python main.py
```

Должно открыться окно приложения.

**Если ошибка с Ollama:**
- Убедитесь что `ollama serve` запущена в другом окне
- Проверьте что модель загружена: `ollama list`

**Если ошибка с модулями:**
```bash
pip install -r requirements.txt --force-reinstall
```

---

## Шаг 9: Соберите EXE

```bash
pip install pyinstaller
pyinstaller build_exe.spec
```

Это создаст папку `dist/AIAgent/` с готовым приложением.

**Если ошибка сборки:**
```bash
# Очистите кэш
rmdir /s /q build dist
pyinstaller build_exe.spec --clean
```

---

## Шаг 10: Запустите EXE

```bash
dist\AIAgent\AIAgent.exe
```

Или дважды кликните на файл в проводнике.

---

## Шаг 11: Создайте ярлык (опционально)

1. Правый клик на `dist\AIAgent\AIAgent.exe`
2. "Отправить" → "Рабочий стол (создать ярлык)"
3. Переименуйте ярлык в "Mirage AI"

---

## 🐛 Частые проблемы и решения

### Ошибка: "python не является внутренней или внешней командой"

**Решение:**
1. Переустановите Python
2. **ОБЯЗАТЕЛЬНО** отметьте "Add Python to PATH"
3. Перезапустите командную строку
4. Проверьте: `python --version`

---

### Ошибка: "Системе не удается найти указанный путь" при активации venv

**Решение:**
```bash
# Используйте полный путь
call venv\Scripts\activate.bat

# Или используйте py launcher
py -m venv venv
call venv\Scripts\activate.bat
```

---

### Ошибка: "ModuleNotFoundError: No module named 'PyQt6'"

**Решение:**
```bash
# Убедитесь что venv активирован (должно быть (venv) в начале строки)
pip install PyQt6
```

---

### Ошибка: "Ollama не запущена"

**Решение:**
```bash
# Запустите в отдельном окне cmd
ollama serve

# Не закрывайте это окно!
# В другом окне запустите приложение
python main.py
```

---

### Ошибка: "Модель не найдена"

**Решение:**
```bash
# Загрузите модель
ollama pull qwen2.5:7b

# Проверьте
ollama list
```

---

### Ошибка при сборке EXE: "UPX not found"

**Решение:**
```bash
# Отредактируйте build_exe.spec
# Найдите строку: upx=True
# Замените на: upx=False

# Или установите UPX
# Скачайте с https://upx.github.io/
# Добавьте в PATH
```

---

### Ошибка: "Permission denied" при запуске EXE

**Решение:**
1. Правый клик на `AIAgent.exe`
2. "Свойства"
3. Внизу: "Разблокировать"
4. "Применить"

---

### EXE не запускается

**Решение:**
1. Проверьте что Ollama запущена: `ollama serve`
2. Проверьте что модель загружена: `ollama list`
3. Запустите из командной строки чтобы увидеть ошибку:
```bash
cd dist\AIAgent
.\AIAgent.exe
```

---

## 📋 Команды для копирования

### Полная установка с нуля:

```bash
# 1. Перейти в папку
cd путь\к\ai_agent

# 2. Создать venv
python -m venv venv

# 3. Активировать
call venv\Scripts\activate.bat

# 4. Установить зависимости
pip install --upgrade pip
pip install -r requirements.txt

# 5. Проверить
python main.py

# 6. Собрать EXE
pip install pyinstaller
pyinstaller build_exe.spec

# 7. Запустить
dist\AIAgent\AIAgent.exe
```

---

## 🎯 Быстрая проверка

После установки выполните:

```bash
# Проверка Python
python --version

# Проверка Ollama
ollama --version
ollama list

# Проверка venv
cd ai_agent
call venv\Scripts\activate.bat
pip list

# Проверка приложения
python main.py
```

---

## 📞 Если ничего не помогает

1. Удалите папку `venv`
2. Удалите папки `build` и `dist`
3. Начните установку заново с Шага 4
4. Если ошибка повторяется - проверьте логи в файле `ai_agent.log`

---

**Удачи! 🚀**
