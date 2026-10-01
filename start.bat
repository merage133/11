@echo off
chcp 65001 >nul
title RU AI Studio — Запуск
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              RU AI Studio — Запуск...                     ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Переходим в папку проекта
cd /d "%~dp0"

:: ============================================
:: ШАГ 1: Проверка Node.js
:: ============================================
echo [1/5] Проверка Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Node.js не найден!
    echo.
    echo  Скачайте и установите: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER%

:: ============================================
:: ШАГ 2: Проверка Ollama
:: ============================================
echo.
echo [2/5] Проверка Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Ollama не установлена!
    echo.
    echo  Скачайте: https://ollama.com/download
    echo.
    pause
    exit /b 1
)

:: Проверяем запущена ли Ollama
tasklist /FI "IMAGENAME eq ollama.exe" /FO CSV 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Ollama не запущена. Запускаю...
    start /B "" ollama serve
    timeout /t 3 /nobreak >nul
)

:: Проверяем подключение к Ollama с помощью PowerShell (кроссплатформенно для Windows)
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ollama не отвечает!
    echo.
    echo  Попробуйте запустить вручную: ollama serve
    echo.
    pause
    exit /b 1
)
echo  ✅ Ollama работает

:: ============================================
:: ШАГ 3: Проверка модели
:: ============================================
echo.
echo [3/5] Проверка модели...
ollama list 2>NUL | findstr /I "qwen" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Модель не найдена. Установите: ollama pull qwen2.5:7b
    echo.
    set /p INSTALL_MODEL="  Установить модель qwen2.5:7b? (y/n): "
    if /i "%INSTALL_MODEL%"=="y" (
        echo.
        echo  Устанавливаю модель (это займёт несколько минут)...
        ollama pull qwen2.5:7b
    )
) else (
    echo  ✅ Модель установлена
)

:: ============================================
:: ШАГ 4: Запуск сервера
:: ============================================
echo.
echo [4/5] Запуск сервера...

:: Проверяем не занят ли порт
netstat -ano | findstr ":3001" >NUL 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ⚠️  Порт 3001 занят. Останавливаю старый процесс...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

start "RU AI Server" /B cmd /c "node server.js"
timeout /t 2 /nobreak >nul

:: Проверяем сервер с помощью PowerShell (кроссплатформенно для Windows)
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Сервер не запустился!
    echo.
    echo  Попробуйте вручную: node server.js
    echo.
    pause
    exit /b 1
)
echo  ✅ Сервер запущен

:: ============================================
:: ШАГ 5: Открытие браузера
:: ============================================
echo.
echo [5/5] Открытие браузера...

:: Копируем index.html в папку сервера для доступа
if not exist "public" mkdir public
copy /Y "dist\index.html" "public\index.html" >nul 2>&1
copy /Y "dist\assets\*" "public\assets\" >nul 2>&1

start "" "http://localhost:3001"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              ✅ RU AI Studio запущен!                     ║
echo ║                                                            ║
echo ║   • Браузер открыт                                         ║
echo ║   • Не закрывайте это окно                                ║
echo ║   • Для остановки нажмите любую клавишу                   ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Нажмите любую клавишу для остановки всех процессов...
pause >nul

:: Остановка всех процессов
echo.
echo Останавливаю процессы...
taskkill /F /FI "WINDOWTITLE eq RU AI Server" >nul 2>&1
echo ✅ Остановлено
timeout /t 2 /nobreak >nul
