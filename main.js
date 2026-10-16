const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, desktopCapturer, safeStorage, shell } = require('electron');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
app.commandLine.appendSwitch('disable-features', 'Dawn,Graphite');
app.setPath('userData', path.join(__dirname, '.userData'));

const PanguMemory = require('./src/core/memory');
const PanguBrain = require('./src/core/brain');
const PetStateMachine = require('./src/core/pet_state');
const PrivacyManager = require('./src/core/privacy');

// Secure DPAPI Credential Helper
const cryptoHelper = {
  encrypt: (plainText) => {
    if (!plainText) return '';
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      try {
        return 'enc_dpapi:' + safeStorage.encryptString(plainText).toString('base64');
      } catch (err) {
        console.warn('[PanguMain] DPAPI encryption warning:', err.message);
        throw new Error('Secure API key storage is unavailable');
      }
    }
    throw new Error('Secure API key storage is unavailable');
  },
  decrypt: (storedText) => {
    if (!storedText) return '';
    if (storedText.startsWith('enc_dpapi:')) {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        try {
          const buf = Buffer.from(storedText.slice(10), 'base64');
          return safeStorage.decryptString(buf);
        } catch (err) {
          console.warn('[PanguMain] DPAPI decryption warning:', err.message);
          return '';
        }
      }
      console.warn('[PanguMain] DPAPI not available to decrypt key');
      return '';
    }
    return storedText; // Fallback legacy plaintext
  }
};

let mainWindow = null;
let tray = null;
let memory = null;
let brain = null;
let petState = null;
let privacy = null;

// Multi-Monitor Virtual Desktop Bounds Calculation
function getAllDisplaysBounds() {
  const displays = screen.getAllDisplays();
  if (!displays || displays.length === 0) {
    const primary = screen.getPrimaryDisplay();
    return primary ? primary.bounds : { x: 0, y: 0, width: 1920, height: 1080 };
  }

  let minX = displays[0].bounds.x;
  let minY = displays[0].bounds.y;
  let maxX = displays[0].bounds.x + displays[0].bounds.width;
  let maxY = displays[0].bounds.y + displays[0].bounds.height;

  for (let i = 1; i < displays.length; i++) {
    const b = displays[i].bounds;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function updateWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const newBounds = getAllDisplaysBounds();
  mainWindow.setBounds(newBounds);
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  sendToRenderer('screen:displays-updated', {
    bounds: newBounds,
    displays: displays.map((d, idx) => ({
      id: d.id,
      index: idx,
      bounds: d.bounds,
      isPrimary: d.id === primary.id
    }))
  });
}

function createWindow() {
  const bounds = getAllDisplaysBounds();

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'ui', 'index.html'));

  // Security Hardening: Never open untrusted external URLs in Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Line ${line}] ${message}`);
  });
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('did-fail-load:', code, desc);
  });

  // Initially pass all mouse events to the background so user can use apps & desktop
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Listen for display topology changes (monitors plugged, unplugged, DPI changes)
  screen.on('display-metrics-changed', updateWindowBounds);
  screen.on('display-added', updateWindowBounds);
  screen.on('display-removed', updateWindowBounds);

  // Emergency Panic shortcut: Ctrl + Shift + P
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (privacy) {
      const isPaused = privacy.toggleEmergencyPause();
      sendToRenderer('privacy:panic-toggled', isPaused);
    }
  });

  // Quick Screen Vision shortcut: Ctrl + Shift + S
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    sendToRenderer('companion:trigger-vision');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Mouse event pass-through IPC handler
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, options || { forward: true });
  }
});

// App lifecycle
app.whenReady().then(() => {
  // Initialize Core Systems with Windows DPAPI encryption
  const dbPath = path.join(__dirname, 'data', 'pangu_memory.db');
  memory = new PanguMemory(dbPath, cryptoHelper);
  brain = new PanguBrain(memory);

  petState = new PetStateMachine(
    memory, 
    (newState, prevState) => {
      sendToRenderer('pet:state-changed', { newState, prevState });
    },
    (levelData) => {
      sendToRenderer('pet:level-up', levelData);
    }
  );

  privacy = new PrivacyManager(memory, (isPaused) => {
    sendToRenderer('privacy:panic-toggled', isPaused);
  });

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (petState) petState.destroy();
  if (memory) memory.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function setupIpcHandlers() {
  // Chat IPC
  ipcMain.handle('chat:send', async (event, message) => {
    if (privacy && privacy.isPaused) {
      return { text: "Pangu is currently paused (Emergency Privacy Mode). Press Ctrl+Shift+P to resume!", action: "SLEEPY" };
    }

    if (typeof message !== 'string' || !message.trim()) {
      return { text: "Puriyala da machi, konjam clear-aa sollunga!", action: "CURIOUS" };
    }
    const cleanMsg = message.trim().slice(0, 2000);

    // Save user chat
    memory.addChatMessage('user', cleanMsg);

    // Generate AI response
    const result = await brain.generateResponse(cleanMsg);

    // Save Pangu chat
    memory.addChatMessage('pangu', result.text);

    // Trigger pet reaction
    if (result.action && petState) {
      petState.setState(result.action, 4000);
    }

    // Award friendship XP
    const xpRes = memory.addXp(15);
    if (xpRes.leveledUp) {
      sendToRenderer('pet:level-up', xpRes);
    }

    return result;
  });

  // Intelligent Multi-Monitor Screen Capture Helper
  async function captureActiveScreen() {
    try {
      const cursorPoint = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPoint) || screen.getPrimaryDisplay();
      const displays = screen.getAllDisplays();
      const displayIndex = displays.findIndex(d => d.id === currentDisplay.id);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1280, height: 720 }
      });
      if (sources && sources.length > 0) {
        const targetSource = (displayIndex >= 0 && displayIndex < sources.length) ? sources[displayIndex] : sources[0];
        return targetSource.thumbnail.toJPEG(82).toString('base64');
      }
      return null;
    } catch (err) {
      console.warn('[PanguMain] Screen capture failed:', err.message);
      return null;
    }
  }

  // Screen Capture IPC for Multimodal Vision (Strict Permission Gated)
  ipcMain.handle('screen:capture', async () => {
    if (!privacy || !privacy.canCaptureScreen()) {
      return null;
    }
    return await captureActiveScreen();
  });

  // Multimodal Screen Vision Chat IPC (Supports screen capture OR directly dropped images)
  ipcMain.handle('chat:send-vision', async (event, message, customB64 = null) => {
    if (!PrivacyManager.canUseScreenVision(privacy)) {
      if (privacy && privacy.isPaused) {
        return { text: "Pangu is paused (Emergency Privacy Mode). Press Ctrl+Shift+P to resume!", action: "SLEEPY" };
      }
      return {
        text: "Screen capture permission disabled in settings, da! Settings-la 'Screen Vision Permission' enable pannunga.",
        action: "CURIOUS"
      };
    }

    const imageB64 = customB64 || await captureActiveScreen();
    if (!imageB64) {
      return { text: "Screen capture eduka mudiyala da. Konjam screen permission check pannunga!", action: "CURIOUS" };
    }

    const query = typeof message === 'string' && message.trim() !== '' 
      ? message.trim().slice(0, 2000) 
      : "Screen-a check pannitu enna seiyanum nu sollu, da!";
    memory.addChatMessage('user', `[👀 Vision Look] ${query}`);

    const result = await brain.generateResponse(query, imageB64);
    memory.addChatMessage('pangu', result.text);

    if (result.action && petState) {
      petState.setState(result.action, 4000);
    }

    // Award friendship XP for vision query
    const xpRes = memory.addXp(25);
    if (xpRes.leveledUp) {
      sendToRenderer('pet:level-up', xpRes);
    }

    return result;
  });

  // Multi-Monitor Displays Information IPC
  ipcMain.handle('screen:displays', () => {
    const primary = screen.getPrimaryDisplay();
    return {
      bounds: getAllDisplaysBounds(),
      displays: screen.getAllDisplays().map((d, idx) => ({
        id: d.id,
        index: idx,
        bounds: d.bounds,
        isPrimary: d.id === primary.id
      }))
    };
  });

  ipcMain.handle('chat:history', () => {
    return memory.getRecentChatHistory(30);
  });

  ipcMain.handle('chat:clear', () => {
    memory.clearChatHistory();
    return true;
  });

  // Memory & Preferences IPC
  ipcMain.handle('memory:list', () => {
    return memory.getAllMemories();
  });

  ipcMain.handle('memory:add', (event, category, content) => {
    if (typeof category !== 'string' || typeof content !== 'string') return null;
    const cleanCat = category.trim().slice(0, 50);
    const cleanContent = content.trim().slice(0, 1000);
    if (!cleanCat || !cleanContent) return null;
    return memory.addMemory(cleanCat, cleanContent);
  });

  ipcMain.handle('memory:delete', (event, id) => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return false;
    memory.deleteMemory(parsedId);
    return true;
  });

  ipcMain.handle('preferences:get', () => {
    return memory.getAllPreferences();
  });

  const ALLOWED_PREFS = new Set([
    'user_name', 'theme', 'language_preference', 'sound_enabled',
    'activity_level', 'screen_permission', 'mic_permission', 'camera_permission',
    'character', 'voice_mode', 'celestial_wings'
  ]);

  ipcMain.handle('preferences:set', (event, key, value) => {
    if (typeof key !== 'string' || !ALLOWED_PREFS.has(key)) return false;
    if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') return false;
    const safeVal = String(value).slice(0, 500);
    memory.setPreference(key, safeVal);
    return true;
  });

  // Pet Care IPC
  ipcMain.handle('pet:stats', () => {
    return memory.getPetStats();
  });

  ipcMain.handle('pet:feed', () => {
    return petState.feed();
  });

  ipcMain.handle('pet:play', () => {
    return petState.play();
  });

  ipcMain.handle('pet:cuddle', () => {
    return petState.cuddle();
  });

  ipcMain.handle('pet:toggleHouse', () => {
    return petState.toggleHouse();
  });

  ipcMain.handle('pet:add-xp', (event, amount) => {
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > 1000) {
      return memory.getPetStats();
    }
    const res = memory.addXp(amount);
    if (res.leveledUp) {
      sendToRenderer('pet:level-up', res);
    }
    return res;
  });

  ipcMain.handle('pet:set-aura', (event, aura) => {
    const validAuras = new Set(['fire', 'thunder', 'frost', 'void']);
    const safeAura = validAuras.has(aura) ? aura : 'fire';
    return memory.setElementalAura(safeAura);
  });

  // API Keys IPC
  ipcMain.handle('api-keys:get', () => {
    return memory.getAllApiKeys();
  });

  ipcMain.handle('api-keys:save', (event, provider, key, model) => {
    const validProviders = new Set(['gemini', 'openai', 'groq']);
    if (!validProviders.has(provider)) return false;
    if (typeof key !== 'string' || key.length > 512) return false;
    const safeModel = typeof model === 'string' ? model.slice(0, 100) : '';
    try {
      memory.setApiKey(provider, key.trim(), safeModel);
      return true;
    } catch (err) {
      console.warn('[PanguMain] API key could not be stored securely:', err.message);
      return false;
    }
  });

  // Privacy IPC
  ipcMain.handle('privacy:status', () => {
    return privacy.getPrivacyStatus();
  });

  ipcMain.handle('privacy:togglePanic', () => {
    return privacy.toggleEmergencyPause();
  });

  ipcMain.handle('privacy:setPermission', (event, key, allowed) => {
    const validPermissionKeys = new Set(['screen_permission', 'mic_permission', 'camera_permission']);
    if (!validPermissionKeys.has(key)) return privacy.getPrivacyStatus();
    return privacy.setPermission(key, !!allowed);
  });

  ipcMain.handle('privacy:wipe', () => {
    return privacy.wipeAllData();
  });

  // App quit
  ipcMain.on('app:quit', () => {
    app.quit();
  });
}
