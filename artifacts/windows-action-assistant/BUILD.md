# Building the Windows Installer

This guide explains how to build `Setup.exe` from the source code on a **Windows machine**.

## Prerequisites

Install the following on your Windows PC:

1. **Node.js 20+** — https://nodejs.org/
2. **pnpm** — `npm install -g pnpm`
3. **Git** — https://git-scm.com/ (if cloning from a repo)

## Step 1 — Clone / Download the project

If you have the project as a ZIP, extract it. Otherwise clone it:

```bash
git clone <your-repo-url>
cd <project-folder>
```

## Step 2 — Install dependencies

```bash
pnpm install
```

## Step 3 — Build the React frontend

Run from the `artifacts/windows-action-assistant` directory:

```bash
cd artifacts/windows-action-assistant
pnpm run build
```

This produces `artifacts/windows-action-assistant/dist/public/` — the compiled web UI.

## Step 4 — Build the Windows installer

Still inside `artifacts/windows-action-assistant`:

```bash
pnpm run electron:build
```

This runs:
1. `vite build` — builds the frontend
2. `electron-builder --win --x64` — packages into a NSIS installer

The output is:

```
artifacts/windows-action-assistant/release/
└── Windows Action Assistant Setup 1.0.0.exe   ← your installer
```

## Step 5 — Install on any Windows PC

Copy `Windows Action Assistant Setup 1.0.0.exe` to any Windows 10/11 PC and double-click to install.

- No login, no account, no cloud setup required
- The app installs to `%LOCALAPPDATA%\Programs\Windows Action Assistant` by default
- A desktop shortcut and Start Menu entry are created automatically
- The app runs as a floating widget in the top-center of the screen
- Right-click the system tray icon to access Settings or quit

## Optional: Add a custom icon

Replace `artifacts/windows-action-assistant/public/icon.ico` with your own 256×256 ICO file before building.

You can convert a PNG to ICO using https://convertio.co/png-ico/ or any image editor.

## Automated Build Script

For CI / scripted builds, save this as `build-installer.bat` in the project root:

```bat
@echo off
echo Building Windows Action Assistant...
cd artifacts\windows-action-assistant
call pnpm install
call pnpm run electron:build
echo.
echo Build complete!
echo Installer: artifacts\windows-action-assistant\release\
pause
```

## Development Mode (Windows)

To run the app in Electron without building an installer:

```bash
cd artifacts/windows-action-assistant
pnpm run build
pnpm run electron:dev
```

## Troubleshooting

- **"electron-builder not found"** — run `pnpm install` again inside `artifacts/windows-action-assistant`
- **"Cannot find module electron"** — same as above
- **Antivirus warning on installer** — this is normal for unsigned EXE files. The app is safe.
- **Icons appear as white squares** — add a valid `public/icon.ico` file
