const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const PanguMemory = require('../src/core/memory');

describe('PanguMemory SQLite Core', () => {
  let dbPath;
  let memory;

  beforeEach(() => {
    dbPath = path.join(__dirname, '..', 'scratch', `test_mem_${Date.now()}_${Math.random().toString(36).slice(2)}.db`);
    // Mock simple reversible cipher for test isolation
    const mockCrypto = {
      encrypt: (text) => 'mock_enc:' + Buffer.from(text).toString('base64'),
      decrypt: (cipher) => {
        if (cipher.startsWith('mock_enc:')) {
          return Buffer.from(cipher.slice(9), 'base64').toString('utf8');
        }
        return cipher;
      }
    };
    memory = new PanguMemory(dbPath, mockCrypto);
  });

  afterEach(() => {
    if (memory) memory.close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const walFile = dbPath + '-wal';
    const shmFile = dbPath + '-shm';
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
  });

  test('initializes default preferences, memories, and pet stats', () => {
    const prefs = memory.getAllPreferences();
    assert.equal(prefs.user_name, '');
    assert.equal(prefs.theme, 'dark');

    const stats = memory.getPetStats();
    assert.equal(stats.level, 1);
    assert.equal(stats.xp, 0);
    assert.equal(stats.elemental_aura, 'fire');

    const memories = memory.getAllMemories();
    assert.ok(memories.length > 0, 'Should seed initial memories');
  });

  test('preferences set and get', () => {
    memory.setPreference('theme', 'light');
    assert.equal(memory.getPreference('theme'), 'light');
    assert.equal(memory.getPreference('non_existent', 'default_val'), 'default_val');
  });

  test('memories add and soft-delete', () => {
    const id = memory.addMemory('custom_cat', 'Damo loves building 3D companions');
    assert.ok(id > 0);

    const all = memory.getAllMemories();
    const found = all.find(m => m.id === id);
    assert.ok(found);
    assert.equal(found.content, 'Damo loves building 3D companions');

    memory.deleteMemory(id);
    const afterDelete = memory.getAllMemories();
    assert.equal(afterDelete.find(m => m.id === id), undefined);
  });

  test('chat history add, retrieve, and clear', () => {
    memory.addChatMessage('user', 'Hello Pangu!');
    memory.addChatMessage('pangu', 'Vanakkam da!');

    const recent = memory.getRecentChatHistory(10);
    assert.equal(recent.length, 2);
    assert.equal(recent[0].role, 'user');
    assert.equal(recent[0].content, 'Hello Pangu!');
    assert.equal(recent[1].role, 'pangu');

    memory.clearChatHistory();
    assert.equal(memory.getRecentChatHistory(10).length, 0);
  });

  test('addXp calculation and level up', () => {
    const res1 = memory.addXp(50);
    assert.equal(res1.leveledUp, false);
    assert.equal(res1.xp, 50);
    assert.equal(res1.newLevel, 1);

    // 50 + 60 = 110 >= 100 -> Level 2 with 10 leftover XP
    const res2 = memory.addXp(60);
    assert.equal(res2.leveledUp, true);
    assert.equal(res2.newLevel, 2);
    assert.equal(res2.xp, 10);
  });

  test('addXp sanitizes invalid or abusive inputs', () => {
    const beforeStats = memory.getPetStats();
    memory.addXp(-500); // negative input
    const afterNeg = memory.getPetStats();
    assert.ok(afterNeg.xp >= beforeStats.xp, 'Negative XP should be clamped');

    memory.addXp('invalid_string');
    const afterStr = memory.getPetStats();
    assert.ok(afterStr.xp >= afterNeg.xp, 'Invalid XP should use safe default');

    memory.addXp(1e9); // massive overflow attempt
    const afterHuge = memory.getPetStats();
    // Clamped to max 1000 per request
    assert.ok(afterHuge.level <= 15, 'Massive XP should be clamped to safe boundary');
  });

  test('setElementalAura validates whitelist', () => {
    memory.setElementalAura('thunder');
    assert.equal(memory.getPetStats().elemental_aura, 'thunder');

    memory.setElementalAura('frost');
    assert.equal(memory.getPetStats().elemental_aura, 'frost');

    // Invalid aura should fallback to default 'fire'
    memory.setElementalAura('nuclear_plasma_hack');
    assert.equal(memory.getPetStats().elemental_aura, 'fire');
  });

  test('encrypts API keys at rest and decrypts accurately', () => {
    memory.setApiKey('gemini', 'AIzaSy_Secret_Test_Key_12345', 'gemini-2.5-flash');

    // Verify row in database is encrypted
    const rawRow = memory.db.prepare('SELECT api_key FROM api_keys WHERE provider = ?').get('gemini');
    assert.ok(rawRow.api_key.startsWith('mock_enc:'), 'Database row should store cipher, not plaintext');
    assert.ok(!rawRow.api_key.includes('AIzaSy_Secret_Test_Key_12345'), 'Plaintext must not be stored in DB');

    // Verify getApiKey decrypts properly
    const keyRec = memory.getApiKey('gemini');
    assert.equal(keyRec.api_key, 'AIzaSy_Secret_Test_Key_12345');
    assert.equal(keyRec.model, 'gemini-2.5-flash');

    // Verify getAllApiKeys masks the key
    const all = memory.getAllApiKeys();
    assert.equal(all.length, 1);
    assert.equal(all[0].masked_key, 'AIza...');

    // Verify clearAllApiKeys wipes credentials
    memory.clearAllApiKeys();
    assert.equal(memory.getApiKey('gemini'), null);
  });

  test('does not persist API keys when encryption fails', () => {
    memory.encryptFn = () => { throw new Error('encryption unavailable'); };
    assert.throws(() => memory.setApiKey('gemini', 'secret-key'), /encryption unavailable/);
    assert.equal(memory.stmts.getApiKey.get('gemini'), undefined);
  });
});
