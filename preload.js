const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panguAPI', {
  // Mouse click-through control
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),

  // Chat & Brain
  sendMessage: (message) => ipcRenderer.invoke('chat:send', message),
  sendVisionMessage: (message, customB64) => ipcRenderer.invoke('chat:send-vision', message, customB64),
  captureScreen: () => ipcRenderer.invoke('screen:capture'),
  onTriggerVision: (callback) => ipcRenderer.on('companion:trigger-vision', () => callback()),
  getChatHistory: () => ipcRenderer.invoke('chat:history'),
  clearChatHistory: () => ipcRenderer.invoke('chat:clear'),

  // Memory & Preferences
  getMemories: () => ipcRenderer.invoke('memory:list'),
  addMemory: (category, content) => ipcRenderer.invoke('memory:add', category, content),
  deleteMemory: (id) => ipcRenderer.invoke('memory:delete', id),
  getPreferences: () => ipcRenderer.invoke('preferences:get'),
  setPreference: (key, value) => ipcRenderer.invoke('preferences:set', key, value),

  // Pet Care & State & RPG Progression
  getPetStats: () => ipcRenderer.invoke('pet:stats'),
  feedPet: () => ipcRenderer.invoke('pet:feed'),
  playPet: () => ipcRenderer.invoke('pet:play'),
  cuddlePet: () => ipcRenderer.invoke('pet:cuddle'),
  toggleHouse: () => ipcRenderer.invoke('pet:toggleHouse'),
  addXp: (amount) => ipcRenderer.invoke('pet:add-xp', amount),
  setElementalAura: (aura) => ipcRenderer.invoke('pet:set-aura', aura),
  onPetStateChange: (callback) => ipcRenderer.on('pet:state-changed', (event, data) => callback(data)),
  onLevelUp: (callback) => ipcRenderer.on('pet:level-up', (event, data) => callback(data)),

  // Settings & API Keys
  getApiKeys: () => ipcRenderer.invoke('api-keys:get'),
  saveApiKey: (provider, key, model) => ipcRenderer.invoke('api-keys:save', provider, key, model),

  // Privacy & Panic
  getPrivacyStatus: () => ipcRenderer.invoke('privacy:status'),
  togglePanic: () => ipcRenderer.invoke('privacy:togglePanic'),
  setPermission: (key, allowed) => ipcRenderer.invoke('privacy:setPermission', key, allowed),
  wipeData: () => ipcRenderer.invoke('privacy:wipe'),
  onPanicToggle: (callback) => ipcRenderer.on('privacy:panic-toggled', (event, isPaused) => callback(isPaused)),

  // Multi-Monitor Displays
  getDisplays: () => ipcRenderer.invoke('screen:displays'),
  onDisplaysUpdated: (callback) => ipcRenderer.on('screen:displays-updated', (event, data) => callback(data)),

  // System Controls
  closeApp: () => ipcRenderer.send('app:quit')
});
