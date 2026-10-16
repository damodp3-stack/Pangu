# 🏛️ PANGU Architecture Blueprint

> Complete technical design and system architecture for PANGU, the 3D native AI desktop companion for Windows.

---

## 🎯 Architectural Philosophy

PANGU was engineered to solve the "Chatbot Box Problem" — where traditional AI assistants are trapped inside rigid rectangular web windows or browser tabs. PANGU is designed with:
1. **Zero Windows / Zero Rectangles:** Pangu lives freely on top of the Windows desktop, taskbar, and windows.
2. **Transparent Event Routing:** Empty desktop space passes mouse clicks directly through to underlying applications (VS Code, Chrome, etc.).
3. **Rigged 3D Quadruped Simulation:** Anatomical skeletal animation, real-time lighting, contact shadows, procedural gaze tracking, and spring harmonic tail physics.
4. **Multimodal Edge Cognition:** Offline conversational companion + Google Gemini Vision API for reading code, screenshots, and dropped files.
5. **Private Local Memory:** High-speed SQLite in WAL mode storing user preferences, chat logs, and RPG level progression.

---

## 🌐 High-Level System Architecture

```
+--------------------------------------------------------------------------------+
|                             WINDOWS OS DESKTOP                                 |
+--------------------------------------------------------------------------------+
                                       ▲
                   (Transparent Screen-Spanning Window)
                                       │
+--------------------------------------------------------------------------------+
|                         ELECTRON MAIN PROCESS (Node.js)                        |
|                                                                                |
|   +-------------------+    +--------------------+    +---------------------+   |
|   |  BrowserWindow    |    |  Multi-Display     |    |  Global Shortcuts   |   |
|   |  (Transparent,    |    |  Bounds Calculator |    |  - Ctrl+Shift+P     |   |
|   |   Always-On-Top,  |    |  & Topology Watcher|    |  - Ctrl+Shift+S     |   |
|   |   Frameless)      |    +--------------------+    +---------------------+   |
|   +-------------------+              │                                         |
|             ▲                        ▼                                         |
|             │              +--------------------+                              |
|             │              |  Desktop Capturer  | (Screenshots / Vision)       |
|             │              +--------------------+                              |
|             │                        │                                         |
|             │                        ▼                                         |
|   +------------------------------------------------------------------------+   |
|   |                      CORE SUBSYSTEMS & STATE                           |   |
|   |                                                                        |   |
|   |   +---------------------+   +---------------------+   +------------+   |   |
|   |   |     PanguMemory     |   |      PanguBrain     |   |  PetState  |   |   |
|   |   |   (SQLite3 - WAL)   |◄-►|   (Gemini + Local)  |◄-►|  Machine   |   |   |
|   |   +---------------------+   +---------------------+   +------------+   |   |
|   |                                                                        |   |
|   +------------------------------------------------------------------------+   |
|                                      ▲                                         |
+--------------------------------------┼-----------------------------------------+
                                       │ IPC (ContextBridge)
+--------------------------------------▼-----------------------------------------+
|                    SECURE PRELOAD BRIDGE (preload.js)                          |
|             window.panguAPI (Type-safe, Context-Isolated API)                  |
+--------------------------------------------------------------------------------+
                                       ▲
                                       │
+--------------------------------------▼-----------------------------------------+
|                   RENDERER PROCESS (HTML5 / Three.js / CSS)                    |
|                                                                                |
|   +------------------------------------------------------------------------+   |
|   |                 3D CHARACTER ENGINE (pangu_3d.js)                      |   |
|   |                                                                        |   |
|   |   - Three.js ACESFilmic WebGL Renderer & Environment Lighting          |   |
|   |   - GLTF / FBX Quadruped Rig Loader (Fox, Sellsword Fox, Dragon, Cat)  |   |
|   |   - Dual-Layer Contact Shadows (Inner AO + Soft Diffuse Penumbra)      |   |
|   |   - Procedural Head Gaze, Lip-Sync Mouth Articulation, Blinking        |   |
|   |   - 4-Joint Spring Harmonic Tail Physics & Locomotion Inertia          |   |
|   +------------------------------------------------------------------------+   |
|                                      │                                         |
|   +----------------------------------┴-------------------------------------+   |
|   |                     MODULAR CONTROLLER SUBSYSTEMS                      |   |
|   |                                                                        |   |
|   |   - SpeechEngine       : Typewriter streaming, TTS, acoustic vocalizer |   |
|   |   - MiniGamesManager   : Laser pointer chase & elastic toy ball fetch  |   |
|   |   - DragDropManager    : Desktop drag-and-drop file & image ingestion  |   |
|   |   - PomodoroManager    : 25-minute deep work companion timer           |   |
|   |   - MenuManager        : Floating radial context menu & RPG level UI   |   |
|   |   - DisplayManager     : Multi-monitor leap & virtual canvas span      |   |
|   |   - VoiceInputManager  : Web Speech STT microphone input               |   |
|   |   - SettingsModal      : Custom mascots, audio toggles & API key modal |   |
|   +------------------------------------------------------------------------+   |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

## 🧩 Core Components Breakdown

### 1. Electron Main Process (`main.js`)
- **Virtual Desktop Geometry:** Calculates the bounding union of all connected physical displays (`getAllDisplaysBounds()`).
- **Dynamic Topology Sync:** Subscribes to `display-added`, `display-removed`, and `display-metrics-changed` to automatically resize and reposition the transparent canvas.
- **Mouse Pass-Through Routing:** Uses `win.setIgnoreMouseEvents(true, { forward: true })` so clicks pass straight to native Windows applications, turning click-through off only when the mouse hovers over interactive UI elements.
- **Multimodal Screen Capture:** Leverages `desktopCapturer.getSources()` with cursor-proximity display detection to capture the exact monitor the user is actively working on.

### 2. Preload Isolation Bridge (`preload.js`)
- Runs in a secure context with `nodeIntegration: false` and `contextIsolation: true`.
- Exposes `window.panguAPI` containing strictly bounded IPC invokers.

### 3. Cognitive AI Engine (`src/core/brain.js`)
- **Turn-Taking Normalizer:** Reconstructs and cleans multi-turn chat history into strictly alternating `user` -> `model` -> `user` cycles to satisfy Google Gemini API specifications.
- **Dynamic Multimodal Ingestion:** Extracts exact image MIME types (`image/png`, `image/jpeg`, `image/webp`) and packages base64 inline buffers.
- **Multi-Model Cascade:**
  ```
  User Selected Model ──► gemini-2.5-flash ──► gemini-2.0-flash ──► gemini-1.5-flash ──► Local Offline Companion
  ```
- **Tanglish Prompt Engineering:** Injects brotherly warmth, conversational colloquialisms ("da", "machi", "thozha"), emotional empathy, and structured reaction tags (`[ACTION:tag]`).

### 4. 3D Character Engine (`src/ui/components/pangu_3d.js`)
- **Tone Mapping & Lighting:** `ACESFilmicToneMapping` with exposure `1.15`, key directional sunlight, fill sky light, rim back-silhouette light, ground bounce, and eye catchlights.
- **Procedural IK & Gaze:** Rotates head and neck bones to track cursor coordinates across screens.
- **Skeletal Lip-Sync:** Vibrates and offsets muzzle/jaw bones in sync with speech character streaming.
- **Spring Harmonic Tail:** Four-joint mathematical spring-damper system simulating physical mass inertia and gravity when walking or running.
- **Dynamic Dual Contact Shadow:** Uses two canvas-generated radial textures: a sharp inner AO shadow and an expansive penumbra shadow underneath paws.

### 5. Persistent Local Memory (`src/core/memory.js`)
- Uses `better-sqlite3` with `journal_mode = WAL` (Write-Ahead Logging) and `synchronous = NORMAL` for sub-millisecond local reads and writes.
- Prepared statement caching prevents SQL compilation overhead.
- Stores user preferences, chat logs, RPG levels/XP, and masked API keys.
