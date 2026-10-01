@echo off
chcp 1251 >nul
title RU AI Studio - Build Installer
color 0B

echo.
echo ================================================================
echo     RU AI Studio - Creating Windows Installer
echo ================================================================
echo.

:: Go to project folder
cd /d "%~dp0"

:: ============================================
:: STEP 1: Check Node.js
:: ============================================
echo [1/4] Checking Node.js...
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
:: STEP 2: Install dependencies
:: ============================================
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

:: ============================================
:: STEP 3: Build project
:: ============================================
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

:: ============================================
:: STEP 4: Compile installer
:: ============================================
echo.
echo [4/4] Compiling installer...

:: Check for Inno Setup
set ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe
if not exist "%ISCC_PATH%" (
    set ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe
)

if not exist "%ISCC_PATH%" (
    echo.
    echo  [ERROR] Inno Setup not found!
    echo.
    echo  Download from: https://jrsoftware.org/isdl.php
    echo.
    echo  After installation, run this script again.
    echo.
    pause
    exit /b 1
)

:: Create output folder
if not exist "installer_output" mkdir installer_output

:: Compile installer
"%ISCC_PATH%" setup.iss

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Installer compilation failed!
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Done
:: ============================================
echo.
echo ================================================================
echo     [OK] Installer created successfully!
echo.
echo     File: installer_output\RU_AI_Studio_Setup_1.0.0.exe
echo ================================================================
echo.

:: Open output folder
%SystemRoot%\explorer.exe installer_output

pause
