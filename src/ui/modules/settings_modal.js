/**
 * PANGU Settings Modal Controller
 * Manages user preferences, mascot models, audio toggles, and API keys.
 */

export class SettingsModal {
  constructor(options = {}) {
    this.modalEl = options.modalEl;
    this.panguAPI = options.panguAPI;
    this.pangu = options.pangu;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.onSettingsSaved = options.onSettingsSaved || (() => {});

    // Elements
    this.closeBtn = document.getElementById('settings-close-btn');
    this.cancelBtn = document.getElementById('settings-cancel-btn');
    this.saveBtn = document.getElementById('settings-save-btn');
    this.soundSelect = document.getElementById('setting-sound');
    this.voiceModeSelect = document.getElementById('setting-voice-mode');
    this.wingsSelect = document.getElementById('setting-wings');
    this.charSelect = document.getElementById('setting-character');
    this.themeSelect = document.getElementById('setting-theme');
    this.geminiKeyInput = document.getElementById('setting-gemini-key');

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.close());
    }
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.save());
    }
  }

  async open(state = {}) {
    if (!this.modalEl) return;
    if (this.panguAPI) this.panguAPI.setIgnoreMouseEvents(false);

    try {
      const keys = (await this.panguAPI.getApiKeys()) || [];
      const gemini = keys.find(k => k.provider === 'gemini');
      if (gemini && this.geminiKeyInput) {
        this.geminiKeyInput.placeholder = gemini.masked_key || 'AIzaSy...';
      }
    } catch (e) {
      console.warn('[SettingsModal] Failed to load keys:', e);
    }

    if (this.charSelect && state.currentCharacter) this.charSelect.value = state.currentCharacter;
    if (this.soundSelect && state.soundEnabled !== undefined) this.soundSelect.value = state.soundEnabled ? 'true' : 'false';
    if (this.voiceModeSelect && state.voiceMode) this.voiceModeSelect.value = state.voiceMode;
    if (this.wingsSelect && state.wingsEnabled !== undefined) this.wingsSelect.value = state.wingsEnabled ? 'true' : 'false';
    if (this.themeSelect && state.currentTheme) this.themeSelect.value = state.currentTheme;

    this.modalEl.classList.add('open');
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
    if (this.panguAPI) {
      this.panguAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  async save() {
    const selTheme = this.themeSelect ? this.themeSelect.value : 'dark';
    const selChar = this.charSelect ? this.charSelect.value : 'sellsword_fox';
    const selSound = this.soundSelect ? this.soundSelect.value === 'true' : true;
    const selVoiceMode = this.voiceModeSelect ? this.voiceModeSelect.value : 'both';
    const selWings = this.wingsSelect ? this.wingsSelect.value === 'true' : false;
    const geminiKey = this.geminiKeyInput ? this.geminiKeyInput.value : '';

    if (this.panguAPI) {
      await this.panguAPI.setPreference('theme', selTheme);
      await this.panguAPI.setPreference('character', selChar);
      await this.panguAPI.setPreference('sound_enabled', selSound ? 'true' : 'false');
      await this.panguAPI.setPreference('voice_mode', selVoiceMode);
      await this.panguAPI.setPreference('celestial_wings', selWings ? 'true' : 'false');

      if (geminiKey && geminiKey.trim() !== '') {
        await this.panguAPI.saveApiKey('gemini', geminiKey.trim(), 'gemini-2.5-flash');
      }
    }

    this.onSettingsSaved({
      theme: selTheme,
      character: selChar,
      soundEnabled: selSound,
      voiceMode: selVoiceMode,
      wingsEnabled: selWings
    });

    this.close();
    this.showSpeech("Settings updated, da! ✨");
  }
}
