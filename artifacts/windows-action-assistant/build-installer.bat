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
    echo.
    echo Please close and reopen CMD, then run this script again.
    pause
    exit /b 0
)

:: Navigate to workspace root (two levels up from this script)
cd /d "%~dp0"
cd ..\..

echo Working directory: %CD%
echo.

:: Delete old lockfile so pnpm re-resolves for Windows (includes win32 native binaries)
if exist "pnpm-lock.yaml" (
    echo Removing old lockfile to force fresh Windows-compatible resolution...
    del /f /q pnpm-lock.yaml
)

echo [1/3] Installing dependencies...
call pnpm install --no-frozen-lockfile
if %ERRORLEVEL% neq 0 (
    echo ERROR: pnpm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Building React UI (Vite)...
cd artifacts\windows-action-assistant
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
echo   BUILD COMPLETE!
echo ============================================================
echo.
echo   Installer located at:
echo   artifacts\windows-action-assistant\release\
echo   "Windows Action Assistant Setup 1.0.0.exe"
echo.
echo   Double-click the .exe to install on any Windows 10/11 PC.
echo   No internet required. No accounts. Fully offline.
echo.
pause
