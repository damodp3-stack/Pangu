/**
 * PANGU Pomodoro Focus Buddy
 * 25-minute deep work companion timer with screen presence, XP rewards, and fanfare.
 */

export class PomodoroManager {
  constructor(options = {}) {
    this.focusPill = options.focusPill;
    this.focusTimeDisplay = options.focusTimeDisplay;
    this.focusStopBtn = options.focusStopBtn;
    this.menuFocusText = options.menuFocusText;
    this.pangu = options.pangu;
    this.panguAPI = options.panguAPI;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.onCompleted = options.onCompleted || (() => {});

    this.focusInterval = null;
    this.focusSecondsRemaining = 25 * 60;
    this.isFocusActive = false;

    this.bindEvents();
  }

  bindEvents() {
    if (this.focusStopBtn) {
      this.focusStopBtn.addEventListener('click', () => {
        this.stopSession(false);
      });
    }
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  startSession(durationMinutes = 25) {
    this.isFocusActive = true;
    this.focusSecondsRemaining = durationMinutes * 60;

    if (this.focusPill) this.focusPill.classList.add('visible');
    if (this.focusTimeDisplay) this.focusTimeDisplay.textContent = this.formatTime(this.focusSecondsRemaining);
    if (this.menuFocusText) this.menuFocusText.textContent = `Focus Buddy: Active (${durationMinutes}m)`;

    this.showSpeech(`Focus Session Activated! 🍅 ${durationMinutes} mins deep work start pannuvom da. Naan un desk guard! 🛡️⚡`, 4500, 'excited');
    if (this.pangu) this.pangu.triggerHabit('SURVEY_DESKTOP');
    if (this.soundFX) this.soundFX.playHappyChime();

    if (this.focusInterval) clearInterval(this.focusInterval);
    this.focusInterval = setInterval(() => {
      this.focusSecondsRemaining--;
      if (this.focusTimeDisplay) this.focusTimeDisplay.textContent = this.formatTime(this.focusSecondsRemaining);

      if (this.focusSecondsRemaining <= 0) {
        this.stopSession(true);
      }
    }, 1000);
  }

  stopSession(completed = false) {
    if (this.focusInterval) clearInterval(this.focusInterval);
    this.focusInterval = null;
    this.isFocusActive = false;

    if (this.focusPill) this.focusPill.classList.remove('visible');
    if (this.menuFocusText) this.menuFocusText.textContent = "Focus Buddy: 25m Pomodoro";

    if (completed) {
      if (this.pangu) this.pangu.reactCelebrate();
      if (this.soundFX) this.soundFX.playHappyChime();
      if (this.panguAPI) this.panguAPI.addXp(50);
      this.showSpeech("🍅 FOCUS GOAL COMPLETED! 25 mins sema hard work machi! +50 XP gained! 5 mins break eduthuko! ☕✨", 6500, 'excited');
      this.onCompleted();
    } else {
      this.showSpeech("Focus session ended. Whenever you're ready, let's start again da! 🐾", 3000, 'normal');
    }
  }

  toggle() {
    if (this.isFocusActive) {
      this.stopSession(false);
    } else {
      this.startSession();
    }
  }

  syncCoordinates(screenX, screenY) {
    if (this.focusPill && this.focusPill.classList.contains('visible')) {
      this.focusPill.style.left = `${screenX}px`;
      this.focusPill.style.top = `${screenY - 85}px`;
    }
  }

  destroy() {
    if (this.focusInterval) clearInterval(this.focusInterval);
  }
}
