# Mirage AI - Create EXE Launcher
# Run this script to create Mirage.exe

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     Mirage AI - Creating EXE Launcher" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Method 1: Try using C# compiler (csc.exe)
Write-Host "[INFO] Trying C# compiler method..." -ForegroundColor Yellow

$csharpCode = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

class MirageLauncher
{
    static void Main(string[] args)
    {
        try
        {
            string dir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            string batPath = Path.Combine(dir, "start.bat");
            
            if (File.Exists(batPath))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c \"" + batPath + "\"";
                psi.WorkingDirectory = dir;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                Process.Start(psi);
            }
            else
            {
                Console.WriteLine("Error: start.bat not found!");
                Console.WriteLine("Press any key to exit...");
                Console.ReadKey();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
    }
}
"@

# Try to find csc.exe
$cscPaths = @(
    "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe",
    "C:\Windows\Microsoft.NET\Framework64\v3.5\csc.exe",
    "C:\Windows\Microsoft.NET\Framework\v3.5\csc.exe"
)

$cscFound = $false
foreach ($cscPath in $cscPaths) {
    if (Test-Path $cscPath) {
        Write-Host "[OK] Found C# compiler: $cscPath" -ForegroundColor Green
        
        # Write C# source
        $csharpCode | Out-File -FilePath "MirageLauncher.cs" -Encoding UTF8
        
        # Compile
        $iconPath = Join-Path $PSScriptRoot "mirage_icon.png"
        $compileArgs = "/target:exe /out:Mirage.exe /platform:anycpu"
        
        if (Test-Path $iconPath) {
            # Note: csc doesn't support PNG icons directly, need .ico
            Write-Host "[INFO] Compiling without custom icon..." -ForegroundColor Yellow
        }
        
        & $cscPath $compileArgs "MirageLauncher.cs" 2>&1 | Out-Null
        
        if (Test-Path "Mirage.exe") {
            Write-Host ""
            Write-Host "================================================================" -ForegroundColor Green
            Write-Host "     [OK] Mirage.exe created successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "     You can place Mirage.exe on your desktop." -ForegroundColor Green
            Write-Host "================================================================" -ForegroundColor Green
            Write-Host ""
            $cscFound = $true
            break
        }
    }
}

if (-not $cscFound) {
    Write-Host ""
    Write-Host "[WARN] C# compiler not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative methods to create EXE:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Use Bat To Exe Converter (recommended):" -ForegroundColor White
    Write-Host "   Download: https://www.battoexeconverter.com/" -ForegroundColor Gray
    Write-Host "   - Open Bat To Exe Converter" -ForegroundColor Gray
    Write-Host "   - Select start.bat as source" -ForegroundColor Gray
    Write-Host "   - Set output to Mirage.exe" -ForegroundColor Gray
    Write-Host "   - Add mirage_icon.png as icon" -ForegroundColor Gray
    Write-Host "   - Click Compile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Use PS2EXE module:" -ForegroundColor White
    Write-Host "   Install-Module -Name PS2EXE" -ForegroundColor Gray
    Write-Host "   Invoke-PS2EXE -inputFile 'MirageAI.vbs' -outputFile 'Mirage.exe'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Use IExpress (built into Windows):" -ForegroundColor White
    Write-Host "   Run: iexpress.exe" -ForegroundColor Gray
    Write-Host "   - Create new Self Extraction Directive" -ForegroundColor Gray
    Write-Host "   - Add MirageAI.vbs as package file" -ForegroundColor Gray
    Write-Host "   - Set install program to MirageAI.vbs" -ForegroundColor Gray
    Write-Host "   - Output as Mirage.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create simple bat launcher as fallback
    Write-Host "[INFO] Creating simple launcher as fallback..." -ForegroundColor Yellow
    
    $launcherContent = @"
@echo off
title Mirage AI
cd /d "%~dp0"
start /B "" wscript.exe MirageAI.vbs
"@
    
    $launcherContent | Out-File -FilePath "Mirage.bat" -Encoding ASCII
    
    Write-Host "[OK] Created Mirage.bat (you can rename it to Mirage.exe)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
