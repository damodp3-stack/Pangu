/**
 * PANGU Voice Input Manager (Speech-to-Text)
 * Enables hands-free spoken queries to Pangu using standard SpeechRecognition API.
 */

export class VoiceInputManager {
  constructor(options = {}) {
    this.talkMicBtn = options.talkMicBtn;
    this.talkInput = options.talkInput;
    this.pangu = options.pangu;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.onTranscriptComplete = options.onTranscriptComplete || (() => {});
    this.openTalkPill = options.openTalkPill || (() => {});

    this.recognition = null;
    this.isListeningVoice = false;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListeningVoice = true;
      if (this.talkMicBtn) this.talkMicBtn.classList.add('active');
      if (this.pangu) this.pangu.setListening(true);
      if (this.soundFX) this.soundFX.playListening();
      if (this.talkInput) this.talkInput.placeholder = "Listening to your voice... 🎙️";
    };

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (this.talkInput) this.talkInput.value = transcript;
    };

    this.recognition.onerror = (e) => {
      console.warn('[STT] Speech recognition error:', e.error);
      this.stop();
    };

    this.recognition.onend = () => {
      this.stop();
      if (this.talkInput && this.talkInput.value.trim() !== '') {
        this.onTranscriptComplete(this.talkInput.value.trim());
      }
    };
  }

  start() {
    if (!this.recognition) {
      this.showSpeech("Voice recognition browser-la support aagala, machi!", 3500);
      return;
    }
    this.openTalkPill();
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[VoiceInput] Speech recognition already active:', e);
    }
  }

  stop() {
    this.isListeningVoice = false;
    if (this.talkMicBtn) this.talkMicBtn.classList.remove('active');
    if (this.pangu) this.pangu.setListening(false);
    if (this.talkInput) this.talkInput.placeholder = "Ask Pangu anything, da...";
    try {
      if (this.recognition) this.recognition.stop();
    } catch (e) {}
  }

  toggle() {
    if (this.isListeningVoice) {
      this.stop();
    } else {
      this.start();
    }
  }

  destroy() {
    this.stop();
  }
}
