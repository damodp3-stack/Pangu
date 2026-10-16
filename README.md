# 🐾 PANGU — 3D Native AI Desktop Companion

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-v30+-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r186+-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Multimodal%20Vision-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)

**"A living, breathing 3D AI companion walking, running, and playing directly on your Windows desktop — with ZERO windows, ZERO rectangular frames, and pure native OS presence."**

[Quick Start](#-quick-start) • [Features](#-features) • [User Guide](docs/USER_GUIDE.md) • [Architecture](docs/ARCHITECTURE.md) • [API Docs](docs/API_REFERENCE.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🌟 What Makes PANGU Special

1. **🚫 ZERO WINDOWS, ZERO BOXES, ZERO CLUTTER**
   - No rectangular chat boxes or pinned sidebars obscuring your IDE or browser.
   - ONLY PANGU, the 3D creature, roams on your desktop.
   - Transparent click-through allows you to click, type, and code in Chrome, VS Code, or gaming apps uninterrupted.

2. **🦊 FULL 3D CHARACTER ENGINE (Three.js WebGL)**
   - **Quadruped Skeletal Rig:** Multi-jointed anatomy with head, muzzle, jaw, 4 legs with paws, flapping celestial wings, and a 4-joint spring harmonic tail.
   - **Procedural Gaze Tracking:** Pangu naturally turns its 3D head and body to watch your mouse cursor as you work.
   - **Realistic Contact Lighting:** Dual-layer ambient occlusion (inner sharp contact + outer soft penumbra shadow) casts onto your Windows taskbar.
   - **Acrobatic Moves:** 360° somersault backflips, superhero landings, and sleepy ball curling.

3. **🧠 GOOGLE-TIER MULTIMODAL COGNITIVE BRAIN**
   - **Tanglish AI Best Friend:** Powered by official `@google/genai` with deep conversational empathy, humor, and brotherly tone (*"da"*, *"machi"*, *"thozha"*).
   - **Multi-Turn Normalization:** Built-in message turn-taking normalizer prevents API cycle errors.
   - **Offline Fallback Brain:** Works 100% offline with zero setup required.
   - **📁 Drag & Drop Multimodal Ingestion:** Drag screenshots (`.png`, `.jpg`, `.webp`) or code files (`.js`, `.py`, `.html`, etc.) directly onto Pangu's 3D body for instant feedback.

4. **🍅 FOCUS BUDDY (POMODORO TIMER)**
   - Start 25-minute deep work sessions directly from the context menu.
   - A floating timer anchors above Pangu while it guards your desktop.
   - Awards **+50 XP** upon completion with celebratory fanfare!

5. **🎮 DESKTOP MINI-GAMES & TOYS**
   - 🔴 **Laser Pointer Chase (`L` or Menu):** High-speed 280 px/s sprint chase to pounce on the glowing red laser dot.
   - 🎾 **Bouncy Toy Ball Fetch (`B` or Menu):** Real physical gravity, boundary bounces, and batting animations.
   - 🖥️ **Multi-Monitor Roaming (`Tab` or Menu):** Seamlessly leaps between multiple physical monitors.

6. **⚔️ RPG FRIENDSHIP PROGRESSION**
   - Earn XP from petting, chatting, screen vision, mini-games, and focus sessions.
   - Unlock 6 prestige titles from *Novice Companion* to *Mythic Desktop Guardian*.

7. **⚡ 4 ELEMENTAL MAGIC AURAS**
   - 🔥 **Fire Obsidian:** Floating ember sparks and heat shimmer.
   - ⚡ **Thunder Lightning:** Electric cyan & gold crackling sparks.
   - ❄️ **Frost Crystal:** Crystalline snowflakes and soft frost vapor.
   - 🌌 **Cosmic Void:** Swirling violet nebula starlight.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Windows 10 / 11

### 1. Installation
```bash
git clone https://github.com/damodp3-stack/Pangu.git
cd Pangu
npm install
```

### 2. Launch
- **Option 1 (One-Click Batch Script):** Double-click `run_pangu.bat`.
- **Option 2 (Terminal):**
  ```bash
  npm start
  ```

### 3. Setup Gemini API Key (Optional)
To enable cloud intelligence and screen vision:
1. Obtain a free key from [Google AI Studio](https://aistudio.google.com).
2. Right-click Pangu -> **⚙️ Settings & API Key** -> Paste key -> **Save**.
### 4. Running Automated Tests
Run the verified 23-test regression suite:
```bash
npm test
```
To run the full headless Electron smoke verification:
```bash
npm run test:smoke
```

---

## ⌨️ Controls & Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **`Spacebar`** | Open floating dialogue pill beside Pangu |
| **`Ctrl + Shift + S`** | Quick screen inspection (requires screen permission) |
| **`Ctrl + Shift + P`** | **Emergency Privacy Switch** (instantly freeze Pangu & block all vision/cloud) |
| **`L`** | Toggle Red Laser Chase mini-game |
| **`B`** | Toss Bouncy Toy Ball across desktop |
| **`Tab`** | Jump to Next Monitor *(if multi-monitor connected)* |
| **`M`** | Toggle Sound Effects (Mute / Unmute) |
| **`Left-Click (Short)`** | Pet Pangu / Purr reaction |
| **`Left-Click & Drag`** | Pick up and dangle Pangu with gravity release |
| **`Right-Click`** | Open Circular RPG Context Menu |

---

## 📂 Project Structure

```
Pangu/
├── main.js                  # Electron Main Process (Window, DPAPI Crypto, IPC Security)
├── preload.js               # Secure ContextBridge isolation bridge
├── run_pangu.bat            # 1-Click Windows execution script
├── package.json             # NPM package scripts and dependencies
├── LICENSE                  # MIT License
├── CONTRIBUTING.md          # Open-source contribution guidelines
├── tests/                   # 23 Automated unit & regression test suites
│   ├── brain.test.js        # AI prompt, history normalization & timeout tests
│   ├── memory.test.js       # SQLite persistence, DPAPI encryption & XP bounds
│   ├── pet_state.test.js    # State machine and activity logic tests
│   └── privacy.test.js      # Panic toggle and permission gating tests
├── docs/                    # Complete architectural and API documentation
│   ├── ARCHITECTURE.md      # Detailed system blueprints & security architecture
│   ├── USER_GUIDE.md        # Comprehensive user manual
│   ├── API_REFERENCE.md     # IPC methods & database schemas
│   └── DEVELOPMENT.md       # Developer setup, testing & asset rigging handbook
├── src/
│   ├── core/                # Brain, SQLite memory, state machines, privacy
│   ├── legacy/              # Archived early 2D canvas engine
│   └── ui/                  # WebGL 3D character engine, styles, assets & modules
└── scratch/                 # Experimental tests & model rigging tools
```

---

## 🛡️ Privacy & Local-First Security Architecture

- **Windows DPAPI Credential Encryption:** API keys are encrypted at rest using Electron's `safeStorage` (backed by Windows Data Protection API). Fails closed if secure storage is unavailable; keys are never stored in plaintext.
- **Permission-Gated Screen Vision:** All vision requests (auto-captured or dropped images) require explicit user permission and are strictly blocked when privacy pause is active.
- **Strict IPC Sanitization:** All IPC channels are strictly bounded, validating integers, permitted keys, and input lengths to prevent memory corruption or XP injection.
- **Navigation Security:** External links are forced to open in the OS default browser via `shell.openExternal`, preventing Electron window hijacking.
- **Private Local Storage:** Chat logs, preferences, and RPG achievements remain 100% on your machine in SQLite (`data/pangu_memory.db`).
- **Emergency Kill Switch:** Pressing **`Ctrl + Shift + P`** halts all companion activity, audio, rendering, and API calls instantly.

---

## 📚 Complete Documentation Suite

- 🏛️ [System Architecture Blueprint](docs/ARCHITECTURE.md)
- 📖 [Complete User Guide](docs/USER_GUIDE.md)
- 🔌 [API & IPC Reference](docs/API_REFERENCE.md)
- 🛠️ [Developer & 3D Rigging Handbook](docs/DEVELOPMENT.md)

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
