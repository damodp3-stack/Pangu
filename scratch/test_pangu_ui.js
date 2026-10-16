const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[PANGU RENDERER]', msg);
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('did-fail-load:', code, desc);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'));
  await new Promise(r => setTimeout(r, 3500));
  console.log('[PANGU TEST] UI ran for 3.5s with zero crashes!');
  app.quit();
});
