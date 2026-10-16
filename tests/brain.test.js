const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const PanguBrain = require('../src/core/brain');

describe('PanguBrain Cognitive Core', () => {
  const mockMemory = {
    getAllPreferences: () => ({
      user_name: 'DamoTester',
      language_preference: 'tanglish',
      theme: 'dark'
    }),
    getAllMemories: () => [
      { category: 'profile', content: 'Building Pangu 3D Companion' },
      { category: 'hobby', content: 'Loves Three.js and AI' }
    ],
    getPetStats: () => ({
      mood: 'Happy',
      happiness: 95,
      energy: 90
    }),
    getApiKey: () => null,
    getRecentChatHistory: () => [
      { role: 'user', content: 'Hi Pangu' },
      { role: 'pangu', content: 'Hello DamoTester!' },
      { role: 'user', content: 'Tell me a joke' }
    ]
  };

  test('generates system prompt including custom user name and memories', () => {
    const brain = new PanguBrain(mockMemory);
    const prompt = brain.getSystemPrompt();

    assert.ok(prompt.includes('DamoTester'), 'System prompt should incorporate user_name');
    assert.ok(prompt.includes('Building Pangu 3D Companion'), 'System prompt should incorporate user memories');
    assert.ok(prompt.includes('[ACTION:HAPPY]'), 'System prompt should declare action tags');
  });

  test('parses action tags from AI replies cleanly', () => {
    const brain = new PanguBrain(mockMemory);
    const parsed = brain.parseResponse("Kandippa machi, lets build it! [ACTION:EXCITED]");

    assert.equal(parsed.text, "Kandippa machi, lets build it!");
    assert.equal(parsed.action, "EXCITED");

    const defaultAction = brain.parseResponse("Simple plain text response without action tag");
    assert.equal(defaultAction.action, "HAPPY");
    assert.equal(defaultAction.text, "Simple plain text response without action tag");
  });

  test('buildNormalizedHistory guarantees strictly alternating user/model turns', () => {
    const customMemory = {
      ...mockMemory,
      getRecentChatHistory: () => [
        { role: 'pangu', content: 'Ignored initial model greeting' },
        { role: 'user', content: 'Message 1' },
        { role: 'user', content: 'Message 2' }, // Consecutive user message
        { role: 'pangu', content: 'Reply 1' }
      ]
    };

    const brain = new PanguBrain(customMemory);
    const history = brain.buildNormalizedHistory('Current query');

    assert.ok(history.length >= 2);
    assert.equal(history[0].role, 'user');
    assert.equal(history[0].text, 'Message 1\nMessage 2', 'Consecutive identical roles should be merged');
    assert.equal(history[1].role, 'model');
  });

  test('localFallbackResponse dynamically adapts to custom user_name', () => {
    const brain = new PanguBrain(mockMemory);

    const greeting = brain.localFallbackResponse('Hello there');
    assert.ok(greeting.text.includes('DamoTester'), 'Greeting should address the user by their configured name');
    assert.equal(greeting.action, 'EXCITED');

    const sleep = brain.localFallbackResponse('thoongu machi');
    assert.equal(sleep.action, 'SLEEPY');

    const motivate = brain.localFallbackResponse('super project done');
    assert.equal(motivate.action, 'CELEBRATE');
  });

  test('withTimeout helper aborts long-hanging promises', async () => {
    const brain = new PanguBrain(mockMemory);
    const slowPromise = new Promise(resolve => setTimeout(resolve, 500));

    await assert.rejects(
      async () => {
        await brain.withTimeout(slowPromise, 50);
      },
      /timed out after 50ms/
    );

    const fastPromise = Promise.resolve('ok');
    const result = await brain.withTimeout(fastPromise, 500);
    assert.equal(result, 'ok');
  });
});
