@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Windows Action Assistant - Build Setup.exe
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

:: Check pnpm
where pnpm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing pnpm...
    npm install -g pnpm
)

:: Move into the artifact directory (works from project root or artifact dir)
if exist "artifacts\windows-action-assistant\package.json" (
    cd artifacts\windows-action-assistant
) else if not exist "package.json" (
    echo ERROR: Run this script from the project root or artifacts\windows-action-assistant
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: pnpm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Building React UI (Vite)...
call pnpm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Vite build failed
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging with electron-builder...
call pnpm exec electron-builder --win --x64
if %ERRORLEVEL% neq 0 (
    echo ERROR: electron-builder failed
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD COMPLETE
echo ============================================================
echo.
echo   Installer: release\Windows Action Assistant Setup 1.0.0.exe
echo.
echo   - Double-click the .exe to install on any Windows 10/11 PC
echo   - No internet required, no accounts, fully offline
echo   - Installs to %%LOCALAPPDATA%%\Programs\Windows Action Assistant
echo.
pause
