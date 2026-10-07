const { app, BrowserWindow, Menu, dialog, screen } = require('electron');
const path = require('node:path');

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
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.once('ready-to-show', () => window.show());
  // This stage has no external links or privileged renderer APIs.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));

  const devUrl = !app.isPackaged && process.env.AICUBE_DESKTOP_DEV_URL;
  if (devUrl) {
    const url = new URL(devUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('Invalid desktop dev URL');
    await window.loadURL(url.href);
  } else {
    // The installed snapshot never needs or requests remote content.
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
      (_details, callback) => callback({ cancel: true }),
    );
    await window.loadFile(path.join(__dirname, '../dist-desktop/index.html'));
  }
}

function openWindow() {
  createWindow().catch(error => {
    dialog.showErrorBox('Не удалось открыть Айкуб Игры', error.message);
    app.quit();
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(process.platform === 'darwin'
    ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])
    : null);
  openWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) openWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
