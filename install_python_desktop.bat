@echo off
title Mirage AI - Python Desktop Installer
color 0B

echo.
echo ================================================================
echo     Mirage AI - Python Desktop Installer
echo ================================================================
echo.

cd /d "%~dp0"

:: Проверка Python
echo [1/6] Checking Python...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Python not found!
    echo.
    echo  Please install Python 3.10+ from:
    echo  https://www.python.org/downloads/
    echo.
    echo  IMPORTANT: Check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
echo  [OK] %PYTHON_VER%

:: Проверка Ollama
echo.
echo [2/6] Checking Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Ollama not found!
    echo.
    echo  Please install Ollama from:
    echo  https://ollama.com/download
    echo.
    pause
    exit /b 1
)
echo  [OK] Ollama installed

:: Проверка модели
echo.
echo [3/6] Checking Ollama model...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] No model found. Installing qwen2.5:7b...
    echo  This will take a few minutes...
    ollama pull qwen2.5:7b
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Failed to install model
        pause
        exit /b 1
    )
)
echo  [OK] Model ready

:: Переход в папку ai_agent
echo.
echo [4/6] Setting up Python environment...
cd ai_agent

:: Создание виртуального окружения
if not exist "venv" (
    echo  Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Активация и установка зависимостей
echo  Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo  [OK] Dependencies installed

:: Сборка EXE
echo.
echo [5/6] Building EXE...
echo  This will take 2-5 minutes...
pyinstaller build_exe.spec --noconfirm
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Failed to build EXE
    pause
    exit /b 1
)
echo  [OK] EXE built successfully

:: Создание ярлыка
echo.
echo [6/6] Creating desktop shortcut...
cd ..

set SCRIPT="%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Mirage AI.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0ai_agent\dist\AIAgent\AIAgent.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0ai_agent\dist\AIAgent" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo  [OK] Shortcut created on desktop

:: Финальное сообщение
echo.
echo ================================================================
echo     [OK] Installation completed successfully!
echo.
echo     You can now:
echo     1. Double-click "Mirage AI" on your desktop
echo     2. Or run: ai_agent\dist\AIAgent\AIAgent.exe
echo.
echo     IMPORTANT: Make sure Ollama is running:
echo     ollama serve
echo ================================================================
echo.

pause
