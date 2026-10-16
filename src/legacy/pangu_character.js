/**
 * PANGU 2D Canvas Character & Animation Engine
 * Renders Pangu with 60fps dynamic physics, expressions, eye tracking, wing flaps, and theme particles.
 */

class PanguCharacter {
  constructor(canvas, container, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;

    this.theme = options.theme || 'dark'; // 'dark' (Fire Obsidian) or 'light' (Frost Blue)
    this.state = 'IDLE'; // IDLE, HAPPY, CURIOUS, THINKING, EXCITED, SLEEPY, SURPRISED, FLYING, PLAYING
    
    // Position & Physics
    this.x = 180;
    this.y = window.innerHeight - 300;
    this.vx = 0;
    this.vy = 0;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Animation Timers
    this.tick = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.eyeTargetX = 0;
    this.eyeTargetY = 0;
    this.wingAngle = 0;
    this.tailAngle = 0;

    // Particles (Embers for dark, sparkles for light)
    this.particles = [];

    this.initCanvas();
    this.initEventListeners();
    this.animate();
  }

  initCanvas() {
    this.canvas.width = 240;
    this.canvas.height = 240;
    this.updateContainerPosition();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
  }

  setState(newState) {
    this.state = newState;
    if (newState === 'EXCITED' || newState === 'HAPPY') {
      this.spawnCelebrationParticles();
    }
  }

  updateContainerPosition() {
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;
  }

  initEventListeners() {
    // Mouse drag handling
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragOffsetX = e.clientX - this.x;
      this.dragOffsetY = e.clientY - this.y;
      this.setState('SURPRISED');
    });

    window.addEventListener('mousemove', (e) => {
      // Track mouse for eye direction
      const petCenterX = this.x + 120;
      const petCenterY = this.y + 120;
      const dx = e.clientX - petCenterX;
      const dy = e.clientY - petCenterY;
      const dist = Math.hypot(dx, dy) || 1;
      this.eyeTargetX = (dx / dist) * 7;
      this.eyeTargetY = (dy / dist) * 5;

      if (this.isDragging) {
        this.x = Math.max(10, Math.min(window.innerWidth - 250, e.clientX - this.dragOffsetX));
        this.y = Math.max(10, Math.min(window.innerHeight - 250, e.clientY - this.dragOffsetY));
        this.updateContainerPosition();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.setState('HAPPY');
        setTimeout(() => { if (this.state === 'HAPPY') this.setState('IDLE'); }, 2000);
      }
    });

    // Petting / clicking interaction
    this.container.addEventListener('click', (e) => {
      if (this.isDragging) return;
      this.onPetClick();
    });
  }

  onPetClick() {
    const speech = document.getElementById('pet-speech');
    const dialogs = [
      "Hi Damo! Need help with your code, da? ♡",
      "Purr... Enakku un kooda irukrathu romba pudichirukku! 🐾",
      "I'm right here with you, machi! Let's do this! 🚀",
      "Nalla work pannitu irukkeenga! Keep rocking! ✨",
      "Hey buddy! Enna plan innaiku? 😄"
    ];
    const picked = dialogs[Math.floor(Math.random() * dialogs.length)];

    if (speech) {
      speech.textContent = picked;
      speech.classList.add('visible');
      setTimeout(() => speech.classList.remove('visible'), 4000);
    }

    this.setState('EXCITED');
    if (window.soundFX) window.soundFX.playHappyChime();
    setTimeout(() => { if (this.state === 'EXCITED') this.setState('IDLE'); }, 2500);
  }

  showSpeech(text) {
    const speech = document.getElementById('pet-speech');
    if (speech) {
      speech.textContent = text;
      speech.classList.add('visible');
      setTimeout(() => speech.classList.remove('visible'), 5000);
    }
  }

  spawnCelebrationParticles() {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: 120 + (Math.random() - 0.5) * 60,
        y: 120 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        size: Math.random() * 5 + 3,
        alpha: 1,
        life: 0
      });
    }
  }

  updateParticles() {
    // Regular ambient emission
    if (this.tick % 4 === 0) {
      this.particles.push({
        x: 120 + (Math.random() - 0.5) * 80,
        y: 160 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.8 - 0.5,
        size: Math.random() * 4 + 2,
        alpha: 0.9,
        life: 0
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      p.life++;
      if (p.alpha <= 0 || p.life > 60) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    const isDark = this.theme === 'dark';
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = isDark ? (Math.random() > 0.5 ? '#FF3B30' : '#FF8A00') : (Math.random() > 0.5 ? '#3DDCFF' : '#99B8FF');
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = isDark ? '#FF3B30' : '#3DDCFF';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  animate() {
    this.tick++;

    // Blink timer
    this.blinkTimer++;
    if (this.blinkTimer > 180) {
      this.isBlinking = true;
      if (this.blinkTimer > 192) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Wings & Tail waving
    this.wingAngle = Math.sin(this.tick * 0.1) * 0.35;
    this.tailAngle = Math.sin(this.tick * 0.06) * 0.25;

    if (this.state === 'EXCITED' || this.state === 'FLYING') {
      this.wingAngle = Math.sin(this.tick * 0.35) * 0.6;
      this.tailAngle = Math.sin(this.tick * 0.25) * 0.5;
    }

    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const isDark = this.theme === 'dark';

    // Palette definition based on current theme
    const colors = isDark ? {
      bodyMain: '#1A202C',      // Obsidian Black fur
      bodyHighlight: '#2D3748', // Charcoal soft gradient
      accentFlame: '#FF3B30',   // Fire Red
      energyOrange: '#FF8A00',  // Warm Orange
      crestCyan: '#3DDCFF',     // Forehead Cyan Glow
      collar: '#FF8A00',
      eyes: '#3DDCFF'
    } : {
      bodyMain: '#FFFFFF',      // Pure Snow White fur
      bodyHighlight: '#E0F2FE', // Soft Frost Blue
      accentFlame: '#38BDF8',   // Celestial Sky Blue
      energyOrange: '#60A5FA',  // Ice Blue
      crestCyan: '#0284C7',     // Deep Cyan Glow
      collar: '#38BDF8',
      eyes: '#0284C7'
    };

    const cx = 120;
    const cy = 130;
    const breath = Math.sin(this.tick * 0.05) * 2;

    this.updateParticles();
    this.drawParticles();

    this.ctx.save();
    this.ctx.translate(cx, cy + breath);

    // 1. Draw Tail
    this.drawTail(colors);

    // 2. Draw Wings
    this.drawWings(colors);

    // 3. Draw Body
    this.drawBody(colors);

    // 4. Draw Ears
    this.drawEars(colors);

    // 5. Draw Head & Face
    this.drawHead(colors);

    // 6. Draw Forehead Crest (Glowing Rune)
    this.drawForeheadCrest(colors);

    // 7. Draw Eyes & Expression
    this.drawEyes(colors);
    this.drawMouth(colors);

    this.ctx.restore();
  }

  drawTail(c) {
    this.ctx.save();
    this.ctx.translate(-25, 45);
    this.ctx.rotate(-0.4 + this.tailAngle);

    // Fluffy tail curve
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.bezierCurveTo(-50, -20, -75, -60, -45, -95);
    this.ctx.bezierCurveTo(-25, -115, 5, -85, -5, -45);
    this.ctx.closePath();

    const grad = this.ctx.createLinearGradient(-50, -95, 0, 0);
    grad.addColorStop(0, c.accentFlame);
    grad.addColorStop(0.5, c.energyOrange);
    grad.addColorStop(1, c.bodyMain);

    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = c.accentFlame;
    this.ctx.shadowBlur = 12;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawWings(c) {
    // Left Wing
    this.ctx.save();
    this.ctx.translate(-42, 10);
    this.ctx.rotate(-0.5 - this.wingAngle);
    this.renderSingleWing(c, -1);
    this.ctx.restore();

    // Right Wing
    this.ctx.save();
    this.ctx.translate(42, 10);
    this.ctx.rotate(0.5 + this.wingAngle);
    this.renderSingleWing(c, 1);
    this.ctx.restore();
  }

  renderSingleWing(c, direction) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.bezierCurveTo(direction * 40, -45, direction * 70, -25, direction * 65, 10);
    this.ctx.bezierCurveTo(direction * 50, 15, direction * 35, 5, direction * 25, 18);
    this.ctx.bezierCurveTo(direction * 15, 15, 0, 10, 0, 0);
    this.ctx.closePath();

    const wingGrad = this.ctx.createLinearGradient(0, -30, direction * 60, 10);
    wingGrad.addColorStop(0, c.accentFlame);
    wingGrad.addColorStop(0.6, c.energyOrange);
    wingGrad.addColorStop(1, 'rgba(61, 220, 255, 0.4)');

    this.ctx.fillStyle = wingGrad;
    this.ctx.shadowColor = c.crestCyan;
    this.ctx.shadowBlur = 10;
    this.ctx.fill();
  }

  drawBody(c) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(0, 42, 38, 32, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.bodyMain;
    this.ctx.fill();

    // Chest fluff
    this.ctx.beginPath();
    this.ctx.ellipse(0, 36, 20, 24, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.bodyHighlight;
    this.ctx.fill();

    // Collar with "P" medal
    this.ctx.beginPath();
    this.ctx.ellipse(0, 24, 26, 7, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.collar;
    this.ctx.shadowColor = c.collar;
    this.ctx.shadowBlur = 6;
    this.ctx.fill();

    // P Pendant
    this.ctx.beginPath();
    this.ctx.arc(0, 32, 7, 0, Math.PI * 2);
    this.ctx.fillStyle = '#111827';
    this.ctx.fill();
    this.ctx.strokeStyle = c.crestCyan;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = c.crestCyan;
    this.ctx.font = 'bold 9px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('P', 0, 32);

    this.ctx.restore();
  }

  drawEars(c) {
    // Left Ear
    this.ctx.save();
    this.ctx.translate(-38, -35);
    this.ctx.rotate(-0.25);
    this.renderSingleEar(c, -1);
    this.ctx.restore();

    // Right Ear
    this.ctx.save();
    this.ctx.translate(38, -35);
    this.ctx.rotate(0.25);
    this.renderSingleEar(c, 1);
    this.ctx.restore();
  }

  renderSingleEar(c, dir) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, 20);
    this.ctx.bezierCurveTo(dir * 25, 0, dir * 40, -55, 0, -65);
    this.ctx.bezierCurveTo(-dir * 20, -45, -dir * 15, -10, 0, 20);
    this.ctx.closePath();

    this.ctx.fillStyle = c.bodyMain;
    this.ctx.fill();

    // Inner ear flame/frost glow
    this.ctx.beginPath();
    this.ctx.moveTo(0, 10);
    this.ctx.bezierCurveTo(dir * 15, -5, dir * 25, -45, 0, -52);
    this.ctx.bezierCurveTo(-dir * 10, -35, -dir * 8, -5, 0, 10);
    this.ctx.closePath();

    this.ctx.fillStyle = c.accentFlame;
    this.ctx.shadowColor = c.accentFlame;
    this.ctx.shadowBlur = 8;
    this.ctx.fill();
  }

  drawHead(c) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(0, -6, 52, 44, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.bodyMain;
    this.ctx.shadowColor = c.accentFlame;
    this.ctx.shadowBlur = 10;
    this.ctx.fill();

    // Cheek fluff
    this.ctx.fillStyle = c.bodyHighlight;
    this.ctx.beginPath();
    this.ctx.arc(-42, 6, 12, 0, Math.PI * 2);
    this.ctx.arc(42, 6, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawForeheadCrest(c) {
    this.ctx.save();
    this.ctx.translate(0, -30);

    // Glowing mystical diamond / swirl mark
    this.ctx.beginPath();
    this.ctx.moveTo(0, -10);
    this.ctx.lineTo(8, 0);
    this.ctx.lineTo(0, 10);
    this.ctx.lineTo(-8, 0);
    this.ctx.closePath();

    this.ctx.fillStyle = c.crestCyan;
    this.ctx.shadowColor = c.crestCyan;
    this.ctx.shadowBlur = 14;
    this.ctx.fill();

    this.ctx.restore();
  }

  drawEyes(c) {
    const isSleeping = this.state === 'SLEEPING';
    const isHappy = this.state === 'HAPPY';

    if (isSleeping || this.isBlinking) {
      // Curved sleeping/blinking line
      this.drawCurvedEye(-22, -4);
      this.drawCurvedEye(22, -4);
      return;
    }

    if (isHappy) {
      // Joyful curved anime eyes (^_^)
      this.drawHappyEye(-22, -4);
      this.drawHappyEye(22, -4);
      return;
    }

    // Normal expressive eyes with gaze tracking
    this.renderOpenEye(-22, -4, c);
    this.renderOpenEye(22, -4, c);
  }

  renderOpenEye(ex, ey, c) {
    this.ctx.save();
    this.ctx.translate(ex, ey);

    // Eye outline
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 16, 19, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0F172A';
    this.ctx.fill();

    // Iris (Glowing Cyan/Blue)
    const irisGrad = this.ctx.createRadialGradient(
      this.eyeTargetX * 0.4, this.eyeTargetY * 0.4, 2,
      this.eyeTargetX * 0.4, this.eyeTargetY * 0.4, 14
    );
    irisGrad.addColorStop(0, '#FFFFFF');
    irisGrad.addColorStop(0.3, c.eyes);
    irisGrad.addColorStop(1, '#0284C7');

    this.ctx.beginPath();
    this.ctx.ellipse(this.eyeTargetX * 0.5, this.eyeTargetY * 0.5, 12, 14, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = irisGrad;
    this.ctx.shadowColor = c.crestCyan;
    this.ctx.shadowBlur = 10;
    this.ctx.fill();

    // Pupil
    this.ctx.beginPath();
    this.ctx.ellipse(this.eyeTargetX * 0.7, this.eyeTargetY * 0.7, 6, 8, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#050B14';
    this.ctx.fill();

    // Big Sparkle Highlight
    this.ctx.beginPath();
    this.ctx.arc(-4 + this.eyeTargetX * 0.2, -5 + this.eyeTargetY * 0.2, 4, 0, Math.PI * 2);
    this.ctx.arc(3 + this.eyeTargetX * 0.2, 3 + this.eyeTargetY * 0.2, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawCurvedEye(ex, ey) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, 10, 0.2, Math.PI - 0.2, false);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawHappyEye(ex, ey) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(ex, ey + 4, 12, Math.PI + 0.2, -0.2, false);
    this.ctx.strokeStyle = this.theme === 'dark' ? '#FF8A00' : '#0284C7';
    this.ctx.lineWidth = 3.5;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMouth(c) {
    this.ctx.save();
    // Cute Nose
    this.ctx.beginPath();
    this.ctx.ellipse(0, 11, 4, 2.5, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = c.accentFlame;
    this.ctx.fill();

    // Mouth
    this.ctx.beginPath();
    if (this.state === 'EXCITED' || this.state === 'HAPPY') {
      // Open joyful smile with tiny fangs
      this.ctx.arc(0, 14, 8, 0.1, Math.PI - 0.1, false);
      this.ctx.fillStyle = '#E11D48';
      this.ctx.fill();
      this.ctx.strokeStyle = c.accentFlame;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Tiny white fangs
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.moveTo(-4, 14);
      this.ctx.lineTo(-2, 17);
      this.ctx.lineTo(0, 14);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(0, 14);
      this.ctx.lineTo(2, 17);
      this.ctx.lineTo(4, 14);
      this.ctx.fill();
    } else {
      // Gentle cat/fox smile (w)
      this.ctx.arc(-4, 15, 4, 0, Math.PI * 0.8, false);
      this.ctx.arc(4, 15, 4, Math.PI * 0.2, Math.PI, false);
      this.ctx.strokeStyle = this.theme === 'dark' ? '#CBD5E1' : '#334155';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}

window.PanguCharacter = PanguCharacter;
