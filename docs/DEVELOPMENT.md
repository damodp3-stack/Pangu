# 🛠️ PANGU Developer & Asset Pipeline Handbook

This guide details the internal developer workflow, bundling system, 3D model rigging specifications, and procedural audio synthesis pipelines.

---

## 🏗️ Build & Development Workflow

### Scripts
- `npm run build`: Bundles `src/ui/components/app.js` and all dependencies into `src/ui/dist/bundle.js` using `esbuild`.
- `npm run build:prod`: Generates minified production bundle with sourcemap.
- `npm start`: Runs `npm run build` and launches the Electron application.
- `npm test`: Runs automated headless end-to-end verification via Electron.
- `npm run clean`: Cleans the `src/ui/dist/` build directory.

### Project Layout
```
Pangu/
├── main.js                  # Electron Main process (Multi-display, shortcuts, IPC)
├── preload.js               # Context isolation security bridge
├── run_pangu.bat            # Windows 1-click startup batch script
├── package.json             # NPM dependencies & scripts
├── data/                    # SQLite database storage (git-ignored)
│   └── .gitkeep
├── docs/                    # Architectural & API documentation
│   ├── ARCHITECTURE.md
│   ├── USER_GUIDE.md
│   ├── API_REFERENCE.md
│   └── DEVELOPMENT.md
├── src/
│   ├── core/                # Business logic & state machines
│   │   ├── brain.js         # Gemini API & offline cognitive engine
│   │   ├── memory.js        # SQLite persistence layer
│   │   ├── pet_state.js     # Autonomous behavior state machine
│   │   └── privacy.js       # Emergency privacy switch manager
│   ├── legacy/              # Archived early 2D canvas engine
│   │   ├── pangu_character.js
│   │   └── README.md
│   └── ui/
│       ├── index.html       # Transparent WebGL window entrypoint
│       ├── assets/          # 3D GLTF models, textures & sprite sheets
│       │   ├── Fox.glb
│       │   ├── SellswordFox.glb
│       │   ├── Dragon.glb
│       │   └── cat.glb
│       ├── components/      # Core 3D engine & audio synthesizer
│       │   ├── app.js       # Application controller
│       │   ├── pangu_3d.js  # 3D Three.js character engine
│       │   └── sound_fx.js  # Procedural Web Audio synthesizer
│       ├── modules/         # Modular feature controllers
│       │   ├── display_manager.js
│       │   ├── drag_drop.js
│       │   ├── menu_manager.js
│       │   ├── minigames.js
│       │   ├── pomodoro.js
│       │   ├── settings_modal.js
│       │   ├── speech_engine.js
│       │   └── voice_input.js
│       └── styles/          # Modern Glassmorphic CSS themes
│           ├── main.css
│           ├── dark_theme.css
│           └── light_theme.css
└── scratch/                 # Offline test scripts & model baking tools
```

---

## 🦊 Rigging 3D Characters for PANGU

PANGU uses **Three.js** `GLTFLoader` (or `FBXLoader`) to load skeletal models. When exporting your model from Blender or Maya:

### 1. Scaling & Transform Requirements
- Ensure **Scale is applied** (`1.0, 1.0, 1.0`) on root objects.
- Model height should approximate `1.35 to 1.55` Three.js units.
- Paws/feet should rest at `y = 0` (ground level).
- Forward direction should face **+Z** or **+X** (set `baseRotationY` in `charConfig` if needed).

### 2. Standard Skeletal Hierarchy
PANGU automatically detects bones using case-insensitive name matching:
- **Head:** Bone containing `head` or named `joint4`.
  *(Enables 3D gaze tracking towards the mouse cursor).*
- **Neck:** Bone containing `neck` or named `joint3`.
- **Muzzle / Jaw:** Bone containing `jaw`, `nose`, or `face`.
  *(Enables typewriter lip-sync vibrations).*
- **Spine:** Bones containing `spine` or `body`.
  *(Enables idle weight shifting and posture breathing).*
- **Tail:** Bones containing `tail` or `joint1`.
  *(Enables 4-joint spring harmonic physics).*

### 3. Required Animation Clips
Include the following animation clips in your `.glb` file:
- `idle` (or `Survey`)
- `walk` (Quadruped walk cycle)
- `run` (High-speed sprint cycle)

### 4. Registering a New Character
In `src/ui/components/pangu_3d.js`:
```javascript
const charConfig = {
  my_new_mascot: {
    path: 'assets/MyMascot.glb',
    targetHeight: 1.5,
    baseRotationY: 0,
    clipsMap: {
      idle: 'idle',
      walk: 'walk',
      run: 'run'
    }
  }
};
```

---

## 🎵 Procedural Web Audio API Synthesis

PANGU does NOT load large external `.mp3` or `.wav` sound files. All sound effects are synthesized in real-time in `src/ui/components/sound_fx.js` using browser native Web Audio oscillators:

- **Arpeggios:** Sine oscillators stepped through musical chords (e.g. C5, E5, G5, C6).
- **Purring:** 85Hz triangle wave modulated with a 24Hz LFO tremolo gain node.
- **Bounces:** Pitch-dropping triangle wave (280Hz -> 95Hz over 60ms).
- **Vocalizations:** Procedural phonemes mapped to vowels with harmonic overtones.

Adding a new sound effect:
```javascript
playMyEffect() {
  if (!this.enabled) return;
  this.init();
  const now = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(this.ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}
```
