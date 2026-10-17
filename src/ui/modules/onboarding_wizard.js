/**
 * PANGU Companion-Led Onboarding Wizard
 * Guides the user through a warm, interactive conversation with Pangu on first launch.
 */

export class OnboardingWizard {
  constructor(options = {}) {
    this.wizardEl = options.wizardEl;
    this.panguAPI = options.panguAPI;
    this.pangu = options.pangu;
    this.speechEngine = options.speechEngine;
    this.soundFX = options.soundFX || window.soundFX;
    this.onComplete = options.onComplete || (() => {});

    this.currentStep = 1;
    this.totalSteps = 6;

    this.formData = {
      user_name: '',
      user_dob: '',
      user_age: '',
      user_gender: 'female',
      companion_bond: 'sister',
      visual_style: 'celestial_garden',
      character: 'fox',
      language_preference: 'tanglish',
      gemini_key: ''
    };

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.stepContainer = document.getElementById('onboard-steps-container');
    this.prevBtn = document.getElementById('onboard-prev-btn');
    this.nextBtn = document.getElementById('onboard-next-btn');
    this.skipBtn = document.getElementById('onboard-skip-btn');
    this.stepIndicator = document.getElementById('onboard-step-indicator');
    this.companionSpeech = document.getElementById('onboard-companion-speech');
  }

  bindEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.handleNext());
    }
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.handlePrev());
    }
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.handleSkip());
    }

    // Name input Enter key
    const nameInput = document.getElementById('onboard-name-input');
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleNext();
      });
    }

    // DOB change -> auto-calculate age
    const dobInput = document.getElementById('onboard-dob-input');
    if (dobInput) {
      dobInput.addEventListener('change', () => {
        const val = dobInput.value;
        if (val) {
          const birthDate = new Date(`${val}T00:00:00`);
          if (!Number.isNaN(birthDate.getTime())) {
            const now = new Date();
            let age = now.getFullYear() - birthDate.getFullYear();
            if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
              age -= 1;
            }
            if (age >= 0 && age <= 120) {
              this.formData.user_age = String(age);
              const ageDisplay = document.getElementById('onboard-age-display');
              if (ageDisplay) ageDisplay.textContent = `Age: ${age} years old`;
            }
          }
        }
      });
    }

    // Interactive card selectors
    this.setupCardSelection('gender-card', (val) => {
      this.formData.user_gender = val;
      // Auto-tailor recommendation for Female
      if (val === 'female' || val === 'woman') {
        this.formData.companion_bond = 'sister';
        this.formData.visual_style = 'celestial_garden';
        this.updateCardUI('bond-card', 'sister');
        this.updateCardUI('atmosphere-card', 'celestial_garden');
      } else if (val === 'male' || val === 'man') {
        this.formData.companion_bond = 'bestie';
        this.updateCardUI('bond-card', 'bestie');
      }
    });

    this.setupCardSelection('bond-card', (val) => {
      this.formData.companion_bond = val;
    });

    this.setupCardSelection('atmosphere-card', (val) => {
      this.formData.visual_style = val;
      if (this.pangu) {
        this.pangu.setVisualStyle(val);
      }
    });

    this.setupCardSelection('mascot-card', (val) => {
      this.formData.character = val;
      if (this.pangu) {
        this.pangu.setCharacter(val);
      }
    });
  }

  setupCardSelection(className, callback) {
    const cards = document.querySelectorAll(`.${className}`);
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const val = card.dataset.value;
        if (val && callback) callback(val);
        if (this.soundFX) this.soundFX.playHappyChime();
      });
    });
  }

  updateCardUI(className, value) {
    const cards = document.querySelectorAll(`.${className}`);
    cards.forEach((card) => {
      if (card.dataset.value === value) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  open() {
    if (!this.wizardEl) return;
    if (this.panguAPI) this.panguAPI.setIgnoreMouseEvents(false);
    this.currentStep = 1;
    this.renderStep(1);
    this.wizardEl.classList.add('open');

    if (this.pangu) {
      this.pangu.reactCurious();
    }
    if (this.soundFX) {
      this.soundFX.playHappyChime();
    }
  }

  close() {
    if (!this.wizardEl) return;
    this.wizardEl.classList.remove('open');
    if (this.panguAPI) {
      this.panguAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  renderStep(step) {
    this.currentStep = step;

    // Hide all step slides
    for (let i = 1; i <= this.totalSteps; i++) {
      const el = document.getElementById(`onboard-step-${i}`);
      if (el) el.style.display = i === step ? 'block' : 'none';
    }

    if (this.stepIndicator) {
      this.stepIndicator.textContent = `Step ${step} of ${this.totalSteps}`;
    }

    if (this.prevBtn) {
      this.prevBtn.style.display = step === 1 ? 'none' : 'block';
    }

    if (this.nextBtn) {
      this.nextBtn.textContent = step === this.totalSteps ? '✨ Finish & Wake Pangu!' : 'Next ➔';
    }

    // Companion Dialogues & Gestures per step
    const stepPrompts = {
      1: {
        speech: "Hi! I'm PANGU, your 3D AI desktop companion! Enna unga personal best friend-aa vechukkalaam! What's your name, da? ♡",
        action: 'HAPPY'
      },
      2: {
        speech: `Nice to meet you, ${this.formData.user_name || 'friend'}! When is your birthday? I'll celebrate your special day with cute flips & treats! 🎂🎉`,
        action: 'EXCITED'
      },
      3: {
        speech: "How should I address you? Choose your profile so I can speak with you in the most caring, natural way! 🌸",
        action: 'CURIOUS'
      },
      4: {
        speech: "How would you like our companion relationship to feel? I can be your caring sister, loyal bestie, or cuddly pet! ♡",
        action: 'LOVE'
      },
      5: {
        speech: "Let's choose our 3D Atmosphere! Celestial Garden surrounds us with 3D butterflies, songbirds & drifting Sakura petals! 🦋🌸",
        action: 'CELEBRATE'
      },
      6: {
        speech: "Choose your favorite mascot and preferred language! You can also paste a free Gemini API key or use offline mode! ⚡",
        action: 'EXCITED'
      }
    };

    const cur = stepPrompts[step];
    if (cur && this.companionSpeech) {
      this.companionSpeech.textContent = cur.speech;
    }

    if (this.pangu) {
      if (cur.action === 'HAPPY') this.pangu.reactTouch();
      else if (cur.action === 'EXCITED') this.pangu.jump();
      else if (cur.action === 'LOVE') this.pangu.reactLove();
      else if (cur.action === 'CELEBRATE') this.pangu.playSomersault();
      else if (cur.action === 'CURIOUS') this.pangu.reactCurious();
    }
  }

  handleNext() {
    // Collect step data
    if (this.currentStep === 1) {
      const nameInput = document.getElementById('onboard-name-input');
      const name = nameInput ? nameInput.value.trim() : '';
      this.formData.user_name = name || 'Friend';
    } else if (this.currentStep === 2) {
      const dobInput = document.getElementById('onboard-dob-input');
      if (dobInput && dobInput.value) {
        this.formData.user_dob = dobInput.value;
      }
    } else if (this.currentStep === 6) {
      const keyInput = document.getElementById('onboard-gemini-key');
      if (keyInput && keyInput.value) {
        this.formData.gemini_key = keyInput.value.trim();
      }
      const langSelect = document.getElementById('onboard-lang-select');
      if (langSelect) {
        this.formData.language_preference = langSelect.value;
      }
      this.completeSetup();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      if (this.soundFX) this.soundFX.playHappyChime();
      this.renderStep(this.currentStep + 1);
    }
  }

  handlePrev() {
    if (this.currentStep > 1) {
      this.renderStep(this.currentStep - 1);
    }
  }

  async handleSkip() {
    this.formData.user_name = this.formData.user_name || 'Friend';
    await this.completeSetup();
  }

  async completeSetup() {
    const data = this.formData;
    const name = data.user_name || 'Friend';

    if (this.panguAPI) {
      await this.panguAPI.setPreference('user_name', name);
      await this.panguAPI.setPreference('user_gender', data.user_gender);
      await this.panguAPI.setPreference('user_dob', data.user_dob);
      await this.panguAPI.setPreference('user_age', data.user_age);
      await this.panguAPI.setPreference('companion_bond', data.companion_bond);
      await this.panguAPI.setPreference('visual_style', data.visual_style);
      await this.panguAPI.setPreference('character', data.character);
      await this.panguAPI.setPreference('language_preference', data.language_preference);
      await this.panguAPI.setPreference('onboarding_complete', 'true');

      if (data.gemini_key) {
        await this.panguAPI.saveApiKey('gemini', data.gemini_key, 'gemini-2.5-flash');
      }

      // Add Memory for companion brain
      await this.panguAPI.addMemory('profile', `Name: ${name}, Gender: ${data.user_gender}, Birthday: ${data.user_dob || 'not set'}, Bond: ${data.companion_bond}`);
    }

    // Apply 3D changes immediately
    if (this.pangu) {
      this.pangu.setCharacter(data.character);
      this.pangu.setVisualStyle(data.visual_style);
      this.pangu.playSomersault();
      this.pangu.spawnParticle('heart', 15);
      this.pangu.spawnParticle('star', 20);
    }

    if (this.soundFX) {
      this.soundFX.playBurst();
    }

    this.close();

    // Personalized Welcome Greeting
    let welcomeGreeting = `Yay ${name}! Everything is set up! Let's build something amazing together! ♡`;
    if (data.user_gender === 'female' || data.user_gender === 'woman') {
      const term = data.companion_bond === 'sister' ? `${name} thangom` : `${name} sis`;
      welcomeGreeting = `Yay ${term}! Everything is set up! Un koodave naan iruppen, daily jolly-aa kalakkalaam! ♡ 🌸✨`;
    } else if (data.user_gender === 'male' || data.user_gender === 'man') {
      welcomeGreeting = `Super ${name} machi! Everything is set up! Let's conquer big dreams together, bro! ⚡🐾`;
    }

    if (this.speechEngine) {
      this.speechEngine.showSpeech(welcomeGreeting, 6000, 'excited');
    }

    if (this.onComplete) {
      this.onComplete(data);
    }
  }
}
