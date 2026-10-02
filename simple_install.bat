@echo off
chcp 65001 >nul
title Mirage AI - Простая установка (без venv)
color 0B

echo.
echo ================================================================
echo     Mirage AI - Простая установка
echo     (без виртуального окружения)
echo ================================================================
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

:: Установка зависимостей
echo.
echo [3/4] Установка зависимостей...
echo  Это займёт 2-5 минут...
echo.

cd /d "%AI_AGENT_DIR%"

pip install --upgrade pip --quiet
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Не удалось установить зависимости
    pause
    exit /b 1
)

echo  [OK] Зависимости установлены

:: Сборка EXE
echo.
echo [4/4] Сборка EXE...
echo  Это займёт 2-5 минут...
echo.

pip install pyinstaller --quiet
pyinstaller build_exe.spec --noconfirm
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Не удалось собрать EXE
    pause
    exit /b 1
)

:: Проверка
if not exist "dist\AIAgent\AIAgent.exe" (
    echo  [ОШИБКА] EXE не создан!
    pause
    exit /b 1
)

:: Создание ярлыка
echo.
echo  Создание ярлыка...
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
echo ================================================================
echo  [OK] Установка завершена!
echo.
echo  Запустите: %AI_AGENT_DIR%\dist\AIAgent\AIAgent.exe
echo.
echo  Или используйте ярлык "Mirage AI" на рабочем столе
echo.
echo  ВАЖНО: Перед запуском запустите: ollama serve
echo ================================================================
echo.

explorer "%AI_AGENT_DIR%\dist\AIAgent"
pause
