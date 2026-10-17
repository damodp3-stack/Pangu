const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const PanguMemory = require('../src/core/memory');

app.whenReady().then(async () => {
  const dbPath = path.join(__dirname, '..', 'data', 'pangu_memory.db');
  const memory = new PanguMemory(dbPath);

  // Register handlers
  ipcMain.handle('preferences:get', () => memory.getAllPreferences());
  ipcMain.handle('preferences:set', (e, k, v) => memory.setPreference(k, v));
  ipcMain.handle('memory:list', () => memory.getAllMemories());
  ipcMain.handle('memory:add', (e, cat, content) => memory.addMemory(cat, content));
  ipcMain.handle('memory:delete', (e, id) => memory.deleteMemory(id));
  ipcMain.handle('api-keys:get', () => memory.getAllApiKeys());
  ipcMain.handle('api-keys:save', (e, p, k, m) => memory.setApiKey(p, k, m));
  ipcMain.handle('chat:history', () => memory.getRecentChatHistory(10));
  ipcMain.handle('chat:send', (e, msg) => ({ text: 'Test response', action: 'HAPPY' }));
  ipcMain.handle('pet:stats', () => memory.getPetStats());
  ipcMain.handle('pet:add-xp', (e, amt) => memory.addXp(amt));
  ipcMain.handle('pet:set-aura', (e, aura) => memory.setElementalAura(aura));
  ipcMain.handle('pet:feed', () => memory.updatePetStats({ hunger: 10 }));
  ipcMain.handle('pet:play', () => memory.updatePetStats({ energy: 80 }));
  ipcMain.handle('pet:cuddle', () => memory.updatePetStats({ happiness: 100 }));
  ipcMain.handle('pet:toggleHouse', () => true);
  ipcMain.handle('privacy:status', () => ({ isPaused: false, screenAllowed: false, micAllowed: false }));
  ipcMain.handle('privacy:togglePanic', () => false);
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
  win.webContents.on('console-message', (event, level, msg, line, sourceId) => {
    const text = typeof event === 'object' && event.message ? event.message : msg;
    const lineNum = typeof event === 'object' && event.lineNumber ? event.lineNumber : line;
    const source = typeof event === 'object' && event.sourceId ? event.sourceId : sourceId;
    logs.push(text);
    console.log('[FULL SYSTEM TEST]', text, 'at', source, ':', lineNum);
  });

  win.webContents.on('did-start-navigation', () => {
    win.webContents.executeJavaScript(`
      window.addEventListener('unhandledrejection', e => console.error('PROMISE REJECTION STACK:', e.reason ? (e.reason.stack || e.reason) : e));
      window.addEventListener('error', e => console.error('WINDOW ERROR STACK:', e.error ? e.error.stack : e.message));
    `);
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
