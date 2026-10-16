class PrivacyManager {
  static canUseScreenVision(privacyManager) {
    return Boolean(
      privacyManager &&
      typeof privacyManager.canCaptureScreen === 'function' &&
      privacyManager.canCaptureScreen()
    );
  }

  constructor(memory, onPanicToggle = () => {}) {
    this.memory = memory;
    this.onPanicToggle = onPanicToggle;
    this.isPaused = false; // Emergency pause state
  }

  toggleEmergencyPause() {
    this.isPaused = !this.isPaused;
    this.onPanicToggle(this.isPaused);
    return this.isPaused;
  }

  getPrivacyStatus() {
    const prefs = this.memory.getAllPreferences();
    return {
      isPaused: this.isPaused,
      screenPermission: prefs.screen_permission === 'true',
      micPermission: prefs.mic_permission === 'true',
      cameraPermission: prefs.camera_permission === 'true',
      cloudAiEnabled: true
    };
  }

  setPermission(permissionKey, isAllowed) {
    this.memory.setPreference(permissionKey, isAllowed ? 'true' : 'false');
    return this.getPrivacyStatus();
  }

  canCaptureScreen() {
    if (this.isPaused) return false;
    const prefs = this.memory.getAllPreferences();
    return prefs.screen_permission === 'true';
  }

  wipeAllData() {
    this.memory.clearChatHistory();
    // Mark memories as inactive
    const memories = this.memory.getAllMemories();
    for (const m of memories) {
      this.memory.deleteMemory(m.id);
    }
    if (typeof this.memory.clearAllApiKeys === 'function') {
      this.memory.clearAllApiKeys();
    }
    return { success: true, message: 'All local chat history, memories, and stored credentials have been wiped.' };
  }
}

module.exports = PrivacyManager;
