@echo off
title Mirage AI - Python Desktop Installer
color 0B

echo.
echo ================================================================
echo     Mirage AI - Python Desktop Installer
echo ================================================================
echo.

:: Сохраняем путь к скрипту
set "INSTALLER_DIR=%~dp0"
cd /d "%INSTALLER_DIR%"

echo  [INFO] Installer directory: %INSTALLER_DIR%

:: Проверка Python
echo.
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

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
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

:: Проверка папки ai_agent
echo.
echo [4/6] Setting up Python environment...

if not exist "ai_agent" (
    echo  [ERROR] Folder 'ai_agent' not found!
    echo.
    echo  Please make sure you are running this script from the project root.
    echo  The 'ai_agent' folder should be in: %INSTALLER_DIR%
    echo.
    pause
    exit /b 1
)

cd ai_agent

:: Проверка requirements.txt
if not exist "requirements.txt" (
    echo  [ERROR] File 'requirements.txt' not found in ai_agent folder!
    pause
    exit /b 1
)

:: Создание виртуального окружения
if not exist "venv" (
    echo  Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERROR] Failed to create virtual environment!
        echo.
        echo  Try running manually:
        echo    cd %INSTALLER_DIR%ai_agent
        echo    python -m venv venv
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Virtual environment created
) else (
    echo  [OK] Virtual environment already exists
)

:: Активация и установка зависимостей
echo.
echo  Installing dependencies...
call venv\Scripts\activate.bat

pip install --upgrade pip --quiet
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Failed to install dependencies!
    echo.
    echo  Try installing manually:
    echo    cd %INSTALLER_DIR%ai_agent
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed

:: Деактивация
call venv\Scripts\deactivate.bat

:: Сборка EXE
echo.
echo [5/6] Building EXE...
echo  This will take 2-5 minutes...
echo.

call venv\Scripts\activate.bat
pyinstaller build_exe.spec --noconfirm
set BUILD_RESULT=%ERRORLEVEL%
call venv\Scripts\deactivate.bat

if %BUILD_RESULT% NEQ 0 (
    echo.
    echo  [ERROR] Failed to build EXE!
    echo.
    echo  Try building manually:
    echo    cd %INSTALLER_DIR%ai_agent
    echo    venv\Scripts\activate
    echo    pyinstaller build_exe.spec
    echo.
    pause
    exit /b 1
)
echo  [OK] EXE built successfully

:: Проверка что EXE создан
if not exist "dist\AIAgent\AIAgent.exe" (
    echo.
    echo  [ERROR] EXE file not found after build!
    echo  Expected: %INSTALLER_DIR%ai_agent\dist\AIAgent\AIAgent.exe
    echo.
    pause
    exit /b 1
)

:: Создание ярлыка
echo.
echo [6/6] Creating desktop shortcut...
cd /d "%INSTALLER_DIR%"

set "SCRIPT=%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Mirage AI.lnk" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "%INSTALLER_DIR%ai_agent\dist\AIAgent\AIAgent.exe" >> "%SCRIPT%"
echo oLink.WorkingDirectory = "%INSTALLER_DIR%ai_agent\dist\AIAgent" >> "%SCRIPT%"
echo oLink.Description = "Mirage AI - Autonomous AI Assistant" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"

echo  [OK] Shortcut created on desktop

:: Финальное сообщение
echo.
echo ================================================================
echo     [OK] Installation completed successfully!
echo.
echo     You can now:
echo     1. Double-click "Mirage AI" on your desktop
echo     2. Or run: %INSTALLER_DIR%ai_agent\dist\AIAgent\AIAgent.exe
echo.
echo     IMPORTANT: Make sure Ollama is running before starting:
echo     ollama serve
echo.
echo     EXE location:
echo     %INSTALLER_DIR%ai_agent\dist\AIAgent\AIAgent.exe
echo ================================================================
echo.

pause
