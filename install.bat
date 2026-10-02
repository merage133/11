@echo off
chcp 65001 >nul
title Mirage AI - Быстрая установка
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          Mirage AI - Установка Python версии              ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Сохраняем путь к папке со скриптом
set "SCRIPT_DIR=%~dp0"
set "AI_AGENT_DIR=%SCRIPT_DIR%ai_agent"

echo [INFO] Папка установщика: %SCRIPT_DIR%
echo [INFO] Папка AI Agent: %AI_AGENT_DIR%
echo.

:: Проверка Python
echo [1/5] Проверка Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ОШИБКА] Python не найден!
    echo.
    echo  Установите Python 3.10+ с сайта:
    echo  https://www.python.org/downloads/
    echo.
    echo  ВАЖНО: При установке отметьте "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo  [OK] %PYTHON_VER%

:: Проверка Ollama
echo.
echo [2/5] Проверка Ollama...
ollama --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ОШИБКА] Ollama не найдена!
    echo.
    echo  Установите Ollama с сайта:
    echo  https://ollama.com/download
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('ollama --version 2^>^&1') do set OLLAMA_VER=%%i
echo  [OK] %OLLAMA_VER%

:: Проверка модели
echo.
echo [3/5] Проверка модели Ollama...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Модель не найдена. Устанавливаю qwen2.5:7b...
    echo  Это займёт несколько минут...
    ollama pull qwen2.5:7b
    if %ERRORLEVEL% NEQ 0 (
        echo  [ОШИБКА] Не удалось установить модель
        pause
        exit /b 1
    )
)
echo  [OK] Модель готова

:: Проверка папки ai_agent
echo.
echo [4/5] Проверка файлов...
if not exist "%AI_AGENT_DIR%" (
    echo  [ОШИБКА] Папка ai_agent не найдена!
    echo  Ожидалась: %AI_AGENT_DIR%
    pause
    exit /b 1
)

if not exist "%AI_AGENT_DIR%\requirements.txt" (
    echo  [ОШИБКА] Файл requirements.txt не найден!
    pause
    exit /b 1
)

if not exist "%AI_AGENT_DIR%\build_exe.spec" (
    echo  [ОШИБКА] Файл build_exe.spec не найден!
    pause
    exit /b 1
)

echo  [OK] Все файлы на месте

:: Установка зависимостей и сборка
echo.
echo [5/5] Установка и сборка...
echo  Это займёт 5-10 минут...
echo.

cd /d "%AI_AGENT_DIR%"

:: Создание виртуального окружения
if not exist "venv" (
    echo  Создание виртуального окружения...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo  [ОШИБКА] Не удалось создать виртуальное окружение
        pause
        exit /b 1
    )
)

:: Активация и установка
call venv\Scripts\activate.bat

echo  Установка зависимостей...
pip install --upgrade pip --quiet
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Не удалось установить зависимости
    pause
    exit /b 1
)

echo.
echo  Сборка EXE файла...
pyinstaller build_exe.spec --noconfirm --clean
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Не удалось собрать EXE
    pause
    exit /b 1
)

call venv\Scripts\deactivate.bat

:: Проверка результата
if not exist "dist\AIAgent\AIAgent.exe" (
    echo.
    echo  [ОШИБКА] EXE файл не создан!
    echo  Ожидался: %AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe
    pause
    exit /b 1
)

:: Создание ярлыка на рабочем столе
echo.
echo  Создание ярлыка на рабочем столе...
set "VBS_SCRIPT=%TEMP%\create_shortcut_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Mirage AI.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%AI_AGENT_DIR%\dist\AIAgent" >> "%VBS_SCRIPT%"
echo oLink.Description = "Mirage AI - Автономный AI ассистент" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

:: Финальное сообщение
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              [OK] Установка завершена!                    ║
echo ║                                                            ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  Как запустить:                                           ║
echo ║                                                            ║
echo ║  1. Двойной клик на ярлык "Mirage AI" на рабочем столе   ║
echo ║                                                            ║
echo ║  2. Или запустите напрямую:                               ║
echo ║     %AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe              ║
echo ║                                                            ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  ВАЖНО: Перед запуском убедитесь что Ollama работает:    ║
echo ║                                                            ║
echo ║  ollama serve                                             ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Открыть папку с EXE
explorer "%AI_AGENT_DIR%\dist\AIAgent"

pause
