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
    this.skipBtn = document.getElementById('settings-skip-btn');
    this.soundSelect = document.getElementById('setting-sound');
    this.voiceModeSelect = document.getElementById('setting-voice-mode');
    this.wingsSelect = document.getElementById('setting-wings');
    this.charSelect = document.getElementById('setting-character');
    this.themeSelect = document.getElementById('setting-theme');
    this.geminiKeyInput = document.getElementById('setting-gemini-key');
    this.profileName = document.getElementById('profile-name');
    this.profileAge = document.getElementById('profile-age');
    this.profileGender = document.getElementById('profile-gender');
    this.profileDob = document.getElementById('profile-dob');
    this.profileBond = document.getElementById('profile-bond');
    this.profilePersona = document.getElementById('profile-persona');
    this.profileStyle = document.getElementById('profile-style');
    this.profileLanguage = document.getElementById('profile-language');
    this.profileVisualStyle = document.getElementById('profile-visual-style');
    this.profileHeading = document.getElementById('profile-setup-heading');

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
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', async () => {
        await this.panguAPI.setPreference('onboarding_complete', 'true');
        this.close();
      });
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
    const prefs = state.preferences || {};
    if (this.profileName) this.profileName.value = prefs.user_name || '';
    if (this.profileAge) this.profileAge.value = prefs.user_age || '';
    if (this.profileGender) this.profileGender.value = prefs.user_gender || '';
    if (this.profileDob) this.profileDob.value = prefs.user_dob || '';
    if (this.profileBond) this.profileBond.value = prefs.companion_bond || 'bestie';
    if (this.profilePersona) this.profilePersona.value = prefs.companion_presentation || 'neutral';
    if (this.profileStyle) this.profileStyle.value = prefs.conversation_style || 'friendly';
    if (this.profileLanguage) this.profileLanguage.value = prefs.language_preference || 'tanglish';
    if (this.profileVisualStyle) this.profileVisualStyle.value = prefs.visual_style || 'classic';
    if (this.profileHeading) this.profileHeading.textContent = state.firstRun ? "Let's set up your companion" : 'Your profile & companion style';
    if (this.skipBtn) this.skipBtn.style.display = state.firstRun ? '' : 'none';
    if (this.cancelBtn) this.cancelBtn.textContent = state.firstRun ? 'Close' : 'Cancel';

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
    const userName = this.profileName ? this.profileName.value.trim().slice(0, 60) : '';
    const ageText = this.profileAge ? this.profileAge.value.trim() : '';
    const userAge = ageText === '' ? '' : Number(ageText);
    const userDob = this.profileDob ? this.profileDob.value : '';
    const userBond = this.profileBond ? this.profileBond.value : 'bestie';
    if (ageText && (!Number.isInteger(userAge) || userAge < 1 || userAge > 120)) {
      this.showSpeech('Age should be a whole number between 1 and 120, or leave it blank.');
      return;
    }
    if (userDob && (Number.isNaN(Date.parse(userDob)) || userDob > new Date().toISOString().slice(0, 10))) {
      this.showSpeech('Please check the date of birth, or leave it blank.');
      return;
    }

    if (this.panguAPI) {
      await this.panguAPI.setPreference('theme', selTheme);
      await this.panguAPI.setPreference('character', selChar);
      await this.panguAPI.setPreference('sound_enabled', selSound ? 'true' : 'false');
      await this.panguAPI.setPreference('voice_mode', selVoiceMode);
      await this.panguAPI.setPreference('celestial_wings', selWings ? 'true' : 'false');
      await this.panguAPI.setPreference('user_name', userName);
      await this.panguAPI.setPreference('user_age', userAge === '' ? '' : String(userAge));
      await this.panguAPI.setPreference('user_gender', this.profileGender ? this.profileGender.value : '');
      await this.panguAPI.setPreference('user_dob', userDob);
      await this.panguAPI.setPreference('companion_bond', userBond);
      await this.panguAPI.setPreference('companion_presentation', this.profilePersona ? this.profilePersona.value : 'neutral');
      await this.panguAPI.setPreference('conversation_style', this.profileStyle ? this.profileStyle.value : 'friendly');
      await this.panguAPI.setPreference('language_preference', this.profileLanguage ? this.profileLanguage.value : 'tanglish');
      await this.panguAPI.setPreference('visual_style', this.profileVisualStyle ? this.profileVisualStyle.value : 'classic');
      await this.panguAPI.setPreference('onboarding_complete', 'true');

      if (geminiKey && geminiKey.trim() !== '') {
        await this.panguAPI.saveApiKey('gemini', geminiKey.trim(), 'gemini-2.5-flash');
      }
    }

    this.onSettingsSaved({
      theme: selTheme,
      character: selChar,
      soundEnabled: selSound,
      voiceMode: selVoiceMode,
      wingsEnabled: selWings,
      userName,
      visualStyle: this.profileVisualStyle ? this.profileVisualStyle.value : 'classic',
      profile: {
        user_name: userName,
        user_age: userAge === '' ? '' : String(userAge),
        user_gender: this.profileGender ? this.profileGender.value : '',
        user_dob: userDob,
        companion_bond: userBond,
        companion_presentation: this.profilePersona ? this.profilePersona.value : 'neutral',
        conversation_style: this.profileStyle ? this.profileStyle.value : 'friendly',
        language_preference: this.profileLanguage ? this.profileLanguage.value : 'tanglish',
        visual_style: this.profileVisualStyle ? this.profileVisualStyle.value : 'classic',
        onboarding_complete: 'true'
      }
    });

    this.close();
    this.showSpeech(`Settings saved, ${userName || 'friend'}! ✨`);
  }
}
