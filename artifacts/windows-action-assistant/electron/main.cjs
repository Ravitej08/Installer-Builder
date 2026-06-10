'use strict';

const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, powerMonitor } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings', 'settings.json');

let mainWindow = null;
let tray = null;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

function writeSettings(data) {
  ensureDir(path.dirname(SETTINGS_FILE));
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getIconPath() {
  const ico = path.join(__dirname, '../public/icon.ico');
  const png = path.join(__dirname, '../public/panda-icon.png');
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return null;
}

function createWindow() {
  const settings = readSettings();
  const pos = settings?.widgetPosition;
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 220,
    height: 220,
    minWidth: 180,
    maxWidth: 460,
    minHeight: 180,
    maxHeight: 600,
    x: pos && pos.x >= 0 ? pos.x : undefined,
    y: pos && pos.y >= 0 ? pos.y : undefined,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    icon: iconPath || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/public/index.html'));
  }

  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    const s = readSettings() || {};
    writeSettings({ ...s, widgetPosition: { x, y } });
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const iconPath = getIconPath();
  let icon;
  if (iconPath) {
    try {
      icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } catch {
      icon = nativeImage.createEmpty();
    }
  } else {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Windows Action Assistant');

  const menu = Menu.buildFromTemplate([
    { label: 'Show Panda', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: 'Settings', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('navigate', '/settings'); } } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function setupBatteryMonitoring() {
  const sendBattery = () => {
    exec('powershell.exe -NoProfile -Command "(Get-WmiObject Win32_Battery).EstimatedChargeRemaining"', { timeout: 5000 }, (err, stdout) => {
      if (!err && mainWindow) {
        const level = parseInt(stdout.trim(), 10);
        if (!isNaN(level)) {
          mainWindow.webContents.send('battery-status', { level, charging: false });
        }
      }
    });
  };

  powerMonitor.on('on-battery', () => {
    if (mainWindow) mainWindow.webContents.send('battery-status', { charging: false });
    sendBattery();
  });

  powerMonitor.on('on-ac', () => {
    if (mainWindow) mainWindow.webContents.send('battery-status', { charging: true });
  });

  setInterval(() => {
    if (mainWindow) sendBattery();
  }, 60000);
}

// ─── IPC HANDLERS ────────────────────────────────────────────────────────────

ipcMain.on('resize-window', (_, w, h) => {
  if (!mainWindow) return;
  const [curX, curY] = mainWindow.getPosition();
  const [curW, curH] = mainWindow.getSize();
  const newW = Math.min(Math.max(w, 180), 460);
  const newH = Math.min(Math.max(h, 180), 600);
  const newX = Math.round(curX - (newW - curW) / 2);
  const newY = curY - (newH - curH);
  mainWindow.setBounds({ x: newX, y: Math.max(0, newY), width: newW, height: newH }, true);
});

ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.handle('get-settings', () => readSettings());
ipcMain.handle('save-settings', (_, data) => { writeSettings(data); return true; });

ipcMain.handle('open-uri', async (_, uri) => {
  await shell.openExternal(uri);
  return 'ok';
});

ipcMain.handle('run-powershell', (_, command) => {
  return new Promise((resolve) => {
    const escaped = command.replace(/"/g, '\\"');
    exec(`powershell.exe -NoProfile -NonInteractive -Command "${escaped}"`, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) resolve(`Error: ${stderr || err.message}`);
      else resolve(stdout.trim() || 'Done');
    });
  });
});

ipcMain.handle('run-cmd', (_, command) => {
  return new Promise((resolve) => {
    exec(`cmd.exe /c start "" ${command}`, { timeout: 5000 }, (err) => {
      if (err) resolve(`Error: ${err.message}`);
      else resolve('Done');
    });
  });
});

ipcMain.handle('run-winget', (_, packageId, label) => {
  return new Promise((resolve) => {
    exec(`cmd.exe /c start "" powershell.exe -NoProfile -Command "winget install --id '${packageId}' --accept-package-agreements --accept-source-agreements"`, (err) => {
      if (err) resolve(`Error: ${err.message}`);
      else resolve(`Installing ${label}...`);
    });
  });
});

ipcMain.handle('launch-app', (_, exe) => {
  return new Promise((resolve) => {
    exec(`start "" "${exe}"`, { shell: true }, (err) => {
      if (err) {
        spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();
      }
      resolve('Done');
    });
  });
});

ipcMain.handle('open-explorer', (_, folderPath) => {
  return new Promise((resolve) => {
    const target = folderPath ? folderPath.replace(/%USERPROFILE%/gi, app.getPath('home')) : '';
    shell.openPath(target || app.getPath('home')).then(() => resolve('Done'));
  });
});

ipcMain.handle('scan-index', () => {
  return new Promise((resolve) => {
    const home = app.getPath('home');
    const results = [];
    const dirs = [path.join(home, 'Desktop'), path.join(home, 'Documents'), path.join(home, 'Downloads')];
    for (const dir of dirs) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir, { withFileTypes: true });
          for (const f of files.slice(0, 50)) {
            results.push({ name: f.name, path: path.join(dir, f.name), type: f.isDirectory() ? 'folder' : 'file' });
          }
        }
      } catch { /* skip */ }
    }
    resolve(results);
  });
});

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  ensureDir(DATA_DIR);
  createWindow();
  createTray();
  setupBatteryMonitoring();
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows — don't quit
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
