/**
 * PANGU Speech Engine (Natural Typewriter, Spoken TTS, & Acoustic Vocalizer)
 * Synchronizes character-by-character dialogue with 3D lip-sync, dynamic emotion,
 * and conversational pauses on punctuation.
 */

export class SpeechEngine {
  constructor(options = {}) {
    this.speechBubble = options.speechBubble;
    this.pangu = options.pangu;
    this.soundFX = options.soundFX || window.soundFX;
    this.voiceMode = options.voiceMode || 'both'; // 'acoustic', 'tts', 'both'
    this.soundEnabled = options.soundEnabled !== false;

    this.speechTimeout = null;
    this.speechTypewriterTimeout = null;
    this.cachedVoices = [];

    this.initVoices();
  }

  initVoices() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.populateVoices();
      window.speechSynthesis.onvoiceschanged = () => this.populateVoices();
    }
  }

  populateVoices() {
    if (window.speechSynthesis) {
      this.cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  getBestVoice() {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      this.populateVoices();
    }
    if (!this.cachedVoices || this.cachedVoices.length === 0) return null;

    // Prefer cheerful, natural English or Indian English voices
    const preferredIn = this.cachedVoices.find(
      v => (v.lang === 'en-IN' || v.lang.startsWith('en_IN')) && !v.name.includes('Desktop')
    );
    if (preferredIn) return preferredIn;

    const naturalEn = this.cachedVoices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'))
    );
    if (naturalEn) return naturalEn;

    const anyEn = this.cachedVoices.find(v => v.lang.startsWith('en'));
    return anyEn || this.cachedVoices[0];
  }

  setVoiceMode(mode) {
    this.voiceMode = mode;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
  }

  /**
   * Typewriter Streaming Speech Bubble
   * @param {string} text - Message to type out
   * @param {number} customDuration - Duration in ms to hold after typing (0 = auto-calculate)
   * @param {string} emotion - 'normal', 'happy', 'excited', 'sleepy'
   */
  showSpeech(text, customDuration = 0, emotion = 'normal') {
    if (!this.speechBubble) return;

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    if (this.speechTypewriterTimeout) clearTimeout(this.speechTypewriterTimeout);

    this.speechBubble.textContent = '';
    this.speechBubble.classList.add('visible');

    const chars = Array.from(text);
    let charIndex = 0;

    // Approximate typing duration plus comfortable reading time
    const typeTimeEst = chars.length * 28;
    const readTime = Math.max(3500, chars.length * 55);
    const totalSpeakingSec = (typeTimeEst + Math.min(2500, readTime * 0.5)) / 1000;

    // Trigger 3D lip-sync articulation & eye contact
    if (this.pangu) {
      this.pangu.startSpeaking(totalSpeakingSec, emotion);
    }

    // Trigger natural spoken voice (TTS) if enabled
    if (window.speechSynthesis && (this.voiceMode === 'tts' || this.voiceMode === 'both') && this.soundEnabled) {
      try {
        window.speechSynthesis.cancel();
        const cleanSpeech = text
          .replace(/\[ACTION:[A-Z_]+\]/g, '')
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .trim();
        if (cleanSpeech) {
          const utterance = new SpeechSynthesisUtterance(cleanSpeech);
          const bestVoice = this.getBestVoice();
          if (bestVoice) utterance.voice = bestVoice;
          utterance.rate = 1.05;
          utterance.pitch = 1.15;
          window.speechSynthesis.speak(utterance);
        }
      } catch (ttsErr) {
        console.warn('[SpeechEngine] TTS error:', ttsErr);
      }
    }

    const typeNextChar = () => {
      if (charIndex < chars.length) {
        const char = chars[charIndex];
        this.speechBubble.textContent += char;
        charIndex++;

        // Sync cute animal companion vocalization
        if (this.soundFX && char.trim() !== '' && (this.voiceMode === 'acoustic' || this.voiceMode === 'both') && this.soundEnabled) {
          this.soundFX.playSpeechSyllable(char, emotion);
        }

        // Conversational pauses on punctuation marks
        let delay = 22;
        if (char === ',' || char === ';') delay = 120;
        else if (char === '.' || char === '!' || char === '?') delay = 240;

        this.speechTypewriterTimeout = setTimeout(typeNextChar, delay);
      } else {
        // Hold dialogue bubble for reading, then smoothly close
        const holdTime = customDuration > 0 ? customDuration : readTime;
        this.speechTimeout = setTimeout(() => {
          this.hideSpeech();
        }, holdTime);
      }
    };

    typeNextChar();
  }

  hideSpeech() {
    if (!this.speechBubble) return;
    this.speechBubble.classList.remove('visible');
    if (this.pangu) {
      this.pangu.stopSpeaking();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  syncCoordinates(screenX, screenY, isFocusActive = false) {
    if (!this.speechBubble) return;
    const isNearTop = screenY < 200;
    this.speechBubble.style.left = `${screenX}px`;
    if (isNearTop) {
      this.speechBubble.classList.add('flipped-down');
      this.speechBubble.style.top = `${screenY + 65}px`;
    } else {
      this.speechBubble.classList.remove('flipped-down');
      const offsetTop = isFocusActive ? 135 : 75;
      this.speechBubble.style.top = `${screenY - offsetTop}px`;
    }
  }

  destroy() {
    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    if (this.speechTypewriterTimeout) clearTimeout(this.speechTypewriterTimeout);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
}
