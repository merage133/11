@echo off
chcp 65001 >nul
title Mirage AI - Установка
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          Mirage AI - Установка Python версии              ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "SCRIPT_DIR=%~dp0"
set "AI_AGENT_DIR=%SCRIPT_DIR%ai_agent"

echo [INFO] Папка: %AI_AGENT_DIR%
echo.

:: Проверка Python
echo [1/4] Проверка Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Python не найден!
    echo  Установите с https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo  [OK] %PYTHON_VER%

:: Проверка Ollama
echo.
echo [2/4] Проверка Ollama...
ollama --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Ollama не найдена!
    echo  Установите с https://ollama.com/download
    pause
    exit /b 1
)
echo  [OK] Ollama установлена

:: Проверка модели
echo.
echo [3/4] Проверка модели...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Модель не найдена. Устанавливаю qwen2.5:7b...
    ollama pull qwen2.5:7b
)
echo  [OK] Модель готова

:: Установка и сборка
echo.
echo [4/4] Установка зависимостей и сборка...
echo  Это займёт 5-10 минут...
echo.

cd /d "%AI_AGENT_DIR%"

:: Создание venv если нужно
if not exist "venv" (
    echo  Создание виртуального окружения...
    python -m venv venv
)

:: Активация
call venv\Scripts\activate.bat

:: Установка зависимостей
echo  Установка зависимостей...
pip install --upgrade pip --quiet
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Не удалось установить зависимости
    pause
    exit /b 1
)
echo  [OK] Зависимости установлены

:: Сборка EXE (упрощённая команда без spec файла)
echo.
echo  Сборка EXE...
pyinstaller --noconfirm --clean ^
    --name "AIAgent" ^
    --windowed ^
    --add-data "utils.py;." ^
    --add-data "llm_client.py;." ^
    --add-data "tool_executor.py;." ^
    --add-data "agent_loop.py;." ^
    --add-data "voice_input.py;." ^
    --add-data "ui_main.py;." ^
    --hidden-import "PyQt6" ^
    --hidden-import "PyQt6.QtCore" ^
    --hidden-import "PyQt6.QtGui" ^
    --hidden-import "PyQt6.QtWidgets" ^
    --hidden-import "vosk" ^
    --hidden-import "sounddevice" ^
    --hidden-import "numpy" ^
    --hidden-import "duckduckgo_search" ^
    --hidden-import "psutil" ^
    --hidden-import "sympy" ^
    --hidden-import "requests" ^
    main.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ОШИБКА] Не удалось собрать EXE
    echo.
    echo  Попробуйте запустить приложение напрямую:
    echo    python main.py
    echo.
    pause
    exit /b 1
)

call venv\Scripts\deactivate.bat

:: Проверка
if not exist "dist\AIAgent\AIAgent.exe" (
    echo  [ОШИБКА] EXE не создан!
    pause
    exit /b 1
)

:: Создание ярлыка
echo.
echo  Создание ярлыка на рабочем столе...
set "VBS=%TEMP%\shortcut_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Mirage AI.lnk" >> "%VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS%"
echo oLink.TargetPath = "%AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe" >> "%VBS%"
echo oLink.WorkingDirectory = "%AI_AGENT_DIR%\dist\AIAgent" >> "%VBS%"
echo oLink.Save >> "%VBS%"

cscript /nologo "%VBS%"
del "%VBS%"

:: Готово
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              [OK] Установка завершена!                    ║
echo ║                                                            ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  Запуск:                                                   ║
echo ║  1. Ярлык "Mirage AI" на рабочем столе                    ║
echo ║  2. Или: %AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe         ║
echo ║                                                            ║
echo ║  ВАЖНО: Перед запуском запустите: ollama serve            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

explorer "%AI_AGENT_DIR%\dist\AIAgent"
pause
