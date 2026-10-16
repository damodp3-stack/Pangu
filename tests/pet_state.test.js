const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const PetStateMachine = require('../src/core/pet_state');

describe('PetStateMachine Core Logic', () => {
  let stats;
  let mockMemory;
  let stateChanges;
  let levelUps;
  let machine;

  beforeEach(() => {
    stats = {
      hunger: 50,
      happiness: 50,
      energy: 50,
      mood: 'Happy',
      level: 1,
      xp: 0
    };
    stateChanges = [];
    levelUps = [];

    mockMemory = {
      getPetStats: () => ({ ...stats }),
      updatePetStats: (updates) => {
        stats = { ...stats, ...updates };
        return { ...stats };
      },
      addXp: (amt) => {
        stats.xp += amt;
        const leveledUp = stats.xp >= 100;
        if (leveledUp) {
          stats.level += 1;
          stats.xp -= 100;
        }
        return { leveledUp, newLevel: stats.level, xp: stats.xp };
      }
    };

    machine = new PetStateMachine(
      mockMemory,
      (newState, prevState) => stateChanges.push({ newState, prevState }),
      (lvl) => levelUps.push(lvl)
    );
  });

  afterEach(() => {
    if (machine) machine.destroy();
  });

  test('initializes with default IDLE state', () => {
    assert.equal(machine.state, 'IDLE');
  });

  test('feeding pet reduces hunger and boosts happiness & XP', () => {
    const result = machine.feed();
    assert.ok(result.hunger < 50, 'Hunger should decrease');
    assert.ok(result.happiness > 50, 'Happiness should increase');
    assert.equal(machine.state, 'HAPPY');
  });

  test('playing with pet expends energy and boosts mood', () => {
    const result = machine.play();
    assert.ok(result.energy < 50, 'Energy should be expended');
    assert.ok(result.happiness > 50, 'Happiness should increase');
    assert.equal(result.mood, 'Excited');
    assert.equal(machine.state, 'PLAYING');
  });

  test('cuddling increases happiness safely', () => {
    const result = machine.cuddle();
    assert.ok(result.happiness > 50);
    assert.equal(machine.state, 'HAPPY');
  });

  test('toggling house toggles SLEEPING and IDLE states', () => {
    const inHouse = machine.toggleHouse();
    assert.equal(inHouse, true);
    assert.equal(machine.state, 'SLEEPING');

    const outHouse = machine.toggleHouse();
    assert.equal(outHouse, false);
    assert.equal(machine.state, 'IDLE');
  });
});
