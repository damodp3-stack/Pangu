# 🤝 Contributing to PANGU

Thank you for your interest in contributing to **PANGU** — the 3D Native AI Desktop Companion! Whether you are designing new 3D creature models, polishing Tanglish dialogue, adding mini-games, or optimizing WebGL shaders, your contributions are warmly welcomed.

---

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [3D Model & Asset Pipeline Guidelines](#3d-model--asset-pipeline-guidelines)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs & Feature Requests](#reporting-bugs--feature-requests)

---

## 📜 Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and supportive of all contributors.

---

## 🛠️ How Can I Contribute?
- **3D Art & Mascots:** Rig and animate new desktop creatures (GLTF/GLB or FBX).
- **AI Brain & Cognition:** Enhance multi-turn context retention, tool use, and Tanglish conversational tone.
- **Desktop Mini-Games:** Design new physics toys for Pangu (e.g. yarn balls, obstacles, racing).
- **Multi-Monitor Features:** Improve edge detection and dynamic display switching.
- **Audio & Synthesis:** Compose new cute procedurally synthesized Web Audio chimes.
- **Documentation:** Improve guides, tutorials, or translate docs into multiple languages.

---

## 💻 Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/damodp3-stack/Pangu.git
   cd Pangu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the bundle & run locally:**
   ```bash
   npm start
   ```

4. **Run automated verification tests:**
   ```bash
   npm test
   ```

---

## 📐 Coding Guidelines

- **Vanilla JavaScript (ES Modules):** All UI modules (`src/ui/modules/`) use clean ES module syntax.
- **Zero Heavy UI Frameworks:** Pangu operates on pure HTML, Vanilla CSS, and Three.js for ultra-lightweight CPU/GPU overhead.
- **Non-blocking Physics:** All physics calculations in `pangu_3d.js` and `minigames.js` run on `requestAnimationFrame` and must not exceed frame budgets.
- **Database Best Practices:** Use prepared statements for SQLite operations in `src/core/memory.js`.
- **Privacy First:** Never log, upload, or transmit API keys or private user desktop captures without explicit user permission.

---

## 🦊 3D Model & Asset Pipeline Guidelines

When contributing new mascots (`.glb` or `.fbx`):
1. **Target Dimensions:** Models should be normalized to approximately `1.35 - 1.55` Three.js world units tall.
2. **Standard Bone Names:** To enable procedural head gaze, lip-sync, and tail physics, ensure bones include:
   - `head` or `joint4` (Head bone)
   - `neck` or `joint3` (Neck bone)
   - `jaw`, `nose`, or `face` (Muzzle/Jaw for speech)
   - `spine` or `body` (Spine bones)
   - `tail` (Tail bones for spring harmonics)
3. **Animations:** Include `idle`, `walk`, and `run` animation clips within the asset file.
4. **File Placement:** Store models in `src/ui/assets/` and register them in `src/ui/components/pangu_3d.js`.

---

## 🚀 Submitting a Pull Request

1. Create a descriptive branch:
   ```bash
   git checkout -b feature/awesome-companion-feature
   ```
2. Commit your changes with concise messages:
   ```bash
   git commit -m "feat(minigames): add bouncy yarn ball interaction"
   ```
3. Run the verification test suite before pushing:
   ```bash
   npm test
   ```
4. Push your branch to GitHub and open a Pull Request against `main`.

---

## 🐛 Reporting Bugs & Feature Requests
If you encounter a bug or have a cool suggestion, please [open an issue](https://github.com/damodp3-stack/Pangu/issues) on GitHub. Include:
- Steps to reproduce the issue
- Operating System & Display setup (e.g., Windows 11, Dual Monitor 1080p + 4K)
- Console logs from `main.js` or renderer developer tools
