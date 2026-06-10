'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings:    () => ipcRenderer.invoke('get-settings'),
  saveSettings:   (data) => ipcRenderer.invoke('save-settings', data),
  openUri:        (uri) => ipcRenderer.invoke('open-uri', uri),
  runPowerShell:  (cmd) => ipcRenderer.invoke('run-powershell', cmd),
  runCmd:         (cmd) => ipcRenderer.invoke('run-cmd', cmd),
  runWinget:      (id, label) => ipcRenderer.invoke('run-winget', id, label),
  launchApp:      (exe) => ipcRenderer.invoke('launch-app', exe),
  openExplorer:   (folder) => ipcRenderer.invoke('open-explorer', folder),
  scanIndex:      () => ipcRenderer.invoke('scan-index'),
  onNavigate:     (cb) => ipcRenderer.on('navigate', (_, path) => cb(path)),
  onBatteryStatus:(cb) => ipcRenderer.on('battery-status', (_, data) => cb(data)),
  resizeWindow:   (w, h) => ipcRenderer.send('resize-window', w, h),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
});
