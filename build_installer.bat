@echo off
title Mirage AI - Build Installer
cd /d "%~dp0"

echo.
echo ================================================================
echo     Mirage AI - Creating Windows Installer
echo ================================================================
echo.

echo [1/4] Checking Node.js...
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
echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Failed to install dependencies!
    echo.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed

echo.
echo [3/4] Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Build failed!
    echo.
    pause
    exit /b 1
)
echo  [OK] Project built

echo.
echo [4/4] Compiling installer...

set ISCC_PATH=

if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
    goto :found
)
if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe"
    goto :found
)
if exist "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
    goto :found
)

where ISCC.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where ISCC.exe') do (
        set "ISCC_PATH=%%i"
        goto :found
    )
)

echo.
echo  [ERROR] Inno Setup not found!
echo.
echo  Download: https://jrsoftware.org/isdl.php
echo.
echo  NOTE: You can still use the program without installer!
echo  Just run: start.bat
echo.
pause
exit /b 1

:found
echo  [OK] Inno Setup found

if not exist "installer_output" mkdir installer_output

"%ISCC_PATH%" setup.iss

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Compilation failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo     [OK] Installer created!
echo.
echo     File: installer_output\RU_AI_Studio_Setup_1.0.0.exe
echo ================================================================
echo.

%SystemRoot%\explorer.exe installer_output
pause
