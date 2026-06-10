---
name: Windows Action Assistant
description: Electron + React Windows desktop assistant with animated panda character
---

## Key decisions

- Electron files use `.cjs` extension (`electron/main.cjs`, `electron/preload.cjs`) because the package has `"type": "module"` — CommonJS `require()` only works with explicit `.cjs` extension.
- Window default size: 220×220 (idle panda only). Expands to 360×490 when command bubble opens via `resize-window` IPC (takes w, h; adjusts y so it grows upward).
- `set-ignore-mouse` IPC + CSS `WebkitAppRegion: drag` on drag-handle strip at panda head top — rest of panda is clickable.
- Icon: `public/panda-icon.png` for `win.icon`; electron-builder auto-converts to ICO for NSIS. Removed `installerIcon`/`uninstallerIcon` from nsis config to avoid needing a hand-crafted `.ico`.
- Battery monitoring: `powerMonitor` events + PowerShell polling every 60s → sends `battery-status` IPC to renderer.
- PandaState types: idle | sleeping | watching | listening | thinking | executing | success | error | celebration.
- Sleep after 5 min inactivity; wakes on any mouse/key event.
- Pre-existing TS errors in `src/components/ui/` (missing @radix-ui deps) are harmless — those components are unused scaffolds.

**Why:** `"type": "module"` makes `.js` files ESM, breaking `require()` in Electron main process.
**How to apply:** Any new Electron main-process file must use `.cjs` extension.
