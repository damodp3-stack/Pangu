const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ipcMain.on('export-done', (e, size) => {
    console.log('[MAIN] Export complete! Generated SellswordFox.glb size:', size, 'bytes');
    setTimeout(() => {
      app.quit();
    }, 400);
  });

  ipcMain.on('export-failed', (e, err) => {
    console.error('[MAIN] Export failed:', err);
    app.quit();
  });

  win.loadFile(path.join(__dirname, 'runner.html'));

  win.webContents.on('console-message', (e, level, message) => {
    console.log('[RENDERER LOG]', message);
  });
});
