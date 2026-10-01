@echo off
title RU AI Studio
cd /d "%~dp0"

echo.
echo ================================================================
echo     RU AI Studio - Starting...
echo ================================================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js not found!
    echo  Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%

echo.
echo [2/5] Checking Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Ollama not installed!
    echo  Download: https://ollama.com/download
    echo.
    pause
    exit /b 1
)

tasklist /FI "IMAGENAME eq ollama.exe" /FO CSV 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Starting Ollama...
    start /B "" ollama serve
    timeout /t 3 /nobreak >nul
)

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 3 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Ollama not responding!
    echo  Run manually: ollama serve
    echo.
    pause
    exit /b 1
)
echo  [OK] Ollama is running

echo.
echo [3/5] Checking model...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] No model found.
    echo  Install: ollama pull qwen2.5:7b
    echo.
    set /p INSTALL_MODEL="  Install qwen2.5:7b now? (y/n): "
    if /i "%INSTALL_MODEL%"=="y" (
        echo  Installing model...
        ollama pull qwen2.5:7b
    )
) else (
    echo  [OK] Model installed
)

echo.
echo [4/5] Starting server...

netstat -ano | findstr ":3001" >NUL 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [WARN] Port 3001 busy. Killing old process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

start "RU AI Server" /B cmd /c "node server.js"
timeout /t 2 /nobreak >nul

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 3 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Server failed to start!
    echo  Run manually: node server.js
    echo.
    pause
    exit /b 1
)
echo  [OK] Server started

echo.
echo [5/5] Opening browser...
start "" "http://localhost:3001"

echo.
echo ================================================================
echo     [OK] RU AI Studio is running!
echo.
echo   - Browser opened
echo   - DO NOT close this window
echo   - Press any key to STOP
echo ================================================================
echo.
pause >nul

echo.
echo Stopping...
taskkill /F /FI "WINDOWTITLE eq RU AI Server" >nul 2>&1
echo [OK] Stopped
timeout /t 1 /nobreak >nul
