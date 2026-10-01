@echo off
title Mirage AI - Create EXE Launcher
color 0B

echo.
echo ================================================================
echo     Mirage AI - Creating EXE Launcher
echo ================================================================
echo.

cd /d "%~dp0"

echo [INFO] Creating SED file for IExpress...

:: Create SED file for IExpress
(
echo [Version]
echo Class=IExpress
echo SEDVersion=3
echo [Options]
echo PackagePurpose=InstallApp
echo ShowInstallProgramWindow=0
echo HideExtractAnimation=1
echo UseLongFileName=1
echo InsideCompressed=0
echo Configuration=Z
echo MaxDiskRAM=0
echo TargetDir=.
echo AppLaunched= MirageAI.vbs
echo ResetBootSection=0
echo [PackageFiles]
echo MirageAI.vbs=MirageAI.vbs
echo [MirageAI.vbs]
echo FileType=0
echo Argument=
echo [Strings]
echo AppName=Mirage AI
echo AppDescription=Mirage AI Launcher
echo TargetName=Mirage.exe
echo FriendlyName=Mirage AI
echo PackageName=Mirage
echo LaunchFile= MirageAI.vbs
) > Mirage.sed

echo [OK] SED file created
echo.
echo [INFO] Creating EXE with IExpress...

:: Use IExpress to create EXE
if exist "%SystemRoot%\System32\iexpress.exe" (
    "%SystemRoot%\System32\iexpress.exe" /N /Q Mirage.sed
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ================================================================
        echo     [OK] Mirage.exe created successfully!
        echo.
        echo     You can place Mirage.exe on your desktop.
        echo ================================================================
        echo.
    ) else (
        echo.
        echo [WARN] IExpress failed. Using alternative method...
        echo.
        goto :alternative
    )
) else (
    echo.
    echo [WARN] IExpress not found. Using alternative method...
    echo.
    goto :alternative
)

goto :done

:alternative
echo [INFO] Creating simple batch launcher...

:: Create a simple bat launcher that can be renamed to exe
(
echo @echo off
echo title Mirage AI
echo cd /d "%%~dp0"
echo start /B "" wscript.exe MirageAI.vbs
) > Mirage.bat

echo.
echo ================================================================
echo     [OK] Launcher created!
echo.
echo     Option 1: Use Mirage.bat (rename to Mirage.exe if needed^)
echo     Option 2: Use MirageAI.vbs directly
echo.
echo     For a real .exe file, download:
echo     - Bat To Exe Converter: https://www.battoexeconverter.com/
echo     - Or use PS2EXE: https://github.com/MScholtes/PS2EXE
echo ================================================================
echo.

:done
pause
