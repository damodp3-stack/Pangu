/**
 * PANGU Menu & RPG Progression Manager
 * Controls the floating radial menu, level/XP badges, elemental auras, and mascot transforms.
 */

export class MenuManager {
  constructor(options = {}) {
    this.radialMenu = options.radialMenu;
    this.pangu = options.pangu;
    this.panguAPI = options.panguAPI;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.openTalkPill = options.openTalkPill || (() => {});
    this.openSettings = options.openSettings || (() => {});
    this.toggleSound = options.toggleSound || (() => {});
    this.toggleTheme = options.toggleTheme || (() => {});
    this.toggleWings = options.toggleWings || (() => {});

    // Badges & UI targets
    this.rpgLevelBadge = document.getElementById('rpg-level-badge');
    this.rpgTitleBadge = document.getElementById('rpg-title-badge');
    this.rpgBarFill = document.getElementById('rpg-bar-fill');
    this.rpgXpText = document.getElementById('rpg-xp-text');
    this.menuAura = document.getElementById('menu-aura');
    this.menuAuraIcon = document.getElementById('menu-aura-icon');
    this.menuAuraText = document.getElementById('menu-aura-text');
    this.charIcon = document.getElementById('menu-char-icon');
    this.charText = document.getElementById('menu-char-text');
    this.themeIcon = document.getElementById('menu-theme-icon');
    this.themeText = document.getElementById('menu-theme-text');
    this.soundIcon = document.getElementById('menu-sound-icon');
    this.soundText = document.getElementById('menu-sound-text');
    this.wingsIcon = document.getElementById('menu-wings-icon');
    this.wingsText = document.getElementById('menu-wings-text');
    this.gardenIcon = document.getElementById('menu-garden-icon');
    this.gardenText = document.getElementById('menu-garden-text');
    this.roamText = document.getElementById('menu-roam-text');
    this.sleepIcon = document.getElementById('menu-sleep-icon');
    this.sleepText = document.getElementById('menu-sleep-text');

    this.currentCharacter = options.currentCharacter || 'sellsword_fox';
    this.currentTheme = options.currentTheme || 'dark';

    this.bindEvents();
    this.bindListeners();
  }

  bindEvents() {
    // Menu: Talk
    const menuTalk = document.getElementById('menu-talk');
    if (menuTalk) menuTalk.addEventListener('click', () => { this.close(); this.openTalkPill(); });

    // Menu: Somersault Flip Skill
    const menuPlay = document.getElementById('menu-play');
    if (menuPlay) {
      menuPlay.addEventListener('click', () => {
        this.close();
        if (this.pangu) this.pangu.playSomersault();
        this.showSpeech("Wheeeee! Check out my 3D backflip, Damo! 🤸‍♂️✨");
      });
    }

    // Menu: Elemental Burst
    const menuBurst = document.getElementById('menu-burst');
    if (menuBurst) {
      menuBurst.addEventListener('click', () => {
        this.close();
        if (this.pangu) this.pangu.elementalBurst();
        this.showSpeech(this.currentTheme === 'dark' ? "🔥 Fire Nova Burst! Blazing energy unleashed, machi!" : "✨ Celestial Frost Burst! Cosmic stardust wave, da!");
      });
    }

    // Menu: Roam Toggle
    const menuRoam = document.getElementById('menu-roam');
    if (menuRoam) {
      menuRoam.addEventListener('click', () => {
        this.close();
        if (!this.pangu) return;
        this.pangu.isRoaming = !this.pangu.isRoaming;
        if (this.roamText) this.roamText.textContent = this.pangu.isRoaming ? "Roam Desktop: ON" : "Roam Desktop: OFF";
        if (this.pangu.isRoaming) {
          this.showSpeech("Roaming around desktop, machi! 🐾");
          const target = Math.max(120, Math.min(window.innerWidth - 120, this.pangu.screenX + (Math.random() - 0.5) * 400));
          this.pangu.walkTo(target);
        } else {
          this.showSpeech("Staying right here beside you, Damo! 🐾");
        }
        if (this.soundFX) this.soundFX.playHappyChime();
      });
    }

    // Menu: Celestial Wings
    const menuWings = document.getElementById('menu-wings');
    if (menuWings) {
      menuWings.addEventListener('click', () => {
        this.close();
        this.toggleWings();
      });
    }

    // Menu: 3D Garden (Butterflies, Birds & Sakura Petals)
    const menuGarden = document.getElementById('menu-garden');
    if (menuGarden) {
      menuGarden.addEventListener('click', async () => {
        this.close();
        if (!this.pangu) return;
        const nextStyle = this.pangu.toggleGarden();
        const isGarden = nextStyle === 'celestial_garden';
        if (this.panguAPI) await this.panguAPI.setPreference('visual_style', nextStyle);
        this.updateGardenUI(isGarden);
        if (isGarden) {
          this.showSpeech("3D Garden activated! 🌸 Butterflies, birds & sakura blossoms are here! ♡", 4500, 'excited');
          if (this.soundFX) this.soundFX.playHappyChime();
        } else {
          this.showSpeech("Classic companion mode active! 🐾", 3000);
        }
      });
    }

    // Menu: Sound Toggle
    const menuSound = document.getElementById('menu-sound');
    if (menuSound) {
      menuSound.addEventListener('click', () => {
        this.close();
        this.toggleSound();
      });
    }

    // Menu: Feed Treat
    const menuFeed = document.getElementById('menu-feed');
    if (menuFeed) {
      menuFeed.addEventListener('click', async () => {
        this.close();
        if (this.panguAPI) await this.panguAPI.feedPet();
        if (this.pangu) this.pangu.feed();
        this.refreshPetRpgUI();
        this.showSpeech("Yummy! Romba thanks da, enakku nalla energy vanthuruchu! 🍗✨");
      });
    }

    // Menu: Sleep / Wake
    const menuSleep = document.getElementById('menu-sleep');
    if (menuSleep) {
      menuSleep.addEventListener('click', () => {
        this.close();
        if (!this.pangu) return;
        if (this.pangu.state === 'SLEEPING') {
          this.pangu.wakeUp();
          if (this.sleepText) this.sleepText.textContent = "Go to Sleep";
          if (this.sleepIcon) this.sleepIcon.textContent = "💤";
          this.showSpeech("Woke up! Full charge, ready to help! ⚡");
          if (this.soundFX) this.soundFX.playHappyChime();
        } else {
          this.pangu.sleep();
          if (this.sleepText) this.sleepText.textContent = "Wake Up";
          if (this.sleepIcon) this.sleepIcon.textContent = "☀️";
          this.showSpeech("Good night da... Sleeping... Zzz 😴");
          if (this.soundFX) this.soundFX.playSleepZzz();
        }
      });
    }

    // Menu: Switch Character Mascot
    const menuChar = document.getElementById('menu-character');
    if (menuChar) {
      menuChar.addEventListener('click', async () => {
        this.close();
        const charCycle = ['fox', 'sellsword_fox', 'dragon', 'cat'];
        const nextIdx = (charCycle.indexOf(this.currentCharacter) + 1) % charCycle.length;
        const nextChar = charCycle[nextIdx];

        this.currentCharacter = nextChar;
        if (this.panguAPI) await this.panguAPI.setPreference('character', nextChar);
        if (this.pangu) this.pangu.setCharacter(nextChar);
        this.updateCharacterUI(nextChar);

        const names = {
          fox: "Mystic Kitsune 🦊",
          sellsword_fox: "Sellsword Fox ⚔️",
          dragon: "Cyber Dragon 🐉",
          cat: "Kawaii Shadow Kitty 🐱"
        };
        this.showSpeech(`Transformed into ${names[nextChar]}! Check out my moves, da! ✨`);
      });
    }

    // Menu: Theme Switch
    const menuTheme = document.getElementById('menu-theme');
    if (menuTheme) {
      menuTheme.addEventListener('click', () => {
        this.close();
        this.toggleTheme();
      });
    }

    // Menu: Settings
    const menuSettings = document.getElementById('menu-settings');
    if (menuSettings) {
      menuSettings.addEventListener('click', () => {
        this.close();
        this.openSettings();
      });
    }

    // Menu: Quit
    const menuQuit = document.getElementById('menu-quit');
    if (menuQuit) {
      menuQuit.addEventListener('click', () => {
        if (this.panguAPI) this.panguAPI.closeApp();
      });
    }

    // Menu: Elemental Aura Switcher
    if (this.menuAura) {
      this.menuAura.addEventListener('click', async () => {
        this.close();
        if (!this.pangu) return;
        const newAura = this.pangu.cycleElementalAura();
        if (this.panguAPI) await this.panguAPI.setElementalAura(newAura);
        this.updateAuraUI(newAura);
        const auraNames = { fire: 'Fire Obsidian 🔥', thunder: 'Thunder Lightning ⚡', frost: 'Frost Crystal ❄️', void: 'Cosmic Void 🌌' };
        this.showSpeech(`Elemental Aura switched to ${auraNames[newAura] || newAura}! 🐾✨`, 3500, 'excited');
        this.refreshPetRpgUI();
      });
    }
  }

  bindListeners() {
    if (this.panguAPI && this.panguAPI.onLevelUp) {
      this.panguAPI.onLevelUp((data) => {
        this.refreshPetRpgUI();
        if (this.pangu) this.pangu.reactCelebrate();
        if (this.soundFX) this.soundFX.playHappyChime();
        this.showSpeech(`🎉 LEVEL UP MACHI! Level ${data.newLevel} reach pannitom! Unlocked Title: "${data.title}"! Super da! 🔥⚔️`, 6000, 'excited');
      });
    }
  }

  open() {
    if (!this.radialMenu) return;
    if (this.panguAPI) this.panguAPI.setIgnoreMouseEvents(false);
    this.radialMenu.classList.add('visible');
  }

  close() {
    if (!this.radialMenu) return;
    this.radialMenu.classList.remove('visible');
  }

  isOpen() {
    return this.radialMenu && this.radialMenu.classList.contains('visible');
  }

  async refreshPetRpgUI() {
    try {
      if (!this.panguAPI) return;
      const stats = await this.panguAPI.getPetStats();
      if (!stats) return;
      const level = stats.level || 1;
      const xp = stats.xp || 0;
      const nextXp = stats.nextLevelXp || (level * 100);
      const title = stats.friendship_title || "Novice Companion 🐾";
      const aura = stats.elemental_aura || "fire";

      if (this.rpgLevelBadge) this.rpgLevelBadge.textContent = `Lvl ${level}`;
      if (this.rpgTitleBadge) this.rpgTitleBadge.textContent = title;
      if (this.rpgXpText) this.rpgXpText.textContent = `${xp} / ${nextXp} XP`;
      if (this.rpgBarFill) {
        const pct = Math.min(100, Math.round((xp / nextXp) * 100));
        this.rpgBarFill.style.width = `${pct}%`;
      }
      this.updateAuraUI(aura);
    } catch (e) {
      console.warn('[MenuManager] refreshPetRpgUI error:', e);
    }
  }

  updateAuraUI(auraName) {
    if (!this.menuAuraText) return;
    const icons = { fire: '🔥', thunder: '⚡', frost: '❄️', void: '🌌' };
    const icon = icons[auraName] || '🔥';
    const label = auraName ? auraName.charAt(0).toUpperCase() + auraName.slice(1) : 'Fire';
    if (this.menuAuraIcon) this.menuAuraIcon.textContent = icon;
    if (this.menuAuraText) this.menuAuraText.textContent = `Elemental Aura: ${label} ${icon}`;
  }

  updateCharacterUI(charType) {
    this.currentCharacter = charType;
    const map = {
      fox: { icon: '🦊', label: 'Mascot: Mystic Fox' },
      sellsword_fox: { icon: '⚔️', label: 'Mascot: Sellsword Fox' },
      dragon: { icon: '🐉', label: 'Mascot: Cyber Dragon' },
      cat: { icon: '🐱', label: 'Mascot: Shadow Kitty' }
    };
    const info = map[charType] || map.fox;
    if (this.charIcon) this.charIcon.textContent = info.icon;
    if (this.charText) this.charText.textContent = info.label;
  }

  updateSoundUI(enabled) {
    if (this.soundIcon) this.soundIcon.textContent = enabled ? '🔊' : '🔇';
    if (this.soundText) this.soundText.textContent = enabled ? 'Sound: ON' : 'Silent Mode: ON';
  }

  updateWingsUI(enabled) {
    if (this.wingsIcon) this.wingsIcon.textContent = enabled ? '🪽' : '✨';
    if (this.wingsText) this.wingsText.textContent = enabled ? 'Celestial Wings: ON' : 'Celestial Wings: OFF';
  }

  updateGardenUI(enabled) {
    if (this.gardenIcon) this.gardenIcon.textContent = enabled ? '🌸' : '🌿';
    if (this.gardenText) this.gardenText.textContent = enabled ? '3D Garden: ON 🌸' : '3D Garden: OFF';
  }

  syncCoordinates(screenX, screenY) {
    if (this.radialMenu && this.radialMenu.classList.contains('visible')) {
      const menuW = this.radialMenu.offsetWidth || 215;
      const menuH = this.radialMenu.offsetHeight || 440;
      const menuX = screenX + menuW + 20 > window.innerWidth ? screenX - menuW - 20 : screenX + 65;
      const menuY = Math.max(15, Math.min(window.innerHeight - menuH - 15, screenY - menuH / 2));
      this.radialMenu.style.left = `${menuX}px`;
      this.radialMenu.style.top = `${menuY}px`;
    }
  }
}
