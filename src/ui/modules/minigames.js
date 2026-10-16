/**
 * PANGU Desktop Mini-Games (Laser Pointer Chase & Bouncy Toy Ball Fetch)
 * High-speed interactive desktop physics simulations with audio and companion reactions.
 */

export class MiniGamesManager {
  constructor(options = {}) {
    this.pangu = options.pangu;
    this.panguAPI = options.panguAPI;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.laserPointerEl = options.laserPointerEl;
    this.toyBallEl = options.toyBallEl;
    this.menuLaserText = options.menuLaserText;

    // Mini-Game 1: Laser Chase
    this.isLaserActive = false;
    this.laserX = this.pangu ? this.pangu.screenX : 0;
    this.laserY = this.pangu ? this.pangu.screenY : 0;
    this.laserPounceCooldown = false;

    // Mini-Game 2: Toy Ball Fetch
    this.toyBall = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      catches: 0,
      lastTime: performance.now()
    };
  }

  // --- LASER POINTER CHASE ---

  toggleLaser(forceState) {
    this.isLaserActive = typeof forceState === 'boolean' ? forceState : !this.isLaserActive;

    if (this.isLaserActive) {
      if (this.toyBall.active) this.stopToyBall();
      if (this.laserPointerEl) this.laserPointerEl.classList.add('active');
      if (this.menuLaserText) this.menuLaserText.textContent = "Laser Chase: ON (L)";
      this.panguAPI.setIgnoreMouseEvents(false);
      this.showSpeech("Ooh, Red Dot! 🔴🐾 Catch me if you can, machi!", 3500, 'excited');
      if (this.pangu) this.pangu.reactCurious();
      if (this.soundFX) this.soundFX.playLaserPing();
    } else {
      if (this.laserPointerEl) this.laserPointerEl.classList.remove('active');
      if (this.menuLaserText) this.menuLaserText.textContent = "Play: Laser Chase (L)";
      if (this.pangu) this.pangu.isSprinting = false;
      this.showSpeech("Whew! What an awesome chase, da! 🐾", 3000, 'happy');
      this.panguAPI.setIgnoreMouseEvents(true, { forward: true });
    }
    return this.isLaserActive;
  }

  onMouseMove(e) {
    if (!this.isLaserActive) return;
    this.laserX = e.clientX;
    this.laserY = e.clientY;
    if (this.laserPointerEl) {
      this.laserPointerEl.style.left = `${this.laserX}px`;
      this.laserPointerEl.style.top = `${this.laserY}px`;
    }
  }

  // --- TOY BALL FETCH ---

  tossToyBall(startX, startY) {
    if (this.isLaserActive) this.toggleLaser(false);

    this.toyBall.active = true;
    this.toyBall.lastTime = performance.now();
    this.toyBall.catches = 0;
    if (this.toyBallEl) this.toyBallEl.classList.add('active');

    const originX = startX || (this.pangu ? this.pangu.screenX + (this.pangu.facing * 75) : 300);
    const originY = startY || (this.pangu ? this.pangu.screenY - 130 : 400);
    this.toyBall.x = originX;
    this.toyBall.y = originY;

    // Athletic toss arc across desktop
    const facing = this.pangu ? this.pangu.facing : 1;
    this.toyBall.vx = (Math.random() - 0.5) * 460 + (facing * 220);
    this.toyBall.vy = -480 - Math.random() * 200;

    this.showSpeech("Ball tossed! Go fetch, Pangu! 🎾⚡", 3000, 'excited');
    if (this.pangu) this.pangu.jump(false);
    if (this.soundFX) this.soundFX.playBallBounce();
  }

  stopToyBall() {
    this.toyBall.active = false;
    if (this.toyBallEl) this.toyBallEl.classList.remove('active');
    if (this.pangu) this.pangu.isSprinting = false;
  }

  // --- FRAME UPDATE (Runs on requestAnimationFrame) ---

  update() {
    if (!this.pangu) return;

    // Laser chase real-time tracking
    if (this.isLaserActive) {
      const distToLaser = Math.hypot(this.laserX - this.pangu.screenX, this.laserY - this.pangu.screenY);
      if (distToLaser > 65) {
        this.pangu.chaseTarget(this.laserX, this.laserY, true);
      } else if (!this.laserPounceCooldown) {
        this.laserPounceCooldown = true;
        this.pangu.pounceAt(this.laserX, this.laserY);
        this.showSpeech("Gotcha! Pounced on the red dot! 🎉🐾", 2500, 'happy');
        if (this.soundFX) this.soundFX.playHappyChime();
        this.panguAPI.playPet();
        setTimeout(() => { this.laserPounceCooldown = false; }, 1800);
      }
    }

    // Toy ball physics & fetch logic
    if (this.toyBall.active) {
      const now = performance.now();
      const dt = Math.min((now - this.toyBall.lastTime) / 1000, 0.05);
      this.toyBall.lastTime = now;

      // Ball gravity & physics
      const GRAVITY = 1450;
      this.toyBall.vy += GRAVITY * dt;
      this.toyBall.x += this.toyBall.vx * dt;
      this.toyBall.y += this.toyBall.vy * dt;

      // Floor bounce
      const floor = this.pangu.floorY + 10;
      if (this.toyBall.y >= floor) {
        this.toyBall.y = floor;
        this.toyBall.vy = -this.toyBall.vy * 0.74;
        this.toyBall.vx *= 0.94;
        if (Math.abs(this.toyBall.vy) > 80 && this.soundFX) {
          this.soundFX.playBallBounce();
        }
      }

      // Left/Right Screen Bounds bounce
      if (this.toyBall.x < 24) {
        this.toyBall.x = 24;
        this.toyBall.vx = -this.toyBall.vx * 0.85;
      } else if (this.toyBall.x > window.innerWidth - 24) {
        this.toyBall.x = window.innerWidth - 24;
        this.toyBall.vx = -this.toyBall.vx * 0.85;
      }

      if (this.toyBallEl) {
        this.toyBallEl.style.left = `${this.toyBall.x}px`;
        this.toyBallEl.style.top = `${this.toyBall.y}px`;
      }

      // Pangu chase ball
      const distToBall = Math.hypot(this.toyBall.x - this.pangu.screenX, this.toyBall.y - this.pangu.screenY);
      if (distToBall > 50) {
        this.pangu.chaseTarget(this.toyBall.x, this.toyBall.y, true);
      } else {
        // Intercepted / Batted ball!
        this.toyBall.catches++;
        this.toyBall.vy = -420 - Math.random() * 200;
        this.toyBall.vx = (this.pangu.facing * 280) + (Math.random() - 0.5) * 220;
        this.pangu.pounceAt(this.toyBall.x, this.toyBall.y);
        this.showSpeech("Catch of the day! Sema bounce, machi! 🎾✨", 2500, 'happy');
        if (this.soundFX) this.soundFX.playHappyChime();
        this.panguAPI.playPet();

        if (this.toyBall.catches >= 5) {
          setTimeout(() => {
            if (this.toyBall.active && Math.abs(this.toyBall.vy) < 60) {
              this.stopToyBall();
              this.showSpeech("That was an epic game of fetch, da! 🐾", 3000, 'happy');
            }
          }, 3500);
        }
      }
    }
  }

  destroy() {
    if (this.isLaserActive) this.toggleLaser(false);
    if (this.toyBall.active) this.stopToyBall();
  }
}
