#!/bin/bash

# RU AI Studio — Запуск для Linux/macOS

clear

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              RU AI Studio — Запуск...                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Переходим в папку скрипта
cd "$(dirname "$0")"

# ============================================
# ШАГ 1: Проверка Node.js
# ============================================
echo "[1/5] Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "❌ Node.js не найден!"
    echo ""
    echo "Установите: https://nodejs.org/"
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi
NODE_VER=$(node --version)
echo "✅ Node.js $NODE_VER"

# ============================================
# ШАГ 2: Проверка Ollama
# ============================================
echo ""
echo "[2/5] Проверка Ollama..."
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "❌ Ollama не установлена!"
    echo ""
    echo "Установите: curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

# Проверяем запущена ли Ollama
if ! pgrep -x "ollama" > /dev/null; then
    echo "⚠️  Ollama не запущена. Запускаю..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
fi

# Проверяем подключение к Ollama
if command -v curl &> /dev/null; then
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ Ollama не отвечает!"
        echo ""
        echo "Попробуйте запустить вручную: ollama serve"
        echo ""
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi
else
    # Fallback: используем wget если curl не установлен
    if command -v wget &> /dev/null; then
        if ! wget -q --spider http://localhost:11434/api/tags 2>/dev/null; then
            echo "❌ Ollama не отвечает!"
            echo ""
            echo "Попробуйте запустить вручную: ollama serve"
            echo ""
            read -p "Нажмите Enter для выхода..."
            exit 1
        fi
    else
        echo "⚠️  Не удалось проверить Ollama (curl/wget не установлены)"
    fi
fi
echo "✅ Ollama работает"

# ============================================
# ШАГ 3: Проверка модели
# ============================================
echo ""
echo "[3/5] Проверка модели..."
if ! ollama list 2>/dev/null | grep -qi "qwen"; then
    echo "⚠️  Модель не найдена."
    echo ""
    read -p "Установить модель qwen2.5:7b? (y/n): " INSTALL_MODEL
    if [[ "$INSTALL_MODEL" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Устанавливаю модель (это займёт несколько минут)..."
        ollama pull qwen2.5:7b
    fi
else
    echo "✅ Модель установлена"
fi

# ============================================
# ШАГ 4: Запуск сервера
# ============================================
echo ""
echo "[4/5] Запуск сервера..."

# Проверяем не занят ли порт
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Порт 3001 занят. Останавливаю старый процесс..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

node server.cjs &
SERVER_PID=$!
sleep 2

# Проверяем сервер
if command -v curl &> /dev/null; then
    if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "❌ Сервер не запустился!"
        echo ""
        echo "Попробуйте вручную: node server.cjs"
        echo ""
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi
else
    # Fallback: используем wget если curl не установлен
    if command -v wget &> /dev/null; then
        if ! wget -q --spider http://localhost:3001/api/health 2>/dev/null; then
            echo "❌ Сервер не запустился!"
            echo ""
            echo "Попробуйте вручную: node server.cjs"
            echo ""
            read -p "Нажмите Enter для выхода..."
            exit 1
        fi
    else
        echo "⚠️  Не удалось проверить сервер (curl/wget не установлены)"
    fi
fi
echo "✅ Сервер запущен"

# ============================================
# ШАГ 5: Открытие браузера
# ============================================
echo ""
echo "[5/5] Открытие браузера..."

# Определяем команду для открытия браузера
if command -v xdg-open &> /dev/null; then
    BROWSER_CMD="xdg-open"
elif command -v open &> /dev/null; then
    BROWSER_CMD="open"
else
    BROWSER_CMD=""
fi

if [ -n "$BROWSER_CMD" ]; then
    $BROWSER_CMD "http://localhost:3001" 2>/dev/null
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              ✅ RU AI Studio запущен!                     ║"
echo "║                                                            ║"
echo "║   • Браузер открыт                                         ║"
echo "║   • Не закрывайте это окно                                ║"
echo "║   • Для остановки нажмите Ctrl+C                          ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Нажмите Ctrl+C для остановки всех процессов..."

# Ожидание Ctrl+C
trap "echo ''; echo 'Останавливаю процессы...'; kill $SERVER_PID 2>/dev/null; if [ -n \"$OLLAMA_PID\" ]; then kill $OLLAMA_PID 2>/dev/null; fi; echo '✅ Остановлено'; exit" INT

wait $SERVER_PID
