const { describe, it } = require('node:test');
const assert = require('node:assert');
const PanguMemory = require('../src/core/memory.js');
const PanguBrain = require('../src/core/brain.js');

describe('Onboarding & Gender-Adaptive Cognitive Engine', () => {
  it('stores and retrieves rich profile preferences including companion_bond and visual_style', () => {
    const memory = new PanguMemory(':memory:');

    memory.setPreference('user_name', 'Ananya');
    memory.setPreference('user_gender', 'female');
    memory.setPreference('user_dob', '2002-05-18');
    memory.setPreference('user_age', '24');
    memory.setPreference('companion_bond', 'sister');
    memory.setPreference('visual_style', 'celestial_garden');
    memory.setPreference('onboarding_complete', 'true');

    const prefs = memory.getAllPreferences();
    assert.strictEqual(prefs.user_name, 'Ananya');
    assert.strictEqual(prefs.user_gender, 'female');
    assert.strictEqual(prefs.companion_bond, 'sister');
    assert.strictEqual(prefs.visual_style, 'celestial_garden');
    assert.strictEqual(prefs.onboarding_complete, 'true');
    memory.db.close();
  });

  it('adapts brain system prompt with caring sister dynamic and celestial garden for female user', () => {
    const memory = new PanguMemory(':memory:');
    memory.setPreference('user_name', 'Priya');
    memory.setPreference('user_gender', 'female');
    memory.setPreference('companion_bond', 'sister');
    memory.setPreference('visual_style', 'celestial_garden');

    const brain = new PanguBrain(memory);
    const prompt = brain.getSystemPrompt();

    assert.ok(prompt.includes('Priya'));
    assert.ok(prompt.includes('User Profile: Female'));
    assert.ok(prompt.includes('Caring Sister / Thangom / Akka'));
    assert.ok(prompt.includes('thangom'));
    assert.ok(prompt.includes('Celestial Garden'));
    memory.db.close();
  });

  it('adapts brain system prompt with brotherly camaraderie for male user', () => {
    const memory = new PanguMemory(':memory:');
    memory.setPreference('user_name', 'Karthik');
    memory.setPreference('user_gender', 'male');
    memory.setPreference('companion_bond', 'bestie');

    const brain = new PanguBrain(memory);
    const prompt = brain.getSystemPrompt();

    assert.ok(prompt.includes('Karthik'));
    assert.ok(prompt.includes('User Profile: Male'));
    assert.ok(prompt.includes('machi'));
    assert.ok(prompt.includes('bro'));
    memory.db.close();
  });

  it('local fallback replies address female user with affectionate terms', () => {
    const memory = new PanguMemory(':memory:');
    memory.setPreference('user_name', 'Deepa');
    memory.setPreference('user_gender', 'female');
    memory.setPreference('companion_bond', 'sister');
    memory.setPreference('language_preference', 'tanglish');

    const brain = new PanguBrain(memory);
    const reply = brain.localFallbackResponse('Hi Pangu');
    assert.ok(reply.text.includes('Deepa thangom'));
    memory.db.close();
  });

  it('detects user birthday and celebrates in local fallback response', () => {
    const memory = new PanguMemory(':memory:');
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dobString = `2000-${month}-${day}`;

    memory.setPreference('user_name', 'Sara');
    memory.setPreference('user_gender', 'female');
    memory.setPreference('user_dob', dobString);
    memory.setPreference('language_preference', 'tanglish');

    const brain = new PanguBrain(memory);
    const reply = brain.localFallbackResponse('Hi pangu birthday today');
    assert.ok(reply.text.includes('Happy Birthday'));
    assert.strictEqual(reply.action, 'CELEBRATE');
    memory.db.close();
  });
});
