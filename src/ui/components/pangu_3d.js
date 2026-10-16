import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * PANGU 3D Character Engine (Google-Tier Desktop AI Companion)
 * Features:
 * - Genuine rigged 3D models with skeletal animations (Survey, Walk, Run, Attack)
 * - Multi-character support (Mystic Kitsune Fox, Cyber Dragon, Kawaii Kitty)
 * - Articulated glowing 3D celestial wings with organic flapping physics
 * - Floating octahedral diamond crest that reflects AI thought state
 * - 3D Gaze tracking: Creature turns head and body towards mouse cursor
 * - Rich 3D body language: Listening pose, Thinking pulse, Happy backflip, Nap curl
 * - 60 FPS physics with gravity, somersault rolls, drag & drop, edge-aware roaming
 * - Fire Obsidian Ember (Dark) & Frost Celestial Blue (Light) themes with PBR materials
 * - Dynamic 3D lighting (Key, Rim, Ambient, Crest Point light) & soft contact shadows
 */

export class Pangu3D {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.theme = options.theme || 'dark'; // 'dark' (Fire Obsidian) or 'light' (Frost Celestial)
    this.currentCharacterType = options.character || 'sellsword_fox'; // 'sellsword_fox', 'fox', 'dragon', 'cat'
    this.auraEnabled = options.aura === true; // Default false for clean, studio-grade natural 3D pet
    this.elementalAura = options.elementalAura || 'fire'; // 'fire', 'thunder', 'frost', 'void'
    this.auraParticleTimer = 0;
    this.isPaused = false;
    this.animId = null;

    // Creature State Machine
    this.state = 'IDLE'; // IDLE, WALKING, RUNNING, JUMPING, SLEEPING, DRAGGING, FALLING, EATING, LISTENING, THINKING
    this.facing = 1; // 1 = facing right, -1 = facing left
    this.targetFacing = 1;
    this.currentYaw = Math.PI / 2;

    // Screen Dimensions & Floor
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    // Sits neatly right on top of the Windows taskbar
    this.floorY = Math.max(200, this.screenHeight - 75);

    // Screen Coordinates
    this.screenX = 260;
    this.screenY = this.floorY;
    this.targetX = this.screenX;

    // Procedural Orientation Drivers (Clean single-point-of-truth assignments every frame)
    this.modelPitch = 0; // X rotation (forward lean, bow, stretch)
    this.modelRoll = 0;  // Z rotation (stride roll, weight shift, wiggle)
    this.modelElevation = 0; // Y offset (breathing, settle bounce, pounce)
    this.modelDepth = 0; // Z offset (curiosity peek)

    // Skeletal Additive Offsets (Guaranteed zero drift across frames)
    this.headPitchOffset = 0;
    this.headYawOffset = 0;
    this.headRollOffset = 0;
    this.neckPitchOffset = 0;
    this.neckYawOffset = 0;
    this.jawPitchOffset = 0;

    // Movement & Physics
    this.vx = 0;
    this.vy = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.isSomersaulting = false;
    this.somersaultAngle = 0;
    this.isSprinting = false;
    this.eatingTimer = 0;
    this.isRoaming = true;
    this.roamCooldown = 5;

    // Mouse Tracking for 3D Gaze
    this.mouse = { x: 0, y: 0, screenX: window.innerWidth / 2, screenY: window.innerHeight / 2 };

    // Clocks and Timers
    this.lastTime = performance.now();
    this.idleTimer = 0;
    this.walkCycle = 0;
    this.wingFlapAngle = 0;

    // Particles array
    this.particles = [];

    // Model Cache
    this.modelCache = {};
    this.currentModel = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    // Procedural Rig & Skeletal Layering
    this.headBone = null;
    this.neckBone = null;
    this.jawBone = null;
    this.spineBones = [];
    this.tailBones = [];

    // Locomotion Inertia & Physics
    this.prevVx = 0;
    this.settleBounce = 0;

    // Head & Gaze Inverse Kinematics
    this.headLookYaw = 0;
    this.headLookPitch = 0;

    // Tail Spring-Harmonic Physics Simulation
    this.tailPhysics = [
      { angleY: 0, velY: 0, angleZ: 0, velZ: 0 },
      { angleY: 0, velY: 0, angleZ: 0, velZ: 0 },
      { angleY: 0, velY: 0, angleZ: 0, velZ: 0 },
      { angleY: 0, velY: 0, angleZ: 0, velZ: 0 }
    ];

    // Weight Shifting Micro-Rhythm
    this.weightShiftTimer = 0;
    this.weightShiftCurrent = 0;
    this.weightShiftTarget = 0;

    // Speaking & Lip-Sync Articulation
    this.isSpeaking = false;
    this.speakingTimer = 0;
    this.speakingEmotion = 'normal';

    // Autonomous Living Habits State Machine
    this.currentHabit = null; // 'STRETCH', 'SNIFF_GROUND', 'EAR_PERK', 'PAW_GROOM', 'SURVEY_DESKTOP', 'YAWN_SNOOZE', 'PLAYFUL_WIGGLE', 'SCRATCH'
    this.habitTimer = 0;
    this.habitProgress = 0;
    this.nextHabitInterval = 6 + Math.random() * 8;

    // Direct Petting / Rubbing Interaction State
    this.isBeingPetted = false;
    this.pettingTimer = 0;

    // Procedural Eye Dynamics & Micro-Blinking System
    this.blinkTimer = 0;
    this.nextBlinkInterval = 2.8 + Math.random() * 3.2;
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.isDoubleBlink = false;
    this.eyeMeshes = [];
    this.baseEyeCatchLightIntensity = 1.6;

    // Initialize Systems
    this.initTextures();
    this.initThree();
    this.initLights();
    this.buildCharacterHierarchy();
    this.loadCharacter(this.currentCharacterType);
    this.initInteraction();
    this.animate();
  }

  initTextures() {
    this.shadowTexture = this.createShadowTexture();
    this.aoTexture = this.createAoTexture();
    this.heartTexture = this.createHeartTexture();
    this.starTexture = this.createStarTexture();
    this.zzzTexture = this.createZzzTexture();
    this.emberTexture = this.createEmberTexture();
    this.sparkTexture = this.createSparkTexture();
    this.snowflakeTexture = this.createSnowflakeTexture();
    this.voidTexture = this.createVoidTexture();
    this.particleGeo = new THREE.PlaneGeometry(0.35, 0.35);
  }

  createAoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 16, 0, 32, 16, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 32, 0, 64, 32, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(32, 54);
    ctx.bezierCurveTo(12, 38, 4, 24, 14, 12);
    ctx.bezierCurveTo(24, 0, 32, 16, 32, 16);
    ctx.bezierCurveTo(32, 16, 40, 0, 50, 12);
    ctx.bezierCurveTo(60, 24, 52, 38, 32, 54);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.9)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createEmberTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
    grad.addColorStop(0.35, 'rgba(255, 100, 0, 0.85)');
    grad.addColorStop(0.8, 'rgba(255, 40, 0, 0.2)');
    grad.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createZzzTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('z', 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.95)');
    grad.addColorStop(0.7, 'rgba(250, 204, 21, 0.4)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(186, 230, 253, 0.95)');
    grad.addColorStop(0.8, 'rgba(125, 211, 252, 0.35)');
    grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createVoidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(217, 70, 239, 0.95)');
    grad.addColorStop(0.75, 'rgba(147, 51, 234, 0.35)');
    grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  initThree() {
    this.scene = new THREE.Scene();

    // Perspective Camera: FOV 35 positioned at Z = 16 (1 world unit ≈ 107px at 1080p)
    this.camera = new THREE.PerspectiveCamera(35, this.screenWidth / this.screenHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 16);

    // High performance WebGL renderer with transparent alpha
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.screenWidth, this.screenHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.renderer.domElement.id = 'pangu-3d-canvas';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
    this.renderer.domElement.style.pointerEvents = 'none';

    this.container.appendChild(this.renderer.domElement);

    this.initEnvironment();

    window.addEventListener('resize', () => {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      this.floorY = Math.max(200, this.screenHeight - 75);
      if (this.state === 'IDLE') {
        this.screenY = this.floorY;
      } else {
        this.screenY = Math.min(this.screenY, this.floorY);
      }
      this.camera.aspect = this.screenWidth / this.screenHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.screenWidth, this.screenHeight);
    });
  }

  initEnvironment() {
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      if (this.theme === 'dark') {
        grad.addColorStop(0.0, '#382218');
        grad.addColorStop(0.5, '#1a1412');
        grad.addColorStop(1.0, '#0c0a0a');
      } else {
        grad.addColorStop(0.0, '#dbeafe');
        grad.addColorStop(0.5, '#93c5fd');
        grad.addColorStop(1.0, '#1e293b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      // Studio softbox highlights for sparkling eye and fur specular reflections
      ctx.fillStyle = 'rgba(255, 235, 210, 0.85)';
      ctx.beginPath();
      ctx.arc(80, 40, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(200, 230, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(190, 45, 24, 0, Math.PI * 2);
      ctx.fill();

      const envTex = new THREE.CanvasTexture(canvas);
      envTex.colorSpace = THREE.SRGBColorSpace;
      envTex.mapping = THREE.EquirectangularReflectionMapping;

      const envRt = pmrem.fromEquirectangular(envTex);
      this.scene.environment = envRt.texture;
      pmrem.dispose();
      envTex.dispose();
    } catch (err) {
      console.warn('[Pangu3D] Environment map generation skipped:', err);
    }
  }

  initLights() {
    // 1. Natural Ambient Light (Studio fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(this.ambientLight);

    // 2. Studio Key Light (Clean soft directional key light)
    this.keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    this.keyLight.position.set(4, 8, 7);
    this.scene.add(this.keyLight);

    // 3. Studio Fill Light (Cool complementary soft fill)
    this.fillLight = new THREE.DirectionalLight(0xddeeff, 1.2);
    this.fillLight.position.set(-6, 4, 5);
    this.scene.add(this.fillLight);

    // 4. Studio Rim Light (Strong backlight silhouette for rich depth against desktop wallpaper)
    this.rimLight = new THREE.DirectionalLight(0xff9944, 2.4);
    this.rimLight.position.set(-2, 7, -6);
    this.scene.add(this.rimLight);

    // 5. Ground Bounce Light (Warm bounce upwards into belly and paws)
    this.bounceLight = new THREE.DirectionalLight(0xfff0dd, 0.7);
    this.bounceLight.position.set(0, -5, 3);
    this.scene.add(this.bounceLight);

    // 6. Eye Catchlight Point Light (Positioned in front to create lively specular sparkles in eyes)
    this.eyeCatchLight = new THREE.PointLight(0xffffff, 0.9, 10);
    this.eyeCatchLight.position.set(0, 0.6, 4.5);
    this.characterGroup = new THREE.Group();
    this.characterGroup.add(this.eyeCatchLight);

    this.updateThemeLighting();
  }

  updateThemeLighting() {
    if (this.theme === 'dark') {
      // Fire Obsidian Theme: Warm golden ambient and ember rim backlight
      this.ambientLight.color.setHex(0xfff5ea);
      this.ambientLight.intensity = 1.35;
      this.keyLight.color.setHex(0xffecd2);
      this.keyLight.intensity = 2.2;
      this.fillLight.color.setHex(0xddeeff);
      this.fillLight.intensity = 1.1;
      this.rimLight.color.setHex(0xff8833);
      this.rimLight.intensity = 2.4;
      this.bounceLight.color.setHex(0xffd8b0);
    } else {
      // Frost Celestial Theme: Crisp natural daylight with soft sky-blue rim
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.4;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 2.2;
      this.fillLight.color.setHex(0xcce7ff);
      this.fillLight.intensity = 1.2;
      this.rimLight.color.setHex(0x7dd3fc);
      this.rimLight.intensity = 2.2;
      this.bounceLight.color.setHex(0xeff6ff);
    }
  }

  buildCharacterHierarchy() {
    // Root group that synchronizes with screen coordinates (already created in initLights)
    this.scene.add(this.characterGroup);

    // Sub-group for 3D rotations, somersaults, and gaze yaw
    this.modelPivot = new THREE.Group();
    this.modelPivot.rotation.order = 'YXZ'; // Critical: Yaw evaluated first prevents Euler lock and sideways tilt
    this.characterGroup.add(this.modelPivot);

    // 1. Dual-Layer Dynamic Contact Shadow:
    // A. Inner Ambient Occlusion Shadow (dark, sharp contact under paws)
    const aoGeo = new THREE.PlaneGeometry(1.2, 0.6);
    this.aoMat = new THREE.MeshBasicMaterial({
      map: this.aoTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });
    this.aoMesh = new THREE.Mesh(aoGeo, this.aoMat);
    this.aoMesh.rotation.x = -Math.PI / 2;
    this.aoMesh.position.set(0, -0.65, 0);
    this.characterGroup.add(this.aoMesh);

    // B. Outer Penumbra Shadow (soft, wide diffuse falloff)
    const penumbraGeo = new THREE.PlaneGeometry(2.1, 1.05);
    this.penumbraMat = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });
    this.penumbraMesh = new THREE.Mesh(penumbraGeo, this.penumbraMat);
    this.penumbraMesh.rotation.x = -Math.PI / 2;
    this.penumbraMesh.position.set(0, -0.648, 0);
    this.characterGroup.add(this.penumbraMesh);

    // 2. Build Ethereal Celestial Wings
    this.buildCelestialWings();

    // 3. Build Floating Celestial Halo
    this.buildDiamondCrest();

    // Set initial aura visibility (default clean natural 3D pet)
    this.setAura(this.auraEnabled);
  }

  buildCelestialWings() {
    this.wingsGroup = new THREE.Group();
    this.wingsGroup.position.set(0, 0.45, -0.15);
    this.modelPivot.add(this.wingsGroup);

    // Translucent soft feathered ethereal wing
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.18, 0.35, 0.45, 0.65, 0.9, 0.75);
    wingShape.bezierCurveTo(0.75, 0.45, 0.65, 0.25, 0.8, 0.1);
    wingShape.bezierCurveTo(0.55, 0.05, 0.4, -0.1, 0.5, -0.25);
    wingShape.bezierCurveTo(0.3, -0.12, 0.15, -0.05, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);

    this.wingMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'dark' ? 0xff6600 : 0x38bdf8,
      emissive: this.theme === 'dark' ? 0xff4400 : 0x00d2ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    // Left Wing
    this.leftWing = new THREE.Mesh(wingGeo, this.wingMat);
    this.leftWing.scale.set(0.6, 0.6, 0.6);
    this.leftWing.position.set(0.1, 0, 0);
    this.leftWing.rotation.y = 0.25;
    this.wingsGroup.add(this.leftWing);

    // Right Wing (mirrored)
    this.rightWing = new THREE.Mesh(wingGeo, this.wingMat);
    this.rightWing.scale.set(-0.6, 0.6, 0.6);
    this.rightWing.position.set(-0.1, 0, 0);
    this.rightWing.rotation.y = -0.25;
    this.wingsGroup.add(this.rightWing);

    this.wingsGroup.visible = this.auraEnabled;
  }

  buildDiamondCrest() {
    this.crestGroup = new THREE.Group();
    this.crestGroup.position.set(0, 1.25, 0.1);
    this.modelPivot.add(this.crestGroup);

    // 1. Floating Ethereal Ring
    const haloGeo = new THREE.TorusGeometry(0.13, 0.012, 12, 32);
    this.haloMat = new THREE.MeshBasicMaterial({
      color: this.theme === 'dark' ? 0xff9900 : 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    this.haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    this.haloMesh.rotation.x = Math.PI / 2;
    this.crestGroup.add(this.haloMesh);

    // 2. Floating Celestial Star
    const gemGeo = new THREE.OctahedronGeometry(0.06, 0);
    this.gemMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'dark' ? 0xffcc00 : 0x7dd3fc,
      emissive: this.theme === 'dark' ? 0xff6600 : 0x00e5ff,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.8
    });
    this.gemMesh = new THREE.Mesh(gemGeo, this.gemMat);
    this.crestGroup.add(this.gemMesh);

    this.crestGroup.visible = this.auraEnabled;
  }

  setAura(enabled) {
    this.auraEnabled = !!enabled;
    if (this.wingsGroup) this.wingsGroup.visible = this.auraEnabled && (this.currentCharacterType !== 'dragon');
    if (this.crestGroup) this.crestGroup.visible = this.auraEnabled;
  }

  async loadCharacter(charType) {
    this.currentCharacterType = charType;

    const charConfig = {
      fox: {
        path: 'assets/Fox.glb',
        targetHeight: 1.45,
        baseRotationY: 0,
        clipsMap: {
          idle: 'Survey',
          walk: 'Walk',
          run: 'Run'
        }
      },
      sellsword_fox: {
        path: 'assets/SellswordFox.glb',
        fallbackPath: 'assets/SellswordFox.fbx',
        altPath: 'assets/Sellsword_Fox.fbx',
        targetHeight: 1.55,
        baseRotationY: 0,
        clipsMap: {
          idle: 'idle',
          walk: 'walk',
          run: 'run'
        }
      },
      dragon: {
        path: 'assets/Dragon.glb',
        targetHeight: 1.55,
        baseRotationY: 0,
        clipsMap: {
          idle: 'Idle',
          walk: 'Idle',
          run: 'DragonArmature|DragonArmature|Dragon_Attack2'
        }
      },
      cat: {
        path: 'assets/cat.glb',
        targetHeight: 1.35,
        baseRotationY: 0,
        clipsMap: {
          idle: 'idle',
          walk: 'walk',
          run: 'attack'
        }
      }
    };

    const config = charConfig[charType] || charConfig.fox;

    // Check cache
    if (this.modelCache[charType]) {
      this.attachCharacterModel(this.modelCache[charType], config);
      return;
    }

    const pathsToTry = [
      config.path,
      config.fallbackPath,
      config.altPath
    ].filter(Boolean);

    const tryLoad = (idx) => {
      if (idx >= pathsToTry.length) {
        console.warn(`[Pangu3D] Model files for ${charType} not found, falling back to default fox mascot...`);
        if (typeof window !== 'undefined' && typeof window.__onModelNotFound === 'function') {
          window.__onModelNotFound(charType);
        }
        if (charType !== 'fox') {
          this.loadCharacter('fox');
        }
        return;
      }

      const currentPath = pathsToTry[idx];
      const isFBX = currentPath.toLowerCase().endsWith('.fbx');
      const loader = isFBX ? new FBXLoader() : new GLTFLoader();

      loader.load(
        currentPath,
        (loadedAsset) => {
          this.modelCache[charType] = loadedAsset;
          this.attachCharacterModel(loadedAsset, config);
          console.log(`[Pangu3D] Loaded 3D Character: ${charType} (${currentPath}) successfully!`);
        },
        undefined,
        (err) => {
          console.warn(`[Pangu3D] Could not load ${currentPath}:`, err.message || err);
          tryLoad(idx + 1);
        }
      );
    };

    tryLoad(0);
  }

  attachCharacterModel(gltf, config) {
    // Stop prior animation mixer actions & uncache old model to free memory
    if (this.mixer) {
      this.mixer.stopAllAction();
      if (this.currentModel) {
        this.mixer.uncacheRoot(this.currentModel);
      }
    }

    // Remove previous model if exists
    if (this.currentModel) {
      this.modelPivot.remove(this.currentModel);
    }

    const sceneClone = gltf.scene || gltf;
    this.currentModel = sceneClone;

    // CRITICAL: Reset transforms before computing bounding box so cached models never multiply scale!
    sceneClone.scale.set(1, 1, 1);
    sceneClone.position.set(0, 0, 0);
    sceneClone.rotation.set(0, 0, 0);
    sceneClone.updateMatrixWorld(true);

    // Compute bounding box for automatic perfect desktop scaling
    const box = new THREE.Box3().setFromObject(sceneClone);
    const size = box.getSize(new THREE.Vector3());
    const rawHeight = Math.max(0.001, size.y);
    const scale = config.targetHeight / rawHeight;
    sceneClone.scale.setScalar(scale);

    // Center model paws at ground level
    sceneClone.position.y = -box.min.y * scale - 0.65;
    sceneClone.rotation.y = config.baseRotationY;

    // Cache rig bones for ultra-level procedural skeletal animation, lip-sync & physics
    this.headBone = null;
    this.neckBone = null;
    this.jawBone = null;
    this.spineBones = [];
    this.tailBones = [];
    this.eyeMeshes = [];

    sceneClone.traverse((child) => {
      const n = (child.name || '').toLowerCase();
      if (child.isBone || child.type === 'Bone') {
        if ((n.includes('head') || n === 'joint4') && !this.headBone) {
          this.headBone = child;
        } else if ((n.includes('neck') || n === 'joint3') && !this.neckBone) {
          this.neckBone = child;
        } else if ((n.includes('nose') || n.includes('face') || n.includes('jaw')) && !this.jawBone) {
          this.jawBone = child;
        } else if (n.includes('spine') || n.includes('body') || n === 'joint2') {
          this.spineBones.push(child);
        } else if (n.includes('tail') || n.includes('joint1')) {
          this.tailBones.push(child);
        }
      }

      // Collect dedicated eye nodes or meshes for procedural blinking
      if (n === 'eyes' || n === 'eyearmature' || n.includes('eye')) {
        this.eyeMeshes.push(child);
      } else if (child.isMesh && child.material) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        const matName = (mat.name || '').toLowerCase();
        if (matName.includes('eye')) {
          this.eyeMeshes.push(child);
        }
      }
    });
    this.tailBones.sort((a, b) => a.name.localeCompare(b.name));

    // Apply Theme Materials & Shaders safely to 3D Mesh
    this.applyMaterialsToModel(sceneClone);

    // Attach to Model Pivot
    this.modelPivot.add(sceneClone);

    // Setup Animation Mixer
    this.mixer = new THREE.AnimationMixer(sceneClone);
    this.actions = {};

    const rawClips = gltf.animations || [];
    rawClips.forEach((clip) => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });

    // Smart fuzzy clip resolver for custom models
    const findClip = (targetName, keywords = []) => {
      if (targetName && this.actions[targetName]) return this.actions[targetName];
      for (const kw of keywords) {
        const match = rawClips.find(c => (c.name || '').toLowerCase().includes(kw));
        if (match && this.actions[match.name]) return this.actions[match.name];
      }
      const firstKey = Object.keys(this.actions)[0];
      return firstKey ? this.actions[firstKey] : null;
    };

    const idleAction = findClip(config.clipsMap.idle, ['idle', 'survey', 'stand', 'breath', 'wait', 'take 001']);
    const walkAction = findClip(config.clipsMap.walk, ['walk', 'trot', 'step', 'move', 'run']) || idleAction;
    const runAction = findClip(config.clipsMap.run, ['run', 'sprint', 'attack', 'dash', 'fast']) || walkAction;

    this.stateActions = {
      idle: idleAction,
      walk: walkAction,
      run: runAction
    };

    this.playAction('idle', 0.2);

    // Adjust wings and crest position based on character height
    if (this.crestGroup) {
      this.crestGroup.position.y = config.targetHeight * 0.72;
      this.crestGroup.visible = this.auraEnabled;
    }
    if (this.wingsGroup) {
      this.wingsGroup.position.y = config.targetHeight * 0.35;
      this.wingsGroup.visible = this.auraEnabled && (this.currentCharacterType !== 'dragon');
    }
  }

  applyMaterialsToModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;

            // 1. PRESERVE ORIGINAL 3D ARTIST TEXTURES (Eyes, Fur, Markings, Face)
            if (mat.map) {
              if (mat.color && typeof mat.color.setHex === 'function') {
                mat.color.setHex(0xffffff); // Pure white multiplier keeps texture authentic and rich
              }
              mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.map.needsUpdate = true;
            }

            // 2. Realistic subtle PBR surface response with eye catchlight & metallic polish
            const matName = (mat.name || '').toLowerCase();
            const isEye = matName.includes('eye');
            const isMetal = (mat.metalness && mat.metalness > 0.3) || matName.includes('gold') || matName.includes('steel') || matName.includes('blade') || matName.includes('metal') || matName.includes('buckle') || matName.includes('iron') || matName.includes('brass');
            const isLeather = matName.includes('coat') || matName.includes('leather') || matName.includes('boot') || matName.includes('glove');

            if (isEye) {
              mat.roughness = 0.12; // Extra glossy and glistening for eyes!
              mat.metalness = 0.25;
            } else if (isMetal) {
              // Maintain crisp metallic reflections on sword blades, quillons, pommels & buckles!
              mat.roughness = Math.min(mat.roughness || 0.2, 0.24);
              mat.metalness = Math.max(mat.metalness || 0.85, 0.85);
            } else if (isLeather) {
              mat.roughness = 0.42; // Soft conditioned leather
              mat.metalness = 0.10;
            } else {
              mat.roughness = 0.58; // Soft natural fur and scale specular sheen
              mat.metalness = 0.04;
            }

            // 3. Clear flat color flood so animal looks completely natural
            if (mat.emissive && typeof mat.emissive.setHex === 'function') {
              if (!isEye) {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0.0;
              }
            }
            mat.needsUpdate = true;
          });
        }
      }
    });
  }

  playAction(actionName, fadeDuration = 0.25) {
    const nextAction = this.stateActions[actionName];
    if (!nextAction || nextAction === this.currentAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
    }

    nextAction.reset().fadeIn(fadeDuration).play();
    this.currentAction = nextAction;
  }

  setTheme(themeName) {
    this.theme = themeName;
    this.updateThemeLighting();

    if (this.currentModel) {
      this.applyMaterialsToModel(this.currentModel);
    }

    // Update Wings & Crest Materials
    if (this.wingMat) {
      this.wingMat.color.setHex(this.theme === 'dark' ? 0xff4400 : 0x00e5ff);
      this.wingMat.emissive.setHex(this.theme === 'dark' ? 0xff3300 : 0x00b4d8);
    }
    if (this.gemMat) {
      this.gemMat.color.setHex(this.theme === 'dark' ? 0xffaa00 : 0x38bdf8);
      this.gemMat.emissive.setHex(this.theme === 'dark' ? 0xff4400 : 0x00e5ff);
    }
    if (this.haloMat) {
      this.haloMat.color.setHex(this.theme === 'dark' ? 0xff7700 : 0x7dd3fc);
    }
  }

  setCharacter(charType) {
    if (charType === this.currentCharacterType) return Promise.resolve();
    const loadPromise = this.loadCharacter(charType);
    this.jump();
    this.spawnParticle('star', 8);
    if (window.soundFX) window.soundFX.playBurst();
    return loadPromise;
  }

  // Coordinate Conversion (Screen pixels to Three.js World coordinates)
  screenToWorld(screenX, screenY) {
    const xNdc = (screenX / this.screenWidth) * 2 - 1;
    const yNdc = -(screenY / this.screenHeight) * 2 + 1;
    const dist = this.camera.position.z;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * dist;
    const width = height * this.camera.aspect;
    return {
      x: (xNdc * width) / 2,
      y: (yNdc * height) / 2
    };
  }

  // Particle System
  spawnParticle(type = 'star', count = 1) {
    if (!this.particleGeo) {
      this.particleGeo = new THREE.PlaneGeometry(0.35, 0.35);
    }
    for (let i = 0; i < count; i++) {
      let texture = this.starTexture;
      if (type === 'heart') texture = this.heartTexture;
      if (type === 'zzz') texture = this.zzzTexture;
      if (type === 'ember') texture = this.emberTexture;
      if (type === 'spark') texture = this.sparkTexture;
      if (type === 'snowflake') texture = this.snowflakeTexture;
      if (type === 'void') texture = this.voidTexture;

      const pMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(this.particleGeo, pMat);

      const worldPos = this.screenToWorld(this.screenX, this.screenY);
      mesh.position.set(
        worldPos.x + (Math.random() - 0.5) * 1.1,
        worldPos.y + 0.3 + Math.random() * 0.7,
        0.5 + Math.random() * 0.2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        mat: pMat,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.1 + Math.random() * 0.9,
        rotSpeed: (Math.random() - 0.5) * 3,
        life: 1.0,
        decay: 0.65 + Math.random() * 0.35
      });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta * p.decay;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mat.dispose();
        // Do NOT dispose shared this.particleGeo
        this.particles.splice(i, 1);
      } else {
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.rotation.z += p.rotSpeed * delta;
        p.mat.opacity = p.life;
        p.mesh.scale.setScalar(0.75 + (1 - p.life) * 0.4);
      }
    }
  }

  // Interactive Mouse & Drag Management
  initInteraction() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
      this.mouse.x = (e.clientX / this.screenWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / this.screenHeight) * 2 + 1;

      if (this.isDragging) {
        this.screenX = Math.max(60, Math.min(this.screenWidth - 60, e.clientX - this.dragStartX));
        this.screenY = Math.max(60, Math.min(this.floorY, e.clientY - this.dragStartY));
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Left click only
      const hit = this.hitTest(e.clientX, e.clientY);
      if (hit) {
        this.isDragging = true;
        this.dragStartX = e.clientX - this.screenX;
        this.dragStartY = e.clientY - this.screenY;
        this.state = 'DRAGGING';
        this.playAction('run', 0.15);
        this.spawnParticle('heart', 3);
        if (window.soundFX) window.soundFX.playHappyChime();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.screenY < this.floorY - 5) {
          this.state = 'FALLING';
          this.vy = 80; // Downward drop release velocity in px/s
        } else {
          this.state = 'IDLE';
          this.screenY = this.floorY;
          this.vy = 0;
          this.playAction('idle', 0.2);
        }
      }
    });
  }

  hitTest(clientX, clientY) {
    const dx = clientX - this.screenX;
    const dy = clientY - this.screenY;
    // Sized to match ~160px companion
    return Math.hypot(dx, dy) < 85;
  }

  // Interactive Skills & Actions
  walkTo(targetScreenX, isSprint = false) {
    this.currentHabit = null;
    this.habitProgress = 0;
    this.isSprinting = !!isSprint;
    this.targetX = Math.max(80, Math.min(this.screenWidth - 80, targetScreenX));
    this.facing = this.targetX >= this.screenX ? 1 : -1;
    this.state = this.isSprinting ? 'RUNNING' : 'WALKING';
    this.playAction(this.isSprinting ? 'run' : 'walk', 0.15);
  }

  chaseTarget(targetScreenX, targetScreenY, isSprint = true) {
    this.currentHabit = null;
    this.habitProgress = 0;
    this.isSprinting = isSprint;
    this.targetX = Math.max(60, Math.min(this.screenWidth - 60, targetScreenX));
    this.facing = this.targetX >= this.screenX ? 1 : -1;
    this.state = 'RUNNING';
    this.playAction('run', 0.12);
  }

  pounceAt(targetScreenX, targetScreenY) {
    this.currentHabit = null;
    this.habitProgress = 0;
    this.isSprinting = false;
    this.jump(false);
    this.spawnParticle(this.theme === 'dark' ? 'ember' : 'star', 8);
    this.spawnParticle('heart', 4);
    this.triggerHabit('PLAYFUL_WIGGLE');
  }

  updateScreenBounds(newWidth, newHeight) {
    this.screenWidth = newWidth;
    this.screenHeight = newHeight;
    this.floorY = Math.max(200, this.screenHeight - 75);
    if (this.state === 'IDLE') {
      this.screenY = this.floorY;
    } else {
      this.screenY = Math.min(this.screenY, this.floorY);
    }
    this.camera.aspect = this.screenWidth / this.screenHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.screenWidth, this.screenHeight);
  }

  moveToDisplay(displayBounds) {
    if (!displayBounds) return;
    const targetX = displayBounds.x + displayBounds.width / 2;
    this.walkTo(targetX, true);
    this.jump(false);
  }

  jump(playSound = true) {
    if (this.state === 'JUMPING') return;
    this.currentHabit = null;
    this.habitProgress = 0;
    this.state = 'JUMPING';
    this.vy = -560; // Snappy physical vertical launch (px/s)
    this.playAction('run', 0.15);
    this.spawnParticle(this.theme === 'dark' ? 'ember' : 'star', 4);
    if (playSound && window.soundFX) window.soundFX.playHappyChime();
  }

  playSomersault() {
    if (this.state === 'JUMPING') return;
    this.currentHabit = null;
    this.habitProgress = 0;
    this.state = 'JUMPING';
    this.vy = -640; // Higher launch for full 360 flip
    this.isSomersaulting = true;
    this.somersaultAngle = 0;
    this.playAction('run', 0.15);
    this.spawnParticle(this.theme === 'dark' ? 'ember' : 'star', 10);
    if (window.soundFX) window.soundFX.playWhoosh();
  }

  elementalBurst() {
    this.jump(false);
    let particleType = 'ember';
    if (this.elementalAura === 'thunder') particleType = 'spark';
    else if (this.elementalAura === 'frost') particleType = 'snowflake';
    else if (this.elementalAura === 'void') particleType = 'void';

    this.spawnParticle(particleType, 22);
    this.spawnParticle('star', 10);
    this.spawnParticle('heart', 5);
    if (window.soundFX) window.soundFX.playBurst();
  }

  setElementalAura(aura) {
    const valid = ['fire', 'thunder', 'frost', 'void'];
    this.elementalAura = valid.includes(aura) ? aura : 'fire';

    if (this.wingMat) {
      if (this.elementalAura === 'fire') {
        this.wingMat.color.setHex(0xff4400);
        this.wingMat.emissive.setHex(0xff3300);
      } else if (this.elementalAura === 'thunder') {
        this.wingMat.color.setHex(0x00f5ff);
        this.wingMat.emissive.setHex(0x00b4d8);
      } else if (this.elementalAura === 'frost') {
        this.wingMat.color.setHex(0x99e5ff);
        this.wingMat.emissive.setHex(0x7dd3fc);
      } else if (this.elementalAura === 'void') {
        this.wingMat.color.setHex(0xd946ef);
        this.wingMat.emissive.setHex(0xa855f7);
      }
    }
    if (this.gemMat) {
      if (this.elementalAura === 'fire') this.gemMat.color.setHex(0xffaa00);
      else if (this.elementalAura === 'thunder') this.gemMat.color.setHex(0x00f5ff);
      else if (this.elementalAura === 'frost') this.gemMat.color.setHex(0xbae6fd);
      else if (this.elementalAura === 'void') this.gemMat.color.setHex(0xe879f9);
    }
    this.elementalBurst();
    return this.elementalAura;
  }

  cycleElementalAura() {
    const list = ['fire', 'thunder', 'frost', 'void'];
    const idx = (list.indexOf(this.elementalAura) + 1) % list.length;
    return this.setElementalAura(list[idx]);
  }

  feed() {
    this.state = 'EATING';
    this.eatingTimer = 2.4;
    this.jump(false);
    this.spawnParticle('heart', 6);
    if (window.soundFX) window.soundFX.playMunch();
  }

  sleep() {
    this.state = 'SLEEPING';
    this.playAction('idle', 0.5);
    if (this.mixer) this.mixer.timeScale = 0.35; // Slow breathing in sleep
  }

  wakeUp() {
    this.state = 'IDLE';
    if (this.mixer) this.mixer.timeScale = 1.0;
    this.playAction('idle', 0.2);
    this.jump(false);
  }

  setListening(isListening) {
    if (isListening) {
      this.state = 'LISTENING';
      this.playAction('idle', 0.15);
      this.targetFacing = 0; // Turn directly towards user/camera
    } else if (this.state === 'LISTENING') {
      this.state = 'IDLE';
      this.targetFacing = 1;
    }
  }

  setThinking(isThinking) {
    if (isThinking) {
      this.state = 'THINKING';
      this.playAction('idle', 0.15);
      this.spawnParticle('star', 2);
    } else if (this.state === 'THINKING') {
      this.state = 'IDLE';
    }
  }

  // Ultra-Level Lip-Sync & Speaking Articulation System
  startSpeaking(duration = 4.0, emotion = 'normal') {
    this.isSpeaking = true;
    this.speakingTimer = duration;
    this.speakingEmotion = emotion;
    this.targetFacing = 0; // Faces directly into the camera / user
    if (this.state === 'SLEEPING') {
      this.wakeUp();
    }
    this.playAction('idle', 0.2);
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.speakingTimer = 0;
    this.speakingEmotion = 'normal';
  }

  // Expressive Emotional Reaction Skills
  reactTouch() {
    this.jump(false);
    this.spawnParticle('heart', 6);
    this.triggerHabit('EAR_PERK');
    if (window.soundFX) window.soundFX.playHappyChime();
  }

  reactCurious() {
    this.triggerHabit('EAR_PERK');
    this.spawnParticle('star', 4);
    if (window.soundFX) window.soundFX.playCurious();
  }

  reactLove() {
    this.jump(false);
    this.spawnParticle('heart', 10);
    this.triggerHabit('PLAYFUL_WIGGLE');
    if (window.soundFX) window.soundFX.playHappyChime();
  }

  reactCelebrate() {
    this.playSomersault();
    this.spawnParticle('star', 15);
    this.spawnParticle('heart', 6);
    this.triggerHabit('PLAYFUL_WIGGLE');
    if (window.soundFX) window.soundFX.playBurst();
  }

  reactPetRub() {
    this.spawnParticle('heart', 2);
    this.triggerHabit('SCRATCH');
    if (window.soundFX) window.soundFX.playPurr();
  }

  triggerHabit(habitName) {
    this.currentHabit = habitName;
    this.habitProgress = 0;
  }

  setPaused(paused) {
    this.isPaused = !!paused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
  }

  // 60FPS Main Animation Loop with Smart Idle Throttling
  animate() {
    if (this.isPaused) {
      this.animId = requestAnimationFrame(() => this.animate());
      return;
    }

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05); // Cap to 50ms to prevent spiral of death
    this.lastTime = now;
    const time = now / 1000;

    // 0. RESET SINGLE POINT OF TRUTH OFFSETS (Eliminates frame-by-frame cumulative tilt/drift!)
    this.modelPitch = 0;
    this.modelRoll = 0;
    this.modelElevation = 0;
    this.modelDepth = 0;
    this.headPitchOffset = 0;
    this.headYawOffset = 0;
    this.headRollOffset = 0;
    this.neckPitchOffset = 0;
    this.neckYawOffset = 0;
    this.jawPitchOffset = 0;

    // 1. Base Skeletal Animation Keyframe Mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Physics (SI Gravity, Grounding, Walk/Run, Settle Bounce, Somersault)
    this.updatePhysics(delta);

    // 3. Procedural Skeletal Layering (Lip-Sync, Blinking, Breathing, Dynamic Spring Tail, Weight Shift, 11 Living Habits)
    this.updateProceduralAnimation(time, delta);

    // 4. Body Language & Saccadic Gaze Tracking
    this.updateBodyLanguage(time, delta);

    // 5. Apply All Offsets Cleanly to Model Pivot & Skeletal Bones
    this.applyProceduralTransforms();

    // 6. Wings & Crest
    this.updateWingsAndCrest(time, delta);

    // 7. Dynamic Particles
    this.updateParticles(delta);

    // 8. Synchronize 3D Position with Desktop Pixel Coordinates
    if (this.state === 'IDLE' && !this.isDragging) {
      this.screenY = this.floorY;
      this.vy = 0;
    }
    const worldPos = this.screenToWorld(this.screenX, this.screenY);
    this.characterGroup.position.set(worldPos.x, worldPos.y, 0);

    // 9. Soft Dual-Layer Contact Shadows
    const heightAboveFloor = Math.max(0, this.floorY - this.screenY);
    if (this.aoMesh && this.penumbraMesh) {
      const aoScale = Math.max(0.08, 1.0 - heightAboveFloor / 160);
      this.aoMesh.scale.set(aoScale, aoScale, aoScale);
      this.aoMat.opacity = Math.max(0.0, 0.72 - heightAboveFloor / 200);

      const penumbraScale = Math.max(0.25, 1.0 + heightAboveFloor / 380);
      this.penumbraMesh.scale.set(penumbraScale, penumbraScale, penumbraScale);
      this.penumbraMat.opacity = Math.max(0.04, 0.38 - heightAboveFloor / 550);
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.mixer) this.mixer.stopAllAction();
    if (this.particleGeo) this.particleGeo.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  // Apply Single Point of Truth Transforms cleanly
  applyProceduralTransforms() {
    // Apply computed frame drivers directly to model pivot
    this.modelPivot.rotation.x = this.modelPitch;
    this.modelPivot.rotation.y = this.currentYaw;
    this.modelPivot.rotation.z = this.modelRoll;
    this.modelPivot.position.y = this.modelElevation;
    this.modelPivot.position.z = this.modelDepth;

    // Apply skeletal bone additive offsets on top of current animation mixer frame
    if (this.headBone) {
      this.headBone.rotation.x += this.headPitchOffset;
      this.headBone.rotation.y += this.headYawOffset;
      this.headBone.rotation.z += this.headRollOffset;
    }
    if (this.neckBone) {
      this.neckBone.rotation.x += this.neckPitchOffset;
      this.neckBone.rotation.y += this.neckYawOffset;
    }
    if (this.jawBone) {
      this.jawBone.rotation.x += this.jawPitchOffset;
    }
  }

  // Procedural Skeletal Layering: Injected on top of rigged animations
  updateProceduralAnimation(time, delta) {
    // A. Real-Time Lip-Sync & Speech Cadence Nodding / Articulation
    if (this.isSpeaking) {
      this.speakingTimer -= delta;
      if (this.speakingTimer <= 0) {
        this.stopSpeaking();
      }

      // Multi-harmonic cadence: 16Hz syllable flutter + 3.6Hz expressive stress phrase rhythm
      const cadence = Math.sin(time * 16.2) * 0.065 + Math.sin(time * 7.8) * 0.038;
      const speechPitch = cadence * (0.8 + Math.sin(time * 3.4) * 0.3);

      this.headPitchOffset += speechPitch;
      this.headYawOffset += Math.sin(time * 3.6) * 0.045;
      this.headRollOffset += Math.sin(time * 2.4) * 0.035;
      this.neckPitchOffset += speechPitch * 0.45;
      this.jawPitchOffset += Math.max(0, cadence * 0.1);

      if (Math.random() < 0.04) {
        this.spawnParticle(this.speakingEmotion === 'love' ? 'heart' : (this.theme === 'dark' ? 'ember' : 'star'), 1);
      }
    }

    // A1. Continuous Elemental Aura Particle Trails
    this.auraParticleTimer = (this.auraParticleTimer || 0) + delta;
    if (this.auraParticleTimer > 0.22 && this.state !== 'SLEEPING') {
      this.auraParticleTimer = 0;
      if (this.elementalAura === 'fire') this.spawnParticle('ember', 1);
      else if (this.elementalAura === 'thunder') this.spawnParticle('spark', 1);
      else if (this.elementalAura === 'frost') this.spawnParticle('snowflake', 1);
      else if (this.elementalAura === 'void') this.spawnParticle('void', 1);
    }

    // A2. Procedural Dynamic Eye Blinking & Emotional Facial Expressions
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer > this.nextBlinkInterval) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 0;
      this.isDoubleBlink = Math.random() < 0.18;
      this.nextBlinkInterval = 2.4 + Math.random() * 3.6;
    }

    let blinkFactor = 0;
    if (this.isBlinking) {
      const blinkDuration = this.isDoubleBlink ? 0.28 : 0.14;
      this.blinkProgress += delta;
      const bt = this.blinkProgress / blinkDuration;
      if (bt <= 1.0) {
        if (this.isDoubleBlink) {
          const s = Math.sin(bt * Math.PI * 2);
          blinkFactor = s > 0 ? s : 0;
        } else {
          blinkFactor = Math.sin(bt * Math.PI);
        }
      } else {
        this.isBlinking = false;
        blinkFactor = 0;
      }
    }

    // Emotional Eye Modulation
    let emotionalSquint = 0;
    if (this.isBeingPetted || this.speakingEmotion === 'happy' || this.speakingEmotion === 'love') {
      emotionalSquint = 0.50;
    } else if (this.state === 'SLEEPING') {
      emotionalSquint = 0.88;
    }

    const totalEyeClosure = Math.min(1.0, blinkFactor + emotionalSquint);

    // Apply to dedicated eye nodes/meshes (Dragon eyes)
    if (this.eyeMeshes && this.eyeMeshes.length > 0) {
      this.eyeMeshes.forEach((eye) => {
        eye.scale.y = Math.max(0.06, 1.0 - totalEyeClosure * 0.94);
      });
    }

    // Apply to Head Bone micro-squash for skinned meshes (Fox & Cat)
    if (this.headBone) {
      this.headBone.scale.y = 1.0 - totalEyeClosure * 0.07;
    }

    // Glistening catchlight fades naturally during blink
    if (this.eyeCatchLight) {
      this.eyeCatchLight.intensity = this.baseEyeCatchLightIntensity * Math.max(0.05, 1.0 - totalEyeClosure);
    }

    // B. Organic Procedural Breathing Simulation
    const breathSpeed = this.state === 'SLEEPING' ? 1.4 : (this.isSpeaking ? 3.0 : 2.2);
    const breathAmp = this.state === 'SLEEPING' ? 0.032 : 0.016;
    const breath = Math.sin(time * breathSpeed);

    if (this.spineBones.length > 0) {
      const mainSpine = this.spineBones[0];
      mainSpine.scale.y = 1 + breath * breathAmp;
      mainSpine.scale.z = 1 + breath * breathAmp;
    }
    this.modelElevation += (breath * (breathAmp * 0.35)) + (this.settleBounce || 0);

    // C. Spring-Harmonic Dynamic Tail Physics
    if (this.tailBones && this.tailBones.length > 0) {
      const moveInertia = -(this.vx || 0) * 0.0022;
      const isExcited = this.state === 'JUMPING' || this.isSomersaulting || this.speakingEmotion === 'excited' || this.speakingEmotion === 'happy';
      const wagFreq = isExcited ? 12.0 : (this.isSpeaking ? 7.6 : (this.state === 'SLEEPING' ? 1.0 : 3.2));
      const wagAmp = isExcited ? 0.32 : (this.isSpeaking ? 0.20 : (this.state === 'SLEEPING' ? 0.03 : 0.12));

      this.tailBones.forEach((bone, idx) => {
        if (!this.tailPhysics[idx]) {
          this.tailPhysics[idx] = { angleY: 0, velY: 0, angleZ: 0, velZ: 0 };
        }
        const tp = this.tailPhysics[idx];
        const phase = idx * 0.52;
        const targetAngleY = Math.sin(time * wagFreq + phase) * (wagAmp * (1 + idx * 0.35)) + moveInertia * (1 + idx * 0.4);
        const targetAngleZ = Math.cos(time * (wagFreq * 0.5) + phase) * 0.04;

        const springK = 38.0;
        const damping = 7.5;
        const forceY = (targetAngleY - tp.angleY) * springK - tp.velY * damping;
        tp.velY += forceY * delta;
        tp.angleY += tp.velY * delta;

        const forceZ = (targetAngleZ - tp.angleZ) * springK - tp.velZ * damping;
        tp.velZ += forceZ * delta;
        tp.angleZ += tp.velZ * delta;

        bone.rotation.y += tp.angleY;
        bone.rotation.z += tp.angleZ;
      });
    }

    // D. Weight-Shifting Micro-Rhythm (Real creatures shift weight while standing idle)
    if (this.state === 'IDLE' && !this.isSpeaking && !this.isDragging) {
      this.weightShiftTimer += delta;
      if (this.weightShiftTimer > 5.5) {
        this.weightShiftTimer = 0;
        this.weightShiftTarget = (Math.random() - 0.5) * 0.055;
      }
      this.weightShiftCurrent = THREE.MathUtils.lerp(this.weightShiftCurrent, this.weightShiftTarget, delta * 3.0);
      this.modelRoll += this.weightShiftCurrent; // Safe additive offset for this frame only
      if (this.spineBones.length > 0) {
        this.spineBones[0].rotation.z += this.weightShiftCurrent * 0.5;
      }
    } else {
      this.weightShiftCurrent = 0;
      this.weightShiftTarget = 0;
    }

    // E. 11 Autonomous Living Character Habits Matrix
    if (this.state === 'IDLE' && !this.isSpeaking && !this.isDragging) {
      this.habitTimer += delta;

      if (!this.currentHabit && this.habitTimer > this.nextHabitInterval) {
        this.habitTimer = 0;
        this.nextHabitInterval = 6 + Math.random() * 8;
        const habits = [
          'STRETCH', 'SNIFF_GROUND', 'EAR_PERK', 'PAW_GROOM',
          'SURVEY_DESKTOP', 'YAWN_SNOOZE', 'PLAYFUL_WIGGLE', 'SCRATCH',
          'SNEEZE', 'CURIOSITY_PEEK', 'PLAYFUL_POUNCE'
        ];
        this.currentHabit = habits[Math.floor(Math.random() * habits.length)];
        this.habitProgress = 0;
      }

      if (this.currentHabit) {
        this.habitProgress += delta;

        if (this.currentHabit === 'STRETCH') {
          // 1. Full Deep Arched Stretch: paws dip, chest lowers, spine arches up
          const t = this.habitProgress / 2.4;
          if (t <= 1.0) {
            const curve = Math.sin(t * Math.PI);
            this.modelPitch += curve * 0.22;
            this.headPitchOffset += -curve * 0.18;
            if (this.tailBones && this.tailBones.length > 0) this.tailBones[0].rotation.x += curve * 0.25;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'SNIFF_GROUND') {
          // 2. Curious Ground Sniffing at taskbar
          const t = this.habitProgress / 1.8;
          if (t <= 1.0) {
            const sniffPulse = Math.sin(time * 26) * 0.05;
            this.headPitchOffset += 0.16 + sniffPulse;
            this.headYawOffset += Math.sin(time * 6) * 0.06;
            this.modelElevation += -0.02;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'EAR_PERK' || this.currentHabit === 'EAR_TWITCH') {
          // 3. Inquisitive Sound Alert Perk: ears perk, 20° head cock
          const t = this.habitProgress / 1.2;
          if (t <= 1.0) {
            const twitch = Math.sin(this.habitProgress * 28) * Math.exp(-this.habitProgress * 5) * 0.14;
            this.headRollOffset += 0.20 + twitch;
            this.headPitchOffset += -0.06;
            this.modelElevation += 0.02;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'PAW_GROOM') {
          // 4. Paw Grooming & Face Washing Gesture
          const t = this.habitProgress / 2.2;
          if (t <= 1.0) {
            const groomPulse = Math.sin(time * 16) * 0.08;
            this.modelPitch += -0.05;
            this.headPitchOffset += 0.12 + groomPulse;
            this.headRollOffset += Math.sin(time * 8) * 0.05;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'SURVEY_DESKTOP') {
          // 5. Standing Tall & Surveying Screen Left-to-Right
          const t = this.habitProgress / 2.6;
          if (t <= 1.0) {
            const lookAngle = Math.sin(t * Math.PI * 2) * 0.35;
            this.headYawOffset += lookAngle;
            this.neckYawOffset += lookAngle * 0.4;
            this.headPitchOffset += -0.04;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'YAWN_SNOOZE') {
          // 6. Yawn with jaw opening and relaxing blink
          const t = this.habitProgress / 2.2;
          if (t <= 1.0) {
            const curve = Math.sin(t * Math.PI);
            this.headPitchOffset += -curve * 0.18;
            this.jawPitchOffset += curve * 0.20;
            if (t > 0.4 && t < 0.65 && Math.random() < 0.07) this.spawnParticle('zzz', 1);
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'PLAYFUL_WIGGLE') {
          // 7. Playful Butt Wiggle before pounce!
          const t = this.habitProgress / 2.0;
          if (t <= 1.0) {
            const wiggle = Math.sin(time * 24) * 0.16;
            this.modelPitch += 0.12; // Front chest down
            this.modelRoll += wiggle * 0.35; // Hips wiggle
            if (this.tailBones && this.tailBones.length > 0) {
              this.tailBones[0].rotation.y += wiggle;
              this.tailBones[0].rotation.x += 0.22; // Tail up
            }
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'SCRATCH') {
          // 8. Quick Cute Shoulder/Ear Scratch
          const t = this.habitProgress / 1.1;
          if (t <= 1.0) {
            const scratch = Math.sin(time * 34) * 0.12;
            this.headRollOffset += 0.22 + scratch;
            this.headPitchOffset += 0.08;
            this.modelRoll += scratch * 0.25;
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'SNEEZE') {
          // 9. Sneeze Habit: Inhale anticipation -> sudden cute sneeze burst!
          const t = this.habitProgress / 1.35;
          if (t < 0.45) {
            const twitch = Math.sin(time * 30) * 0.04;
            this.headPitchOffset += -0.18 + twitch;
          } else if (t >= 0.45 && t < 0.7) {
            if (!this._sneezedThisHabit) {
              this._sneezedThisHabit = true;
              this.spawnParticle('star', 7);
              if (window.soundFX) window.soundFX.playSneeze();
            }
            this.headPitchOffset += 0.36;
            this.modelElevation += -0.06;
          } else if (t <= 1.0) {
            this.headPitchOffset += THREE.MathUtils.lerp(0.36, 0, (t - 0.7) / 0.3);
          } else {
            this._sneezedThisHabit = false;
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'CURIOSITY_PEEK') {
          // 10. Curiosity Screen Peek: Leans close to screen glass
          const t = this.habitProgress / 2.0;
          if (t <= 1.0) {
            const peekPulse = Math.sin(t * Math.PI);
            this.modelDepth += peekPulse * 0.45;
            this.headRollOffset += 0.22 * Math.sin(t * Math.PI);
            this.headPitchOffset += -0.1 * Math.sin(t * Math.PI);
          } else {
            this.currentHabit = null;
          }
        } else if (this.currentHabit === 'PLAYFUL_POUNCE') {
          // 11. Playful Pounce: Wiggle then mini hop!
          const t = this.habitProgress / 1.8;
          if (t < 0.55) {
            const wiggle = Math.sin(time * 26) * 0.18;
            this.modelPitch += 0.14;
            this.modelRoll += wiggle * 0.3;
            if (this.tailBones && this.tailBones.length > 0) this.tailBones[0].rotation.y += wiggle;
          } else if (t < 0.85) {
            if (!this._pouncedThisHabit) {
              this._pouncedThisHabit = true;
              this.jump(false);
              if (window.soundFX) window.soundFX.playHappyChime();
            }
          } else {
            this._pouncedThisHabit = false;
            this.currentHabit = null;
          }
        } else {
          // Safety timeout fallback if unhandled habit is triggered
          if (this.habitProgress > 2.5) {
            this.currentHabit = null;
          }
        }
      }
    }
  }

  updatePhysics(delta) {
    // 1. Walking / Running Logic with Locomotion Inertia (Ease-In / Ease-Out)
    if (this.state === 'WALKING' || this.state === 'RUNNING') {
      // Screen border bounce & safety turn
      if (this.screenX < 65) {
        this.screenX = 65;
        this.targetX = 175 + Math.random() * 220;
        this.facing = 1;
      } else if (this.screenX > this.screenWidth - 65) {
        this.screenX = this.screenWidth - 65;
        this.targetX = this.screenWidth - 175 - Math.random() * 220;
        this.facing = -1;
      }
      const maxSpeed = this.isSprinting ? 280 : (this.state === 'RUNNING' ? 190 : 110);
      const dist = this.targetX - this.screenX;

      // Smooth deceleration zone within 70px
      const decel = Math.min(1.0, Math.abs(dist) / 70);
      const targetVx = Math.sign(dist) * maxSpeed * Math.max(0.18, decel);

      // Smooth inertial acceleration
      this.vx = THREE.MathUtils.lerp(this.vx || 0, targetVx, delta * 9.0);
      this.screenX += this.vx * delta;
      this.walkCycle += delta * (Math.abs(this.vx) / maxSpeed) * 11.0;
      this.facing = Math.sign(this.vx || dist || 1);

      // Anticipation forward lean & stride roll
      const forwardLean = (Math.abs(this.vx) / maxSpeed) * 0.07;
      this.modelPitch += forwardLean + Math.sin(this.walkCycle * 2) * 0.022;
      this.modelRoll += Math.sin(this.walkCycle) * 0.032;

      // Arrival & Settle Bounce
      if (Math.abs(dist) < 5 && Math.abs(this.vx) < 18) {
        this.state = 'IDLE';
        this.isSprinting = false;
        this.vx = 0;
        this.walkCycle = 0;
        this.settleBounce = -0.055; // Downward compression bounce on stop!
        this.playAction('idle', 0.25);
      }
    } else {
      // Spring back settle compression bounce
      this.settleBounce = THREE.MathUtils.lerp(this.settleBounce || 0, 0, delta * 12.0);
    }

    // 2. Jumping / Somersault & Gravity Physics (Rock-Solid SI Units: px/s & px/s²)
    if (this.state === 'JUMPING' || this.state === 'FALLING') {
      const GRAVITY = 1500; // px/s²
      this.vy = Math.min(this.vy + GRAVITY * delta, 1100);
      this.screenY += this.vy * delta;

      if (this.isSomersaulting) {
        this.somersaultAngle += delta * Math.PI * 4.8;
        if (this.somersaultAngle >= Math.PI * 2) {
          this.somersaultAngle = 0;
          this.isSomersaulting = false;
        } else {
          this.modelPitch += this.somersaultAngle;
        }
      }

      // Land on taskbar floor
      if (this.screenY >= this.floorY) {
        this.screenY = this.floorY;
        this.vy = 0;
        this.state = 'IDLE';
        this.isSomersaulting = false;
        this.somersaultAngle = 0;
        this.settleBounce = -0.06; // Impact squash bounce on landing
        this.playAction('idle', 0.2);
        this.spawnParticle(this.theme === 'dark' ? 'ember' : 'star', 3);
      }
    }

    // 3. Eating State Timer
    if (this.state === 'EATING') {
      this.eatingTimer -= delta;
      if (this.eatingTimer <= 0) {
        this.state = 'IDLE';
        this.playAction('idle', 0.2);
      }
    }

    // 4. Autonomous Roaming: Wanders along taskbar when idle
    if (this.isRoaming && this.state === 'IDLE' && !this.isSpeaking && !this.currentHabit) {
      this.idleTimer += delta;
      if (this.idleTimer > this.roamCooldown) {
        this.idleTimer = 0;
        this.roamCooldown = 9 + Math.random() * 9;
        const r = Math.random();
        if (r < 0.55) {
          const randomTarget = Math.max(120, Math.min(this.screenWidth - 120, this.screenX + (Math.random() - 0.5) * 450));
          this.walkTo(randomTarget);
        } else if (r < 0.75) {
          this.jump(false);
        }
      }
    }

    // Ambient particles: stardust/embers from wings
    if (Math.random() < 0.04 && this.state !== 'SLEEPING') {
      this.spawnParticle(this.theme === 'dark' ? 'ember' : 'star', 1);
    }

    // Floating Zzz when sleeping
    if (this.state === 'SLEEPING' && Math.random() < 0.05) {
      this.spawnParticle('zzz', 1);
    }
  }

  updateBodyLanguage(time, delta) {
    // 1. Saccadic Gaze & Inverse Kinematics Tracking
    let desiredYaw = this.facing === 1 ? Math.PI / 2 : -Math.PI / 2;

    if (this.isSpeaking || this.state === 'LISTENING') {
      desiredYaw = 0; // Look directly into the user's camera / eyes!
    } else if (this.state === 'IDLE' || this.state === 'THINKING') {
      const dx = this.mouse.screenX - this.screenX;
      const dy = this.mouse.screenY - this.screenY;
      const dist = Math.hypot(dx, dy);

      if (dist < 720 && this.state !== 'SLEEPING') {
        const mouseAngle = Math.atan2(dx, 420);
        desiredYaw = THREE.MathUtils.clamp(mouseAngle, -Math.PI / 2.4, Math.PI / 2.4);

        // Vertical head pitch and horizontal neck yaw with saccadic dampening
        const targetPitch = -Math.atan2(dy, 420) * 0.45; // Look up when mouse is high, down when low
        const targetHeadYaw = (mouseAngle - desiredYaw) * 0.85;

        this.headLookPitch = THREE.MathUtils.lerp(this.headLookPitch || 0, targetPitch, delta * 9.0);
        this.headLookYaw = THREE.MathUtils.lerp(this.headLookYaw || 0, targetHeadYaw, delta * 9.0);

        this.headPitchOffset += this.headLookPitch;
        this.headYawOffset += this.headLookYaw * 0.7;
        this.neckPitchOffset += this.headLookPitch * 0.4;
        this.neckYawOffset += this.headLookYaw * 0.3;
      }
    }

    // Smooth spherical interpolation of yaw
    this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, desiredYaw, 0.12);

    // 2. Dragging wiggle flutter
    if (this.state === 'DRAGGING') {
      this.modelRoll += Math.sin(time * 16) * 0.15;
    }
  }

  updateWingsAndCrest(time, delta) {
    // 1. Wing Flapping Physics
    if (this.leftWing && this.rightWing) {
      const isFast = (this.state === 'JUMPING' || this.state === 'RUNNING' || this.isSomersaulting || this.state === 'DRAGGING');
      const flapSpeed = isFast ? 18 : (this.state === 'SLEEPING' ? 1.5 : 3.5);
      const flapAngle = isFast ? 0.45 : (this.state === 'SLEEPING' ? 0.08 : 0.18);

      const flap = Math.sin(time * flapSpeed) * flapAngle;
      this.leftWing.rotation.y = 0.3 + flap;
      this.rightWing.rotation.y = -0.3 - flap;
    }

    // 2. Diamond Crest Floating Animation & AI Thought Reflection
    if (this.crestGroup) {
      // Bobbing & Rotation
      const bobSpeed = (this.state === 'THINKING' ? 8 : 3);
      this.gemMesh.position.y = Math.sin(time * bobSpeed) * 0.04;
      this.gemMesh.rotation.y += delta * (this.state === 'THINKING' ? 4 : 1.5);
      this.gemMesh.rotation.x = Math.sin(time * 2) * 0.15;

      this.haloMesh.position.y = this.gemMesh.position.y;
      this.haloMesh.rotation.z += delta * 2;

      // Emissive pulse
      if (this.gemMat) {
        const pulse = 0.8 + Math.sin(time * (this.state === 'THINKING' ? 12 : 3.5)) * 0.45;
        this.gemMat.emissiveIntensity = this.state === 'SLEEPING' ? 0.3 : pulse;
      }
    }
  }
}
