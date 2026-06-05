const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
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

function createWindow() {
  const settings = readSettings();
  const pos = settings?.widgetPosition;

  mainWindow = new BrowserWindow({
    width: 680,
    height: 80,
    minWidth: 400,
    maxWidth: 900,
    x: pos && pos.x >= 0 ? pos.x : undefined,
    y: pos && pos.y >= 0 ? pos.y : undefined,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    vibrancy: 'dark',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/public/index.html'));
  }

  // Save position on move
  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    const s = readSettings() || {};
    writeSettings({ ...s, widgetPosition: { x, y } });
  });

  // Resize window based on content
  ipcMain.on('resize-window', (_, height) => {
    if (!mainWindow) return;
    mainWindow.setSize(680, Math.min(Math.max(height, 60), 600));
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('Windows Action Assistant');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => { if (mainWindow) mainWindow.show(); else createWindow(); },
    },
    {
      label: 'Settings',
      click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('navigate', '/settings'); } },
    },
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

// IPC Handlers

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
        // Try direct spawn as fallback
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
    const dirs = [
      path.join(home, 'Desktop'),
      path.join(home, 'Documents'),
      path.join(home, 'Downloads'),
    ];
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

app.whenReady().then(() => {
  ensureDir(DATA_DIR);
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep app running in tray on Windows
  if (process.platform !== 'darwin') {
    // Don't quit — keep tray
  }
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
