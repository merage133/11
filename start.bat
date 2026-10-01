@echo off
chcp 1251 >nul
title RU AI Studio - Launch
color 0B

echo.
echo ================================================================
echo     RU AI Studio - Launching...
echo ================================================================
echo.

:: Go to project folder
cd /d "%~dp0"

:: ============================================
:: STEP 1: Check Node.js
:: ============================================
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js not found!
    echo.
    echo  Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%

:: ============================================
:: STEP 2: Check Ollama
:: ============================================
echo.
echo [2/5] Checking Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Ollama not installed!
    echo.
    echo  Download from: https://ollama.com/download
    echo.
    pause
    exit /b 1
)

:: Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" /FO CSV 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Ollama not running. Starting...
    start /B "" ollama serve
    timeout /t 3 /nobreak >nul
)

:: Check Ollama connection using PowerShell
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Ollama not responding!
    echo.
    echo  Try running manually: ollama serve
    echo.
    pause
    exit /b 1
)
echo  [OK] Ollama is running

:: ============================================
:: STEP 3: Check model
:: ============================================
echo.
echo [3/5] Checking model...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Model not found. Install: ollama pull qwen2.5:7b
    echo.
    set /p INSTALL_MODEL="  Install model qwen2.5:7b? (y/n): "
    if /i "%INSTALL_MODEL%"=="y" (
        echo.
        echo  Installing model (this will take a few minutes)...
        ollama pull qwen2.5:7b
    )
) else (
    echo  [OK] Model installed
)

:: ============================================
:: STEP 4: Start server
:: ============================================
echo.
echo [4/5] Starting server...

:: Check if port is busy
netstat -ano | findstr ":3001" >NUL 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [WARN] Port 3001 is busy. Stopping old process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

start "RU AI Server" /B cmd /c "node server.js"
timeout /t 2 /nobreak >nul

:: Check server using PowerShell
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Server failed to start!
    echo.
    echo  Try manually: node server.js
    echo.
    pause
    exit /b 1
)
echo  [OK] Server started

:: ============================================
:: STEP 5: Open browser
:: ============================================
echo.
echo [5/5] Opening browser...

:: Copy index.html to server folder for access
if not exist "public" mkdir public
copy /Y "dist\index.html" "public\index.html" >nul 2>&1
copy /Y "dist\assets\*" "public\assets\" >nul 2>&1

start "" "http://localhost:3001"

echo.
echo ================================================================
echo     [OK] RU AI Studio is running!
echo.
echo   - Browser opened
echo   - Don't close this window
echo   - Press any key to stop
echo ================================================================
echo.
echo Press any key to stop all processes...
pause >nul

:: Stop all processes
echo.
echo Stopping processes...
taskkill /F /FI "WINDOWTITLE eq RU AI Server" >nul 2>&1
echo [OK] Stopped
timeout /t 2 /nobreak >nul
