import { Pangu3D } from './pangu_3d.js';
import { SpeechEngine } from '../modules/speech_engine.js';
import { MiniGamesManager } from '../modules/minigames.js';
import { PomodoroManager } from '../modules/pomodoro.js';
import { VoiceInputManager } from '../modules/voice_input.js';
import { DragDropManager } from '../modules/drag_drop.js';
import { DisplayManager } from '../modules/display_manager.js';
import { SettingsModal } from '../modules/settings_modal.js';
import { MenuManager } from '../modules/menu_manager.js';
import { OnboardingWizard } from '../modules/onboarding_wizard.js';

/**
 * PANGU 3D Application Controller (Modularized Architecture)
 * High-performance orchestrator for 3D character engine, multimodal Gemini AI,
 * screen vision, desktop mini-games, and RPG progression.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const panguAPI = window.panguAPI;

  // DOM Elements
  const container = document.getElementById('pangu-3d-container');
  const hitBox = document.getElementById('pangu-hit-box');
  const speechBubble = document.getElementById('pangu-3d-speech');
  const talkPill = document.getElementById('pangu-talk-pill');
  const talkInput = document.getElementById('talk-input');
  const talkSendBtn = document.getElementById('talk-send-btn');
  const talkVisionBtn = document.getElementById('talk-vision-btn');
  const talkMicBtn = document.getElementById('talk-mic-btn');
  const radialMenu = document.getElementById('pangu-radial-menu');
  const menuVisionBtn = document.getElementById('menu-vision');
  const menuMicBtn = document.getElementById('menu-mic');
  const menuLaser = document.getElementById('menu-laser');
  const menuLaserText = document.getElementById('menu-laser-text');
  const menuBall = document.getElementById('menu-ball');
  const menuDisplay = document.getElementById('menu-display');
  const menuDisplayText = document.getElementById('menu-display-text');
  const laserPointerEl = document.getElementById('pangu-laser-pointer');
  const toyBallEl = document.getElementById('pangu-toy-ball');
  const settingsModalEl = document.getElementById('settings-modal');
  const onboardingModalEl = document.getElementById('pangu-onboarding-modal');
  const focusPill = document.getElementById('pangu-focus-pill');
  const focusTimeDisplay = document.getElementById('focus-time-display');
  const focusStopBtn = document.getElementById('focus-stop-btn');
  const menuFocus = document.getElementById('menu-focus');
  const menuFocusText = document.getElementById('menu-focus-text');
  const panicBanner = document.getElementById('panic-banner');
  const panicResumeBtn = document.getElementById('panic-resume-btn');

  // 1. Load Initial Preferences & Stats
  let preferences = {};
  let petStats = {};
  try {
    preferences = (await panguAPI.getPreferences()) || {};
    petStats = (await panguAPI.getPetStats()) || {};
  } catch (err) {
    console.warn('[PanguApp] Could not load preferences/stats, using defaults:', err);
  }

  let currentTheme = preferences.theme || 'dark';
  let currentCharacter = preferences.character || 'sellsword_fox';
  let soundEnabled = preferences.sound_enabled !== 'false';
  let voiceMode = preferences.voice_mode || 'both'; // 'acoustic', 'tts', 'both'
  let wingsEnabled = preferences.celestial_wings === 'true';
  let visualStyle = preferences.visual_style || 'classic';
  let currentAura = petStats.elemental_aura || 'fire';

  if (window.soundFX) window.soundFX.setEnabled(soundEnabled);
  applyTheme(currentTheme);

  // Fallback notify if 3D model asset is absent
  window.__onModelNotFound = (charType) => {
    if (charType === 'sellsword_fox') {
      setTimeout(() => {
        speechEngine.showSpeech(
          "Machi, SellswordFox model file load aagala da! Fox model-oda namba ready-aa irukkom! 🦊✨",
          6500,
          'excited'
        );
      }, 800);
    }
  };

  // 2. Initialize 3D Companion Engine
  const pangu = new Pangu3D(container, {
    theme: currentTheme,
    character: currentCharacter,
    visualStyle,
    aura: wingsEnabled,
    elementalAura: currentAura
  });
  window.__panguInstance = pangu;

  // 3. Initialize Modular Subsystems
  const speechEngine = new SpeechEngine({
    speechBubble,
    pangu,
    soundFX: window.soundFX,
    voiceMode,
    soundEnabled
  });

  const displayManager = new DisplayManager({
    pangu,
    panguAPI,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    menuDisplay,
    menuDisplayText
  });

  const miniGames = new MiniGamesManager({
    pangu,
    panguAPI,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    laserPointerEl,
    toyBallEl,
    menuLaserText
  });

  const pomodoro = new PomodoroManager({
    focusPill,
    focusTimeDisplay,
    focusStopBtn,
    menuFocusText,
    pangu,
    panguAPI,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    onCompleted: () => menuManager.refreshPetRpgUI()
  });

  const voiceInput = new VoiceInputManager({
    talkMicBtn,
    talkInput,
    pangu,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    openTalkPill: () => openTalkPill(),
    onTranscriptComplete: () => handleSendTalk()
  });

  const dragDrop = new DragDropManager({
    hitBox,
    pangu,
    panguAPI,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    refreshPetRpgUI: () => menuManager.refreshPetRpgUI()
  });

  const settingsModal = new SettingsModal({
    modalEl: settingsModalEl,
    panguAPI,
    pangu,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    onSettingsSaved: (updated) => {
      soundEnabled = updated.soundEnabled;
      voiceMode = updated.voiceMode;
      speechEngine.setSoundEnabled(soundEnabled);
      speechEngine.setVoiceMode(voiceMode);
      if (window.soundFX) window.soundFX.setEnabled(soundEnabled);
      menuManager.updateSoundUI(soundEnabled);

      wingsEnabled = updated.wingsEnabled;
      pangu.setAura(wingsEnabled);
      menuManager.updateWingsUI(wingsEnabled);

      applyTheme(updated.theme);
      pangu.setTheme(updated.theme);

      if (updated.character !== currentCharacter) {
        currentCharacter = updated.character;
        pangu.setCharacter(updated.character);
        menuManager.updateCharacterUI(updated.character);
      }
      visualStyle = updated.visualStyle || 'classic';
      preferences = { ...preferences, ...(updated.profile || {}), user_name: updated.userName };
      pangu.setVisualStyle(visualStyle);
      menuManager.updateGardenUI(visualStyle === 'celestial_garden');
    }
  });

  const onboardingWizard = new OnboardingWizard({
    wizardEl: onboardingModalEl,
    panguAPI,
    pangu,
    speechEngine,
    soundFX: window.soundFX,
    onComplete: (data) => {
      preferences = { ...preferences, ...data };
      currentCharacter = data.character;
      visualStyle = data.visual_style;
      menuManager.updateCharacterUI(currentCharacter);
      menuManager.updateGardenUI(visualStyle === 'celestial_garden');
    }
  });

  const menuManager = new MenuManager({
    radialMenu,
    pangu,
    panguAPI,
    soundFX: window.soundFX,
    showSpeech: (t, d, e) => speechEngine.showSpeech(t, d, e),
    currentCharacter,
    currentTheme,
    openTalkPill: () => openTalkPill(),
    openSettings: () => {
      settingsModal.open({
        currentCharacter,
        soundEnabled,
        voiceMode,
        wingsEnabled,
        currentTheme,
        preferences
      });
    },
    toggleSound: async () => {
      soundEnabled = !soundEnabled;
      speechEngine.setSoundEnabled(soundEnabled);
      if (window.soundFX) window.soundFX.setEnabled(soundEnabled);
      await panguAPI.setPreference('sound_enabled', soundEnabled ? 'true' : 'false');
      menuManager.updateSoundUI(soundEnabled);
      if (soundEnabled) {
        if (window.soundFX) window.soundFX.playHappyChime();
        speechEngine.showSpeech("Sound effects enabled! 🔊");
      } else {
        speechEngine.showSpeech("Silent mode enabled, da! 🔇 (All sounds muted)");
      }
    },
    toggleTheme: async () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      await panguAPI.setPreference('theme', nextTheme);
      applyTheme(nextTheme);
      pangu.setTheme(nextTheme);
      pangu.playSomersault();
      speechEngine.showSpeech(`Switched to ${nextTheme === 'dark' ? 'Fire Obsidian Ember 🔥' : 'Frost Celestial Blue ❄️'}!`);
    },
    toggleWings: async () => {
      wingsEnabled = !wingsEnabled;
      pangu.setAura(wingsEnabled);
      await panguAPI.setPreference('celestial_wings', wingsEnabled ? 'true' : 'false');
      menuManager.updateWingsUI(wingsEnabled);
      if (wingsEnabled) {
        speechEngine.showSpeech("Celestial Wings & Halo activated! 🪽✨");
        pangu.elementalBurst();
      } else {
        speechEngine.showSpeech("Natural companion mode active! 🐾");
      }
    }
  });

  // Initial UI updates
  menuManager.updateWingsUI(wingsEnabled);
  menuManager.updateCharacterUI(currentCharacter);
  menuManager.updateSoundUI(soundEnabled);
  menuManager.updateGardenUI(visualStyle === 'celestial_garden');
  menuManager.refreshPetRpgUI();

  if (preferences.onboarding_complete !== 'true') {
    onboardingWizard.open();
  }

  // 4. Mouse Event Pass-Through System
  const interactiveElements = [hitBox, speechBubble, talkPill, talkVisionBtn, talkMicBtn, radialMenu, settingsModalEl, onboardingModalEl, focusPill];

  interactiveElements.forEach((el) => {
    if (!el) return;
    el.addEventListener('mouseenter', () => {
      panguAPI.setIgnoreMouseEvents(false);
    });
    el.addEventListener('mouseleave', () => {
      setTimeout(() => {
        const hovered = document.querySelectorAll(':hover');
        let isHovering = false;
        hovered.forEach((h) => {
          if (h.classList && h.classList.contains('interactive')) isHovering = true;
        });
        if (
          !isHovering &&
          !menuManager.isOpen() &&
          !settingsModalEl.classList.contains('open') &&
          !talkPill.classList.contains('visible') &&
          (!focusPill || !focusPill.classList.contains('visible'))
        ) {
          panguAPI.setIgnoreMouseEvents(true, { forward: true });
        }
      }, 60);
    });
  });

  window.addEventListener('mousemove', (e) => {
    miniGames.onMouseMove(e);
  });

  // 5. 60 FPS Frame Synchronizer
  function syncUIWith3D() {
    const px = pangu.screenX;
    const py = pangu.screenY;

    // Anchor hit box
    hitBox.style.left = `${px}px`;
    hitBox.style.top = `${py}px`;

    // Sync speech bubble coordinates (with focus pill clearance)
    speechEngine.syncCoordinates(px, py, pomodoro.isFocusActive);

    // Anchor talk pill below creature
    if (talkPill.classList.contains('visible')) {
      talkPill.style.left = `${px}px`;
      talkPill.style.top = `${py + 30}px`;
    }

    // Anchor focus pill above creature
    pomodoro.syncCoordinates(px, py);

    // Anchor radial menu beside creature
    menuManager.syncCoordinates(px, py);

    // Run mini-games physics & AI updates
    miniGames.update();

    requestAnimationFrame(syncUIWith3D);
  }
  syncUIWith3D();

  // 6. Companion Hit Box Gestures
  let clickStartTime = 0;
  hitBox.addEventListener('mousedown', () => {
    clickStartTime = Date.now();
  });

  let petRubDistance = 0;
  let lastPetMouseX = 0;
  let lastPetMouseY = 0;
  let petRubTimeout = null;

  hitBox.addEventListener('mousemove', (e) => {
    if (pangu.isDragging) return;
    const dx = e.clientX - lastPetMouseX;
    const dy = e.clientY - lastPetMouseY;
    const dist = Math.hypot(dx, dy);
    lastPetMouseX = e.clientX;
    lastPetMouseY = e.clientY;

    if (dist > 2 && dist < 45) {
      petRubDistance += dist;
      if (petRubDistance > 110) {
        petRubDistance = 0;
        pangu.reactPetRub();
      }
    }

    clearTimeout(petRubTimeout);
    petRubTimeout = setTimeout(() => { petRubDistance = 0; }, 350);
  });

  hitBox.addEventListener('click', () => {
    const clickDuration = Date.now() - clickStartTime;
    if (clickDuration > 200) return; // Ignore drag release
    menuManager.close();
    onPetInteraction();
  });

  hitBox.addEventListener('dblclick', () => {
    openTalkPill();
  });

  hitBox.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    talkPill.classList.remove('visible');
    menuManager.open();
  });

  async function onPetInteraction() {
    const userName = preferences.user_name || 'friend';
    const language = preferences.language_preference || 'tanglish';
    const phraseSets = {
      tanglish: [`Hi ${userName}! Enna help venum? Naan un koodave irukken! ♡`, `Purrr... Naan un koodave irukken! 🐾`, `Hey ${userName}! Enna yosikira? Share pannu, serndhu solve pannuvom! 💡`],
      tamil: [`வணக்கம் ${userName}! என்ன உதவி வேண்டும்? நான் உன்னுடன் இருக்கிறேன். ♡`, `நான் இங்கே உன்னுடன் இருக்கிறேன்! 🐾`, `${userName}, என்ன யோசிக்கிறாய்? சொல்லு, சேர்ந்து தீர்வு காணலாம். 💡`],
      hindi: [`नमस्ते ${userName}! क्या मदद चाहिए? मैं तुम्हारे साथ हूँ। ♡`, `मैं यहीं तुम्हारे साथ हूँ! 🐾`, `${userName}, क्या सोच रहे हो? बताओ, मिलकर हल निकालेंगे। 💡`],
      english: [`Hi ${userName}! What can I help with? I'm right here. ♡`, `I'm here with you! 🐾`, `What are you thinking about, ${userName}? Tell me and we'll work it out. 💡`]
    };
    const phrases = phraseSets[language] || phraseSets.tanglish;
    const picked = phrases[Math.floor(Math.random() * phrases.length)];
    pangu.reactTouch();
    speechEngine.showSpeech(picked, 4500, 'happy');
    try {
      await panguAPI.cuddlePet();
      menuManager.refreshPetRpgUI();
    } catch (e) {}
  }

  // 7. Talk Pill Controller
  function openTalkPill() {
    menuManager.close();
    talkPill.classList.add('visible');
    pangu.setListening(true);
    panguAPI.setIgnoreMouseEvents(false);
    setTimeout(() => talkInput.focus(), 50);
  }

  function closeTalkPill() {
    talkPill.classList.remove('visible');
    pangu.setListening(false);
    talkInput.value = '';
    setTimeout(() => {
      panguAPI.setIgnoreMouseEvents(true, { forward: true });
    }, 100);
  }

  async function handleSendTalk() {
    const text = talkInput.value;
    if (!text || text.trim() === '') return;
    closeTalkPill();

    speechEngine.showSpeech("Thinking, da... 💭", 2500, 'normal');
    pangu.setThinking(true);
    if (window.soundFX) window.soundFX.playMessagePop();

    try {
      const response = await panguAPI.sendMessage(text);
      pangu.setThinking(false);

      const action = (response.action || '').toUpperCase();
      let emotion = 'normal';
      if (['HAPPY', 'CELEBRATE', 'LOVE'].includes(action)) emotion = 'happy';
      else if (['EXCITED', 'PLAYFUL', 'PLAYFUL_WIGGLE'].includes(action)) emotion = 'excited';
      else if (['SLEEPY'].includes(action)) emotion = 'sleepy';

      speechEngine.showSpeech(response.text, 0, emotion);
      triggerCompanionAction(action);
      menuManager.refreshPetRpgUI();
    } catch (err) {
      pangu.setThinking(false);
      speechEngine.showSpeech("Chinna connection glitch, da! Settings-la API key check pannikolaren!", 5000, 'normal');
    }
  }

  talkSendBtn.addEventListener('click', handleSendTalk);
  talkInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendTalk();
    if (e.key === 'Escape') closeTalkPill();
  });

  // 8. Screen Vision Inspection
  async function handleVisionInspect(customQuery = '') {
    menuManager.close();
    closeTalkPill();
    speechEngine.showSpeech(`Inspecting your screen, ${preferences.user_name || 'friend'}... 👀`, 3500, 'normal');
    pangu.setThinking(true);
    pangu.triggerHabit('SURVEY_DESKTOP');
    if (window.soundFX) window.soundFX.playCurious();

    try {
      const query = customQuery && customQuery.trim() !== '' ? customQuery : "Screen-a paathu ena nadakuthu nu sollu, da!";
      const response = await panguAPI.sendVisionMessage(query);
      pangu.setThinking(false);

      const action = (response.action || '').toUpperCase();
      let emotion = 'normal';
      if (['HAPPY', 'CELEBRATE', 'LOVE'].includes(action)) emotion = 'happy';
      else if (['EXCITED', 'PLAYFUL', 'PLAYFUL_WIGGLE'].includes(action)) emotion = 'excited';
      else if (['SLEEPY'].includes(action)) emotion = 'sleepy';

      speechEngine.showSpeech(response.text, 0, emotion);
      triggerCompanionAction(action);
      menuManager.refreshPetRpgUI();
    } catch (err) {
      pangu.setThinking(false);
      speechEngine.showSpeech("Screen inspect panna mudiyala machi! Check API key or screen permission!", 5000, 'normal');
    }
  }

  if (talkVisionBtn) talkVisionBtn.addEventListener('click', () => handleVisionInspect(talkInput.value));
  if (menuVisionBtn) menuVisionBtn.addEventListener('click', () => handleVisionInspect());
  if (panguAPI.onTriggerVision) panguAPI.onTriggerVision(() => handleVisionInspect());

  // Voice STT Buttons
  if (talkMicBtn) talkMicBtn.addEventListener('click', () => voiceInput.toggle());
  if (menuMicBtn) menuMicBtn.addEventListener('click', () => { menuManager.close(); voiceInput.start(); });

  // Mini-Games Menu Buttons
  if (menuLaser) menuLaser.addEventListener('click', () => { menuManager.close(); miniGames.toggleLaser(); });
  if (menuBall) menuBall.addEventListener('click', () => { menuManager.close(); miniGames.tossToyBall(); });

  // Pomodoro Focus Menu Button
  if (menuFocus) menuFocus.addEventListener('click', () => { menuManager.close(); pomodoro.toggle(); });

  // 9. Physical 3D Body Language Trigger
  function triggerCompanionAction(action) {
    if (!pangu) return;
    if (action === 'HAPPY') pangu.reactTouch();
    else if (action === 'EXCITED' || action === 'PLAYFUL') pangu.playSomersault();
    else if (action === 'CELEBRATE') pangu.reactCelebrate();
    else if (action === 'LOVE') pangu.reactLove();
    else if (action === 'CURIOUS') pangu.reactCurious();
    else if (action === 'STRETCH') pangu.triggerHabit('STRETCH');
    else if (action === 'PLAYFUL_WIGGLE') pangu.triggerHabit('PLAYFUL_WIGGLE');
    else if (action === 'SCRATCH') pangu.triggerHabit('SCRATCH');
    else if (action === 'GROOM') pangu.triggerHabit('PAW_GROOM');
    else if (action === 'SURVEY') pangu.triggerHabit('SURVEY_DESKTOP');
    else if (action === 'SNEEZE') pangu.triggerHabit('SNEEZE');
    else if (action === 'CURIOSITY_PEEK' || action === 'PEEK') pangu.triggerHabit('CURIOSITY_PEEK');
    else if (action === 'POUNCE' || action === 'PLAYFUL_POUNCE') pangu.triggerHabit('PLAYFUL_POUNCE');
    else if (action === 'SNIFF') pangu.triggerHabit('SNIFF_GROUND');
    else if (action === 'EAR_PERK') pangu.triggerHabit('EAR_PERK');
    else if (action === 'YAWN') pangu.triggerHabit('YAWN_SNOOZE');
    else if (action === 'FLY') pangu.elementalBurst();
    else if (action === 'SLEEPY') pangu.sleep();
    else pangu.jump(false);
  }

  // 10. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement === talkInput || settingsModalEl.classList.contains('open')) return;

    if (e.code === 'Space') {
      e.preventDefault();
      openTalkPill();
    } else if (e.key === 'm' || e.key === 'M') {
      menuManager.toggleSound();
    } else if (e.key === 'l' || e.key === 'L') {
      miniGames.toggleLaser();
    } else if (e.key === 'b' || e.key === 'B') {
      miniGames.tossToyBall();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      displayManager.jumpToNextDisplay();
    }
  });

  // Close radial menu on outside click
  window.addEventListener('click', (e) => {
    if (!radialMenu.contains(e.target) && e.target !== hitBox) {
      menuManager.close();
    }
  });

  // 11. Theme Application
  function applyTheme(theme) {
    currentTheme = theme;
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) themeSelect.value = theme;
    const themeText = document.getElementById('menu-theme-text');
    const themeIcon = document.getElementById('menu-theme-icon');
    if (themeText && themeIcon) {
      if (theme === 'dark') {
        themeText.textContent = "Switch to Frost Theme";
        themeIcon.textContent = "❄️";
      } else {
        themeText.textContent = "Switch to Fire Theme";
        themeIcon.textContent = "🔥";
      }
    }
  }

  // 12. Emergency Privacy Panic Handling (Ctrl+Shift+P)
  if (panguAPI.onPanicToggle) {
    panguAPI.onPanicToggle((isPaused) => {
      if (isPaused) {
        panicBanner.classList.add('active');
        panguAPI.setIgnoreMouseEvents(false);
        pangu.sleep();
        pangu.setPaused(true);
      } else {
        panicBanner.classList.remove('active');
        panguAPI.setIgnoreMouseEvents(true, { forward: true });
        pangu.setPaused(false);
        pangu.wakeUp();
      }
    });
  }

  if (panicResumeBtn) {
    panicResumeBtn.addEventListener('click', async () => {
      await panguAPI.togglePanic();
    });
  }

  // 13. Startup Greeting
  if (preferences.onboarding_complete === 'true') {
    setTimeout(() => {
      const userName = preferences.user_name || 'friend';
      const greetings = {
        tanglish: `Hey ${userName}! Let's build something amazing together! ♡`,
        tamil: `வணக்கம் ${userName}! சேர்ந்து அற்புதமான ஒன்றை உருவாக்கலாம்! ♡`,
        hindi: `नमस्ते ${userName}! चलो मिलकर कुछ शानदार बनाते हैं! ♡`,
        english: `Hi ${userName}! Let's build something amazing together! ♡`
      };
      speechEngine.showSpeech(greetings[preferences.language_preference] || greetings.tanglish, 4500);
      pangu.jump();
    }, 1200);
  }
});
