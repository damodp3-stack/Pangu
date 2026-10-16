# 📖 PANGU User Guide

Welcome to **PANGU** — your 3D Native AI Desktop Best Friend! This guide covers everything from initial setup and controls to advanced multimodal interactions, mini-games, and RPG progression.

---

## 🚀 Getting Started

### 1. Starting Pangu
- **Option A (Double-Click):** Double-click `run_pangu.bat` in the project root.
- **Option B (Command Line):**
  ```bash
  npm start
  ```

### 2. Setting Up Your Google Gemini API Key (Optional but Recommended)
Pangu works 100% offline with its built-in friendly companion brain, but connecting a free Gemini API key unlocks Google-tier intelligence, screen vision, and code reviews!

1. Get a free API key from [Google AI Studio](https://aistudio.google.com).
2. Right-click Pangu to open the context menu.
3. Select **⚙️ Settings & API Key**.
4. Paste your key in the **Google Gemini API Key** field and click **Save Settings**.
*(Alternatively, create a `.env` file with `GEMINI_API_KEY=your_key_here`)*

---

## 🎮 How to Interact with Pangu

### 🖱️ Mouse Gestures
| Gesture | Action | Result |
| :--- | :--- | :--- |
| **Left-Click (Short)** | Pet / Touch | Pangu reacts happily, chirps/purrs, and awards friendship XP! |
| **Left-Click & Drag** | Pick Up & Drop | Pangu dangles in 3D physics and falls with gravity when released! |
| **Double-Click** | Open Talk Pill | Brings up the floating chat input bar beside Pangu. |
| **Right-Click** | Context Menu | Opens the circular RPG menu with all skills, toys, and settings. |
| **Rub Back & Forth** | Petting Fur | Pangu closes its eyes in bliss and purrs with harmonic vibrations. |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **`Spacebar`** | Open floating talk input pill beside Pangu |
| **`Ctrl + Shift + S`** | Quick screen inspection (Pangu inspects your active monitor) |
| **`Ctrl + Shift + P`** | **Emergency Privacy Switch** (Instantly pauses and freezes Pangu) |
| **`L`** | Toggle Red Laser Pointer Chase mini-game |
| **`B`** | Toss Bouncy Toy Ball across desktop |
| **`Tab`** | Jump to Next Monitor *(Multi-monitor setups only)* |
| **`M`** | Toggle Mute / Sound Effects |
| **`Escape`** | Close talk bar or menus |

---

## 📁 Multimodal Drag & Drop Ingestion

You can drag files from Windows Explorer directly onto Pangu's 3D body!

- **🖼️ Images / Screenshots (`.png`, `.jpg`, `.webp`):**
  Drag any screenshot or mockup onto Pangu. Pangu catches the file in its paws and delivers visual insights and debug feedback in natural Tanglish.
- **💻 Code & Text Files (`.js`, `.py`, `.html`, `.css`, `.json`, `.md`, `.cpp`, etc.):**
  Drop any script onto Pangu. Pangu reads the code, reviews logic, detects bugs, and offers brotherly coding advice!

---

## 🍅 Pomodoro Deep Work Focus Buddy

Stay productive and defeat procrastination with Pangu!
1. Right-click Pangu and select **🍅 Focus Buddy: 25m Pomodoro**.
2. A sleek floating countdown badge attaches above Pangu.
3. Pangu stands guard on your desktop keeping you on track.
4. Completing a 25-minute deep focus session triggers celebration acrobatics, fanfare, and **+50 XP**!

---

## 🔴 Mini-Games & Desktop Toys

### 1. Laser Pointer Chase (`L` or Menu)
- A glowing neon red laser dot tracks your mouse cursor.
- Pangu spots the dot, crouches into an excited butt-wiggle, sprints at 280 px/s, and pounces with somersaults!

### 2. Bouncy Toy Ball Fetch (`B` or Menu)
- Toss an elastic energy ball across your desktop floor.
- Simulated with real gravity, floor bounces, and boundary wall ricochets.
- Pangu chases the ball, bats it back into the air, and brings it back to you!

---

## ⚔️ RPG Leveling & Friendship Mastery

Every interaction with Pangu earns Friendship XP!
- **Chatting:** +15 XP
- **Screen & Image Vision:** +25 to +30 XP
- **Petting & Cuddling:** +8 to +12 XP
- **Playing Mini-Games:** +15 XP
- **Focus Sessions:** +50 XP

### Titles Unlocked:
- 🐾 **Level 1 - 4:** *Novice Companion*
- 🌟 **Level 5 - 9:** *Desk Explorer*
- ⚔️ **Level 10 - 19:** *Code Warrior Pal*
- 💎 **Level 20 - 34:** *Loyal Brother Machi*
- 🦊✨ **Level 35 - 49:** *Celestial Kitsune Fox*
- 👑🔥 **Level 50+:** *Mythic Desktop Guardian*

---

## ⚡ 4 Elemental Magic Auras

Cycle elemental visual effects via context menu or settings:
1. 🔥 **Fire Obsidian:** Floating ember sparks and fiery rim light.
2. ⚡ **Thunder Lightning:** Electric sparks and dynamic crackling aura.
3. ❄️ **Frost Crystal:** Crystalline snowflake particles and celestial blue shimmer.
4. 🌌 **Cosmic Void:** Swirling nebula starlight and violet energy.

---

## 🦊 Switching 3D Mascots

Open **Settings** or click **Switch Mascot** in the menu to choose between:
- 🦊 **Mystic Kitsune Fox** (Classic celestial fox rig)
- ⚔️ **Sellsword Fox** (Armored warrior fox rig)
- 🐉 **Cyber Dragon** (High-tech mythic dragon)
- 🐱 **Kawaii Shadow Kitty** (Cute feline desktop companion)

---

## 🛡️ Privacy & Security

- **Zero Invisible Telemetry:** Pangu connects only to Google Gemini API (if configured) using official Google SDKs.
- **Local SQLite DB:** Your chats, preferences, and memories remain on your machine inside `data/pangu_memory.db`.
- **Emergency Panic Switch:** Press **`Ctrl + Shift + P`** anytime to immediately freeze Pangu and halt all screen/mic interaction.
