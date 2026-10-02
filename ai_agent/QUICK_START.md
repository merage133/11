# 🚀 AI Agent - Быстрый старт

## ⚡ Установка за 5 минут

### 1. Установите Python 3.10+
```bash
# Windows: скачайте с https://www.python.org/downloads/
# Linux: sudo apt install python3.10
# macOS: brew install python@3.10
```

### 2. Установите Ollama
```bash
# Windows/macOS: скачайте с https://ollama.com/download
# Linux: curl -fsSL https://ollama.com/install.sh | sh
```

### 3. Загрузите модель
```bash
ollama serve  # В первом терминале
ollama pull qwen2.5:7b  # В втором терминале
```

### 4. Установите зависимости
```bash
cd ai_agent
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 5. Запустите приложение
```bash
python main.py
```

## 🎤 Голосовой ввод (опционально)

```bash
mkdir models
cd models
wget https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip
unzip vosk-model-small-ru-0.22.zip
cd ..
```

## 📦 Сборка EXE

```bash
pip install pyinstaller
pyinstaller build_exe.spec
```

Готовый EXE будет в папке `dist/AIAgent/`

## 🎮 Примеры задач

```
Напиши программу на Python которая выводит "Hello, World!"
Создай файл test.txt с текстом "Привет, мир!"
Какой курс доллара сегодня?
Какое сейчас время?
Посчитай 2 + 2 * 2
```

## 🐛 Проблемы?

1. Проверьте что Ollama запущена: `ollama serve`
2. Проверьте что модель загружена: `ollama list`
3. Проверьте логи: `cat ai_agent.log`

## 📚 Полная документация

См. [README.md](README.md) для подробной документации.

---

**Готово!** 🎉
