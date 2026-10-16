import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Sellsword Fox High-Fidelity 3D Model Procedural Builder
export async function generateSellswordFox() {
  console.log('[SellswordFox] Generating 3D geometry & textures...');

  // 1. Procedural High-Res Texture Canvas
  // Generate a rich, stylized 2048x2048 texture atlas for the character
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#261c16';
  ctx.fillRect(0, 0, 2048, 2048);

  // Fur Texture (warm vibrant orange with hand-painted directional fur grain)
  ctx.fillStyle = '#e86a23';
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 4000; i++) {
    ctx.strokeStyle = Math.random() < 0.5 ? '#d95a14' : '#f57e33';
    ctx.lineWidth = 1 + Math.random() * 2;
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 16, y + 8 + Math.random() * 20);
    ctx.stroke();
  }

  // White Fur Texture (chest mane, belly, tail underside, muzzle)
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(1024, 0, 1024, 1024);
  for (let i = 0; i < 3000; i++) {
    ctx.strokeStyle = Math.random() < 0.5 ? '#e2e8f0' : '#ffffff';
    ctx.lineWidth = 1 + Math.random() * 2.5;
    const x = 1024 + Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 14, y + 6 + Math.random() * 18);
    ctx.stroke();
  }

  // Dark Leather Coat Texture (charcoal with stitched hems and golden trim)
  ctx.fillStyle = '#1e1c24';
  ctx.fillRect(0, 1024, 1024, 1024);
  // Gold filigree embroidery & edge trim
  ctx.strokeStyle = '#dfa838';
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 1054, 964, 964);
  ctx.strokeStyle = '#c48f22';
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 1072, 928, 928);

  // Steel Blade & Golden Crossguard
  const steelGrad = ctx.createLinearGradient(1024, 1024, 2048, 2048);
  steelGrad.addColorStop(0, '#94a3b8');
  steelGrad.addColorStop(0.3, '#f8fafc');
  steelGrad.addColorStop(0.7, '#cbd5e1');
  steelGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = steelGrad;
  ctx.fillRect(1024, 1024, 1024, 1024);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  // Materials with PBR Response
  const furOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xee6920,
    roughness: 0.62,
    metalness: 0.04
  });
  const furWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.68,
    metalness: 0.02
  });
  const furDarkMat = new THREE.MeshStandardMaterial({
    color: 0x221611,
    roughness: 0.55,
    metalness: 0.05
  });
  const leatherCoatMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a22,
    roughness: 0.42,
    metalness: 0.18
  });
  const leatherBrownMat = new THREE.MeshStandardMaterial({
    color: 0x543422,
    roughness: 0.48,
    metalness: 0.12
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xdfab35,
    roughness: 0.25,
    metalness: 0.88
  });
  const steelBladeMat = new THREE.MeshStandardMaterial({
    color: 0xe6edf5,
    roughness: 0.14,
    metalness: 0.94
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.45,
    roughness: 0.08,
    metalness: 0.75
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.22,
    metalness: 0.1
  });

  // Root Hierarchy
  const root = new THREE.Group();
  root.name = 'root';

  // Spine & Torso Group
  const spine = new THREE.Group();
  spine.name = 'spine';
  root.add(spine);

  // 1. Torso & Swashbuckler Coat
  const chestGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.44, 16);
  const chestMesh = new THREE.Mesh(chestGeo, leatherCoatMat);
  chestMesh.position.y = 0.96;
  chestMesh.scale.set(1.0, 1.0, 0.78);
  spine.add(chestMesh);

  // White chest fur ruff in open V-neck
  const ruffGeo = new THREE.ConeGeometry(0.19, 0.38, 8);
  const ruffMesh = new THREE.Mesh(ruffGeo, furWhiteMat);
  ruffMesh.position.set(0, 0.99, 0.15);
  ruffMesh.rotation.x = 0.28;
  spine.add(ruffMesh);

  // Gold lapel piping
  const lapelLeftGeo = new THREE.BoxGeometry(0.022, 0.38, 0.03);
  const lapelLeft = new THREE.Mesh(lapelLeftGeo, goldTrimMat);
  lapelLeft.position.set(-0.11, 0.99, 0.17);
  lapelLeft.rotation.z = -0.22;
  spine.add(lapelLeft);

  const lapelRight = new THREE.Mesh(lapelLeftGeo, goldTrimMat);
  lapelRight.position.set(0.11, 0.99, 0.17);
  lapelRight.rotation.z = 0.22;
  spine.add(lapelRight);

  // Popped Coat Collar (Flared high collar framing fox head)
  const collarBackGeo = new THREE.CylinderGeometry(0.28, 0.19, 0.24, 14, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
  const collarBack = new THREE.Mesh(collarBackGeo, leatherCoatMat);
  collarBack.position.set(0, 1.20, -0.04);
  collarBack.rotation.x = -0.22;
  spine.add(collarBack);

  const collarGoldRimGeo = new THREE.TorusGeometry(0.27, 0.014, 8, 24, Math.PI * 1.4);
  const collarGoldRim = new THREE.Mesh(collarGoldRimGeo, goldTrimMat);
  collarGoldRim.position.set(0, 1.31, -0.05);
  collarGoldRim.rotation.x = Math.PI / 2 - 0.22;
  collarGoldRim.rotation.z = Math.PI * 0.3;
  spine.add(collarGoldRim);

  // Waist Belts & Golden Buckles
  const beltGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.065, 16);
  const belt = new THREE.Mesh(beltGeo, leatherBrownMat);
  belt.position.y = 0.75;
  belt.scale.set(1.0, 1.0, 0.80);
  spine.add(belt);

  const buckleGeo = new THREE.BoxGeometry(0.085, 0.075, 0.035);
  const buckle = new THREE.Mesh(buckleGeo, goldTrimMat);
  buckle.position.set(0, 0.75, 0.18);
  spine.add(buckle);

  // Cross-body chest harness
  const harnessGeo = new THREE.BoxGeometry(0.055, 0.46, 0.016);
  const harness = new THREE.Mesh(harnessGeo, leatherBrownMat);
  harness.position.set(0, 0.97, 0.165);
  harness.rotation.z = 0.65;
  spine.add(harness);

  // Coat Skirts (Flared split trench coat)
  const skirtGeo = new THREE.ConeGeometry(0.36, 0.46, 12, 1, true, 0, Math.PI * 0.95);
  const skirtBack = new THREE.Mesh(skirtGeo, leatherCoatMat);
  skirtBack.position.set(0, 0.52, -0.05);
  skirtBack.rotation.x = 0.22;
  spine.add(skirtBack);

  const skirtLeftGeo = new THREE.ConeGeometry(0.33, 0.45, 8, 1, true, 0, Math.PI * 0.5);
  const skirtLeft = new THREE.Mesh(skirtLeftGeo, leatherCoatMat);
  skirtLeft.position.set(-0.11, 0.53, 0.04);
  skirtLeft.rotation.z = 0.26;
  skirtLeft.rotation.x = -0.15;
  spine.add(skirtLeft);

  const skirtRight = new THREE.Mesh(skirtLeftGeo, leatherCoatMat);
  skirtRight.position.set(0.11, 0.53, 0.04);
  skirtRight.rotation.z = -0.26;
  skirtRight.rotation.x = -0.15;
  skirtRight.scale.x = -1;
  spine.add(skirtRight);

  // 2. Neck & Head Hierarchy
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 1.16, 0);
  spine.add(neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.12, 12), furWhiteMat);
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.12, 0.02);
  neck.add(head);

  // Fox Cranium
  const craniumGeo = new THREE.SphereGeometry(0.185, 16, 14);
  const cranium = new THREE.Mesh(craniumGeo, furOrangeMat);
  cranium.scale.set(0.95, 1.05, 1.15);
  head.add(cranium);

  // Fox Snout / Muzzle
  const muzzleGeo = new THREE.ConeGeometry(0.115, 0.29, 12);
  const muzzle = new THREE.Mesh(muzzleGeo, furOrangeMat);
  muzzle.position.set(0, -0.02, 0.18);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.scale.set(1.1, 1.0, 0.7);
  head.add(muzzle);

  // White Muzzle Underside & Chin
  const muzzleWhiteGeo = new THREE.ConeGeometry(0.095, 0.27, 10);
  const muzzleWhite = new THREE.Mesh(muzzleWhiteGeo, furWhiteMat);
  muzzleWhite.position.set(0, -0.06, 0.17);
  muzzleWhite.rotation.x = Math.PI / 2;
  muzzleWhite.scale.set(1.0, 1.0, 0.55);
  head.add(muzzleWhite);

  // Black Nose Tip
  const noseGeo = new THREE.SphereGeometry(0.038, 10, 8);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.015, 0.33);
  head.add(nose);

  // Fox Eyes
  const eyeLGeo = new THREE.SphereGeometry(0.046, 12, 8);
  const eyeL = new THREE.Mesh(eyeLGeo, eyeMat);
  eyeL.name = 'eye_l';
  eyeL.position.set(-0.095, 0.04, 0.135);
  eyeL.rotation.y = -0.35;
  head.add(eyeL);

  const eyeR = new THREE.Mesh(eyeLGeo, eyeMat);
  eyeR.name = 'eye_r';
  eyeR.position.set(0.095, 0.04, 0.135);
  eyeR.rotation.y = 0.35;
  head.add(eyeR);

  // Flared Cheek Fur Tufts
  const cheekLGeo = new THREE.ConeGeometry(0.095, 0.23, 6);
  const cheekL = new THREE.Mesh(cheekLGeo, furWhiteMat);
  cheekL.position.set(-0.19, -0.03, 0.04);
  cheekL.rotation.z = Math.PI / 2.3;
  cheekL.rotation.y = -0.3;
  head.add(cheekL);

  const cheekR = new THREE.Mesh(cheekLGeo, furWhiteMat);
  cheekR.position.set(0.19, -0.03, 0.04);
  cheekR.rotation.z = -Math.PI / 2.3;
  cheekR.rotation.y = 0.3;
  head.add(cheekR);

  // Tall Pointed Fox Ears
  const earLGeo = new THREE.ConeGeometry(0.098, 0.35, 8);
  const earL = new THREE.Mesh(earLGeo, furOrangeMat);
  earL.name = 'ear_l';
  earL.position.set(-0.11, 0.26, -0.02);
  earL.rotation.z = 0.22;
  earL.rotation.x = -0.15;
  earL.scale.set(1.0, 1.0, 0.55);
  head.add(earL);

  const earLInnerGeo = new THREE.ConeGeometry(0.068, 0.27, 6);
  const earLInner = new THREE.Mesh(earLInnerGeo, furWhiteMat);
  earLInner.position.set(-0.11, 0.24, 0.01);
  earLInner.rotation.z = 0.22;
  earLInner.rotation.x = -0.15;
  earLInner.scale.set(1.0, 1.0, 0.4);
  head.add(earLInner);

  const earR = new THREE.Mesh(earLGeo, furOrangeMat);
  earR.name = 'ear_r';
  earR.position.set(0.11, 0.26, -0.02);
  earR.rotation.z = -0.22;
  earR.rotation.x = -0.15;
  earR.scale.set(1.0, 1.0, 0.55);
  head.add(earR);

  const earRInner = new THREE.Mesh(earLInnerGeo, furWhiteMat);
  earRInner.position.set(0.11, 0.24, 0.01);
  earRInner.rotation.z = -0.22;
  earRInner.rotation.x = -0.15;
  earRInner.scale.set(1.0, 1.0, 0.4);
  head.add(earRInner);

  // 3. Arms & Gauntlets
  // Left Arm
  const shoulderL = new THREE.Group();
  shoulderL.name = 'arm_l';
  shoulderL.position.set(-0.26, 1.08, 0);
  spine.add(shoulderL);

  const pauldronGeo = new THREE.SphereGeometry(0.125, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const pauldronL = new THREE.Mesh(pauldronGeo, leatherCoatMat);
  pauldronL.position.set(-0.02, 0.03, 0);
  pauldronL.rotation.z = -0.4;
  shoulderL.add(pauldronL);

  const pauldronRimL = new THREE.TorusGeometry(0.125, 0.013, 6, 16);
  const pauldronRimLMesh = new THREE.Mesh(pauldronRimL, goldTrimMat);
  pauldronRimLMesh.position.set(-0.02, 0.03, 0);
  pauldronRimLMesh.rotation.x = Math.PI / 2;
  shoulderL.add(pauldronRimLMesh);

  const bicepLGeo = new THREE.CylinderGeometry(0.072, 0.066, 0.26, 10);
  const bicepL = new THREE.Mesh(bicepLGeo, furOrangeMat);
  bicepL.position.set(-0.04, -0.12, 0);
  bicepL.rotation.z = -0.15;
  shoulderL.add(bicepL);

  const forearmL = new THREE.Group();
  forearmL.name = 'forearm_l';
  forearmL.position.set(-0.07, -0.24, 0);
  shoulderL.add(forearmL);

  const bracerGeo = new THREE.CylinderGeometry(0.092, 0.078, 0.22, 10);
  const bracerL = new THREE.Mesh(bracerGeo, leatherBrownMat);
  bracerL.position.set(0, -0.08, 0);
  forearmL.add(bracerL);

  const cuffGeo = new THREE.TorusGeometry(0.094, 0.016, 6, 16);
  const cuffL = new THREE.Mesh(cuffGeo, goldTrimMat);
  cuffL.position.set(0, 0.01, 0);
  cuffL.rotation.x = Math.PI / 2;
  forearmL.add(cuffL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), furDarkMat);
  handL.name = 'hand_l';
  handL.position.set(0, -0.21, 0.02);
  forearmL.add(handL);

  // Right Arm
  const shoulderR = new THREE.Group();
  shoulderR.name = 'arm_r';
  shoulderR.position.set(0.26, 1.08, 0);
  spine.add(shoulderR);

  const pauldronR = new THREE.Mesh(pauldronGeo, leatherCoatMat);
  pauldronR.position.set(0.02, 0.03, 0);
  pauldronR.rotation.z = 0.4;
  shoulderR.add(pauldronR);

  const pauldronRimRMesh = new THREE.Mesh(pauldronRimL, goldTrimMat);
  pauldronRimRMesh.position.set(0.02, 0.03, 0);
  pauldronRimRMesh.rotation.x = Math.PI / 2;
  shoulderR.add(pauldronRimRMesh);

  const bicepR = new THREE.Mesh(bicepLGeo, furOrangeMat);
  bicepR.position.set(0.04, -0.12, 0);
  bicepR.rotation.z = 0.15;
  shoulderR.add(bicepR);

  const forearmR = new THREE.Group();
  forearmR.name = 'forearm_r';
  forearmR.position.set(0.07, -0.24, 0);
  shoulderR.add(forearmR);

  const bracerR = new THREE.Mesh(bracerGeo, leatherBrownMat);
  bracerR.position.set(0, -0.08, 0);
  forearmR.add(bracerR);

  const cuffR = new THREE.Mesh(cuffGeo, goldTrimMat);
  cuffR.position.set(0, 0.01, 0);
  cuffR.rotation.x = Math.PI / 2;
  forearmR.add(cuffR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), furDarkMat);
  handR.name = 'hand_r';
  handR.position.set(0, -0.21, 0.02);
  forearmR.add(handR);

  // 4. Legs & Boots
  const legL = new THREE.Group();
  legL.name = 'leg_l';
  legL.position.set(-0.14, 0.65, 0);
  root.add(legL);

  const thighLGeo = new THREE.CylinderGeometry(0.105, 0.085, 0.32, 10);
  const thighL = new THREE.Mesh(thighLGeo, leatherBrownMat);
  thighL.position.set(0, -0.14, 0);
  legL.add(thighL);

  const calfL = new THREE.Group();
  calfL.name = 'calf_l';
  calfL.position.set(0, -0.28, 0);
  legL.add(calfL);

  const bootL = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.32, 10), leatherBrownMat);
  bootL.position.set(0, -0.14, 0.02);
  calfL.add(bootL);

  const bootCuffL = new THREE.Mesh(new THREE.TorusGeometry(0.090, 0.015, 6, 16), goldTrimMat);
  bootCuffL.position.set(0, 0.01, 0.02);
  bootCuffL.rotation.x = Math.PI / 2;
  calfL.add(bootCuffL);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.062, 0.185), furWhiteMat);
  footL.name = 'foot_l';
  footL.position.set(0, -0.32, 0.06);
  calfL.add(footL);

  const legR = new THREE.Group();
  legR.name = 'leg_r';
  legR.position.set(0.14, 0.65, 0);
  root.add(legR);

  const thighR = new THREE.Mesh(thighLGeo, leatherBrownMat);
  thighR.position.set(0, -0.14, 0);
  legR.add(thighR);

  const calfR = new THREE.Group();
  calfR.name = 'calf_r';
  calfR.position.set(0, -0.28, 0);
  legR.add(calfR);

  const bootR = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.32, 10), leatherBrownMat);
  bootR.position.set(0, -0.14, 0.02);
  calfR.add(bootR);

  const bootCuffR = new THREE.Mesh(new THREE.TorusGeometry(0.090, 0.015, 6, 16), goldTrimMat);
  bootCuffR.position.set(0, 0.01, 0.02);
  bootCuffR.rotation.x = Math.PI / 2;
  calfR.add(bootCuffR);

  const footR = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.062, 0.185), furWhiteMat);
  footR.name = 'foot_r';
  footR.position.set(0, -0.32, 0.06);
  calfR.add(footR);

  // 5. Massive Fluffy Bushy Fox Tail
  const tailRoot = new THREE.Group();
  tailRoot.name = 'tail_1';
  tailRoot.position.set(0, 0.72, -0.16);
  spine.add(tailRoot);

  const tail1 = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), furOrangeMat);
  tail1.scale.set(1.0, 1.25, 1.45);
  tail1.position.set(0, 0.05, -0.12);
  tailRoot.add(tail1);

  const tailMid = new THREE.Group();
  tailMid.name = 'tail_2';
  tailMid.position.set(0, 0.12, -0.26);
  tailRoot.add(tailMid);

  const tail2Orange = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), furOrangeMat);
  tail2Orange.scale.set(1.15, 1.55, 1.65);
  tail2Orange.position.set(0, 0.18, -0.18);
  tail2Orange.rotation.x = -0.55;
  tailMid.add(tail2Orange);

  const tail2White = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), furWhiteMat);
  tail2White.scale.set(1.0, 1.40, 1.45);
  tail2White.position.set(0, 0.08, -0.22);
  tail2White.rotation.x = -0.55;
  tailMid.add(tail2White);

  const tailTipGroup = new THREE.Group();
  tailTipGroup.name = 'tail_3';
  tailTipGroup.position.set(0, 0.38, -0.32);
  tailMid.add(tailTipGroup);

  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.54, 12), furWhiteMat);
  tailTip.position.set(0, 0.22, -0.05);
  tailTip.rotation.x = -Math.PI / 3;
  tailTipGroup.add(tailTip);

  const tailTipAccent = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.25, 8), furDarkMat);
  tailTipAccent.position.set(0, 0.40, -0.16);
  tailTipAccent.rotation.x = -Math.PI / 3;
  tailTipGroup.add(tailTipAccent);

  // 6. Weapons: Giant Zweihänder Greatsword on Back
  const greatsword = new THREE.Group();
  greatsword.name = 'greatsword';
  greatsword.position.set(-0.06, 1.15, -0.22);
  greatsword.rotation.z = -0.72;
  greatsword.rotation.y = 0.25;
  spine.add(greatsword);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.095, 1.22, 0.016), steelBladeMat);
  blade.position.y = 0.50;
  greatsword.add(blade);

  const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.17, 4), steelBladeMat);
  bladeTip.position.y = 1.19;
  bladeTip.rotation.y = Math.PI / 4;
  greatsword.add(bladeTip);

  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.98, 0.018), furDarkMat);
  fuller.position.y = 0.46;
  greatsword.add(fuller);

  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.38, 8), goldTrimMat);
  guard.position.y = -0.11;
  guard.rotation.z = Math.PI / 2;
  greatsword.add(guard);

  const guardTipL = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.065, 6), goldTrimMat);
  guardTipL.position.set(-0.20, -0.09, 0);
  guardTipL.rotation.z = 0.4;
  greatsword.add(guardTipL);

  const guardTipR = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.065, 6), goldTrimMat);
  guardTipR.position.set(0.20, -0.09, 0);
  guardTipR.rotation.z = -0.4;
  greatsword.add(guardTipR);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.021, 0.29, 8), leatherBrownMat);
  hilt.position.y = -0.27;
  greatsword.add(hilt);

  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), goldTrimMat);
  pommel.position.y = -0.42;
  greatsword.add(pommel);

  // Secondary Hip Sword
  const hipSword = new THREE.Group();
  hipSword.name = 'hip_sword';
  hipSword.position.set(-0.22, 0.72, 0.08);
  hipSword.rotation.z = 0.38;
  hipSword.rotation.x = 0.15;
  spine.add(hipSword);

  const scabbard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.64, 0.026), leatherBrownMat);
  scabbard.position.y = -0.29;
  hipSword.add(scabbard);

  const hipGuard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.026, 0.036), goldTrimMat);
  hipGuard.position.y = 0.04;
  hipSword.add(hipGuard);

  const hipHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.145, 8), leatherCoatMat);
  hipHilt.position.y = 0.125;
  hipSword.add(hipHilt);

  const hipPommel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), goldTrimMat);
  hipPommel.position.y = 0.21;
  hipSword.add(hipPommel);

  // Animations Baking
  function qTrack(targetName, times, qList) {
    const values = [];
    qList.forEach(q => values.push(q.x, q.y, q.z, q.w));
    return new THREE.QuaternionKeyframeTrack(targetName + '.quaternion', times, values);
  }
  function pTrack(targetName, times, pList) {
    const values = [];
    pList.forEach(p => values.push(p.x, p.y, p.z));
    return new THREE.VectorKeyframeTrack(targetName + '.position', times, values);
  }

  // 1. Idle Clip (Swordsman ready, breathing, scanning, tail swaying)
  const idleTimes = [0, 1.2, 2.4, 3.6, 4.8];
  const qH0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qH1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0.10, 0.03));
  const qH2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.02, 0, -0.02));
  const qH3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, -0.10, -0.03));

  const pH0 = new THREE.Vector3(0, 0, 0);
  const pH1 = new THREE.Vector3(0, 0.015, 0);

  const qT0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qT1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, 0.24, 0.08));
  const qT2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.04, 0, 0));
  const qT3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, -0.24, -0.08));

  const qTM0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qTM1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, 0.32, 0.12));
  const qTM2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qTM3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, -0.32, -0.12));

  const qA0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qA1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0, 0.04));

  const idleClip = new THREE.AnimationClip('idle', 4.8, [
    qTrack('head', idleTimes, [qH0, qH1, qH2, qH3, qH0]),
    pTrack('spine', idleTimes, [pH0, pH1, pH0, pH1, pH0]),
    qTrack('tail_1', idleTimes, [qT0, qT1, qT2, qT3, qT0]),
    qTrack('tail_2', idleTimes, [qTM0, qTM1, qTM2, qTM3, qTM0]),
    qTrack('arm_l', idleTimes, [qA0, qA1, qA0, qA1, qA0]),
    qTrack('arm_r', idleTimes, [qA0, qA1, qA0, qA1, qA0])
  ]);

  // 2. Walk Clip
  const walkTimes = [0, 0.35, 0.70, 1.05, 1.40];
  const qLL0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.38, 0, 0));
  const qLL1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qLL2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, 0, 0));
  const qLL3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

  const qAL0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.30, 0, 0));
  const qAL1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qAL2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.30, 0, 0));
  const qAL3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

  const qWT0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.15, 0));
  const qWT1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, -0.15, 0));

  const walkClip = new THREE.AnimationClip('walk', 1.4, [
    qTrack('leg_l', walkTimes, [qLL0, qLL1, qLL2, qLL3, qLL0]),
    qTrack('leg_r', walkTimes, [qLL2, qLL3, qLL0, qLL1, qLL2]),
    qTrack('arm_l', walkTimes, [qAL0, qAL1, qAL2, qAL3, qAL0]),
    qTrack('arm_r', walkTimes, [qAL2, qAL3, qAL0, qAL1, qAL2]),
    qTrack('tail_1', walkTimes, [qWT0, qWT1, qWT0, qWT1, qWT0])
  ]);

  // 3. Run Clip
  const runTimes = [0, 0.2, 0.4, 0.6, 0.8];
  const qRL0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.65, 0, 0));
  const qRL1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qRL2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.65, 0, 0));
  const qRL3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

  const qRA0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.55, 0, 0));
  const qRA1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const qRA2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, 0, 0));
  const qRA3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

  const qSpineRun = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0));
  const qRT0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0.28, 0));
  const qRT1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -0.28, 0));

  const runClip = new THREE.AnimationClip('run', 0.8, [
    qTrack('leg_l', runTimes, [qRL0, qRL1, qRL2, qRL3, qRL0]),
    qTrack('leg_r', runTimes, [qRL2, qRL3, qRL0, qRL1, qRL2]),
    qTrack('arm_l', runTimes, [qRA0, qRA1, qRA2, qRA3, qRA0]),
    qTrack('arm_r', runTimes, [qRA2, qRA3, qRA0, qRA1, qRA2]),
    qTrack('spine', runTimes, [qSpineRun, qSpineRun, qSpineRun, qSpineRun, qSpineRun]),
    qTrack('tail_1', runTimes, [qRT0, qRT1, qRT0, qRT1, qRT0])
  ]);

  // Export to GLB
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (glbArrayBuffer) => {
        resolve({ glb: glbArrayBuffer, root });
      },
      (error) => {
        reject(error);
      },
      {
        binary: true,
        animations: [idleClip, walkClip, runClip]
      }
    );
  });
}

// Auto-run when included in runner
if (typeof window !== 'undefined') {
  window.generateSellswordFox = generateSellswordFox;
}
