/**
 * PANGU Multi-Monitor Display Manager
 * Discovers connected displays, spans the transparent desktop overlay,
 * and allows Pangu to leap between physical screens.
 */

export class DisplayManager {
  constructor(options = {}) {
    this.pangu = options.pangu;
    this.panguAPI = options.panguAPI;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.menuDisplay = options.menuDisplay;
    this.menuDisplayText = options.menuDisplayText;

    this.displays = [];
    this.currentDisplayIdx = 0;

    this.init();
  }

  async init() {
    await this.checkDisplays();
    this.bindEvents();
  }

  async checkDisplays() {
    try {
      if (!this.panguAPI) return;
      const info = await this.panguAPI.getDisplays();
      if (info && info.displays && info.displays.length > 0) {
        this.displays = info.displays;
        if (this.displays.length > 1 && this.menuDisplay) {
          this.menuDisplay.style.display = 'flex';
          this.updateDisplayMenuUI();
        }
      }
    } catch (e) {
      console.warn('[DisplayManager] Displays check failed:', e);
    }
  }

  bindEvents() {
    if (this.menuDisplay) {
      this.menuDisplay.addEventListener('click', () => {
        this.jumpToNextDisplay();
      });
    }

    if (this.panguAPI && this.panguAPI.onDisplaysUpdated) {
      this.panguAPI.onDisplaysUpdated((data) => {
        if (data && data.displays) {
          this.displays = data.displays;
          if (this.displays.length > 1 && this.menuDisplay) {
            this.menuDisplay.style.display = 'flex';
            this.updateDisplayMenuUI();
          }
          if (this.pangu) {
            this.pangu.updateScreenBounds(window.innerWidth, window.innerHeight);
          }
        }
      });
    }
  }

  updateDisplayMenuUI() {
    if (!this.menuDisplayText || this.displays.length <= 1) return;
    const nextIdx = (this.currentDisplayIdx + 1) % this.displays.length;
    this.menuDisplayText.textContent = `Jump to Monitor ${nextIdx + 1} (Tab)`;
  }

  jumpToNextDisplay() {
    if (this.displays.length <= 1) return;
    this.currentDisplayIdx = (this.currentDisplayIdx + 1) % this.displays.length;
    const target = this.displays[this.currentDisplayIdx];
    if (target && target.bounds && this.pangu) {
      this.pangu.moveToDisplay(target.bounds);
      this.showSpeech(`Jumped to Monitor ${this.currentDisplayIdx + 1}! 🖥️🐾`, 3500);
      this.updateDisplayMenuUI();
      if (this.soundFX) this.soundFX.playHappyChime();
    }
  }
}
