@echo off
chcp 65001 >nul
title Mirage AI - Запуск
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              Mirage AI - Запуск приложения                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Проверка venv
if not exist "venv" (
    echo [!] Виртуальное окружение не найдено.
    echo     Создаю venv...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ОШИБКА] Не удалось создать venv
        pause
        exit /b 1
    )
)

:: Активация
call venv\Scripts\activate.bat

:: Проверка зависимостей
python -c "import PyQt6" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Зависимости не установлены.
    echo     Устанавливаю...
    pip install -r requirements.txt --quiet
)

:: Проверка Ollama
echo.
echo [INFO] Проверка Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Ollama не запущена!
    echo.
    echo     Запустите в другом окне: ollama serve
    echo.
    echo     Продолжить anyway? (Y/N)
    set /p CONTINUE=
    if /i not "%CONTINUE%"=="Y" exit /b 1
)

:: Запуск
echo.
echo [OK] Запуск Mirage AI...
echo.
python main.py

:: Деактивация
call venv\Scripts\deactivate.bat

echo.
echo [INFO] Приложение закрыто.
pause
