# Building the Windows Installer (Setup.exe)

This is a **native Windows desktop application** built with Electron. The Replit
preview shows the UI running in a dev server for visual development only — the
actual product is a standalone `.exe` that runs on any Windows 10/11 PC with no
browser, no cloud, and no internet connection required.

---

## Architecture

```
artifacts/windows-action-assistant/
├── electron/
│   ├── main.js          ← Electron main process (Node.js, native OS access)
│   └── preload.js       ← contextBridge IPC: secure renderer ↔ main bridge
├── src/                 ← React UI (runs INSIDE Electron renderer)
│   ├── engine/
│   │   ├── intentEngine.ts  ← fuzzy NLP matching engine (no external deps)
│   │   └── actionEngine.ts  ← executes Windows actions via Electron IPC
│   ├── components/
│   │   ├── Widget.tsx       ← the floating assistant widget
│   │   ├── Settings.tsx     ← settings panel
│   │   ├── FirstRun.tsx     ← first-run wizard
│   │   └── DebugPanel.tsx   ← action log / debug view
│   └── hooks/
│       └── useSettings.ts   ← reads/writes JSON via Electron IPC (or localStorage in dev)
├── data/intents/        ← intent databases (no server required)
│   ├── windows-settings.json
│   ├── system-controls.json
│   ├── apps.json
│   ├── winget.json
│   └── troubleshooting.json
├── public/
│   └── icon.png         ← app icon (replace with your own 256×256 PNG)
├── build-installer.bat  ← ONE-CLICK BUILD SCRIPT for Windows
└── package.json         ← electron-builder config (NSIS, x64)
```

**Data storage:** All settings are written to
`%APPDATA%\Windows Action Assistant\data\settings\settings.json` via
`fs.writeFileSync` in Electron's main process — no PostgreSQL, no SQLite, no cloud.

---

## Prerequisites (Windows PC only)

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org/ |
| pnpm | latest | `npm install -g pnpm` |

> **Important:** electron-builder must run on Windows to produce a Windows installer.
> It cannot cross-compile to `.exe` from Linux/Mac reliably for NSIS targets.

---

## Option A — One-click build (recommended)

Double-click or run from CMD:

```bat
build-installer.bat
```

This script (located in `artifacts/windows-action-assistant/`) will:
1. Check for Node.js + pnpm
2. Run `pnpm install`
3. Run `vite build` (compiles React UI → `dist/public/`)
4. Run `electron-builder --win --x64` (packages Electron + UI → `Setup.exe`)

**Output:**
```
artifacts/windows-action-assistant/release/
└── Windows Action Assistant Setup 1.0.0.exe
```

---

## Option B — Manual steps

Run from inside `artifacts/windows-action-assistant/`:

```bash
# Step 1 — Install dependencies
pnpm install

# Step 2 — Build the React UI
pnpm run build

# Step 3 — Package to Setup.exe
pnpm run electron:build
```

---

## Option C — Dev mode on Windows (no installer)

Run both commands in separate terminals from `artifacts/windows-action-assistant/`:

```bash
# Terminal 1: start the Vite dev server
pnpm run dev

# Terminal 2: launch Electron pointing at localhost:3000
pnpm run electron:dev
```

This opens the real Electron window (frameless, always-on-top) without building an installer.

---

## What the installer does

```
Windows Action Assistant Setup 1.0.0.exe
  → Installs to: %LOCALAPPDATA%\Programs\Windows Action Assistant\
  → Creates:     Desktop shortcut
                 Start Menu entry
  → Runs as:     Frameless floating widget (680×80px, always-on-top)
  → Tray icon:   Right-click → Show / Settings / Quit
  → Data:        %APPDATA%\Windows Action Assistant\data\settings\settings.json
  → Uninstall:   Add/Remove Programs → "Windows Action Assistant"
```

## Replacing the app icon

Replace `public/icon.png` with your own **256×256 PNG** before building.
electron-builder converts it to `.ico` automatically for Windows.

Free converter: https://convertio.co/png-ico/

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `electron-builder not found` | Run `pnpm install` inside `artifacts/windows-action-assistant` |
| `Cannot find module 'electron'` | Same — run `pnpm install` |
| Antivirus flags the EXE | Normal for unsigned apps. The code is open — inspect it yourself. |
| Icon shows as white square | Use a valid 256×256 PNG in `public/icon.png` |
| `dist/public not found` | Run `pnpm run build` before `electron-builder` |
| Build fails on Linux/Mac | Must build on Windows for NSIS `.exe` target |
