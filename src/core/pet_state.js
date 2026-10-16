class PetStateMachine {
  constructor(memory, onStateChange = () => {}, onLevelUp = () => {}) {
    this.memory = memory;
    this.onStateChange = onStateChange;
    this.onLevelUp = onLevelUp;

    this.state = 'IDLE'; // IDLE, WALKING, FLYING, SLEEPING, PLAYING, HAPPY, CURIOUS, THINKING, EXCITED, SURPRISED
    this.position = { x: 150, y: 650 }; // default desktop position
    this.targetPosition = { x: 150, y: 650 };
    this.inHouse = false;
    this.facing = 'right'; // 'left' or 'right'

    this.autonomousTimer = null;
    this.statsDecayTimer = null;
    this.stateTimeout = null;

    this.startAutonomousBehavior();
  }

  setState(newState, temporaryDuration = 0) {
    const prevState = this.state;
    this.state = newState;
    this.onStateChange(this.state, prevState);

    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }

    if (temporaryDuration > 0) {
      this.stateTimeout = setTimeout(() => {
        if (this.state === newState && !this.inHouse) {
          this.setState('IDLE');
        }
      }, temporaryDuration);
    }
  }

  feed() {
    const stats = this.memory.getPetStats();
    const newStats = this.memory.updatePetStats({
      hunger: Math.max(0, stats.hunger - 35),
      happiness: Math.min(100, stats.happiness + 15),
      energy: Math.min(100, stats.energy + 10),
      mood: 'Happy'
    });
    const xpResult = this.memory.addXp(12);
    if (xpResult.leveledUp && this.onLevelUp) {
      this.onLevelUp(xpResult);
    }
    this.setState('HAPPY', 3000);
    return { ...newStats, xpResult };
  }

  play() {
    const stats = this.memory.getPetStats();
    const newStats = this.memory.updatePetStats({
      happiness: Math.min(100, stats.happiness + 20),
      energy: Math.max(10, stats.energy - 15),
      hunger: Math.min(100, stats.hunger + 10),
      mood: 'Excited'
    });
    const xpResult = this.memory.addXp(15);
    if (xpResult.leveledUp && this.onLevelUp) {
      this.onLevelUp(xpResult);
    }
    this.setState('PLAYING', 4000);
    return { ...newStats, xpResult };
  }

  cuddle() {
    const stats = this.memory.getPetStats();
    const newStats = this.memory.updatePetStats({
      happiness: Math.min(100, stats.happiness + 25),
      mood: 'Happy'
    });
    const xpResult = this.memory.addXp(8);
    if (xpResult.leveledUp && this.onLevelUp) {
      this.onLevelUp(xpResult);
    }
    this.setState('HAPPY', 3500);
    return { ...newStats, xpResult };
  }

  toggleHouse() {
    this.inHouse = !this.inHouse;
    if (this.inHouse) {
      this.setState('SLEEPING');
      this.memory.updatePetStats({ energy: 100, mood: 'Sleepy' });
    } else {
      this.setState('IDLE');
      this.memory.updatePetStats({ mood: 'Happy' });
    }
    return this.inHouse;
  }

  startAutonomousBehavior() {
    // Every 20 seconds, perform gentle autonomous actions if idle
    this.autonomousTimer = setInterval(() => {
      if (this.inHouse || this.state === 'SLEEPING') return;

      const randomChoice = Math.random();
      if (randomChoice < 0.35) {
        // Wander or stretch
        const moods = ['HAPPY', 'CURIOUS', 'THINKING'];
        const chosen = moods[Math.floor(Math.random() * moods.length)];
        this.setState(chosen, 4000);
      } else if (randomChoice < 0.6) {
        this.setState('FLYING', 3000);
      }
    }, 20000);

    // Slowly decay hunger & energy every 5 minutes
    this.statsDecayTimer = setInterval(() => {
      if (this.inHouse) {
        // Restores energy while in house
        const stats = this.memory.getPetStats();
        this.memory.updatePetStats({ energy: Math.min(100, stats.energy + 10) });
      } else {
        const stats = this.memory.getPetStats();
        this.memory.updatePetStats({
          hunger: Math.min(100, stats.hunger + 2),
          energy: Math.max(10, stats.energy - 1)
        });
      }
    }, 300000);
  }

  destroy() {
    if (this.autonomousTimer) clearInterval(this.autonomousTimer);
    if (this.statsDecayTimer) clearInterval(this.statsDecayTimer);
    if (this.stateTimeout) clearTimeout(this.stateTimeout);
  }
}

module.exports = PetStateMachine;
