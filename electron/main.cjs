// Electron main process: wraps the built React app (dist/) as a desktop window.
const { app, BrowserWindow, shell, session, nativeTheme } = require('electron');
const path = require('path');

const DEV_URL = process.env.ELECTRON_START_URL; // optional: point at the Vite dev server

function createWindow() {
  const win = new BrowserWindow({
    width: 1180, height: 800, minWidth: 420, minHeight: 600,
    title: 'Scamwise', backgroundColor: nativeTheme.shouldUseDarkColors ? '#0F0F0F' : '#FFFFFF', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  DEV_URL ? win.loadURL(DEV_URL) : win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Links (helplines, reporting sites) open in the normal browser, never inside the app window
  const external = url => /^(https?:|mailto:)/.test(url);
  win.webContents.setWindowOpenHandler(({ url }) => { if (external(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:') && !(DEV_URL && url.startsWith(DEV_URL))) { e.preventDefault(); if (external(url)) shell.openExternal(url); } });
}

app.whenReady().then(() => {
  // Only the camera (QR scanner) may be requested; everything else is denied
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// Only one copy of the app at a time
if (!app.requestSingleInstanceLock()) app.quit();
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
