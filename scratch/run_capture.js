const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\DAMO\\.gemini\\antigravity-ide\\brain\\87854639-5959-410a-9cdf-b6194ed418e2';

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  win.webContents.on('console-message', (e, lvl, msg) => console.log('[RENDERER LOG]', msg));

  ipcMain.on('render-complete', (e, { frontData, backData }) => {
    console.log('[CAPTURE] Received rendered snapshots!');
    const frontBuf = Buffer.from(frontData.replace(/^data:image\/png;base64,/, ''), 'base64');
    const backBuf = Buffer.from(backData.replace(/^data:image\/png;base64,/, ''), 'base64');

    fs.writeFileSync(path.join(__dirname, 'sellsword_fox_front.png'), frontBuf);
    fs.writeFileSync(path.join(__dirname, 'sellsword_fox_back.png'), backBuf);

    if (fs.existsSync(artifactDir)) {
      fs.writeFileSync(path.join(artifactDir, 'sellsword_fox_front.png'), frontBuf);
      fs.writeFileSync(path.join(artifactDir, 'sellsword_fox_back.png'), backBuf);
      console.log('[CAPTURE] Successfully saved to artifacts directory!');
    }

    console.log('[CAPTURE] Front PNG size:', frontBuf.length, 'Back PNG size:', backBuf.length);
    app.quit();
  });

  await win.loadFile(path.join(__dirname, 'render_runner.html'));
});
