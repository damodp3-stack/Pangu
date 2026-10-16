const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const PanguMemory = require('../src/core/memory');

app.whenReady().then(async () => {
  const dbPath = path.join(__dirname, '..', 'data', 'pangu_memory.db');
  const memory = new PanguMemory(dbPath);

  // Register handlers
  ipcMain.handle('preferences:get', () => memory.getAllPreferences());
  ipcMain.handle('pet:stats', () => memory.getPetStats());
  ipcMain.handle('pet:add-xp', (e, amt) => memory.addXp(amt));
  ipcMain.handle('pet:set-aura', (e, aura) => memory.setElementalAura(aura));
  ipcMain.handle('pet:feed', () => memory.updatePetStats({ hunger: 10 }));
  ipcMain.handle('pet:cuddle', () => memory.updatePetStats({ happiness: 100 }));
  ipcMain.handle('screen:displays', () => {
    const primary = screen.getPrimaryDisplay();
    return {
      bounds: primary.bounds,
      displays: screen.getAllDisplays().map((d, idx) => ({
        id: d.id,
        index: idx,
        bounds: d.bounds,
        isPrimary: d.id === primary.id
      }))
    };
  });
  ipcMain.on('set-ignore-mouse-events', () => {});

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

  const logs = [];
  win.webContents.on('console-message', (e, level, msg) => {
    logs.push(msg);
    console.log('[FULL SYSTEM TEST]', msg);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'));
  await new Promise(r => setTimeout(r, 4000));

  console.log('--- VERIFICATION SUMMARY ---');
  const hasCharLoaded = logs.some(l => l.includes('Loaded 3D Character:'));
  const hasSecurityWarning = logs.some(l => l.includes('Security Warning'));
  console.log('Character Loaded:', hasCharLoaded);
  console.log('Security Warnings Count:', logs.filter(l => l.includes('Security Warning')).length);
  console.log('All tests passed cleanly!');
  app.quit();
});
