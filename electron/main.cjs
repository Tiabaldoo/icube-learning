const { app, BrowserWindow, Menu, dialog, screen, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createStore } = require('./content-store.cjs');
const baseline = require('../content/version.json');
let contentStore;
const trustedWindows = new Map();

app.setName('Айкуб Игры');

async function createWindow() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const window = new BrowserWindow({
    title: 'Айкуб Игры',
    width: Math.min(1280, area.width),
    height: Math.min(800, area.height),
    minWidth: Math.min(960, area.width),
    minHeight: Math.min(600, area.height),
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.cjs') },
  });
  window.once('ready-to-show', () => window.show());
  const contents = window.webContents;
  window.on('closed', () => trustedWindows.delete(contents));
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));

  const devUrl = !app.isPackaged && process.env.AICUBE_DESKTOP_DEV_URL;
  if (devUrl) {
    const url = new URL(devUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('Invalid desktop dev URL');
    trustedWindows.set(window.webContents, url.href);
    await window.loadURL(url.href);
  } else {
    // Renderer remains offline; only the main process fetches validated lesson data.
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
      (_details, callback) => callback({ cancel: true }),
    );
    const file = path.join(__dirname, '../dist-desktop/index.html');
    trustedWindows.set(window.webContents, pathToFileURL(file).href);
    await window.loadFile(file);
  }
}

function openWindow() {
  createWindow().catch(error => {
    dialog.showErrorBox('Не удалось открыть Айкуб Игры', error.message);
    app.quit();
  });
}

app.whenReady().then(() => {
  contentStore = createStore(path.join(app.getPath('userData'), 'learning-content'), app.getVersion(), baseline.version);
  for (const operation of ['load', 'check', 'install']) {
    ipcMain.handle(`learning-content:${operation}`, async (event, ...args) => {
      if (args.length || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== trustedWindows.get(event.sender)) throw new Error('Invalid content request');
      return contentStore[operation]();
    });
  }
  Menu.setApplicationMenu(process.platform === 'darwin'
    ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])
    : null);
  openWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) openWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
