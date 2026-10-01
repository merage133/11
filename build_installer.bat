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

:: Try to find Inno Setup in multiple locations
set ISCC_PATH=

:: Check common installation paths
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe
    goto :found_iscc
)
if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe
    goto :found_iscc
)
if exist "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" (
    set ISCC_PATH=C:\Program Files (x86)\Inno Setup 5\ISCC.exe
    goto :found_iscc
)
if exist "C:\Program Files\Inno Setup 5\ISCC.exe" (
    set ISCC_PATH=C:\Program Files\Inno Setup 5\ISCC.exe
    goto :found_iscc
)

:: Try to find via registry (64-bit)
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Inno Setup version 6*" /v InstallLocation 2^>nul ^| findstr "REG_SZ"') do (
    if exist "%%bISCC.exe" (
        set ISCC_PATH=%%bISCC.exe
        goto :found_iscc
    )
)

:: Try to find via registry (32-bit on 64-bit Windows)
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Inno Setup version 6*" /v InstallLocation 2^>nul ^| findstr "REG_SZ"') do (
    if exist "%%bISCC.exe" (
        set ISCC_PATH=%%bISCC.exe
        goto :found_iscc
    )
)

:: Try to find via where command
where ISCC.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where ISCC.exe') do (
        set ISCC_PATH=%%i
        goto :found_iscc
    )
)

:not_found
echo.
echo  [ERROR] Inno Setup not found!
echo.
echo  Inno Setup is required to create the Windows installer (.exe).
echo.
echo  Download from: https://jrsoftware.org/isdl.php
echo.
echo  After installation, run this script again.
echo.
echo  NOTE: You can still use the program without installer!
echo  Just run: start.bat
echo.
pause
exit /b 1

:found_iscc
echo  [OK] Inno Setup found: %ISCC_PATH%

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
