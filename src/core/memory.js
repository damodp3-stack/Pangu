const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class PanguMemory {
  constructor(dbPath, cryptoOptions = {}) {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.encryptFn = (typeof cryptoOptions.encrypt === 'function') ? cryptoOptions.encrypt : ((plain) => plain);
    this.decryptFn = (typeof cryptoOptions.decrypt === 'function') ? cryptoOptions.decrypt : ((cipher) => cipher);

    this.db = new Database(dbPath);

    // High-performance Pragmas for Desktop SQLite
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64 MB memory cache
    this.db.pragma('temp_store = MEMORY');

    this.initTables();
    this.initStatements();
    this.seedDefaultData();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pet_stats (
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

      CREATE TABLE IF NOT EXISTS api_keys (
        provider TEXT PRIMARY KEY,
        api_key TEXT,
        model TEXT,
        is_active INTEGER DEFAULT 0
      );

      -- High-performance query indexes
      CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(is_active);
    `);

    // Ensure RPG columns exist in existing databases
    try {
      const cols = this.db.pragma('table_info(pet_stats)').map(c => c.name);
      if (!cols.includes('level')) this.db.exec("ALTER TABLE pet_stats ADD COLUMN level INTEGER DEFAULT 1");
      if (!cols.includes('xp')) this.db.exec("ALTER TABLE pet_stats ADD COLUMN xp INTEGER DEFAULT 0");
      if (!cols.includes('friendship_title')) this.db.exec("ALTER TABLE pet_stats ADD COLUMN friendship_title TEXT DEFAULT 'Novice Companion'");
      if (!cols.includes('elemental_aura')) this.db.exec("ALTER TABLE pet_stats ADD COLUMN elemental_aura TEXT DEFAULT 'fire'");
    } catch (err) {
      console.warn('[PanguMemory] Migration check note:', err.message);
    }
  }

  initStatements() {
    // Cached Prepared Statements for zero recompilation overhead
    this.stmts = {
      getPref: this.db.prepare('SELECT value FROM preferences WHERE key = ?'),
      setPref: this.db.prepare('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)'),
      getAllPrefs: this.db.prepare('SELECT key, value FROM preferences'),

      getAllMemories: this.db.prepare('SELECT id, category, content, created_at FROM memories WHERE is_active = 1 ORDER BY id DESC'),
      addMemory: this.db.prepare('INSERT INTO memories (category, content) VALUES (?, ?)'),
      deleteMemory: this.db.prepare('UPDATE memories SET is_active = 0 WHERE id = ?'),

      addChat: this.db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)'),
      recentChat: this.db.prepare('SELECT role, content, timestamp FROM chat_history ORDER BY id DESC LIMIT ?'),
      clearChat: this.db.prepare('DELETE FROM chat_history'),

      getPetStats: this.db.prepare('SELECT * FROM pet_stats WHERE id = 1'),
      updateXp: this.db.prepare('UPDATE pet_stats SET xp = ?, level = ?, friendship_title = ? WHERE id = 1'),
      setAura: this.db.prepare('UPDATE pet_stats SET elemental_aura = ? WHERE id = 1'),
      updateStats: this.db.prepare(`
        UPDATE pet_stats 
        SET mood = ?, happiness = ?, energy = ?, hunger = ?, level = ?, xp = ?, friendship_title = ?, elemental_aura = ?
        WHERE id = 1
      `),

      getApiKey: this.db.prepare('SELECT * FROM api_keys WHERE provider = ?'),
      setApiKey: this.db.prepare(`
        INSERT OR REPLACE INTO api_keys (provider, api_key, model, is_active)
        VALUES (?, ?, ?, 1)
      `),
      getAllApiKeys: this.db.prepare(`
        SELECT provider, model, is_active, 
               CASE WHEN api_key IS NOT NULL AND length(api_key) > 4 
                    THEN substr(api_key, 1, 4) || '...' 
                    ELSE '' 
               END as masked_key 
        FROM api_keys
      `)
    };
  }

  seedDefaultData() {
    // Default Preferences
    this.stmts.setPref.run('user_name', 'Damo');
    this.stmts.setPref.run('theme', 'dark'); // 'dark' = Fire Obsidian Ember, 'light' = Frost Celestial Blue
    this.stmts.setPref.run('language_preference', 'tanglish');
    this.stmts.setPref.run('sound_enabled', 'true');
    this.stmts.setPref.run('activity_level', 'balanced');
    this.stmts.setPref.run('screen_permission', 'false');
    this.stmts.setPref.run('mic_permission', 'false');

    // Default Seed Memories
    const countMemories = this.db.prepare('SELECT COUNT(*) as count FROM memories').get().count;
    if (countMemories === 0) {
      this.stmts.addMemory.run('profile', 'Name: Damo');
      this.stmts.addMemory.run('project', 'Building PANGU - AI Best Friend & Desktop Companion');
      this.stmts.addMemory.run('interest', 'Loves coding, AI, tech, and building big dreams');
      this.stmts.addMemory.run('language', 'Enjoys Tamil + English (Tanglish) friendly communication');
      this.stmts.addMemory.run('tech', 'Windows 11, Google Gemini API, SQLite local memory');
    }

    // Default Pet Stats
    const statsCount = this.db.prepare('SELECT COUNT(*) as count FROM pet_stats').get().count;
    if (statsCount === 0) {
      this.db.prepare(`
        INSERT INTO pet_stats (id, mood, happiness, energy, hunger)
        VALUES (1, 'Happy', 95, 90, 20)
      `).run();
    }
  }

  // Preferences
  getPreference(key, defaultValue = null) {
    const row = this.stmts.getPref.get(key);
    return row ? row.value : defaultValue;
  }

  setPreference(key, value) {
    this.stmts.setPref.run(key, String(value));
  }

  getAllPreferences() {
    const rows = this.stmts.getAllPrefs.all();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  // Memories
  getAllMemories() {
    return this.stmts.getAllMemories.all();
  }

  addMemory(category, content) {
    const res = this.stmts.addMemory.run(category, content);
    return res.lastInsertRowid;
  }

  deleteMemory(id) {
    this.stmts.deleteMemory.run(id);
  }

  // Chat History
  addChatMessage(role, content) {
    this.stmts.addChat.run(role, content);
  }

  getRecentChatHistory(limit = 20) {
    const rows = this.stmts.recentChat.all(limit);
    return rows.reverse();
  }

  clearChatHistory() {
    this.stmts.clearChat.run();
  }

  // Pet Stats & RPG Progression
  getTitleForLevel(level) {
    if (level >= 50) return 'Mythic Desktop Guardian 👑🔥';
    if (level >= 35) return 'Celestial Kitsune Fox 🦊✨';
    if (level >= 20) return 'Loyal Brother Machi 💎';
    if (level >= 10) return 'Code Warrior Pal ⚔️';
    if (level >= 5) return 'Desk Explorer 🌟';
    return 'Novice Companion 🐾';
  }

  getPetStats() {
    let row = this.stmts.getPetStats.get();
    if (!row) {
      try {
        this.db.prepare(`
          INSERT OR IGNORE INTO pet_stats (id, mood, happiness, energy, hunger, level, xp, friendship_title, elemental_aura)
          VALUES (1, 'Happy', 95, 90, 20, 1, 0, 'Novice Companion', 'fire')
        `).run();
        row = this.stmts.getPetStats.get() || {};
      } catch (e) {
        row = {};
      }
    }
    row.level = row.level || 1;
    row.xp = row.xp || 0;
    row.nextLevelXp = row.level * 100;
    row.friendship_title = row.friendship_title || this.getTitleForLevel(row.level);
    row.elemental_aura = row.elemental_aura || 'fire';
    return row;
  }

  addXp(amount) {
    const parsedAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount)
      ? Math.min(1000, Math.max(1, Math.floor(amount)))
      : 10;
    const stats = this.getPetStats();
    let currentXp = (stats.xp || 0) + parsedAmount;
    let currentLevel = stats.level || 1;
    let leveledUp = false;
    const oldLevel = currentLevel;

    let neededXp = currentLevel * 100;
    while (currentXp >= neededXp) {
      currentXp -= neededXp;
      currentLevel += 1;
      leveledUp = true;
      neededXp = currentLevel * 100;
    }

    const title = this.getTitleForLevel(currentLevel);
    this.stmts.updateXp.run(currentXp, currentLevel, title);

    const updated = this.getPetStats();
    return {
      leveledUp,
      oldLevel,
      newLevel: currentLevel,
      title,
      xp: currentXp,
      nextLevelXp: currentLevel * 100,
      stats: updated
    };
  }

  setElementalAura(aura) {
    const valid = ['fire', 'thunder', 'frost', 'void'];
    const chosen = valid.includes(aura) ? aura : 'fire';
    this.stmts.setAura.run(chosen);
    return this.getPetStats();
  }

  updatePetStats(updates = {}) {
    const current = this.getPetStats();
    const happiness = Math.max(0, Math.min(100, updates.happiness !== undefined ? updates.happiness : current.happiness));
    const energy = Math.max(0, Math.min(100, updates.energy !== undefined ? updates.energy : current.energy));
    const hunger = Math.max(0, Math.min(100, updates.hunger !== undefined ? updates.hunger : current.hunger));
    const mood = updates.mood || (happiness > 80 ? 'Happy' : happiness > 50 ? 'Curious' : 'Sleepy');
    const level = updates.level !== undefined ? updates.level : (current.level || 1);
    const xp = updates.xp !== undefined ? updates.xp : (current.xp || 0);
    const friendship_title = updates.friendship_title || current.friendship_title || this.getTitleForLevel(level);
    const elemental_aura = updates.elemental_aura || current.elemental_aura || 'fire';

    this.stmts.updateStats.run(mood, happiness, energy, hunger, level, xp, friendship_title, elemental_aura);
    return this.getPetStats();
  }

  // API Keys (Encrypted at rest)
  getApiKey(provider = 'gemini') {
    const row = this.stmts.getApiKey.get(provider);
    if (!row) return null;
    let decrypted = row.api_key;
    if (row.api_key) {
      try {
        decrypted = this.decryptFn(row.api_key);
      } catch (err) {
        console.warn(`[PanguMemory] Could not decrypt key for ${provider}:`, err.message);
      }
    }
    return {
      ...row,
      api_key: decrypted
    };
  }

  setApiKey(provider, apiKey, model = '') {
    const cleanKey = (apiKey || '').trim();
    let storedKey = cleanKey;
    if (cleanKey) {
      storedKey = this.encryptFn(cleanKey);
    }
    this.stmts.setApiKey.run(provider, storedKey, model);
  }

  clearAllApiKeys() {
    this.db.prepare('DELETE FROM api_keys').run();
  }

  getAllApiKeys() {
    const rows = this.stmts.getAllApiKeys.all();
    return rows.map((r) => {
      let rawKey = '';
      try {
        const full = this.stmts.getApiKey.get(r.provider);
        rawKey = full && full.api_key ? this.decryptFn(full.api_key) : '';
      } catch (e) {}
      const masked = rawKey && rawKey.length > 4 ? rawKey.slice(0, 4) + '...' : (rawKey ? '••••' : '');
      return {
        provider: r.provider,
        model: r.model,
        is_active: r.is_active,
        masked_key: masked
      };
    });
  }

  close() {
    try {
      this.db.close();
    } catch (e) {}
  }
}

module.exports = PanguMemory;
