# 🔌 PANGU API & IPC Reference

This document provides complete documentation of the Inter-Process Communication (IPC) interfaces exposed between the Electron Main process and Renderer, as well as the SQLite database schema and companion action protocol.

---

## 🌐 ContextBridge API (`window.panguAPI`)

Exposed securely to the renderer process via `preload.js`:

### 1. Mouse & Screen Pass-Through
```typescript
panguAPI.setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): void
```
- Controls OS-level mouse click transparency.
- `ignore = true`: Mouse clicks fall straight through to background desktop and native Windows apps.
- `ignore = false`: Intercepts mouse clicks over interactive Pangu elements (hit box, menus, inputs).

---

### 2. Conversational AI & Multimodal Vision
```typescript
panguAPI.sendMessage(message: string): Promise<{ text: string, action: string }>
```
- Sends a text message to Pangu's brain.
- Returns AI text response and an action emotion tag (e.g., `HAPPY`, `EXCITED`, `CELEBRATE`).

```typescript
panguAPI.sendVisionMessage(message: string, customBase64?: string): Promise<{ text: string, action: string }>
```
- Analyzes an image with Google Gemini Multimodal Vision.
- **Privacy Gated:** Requires both `screen_permission === 'true'` and `isPaused === false`. All vision requests (including caller-supplied `customBase64` or dropped files) are blocked if permission is disabled or emergency panic is active.
- If `customBase64` is provided (e.g. from drag & drop), it analyzes that image buffer.
- If omitted, captures the active screen monitor nearest the user cursor.

```typescript
panguAPI.captureScreen(): Promise<string | null>
```
- Captures the active monitor and returns a JPEG base64 string.
- Returns `null` immediately if screen permission is not granted or if emergency panic mode is active.

```typescript
panguAPI.getChatHistory(): Promise<Array<{ role: string, content: string, timestamp: string }>>
panguAPI.clearChatHistory(): Promise<boolean>
```

---

### 3. Pet State & RPG Progression
```typescript
panguAPI.getPetStats(): Promise<PetStats>
```
Returns:
```typescript
interface PetStats {
  id: number;
  mood: string;
  happiness: number;
  energy: number;
  hunger: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  friendship_title: string;
  elemental_aura: 'fire' | 'thunder' | 'frost' | 'void';
}
```

```typescript
panguAPI.feedPet(): Promise<PetStats & { xpResult: XpResult }>
panguAPI.playPet(): Promise<PetStats & { xpResult: XpResult }>
panguAPI.cuddlePet(): Promise<PetStats & { xpResult: XpResult }>
panguAPI.addXp(amount: number): Promise<XpResult>
panguAPI.setElementalAura(aura: string): Promise<PetStats>
```

```typescript
interface XpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  title: string;
  xp: number;
  nextLevelXp: number;
  stats: PetStats;
}
```

---

### 4. Event Subscriptions
```typescript
panguAPI.onPetStateChange(callback: (data: { newState: string, prevState: string }) => void): void
panguAPI.onLevelUp(callback: (data: XpResult) => void): void
panguAPI.onPanicToggle(callback: (isPaused: boolean) => void): void
panguAPI.onTriggerVision(callback: () => void): void
panguAPI.onDisplaysUpdated(callback: (data: { bounds: DisplayBounds, displays: DisplayInfo[] }) => void): void
```

---

### 5. Multi-Monitor Displays
```typescript
panguAPI.getDisplays(): Promise<{
  bounds: { x: number, y: number, width: number, height: number },
  displays: Array<{ id: number, index: number, bounds: Rectangle, isPrimary: boolean }>
}>
```

---

## 🗄️ SQLite Database Schema (`data/pangu_memory.db`)

### 1. `preferences`
Stores application configuration key-value pairs:
```sql
CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```
Standard keys:
- `user_name`: Name of user (default: `"Damo"`).
- `theme`: `"dark"` (Fire Obsidian) or `"light"` (Frost Celestial).
- `character`: `"fox"`, `"sellsword_fox"`, `"dragon"`, `"cat"`.
- `sound_enabled`: `"true"` | `"false"`.
- `voice_mode`: `"acoustic"`, `"tts"`, `"both"`.
- `celestial_wings`: `"true"` | `"false"`.

### 2. `pet_stats`
Stores companion state and RPG progression:
```sql
CREATE TABLE pet_stats (
  id INTEGER PRIMARY KEY,
  mood TEXT DEFAULT 'Happy',
  happiness INTEGER DEFAULT 95,
  energy INTEGER DEFAULT 90,
  hunger INTEGER DEFAULT 20,
  last_fed DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_slept DATETIME DEFAULT CURRENT_TIMESTAMP,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  friendship_title TEXT DEFAULT 'Novice Companion',
  elemental_aura TEXT DEFAULT 'fire'
);
```

### 3. `chat_history`
Maintains conversational history:
```sql
CREATE TABLE chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,       -- 'user' or 'pangu'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_timestamp ON chat_history(timestamp);
```

### 4. `memories`
Stores personalized semantic memories about the user:
```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_active ON memories(is_active);
```

### 5. `api_keys`
Stores provider credentials encrypted at rest using Windows DPAPI via Electron's `safeStorage`:
```sql
CREATE TABLE api_keys (
  provider TEXT PRIMARY KEY,
  api_key TEXT,               -- Stored as 'enc_dpapi:<base64>' cipher
  model TEXT,
  is_active INTEGER DEFAULT 0
);
```
- **Fail-Closed Encryption:** If `safeStorage` is unavailable, key saves fail closed to prevent accidental plaintext leaks.
- **Backward Compatibility:** Legacy plaintext keys in pre-existing databases remain readable.
- **Masking:** `getAllApiKeys()` masks keys (e.g. `AIza...`) before sending to renderer.

---

## 🏷️ Structured Action Tags Reference

Responses from `PanguBrain` append structured emotional action tags to animate the 3D rig:

| Action Tag | Emotional Meaning | 3D Physical Rig Reaction |
| :--- | :--- | :--- |
| `[ACTION:HAPPY]` | Cheerful / Smiling | Ear twitch, tail wag, gentle hop |
| `[ACTION:EXCITED]` | Hyped / Motivated | 360° somersault roll flip |
| `[ACTION:CELEBRATE]` | Victory / Milestone | Superhero jump, star particles, arpeggio chime |
| `[ACTION:LOVE]` | Heartfelt / Purr | Eye close, heart particles, LFO purr |
| `[ACTION:CURIOUS]` | Inquisitive | Head tilt, ear perk, curious chirp |
| `[ACTION:STRETCH]` | Resting / Taking a break | Arch back, stretch front paws, yawn |
| `[ACTION:PLAYFUL_WIGGLE]` | Before pouncing | Butt-wiggle, tail wag |
| `[ACTION:GROOM]` | Relaxed | Paw wash and face groom |
| `[ACTION:SURVEY]` | Looking around desktop | Slow gaze sweep left and right |
| `[ACTION:FLY]` | Elemental magic surge | Elemental nova burst & particle explosion |
| `[ACTION:SLEEPY]` | Resting | Curl into a ball, close eyes, gentle harmonic lullaby |
