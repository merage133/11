@echo off
chcp 65001 >nul
title RU AI Studio — Создание установщика
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     RU AI Studio — Создание установщика Windows           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Переходим в папку проекта
cd /d "%~dp0"

:: ============================================
:: ШАГ 1: Проверка Node.js
:: ============================================
echo [1/4] Проверка Node.js...
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
:: ШАГ 2: Установка зависимостей
:: ============================================
echo.
echo [2/4] Установка зависимостей...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Ошибка установки зависимостей!
    echo.
    pause
    exit /b 1
)
echo  ✅ Зависимости установлены

:: ============================================
:: ШАГ 3: Сборка проекта
:: ============================================
echo.
echo [3/4] Сборка проекта...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Ошибка сборки!
    echo.
    pause
    exit /b 1
)
echo  ✅ Проект собран

:: ============================================
:: ШАГ 4: Компиляция установщика
:: ============================================
echo.
echo [4/4] Компиляция установщика...

:: Проверяем наличие Inno Setup
set ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe
if not exist "%ISCC_PATH%" (
    set ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe
)

if not exist "%ISCC_PATH%" (
    echo.
    echo  ❌ Inno Setup не найден!
    echo.
    echo  Скачайте и установите: https://jrsoftware.org/isdl.php
    echo.
    echo  После установки запустите этот скрипт снова.
    echo.
    pause
    exit /b 1
)

:: Создаём папку для выходных файлов
if not exist "installer_output" mkdir installer_output

:: Компилируем установщик
"%ISCC_PATH%" setup.iss

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Ошибка компиляции установщика!
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Завершение
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     ✅ Установщик успешно создан!                         ║
echo ║                                                            ║
echo ║     Файл: installer_output\RU_AI_Studio_Setup_1.0.0.exe   ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Открываем папку с установщиком
explorer installer_output

pause
