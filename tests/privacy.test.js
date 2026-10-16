const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const PrivacyManager = require('../src/core/privacy');

describe('PrivacyManager Security & Permissions', () => {
  let prefs;
  let mockMemory;
  let panicEvents;
  let privacy;

  beforeEach(() => {
    prefs = {
      screen_permission: 'false',
      mic_permission: 'false',
      camera_permission: 'false'
    };
    panicEvents = [];
    mockMemory = {
      getAllPreferences: () => ({ ...prefs }),
      setPreference: (k, v) => { prefs[k] = String(v); },
      clearChatHistory: () => {},
      getAllMemories: () => [{ id: 1, content: 'test' }],
      deleteMemory: () => {},
      clearAllApiKeys: () => {}
    };
    privacy = new PrivacyManager(mockMemory, (isPaused) => {
      panicEvents.push(isPaused);
    });
  });

  test('emergency panic toggle activates and notifies listener', () => {
    assert.equal(privacy.isPaused, false);

    const paused = privacy.toggleEmergencyPause();
    assert.equal(paused, true);
    assert.equal(privacy.isPaused, true);
    assert.deepEqual(panicEvents, [true]);

    const resumed = privacy.toggleEmergencyPause();
    assert.equal(resumed, false);
    assert.equal(privacy.isPaused, false);
    assert.deepEqual(panicEvents, [true, false]);
  });

  test('canCaptureScreen gates screen capture based on permissions and panic state', () => {
    // Default: screen_permission is 'false'
    assert.equal(privacy.canCaptureScreen(), false);

    // Enable screen permission
    privacy.setPermission('screen_permission', true);
    assert.equal(privacy.canCaptureScreen(), true);

    // If emergency panic is active, screen capture must be strictly blocked
    privacy.toggleEmergencyPause();
    assert.equal(privacy.isPaused, true);
    assert.equal(privacy.canCaptureScreen(), false, 'Panic mode must block capture even if permission was enabled');

    // Resume from panic
    privacy.toggleEmergencyPause();
    assert.equal(privacy.canCaptureScreen(), true);

    // Revoke permission
    privacy.setPermission('screen_permission', false);
    assert.equal(privacy.canCaptureScreen(), false);
  });

  test('screen vision requires an active privacy manager with screen permission', () => {
    assert.equal(PrivacyManager.canUseScreenVision(null), false);
    assert.equal(PrivacyManager.canUseScreenVision(privacy), false);

    privacy.setPermission('screen_permission', true);
    assert.equal(PrivacyManager.canUseScreenVision(privacy), true);

    privacy.toggleEmergencyPause();
    assert.equal(PrivacyManager.canUseScreenVision(privacy), false);
  });

  test('wipeAllData cleans chat, memories, and API keys', () => {
    let chatCleared = false;
    let memoriesDeleted = 0;
    let keysCleared = false;

    const customMemory = {
      ...mockMemory,
      clearChatHistory: () => { chatCleared = true; },
      getAllMemories: () => [{ id: 10 }, { id: 20 }],
      deleteMemory: () => { memoriesDeleted++; },
      clearAllApiKeys: () => { keysCleared = true; }
    };

    const pm = new PrivacyManager(customMemory);
    const result = pm.wipeAllData();

    assert.equal(result.success, true);
    assert.equal(chatCleared, true);
    assert.equal(memoriesDeleted, 2);
    assert.equal(keysCleared, true);
  });
});
