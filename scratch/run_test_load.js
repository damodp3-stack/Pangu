const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ipcMain.on('test-passed', (e, data) => {
    console.log('[VERIFICATION PASSED] SellswordFox.glb fully verified by GLTFLoader! Data:', data);
    app.quit();
  });

  win.loadFile(path.join(__dirname, 'test_load.html'));

  win.webContents.on('console-message', (e, level, message) => {
    console.log('[BROWSER]', message);
  });
});
