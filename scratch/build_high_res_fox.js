import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Sellsword Fox 3D Model Generator (Game-Ready Rig)
 * Faithfully matches Tang Zhu / Joshua C. Hermanto's 3D Model:
 * - Sculpted Anime Fox Head: Slender muzzle, black nose, expressive amber eyes, cheek fur tufts, tall pointed ears with white fluff
 * - Flared Popped Swashbuckler Trench Coat: Open V-neck, standing collar framing back of head, split coat-tails
 * - White Chest Mane: Layered chest fur tufts
 * - Iconic Sweeping S-Curved Fox Tail: Spline-lofted flame plume with orange base and crisp white tip
 * - Zweihänder Greatsword slung across back: Polished steel blade with fuller, swept crossguard, hilt & pommel
 * - Secondary hip sword with scabbard
 * - Digitigrade fox limbs with leather gauntlets, knee-high boots, and clawed white paws
 * - High-end stylized PBR materials with rich saturation
 * - 60 FPS animation tracks: Idle, Walk, Run
 */
export async function generateHighResSellswordFox() {
  console.log('[SellswordFox] Building sculpted spline geometry & materials...');

  // 1. Color Palette (Stylized Fantasy Swashbuckler)
  const colors = {
    foxOrange: 0xe8631c,
    foxWhite: 0xf5f7fb,
    coatBlack: 0x1a1822,
    leatherWarm: 0x54321c,
    goldBrass: 0xebb438,
    steelBlade: 0xe2ebf5,
    steelDark: 0x475569,
    noseBlack: 0x121010
  };

  // 2. High-Quality Stylized PBR Materials
  const matOrangeFur = new THREE.MeshStandardMaterial({
    color: colors.foxOrange,
    roughness: 0.58,
    metalness: 0.02
  });

  const matWhiteFur = new THREE.MeshStandardMaterial({
    color: colors.foxWhite,
    roughness: 0.62,
    metalness: 0.01
  });

  const matCoat = new THREE.MeshStandardMaterial({
    color: colors.coatBlack,
    roughness: 0.36,
    metalness: 0.14
  });

  const matLeather = new THREE.MeshStandardMaterial({
    color: colors.leatherWarm,
    roughness: 0.44,
    metalness: 0.08
  });

  const matGold = new THREE.MeshStandardMaterial({
    color: colors.goldBrass,
    roughness: 0.24,
    metalness: 0.88
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: colors.steelBlade,
    roughness: 0.14,
    metalness: 0.94
  });

  const matSteelGroove = new THREE.MeshStandardMaterial({
    color: colors.steelDark,
    roughness: 0.28,
    metalness: 0.82
  });

  const matNose = new THREE.MeshStandardMaterial({
    color: colors.noseBlack,
    roughness: 0.22,
    metalness: 0.06
  });

  // Stylized Hand-Painted Eye Canvas
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 256;
  eyeCanvas.height = 256;
  const eCtx = eyeCanvas.getContext('2d');
  // Golden iris gradient
  const irisGrad = eCtx.createRadialGradient(128, 128, 15, 128, 128, 120);
  irisGrad.addColorStop(0, '#fef08a');
  irisGrad.addColorStop(0.35, '#f59e0b');
  irisGrad.addColorStop(0.8, '#d97706');
  irisGrad.addColorStop(1, '#1e1c24');
  eCtx.fillStyle = irisGrad;
  eCtx.beginPath();
  eCtx.arc(128, 128, 124, 0, Math.PI * 2);
  eCtx.fill();
  // Cat/Fox slit pupil
  eCtx.fillStyle = '#111827';
  eCtx.beginPath();
  eCtx.ellipse(128, 128, 36, 92, 0, 0, Math.PI * 2);
  eCtx.fill();
  // Shiny catchlights
  eCtx.fillStyle = '#ffffff';
  eCtx.beginPath();
  eCtx.arc(155, 95, 24, 0, Math.PI * 2);
  eCtx.fill();
  eCtx.beginPath();
  eCtx.arc(102, 162, 14, 0, Math.PI * 2);
  eCtx.fill();

  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const matEye = new THREE.MeshBasicMaterial({ map: eyeTex });

  // 3. Hierarchical Scene Graph
  const root = new THREE.Group();
  root.name = 'root';

  const spine = new THREE.Group();
  spine.name = 'spine';
  root.add(spine);

  // -------------------------------------------------------------------------
  // A. TORSO & SWASHBUCKLER DOUBLET
  // -------------------------------------------------------------------------
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 0.96;
  spine.add(torso);

  // Doublet Body
  const doubletGeo = new THREE.CylinderGeometry(0.23, 0.18, 0.42, 16);
  const doublet = new THREE.Mesh(doubletGeo, matCoat);
  doublet.scale.set(1.04, 1.0, 0.82);
  torso.add(doublet);

  // Double Belts at Waist
  const beltTop = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.045, 16), matLeather);
  beltTop.position.y = -0.16;
  beltTop.scale.set(1.04, 1.0, 0.83);
  torso.add(beltTop);

  const beltBtm = new THREE.Mesh(new THREE.CylinderGeometry(0.188, 0.188, 0.04, 16), matLeather);
  beltBtm.position.y = -0.21;
  beltBtm.scale.set(1.05, 1.0, 0.84);
  torso.add(beltBtm);

  // Dual Golden Belt Buckles
  const buckle1 = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.05, 0.02), matGold);
  buckle1.position.set(0, -0.16, 0.16);
  torso.add(buckle1);

  const buckle2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.02), matGold);
  buckle2.position.set(0.03, -0.21, 0.163);
  torso.add(buckle2);

  // Chest Cross-Strap Harness
  const chestHarness = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.44, 0.015), matLeather);
  chestHarness.position.set(0.01, 0.03, 0.155);
  chestHarness.rotation.z = 0.62;
  torso.add(chestHarness);

  const harnessBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.042, 0.022), matGold);
  harnessBuckle.position.set(0.02, 0.06, 0.165);
  harnessBuckle.rotation.z = 0.62;
  torso.add(harnessBuckle);

  // Lush White Chest Fur Mane (Cascading out from open collar)
  const maneGroup = new THREE.Group();
  maneGroup.position.set(0, 0.06, 0.12);
  torso.add(maneGroup);

  const maneCentral = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), matWhiteFur);
  maneCentral.rotation.x = 0.34;
  maneGroup.add(maneCentral);

  const maneLeft = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.25, 6), matWhiteFur);
  maneLeft.position.set(-0.07, 0.01, 0.01);
  maneLeft.rotation.set(0.28, -0.2, -0.32);
  maneGroup.add(maneLeft);

  const maneRight = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.25, 6), matWhiteFur);
  maneRight.position.set(0.07, 0.01, 0.01);
  maneRight.rotation.set(0.28, 0.2, 0.32);
  maneGroup.add(maneRight);

  // Coat Lapels with Gold Edge
  const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.025), matGold);
  lapelL.position.set(-0.11, 0.06, 0.145);
  lapelL.rotation.z = -0.24;
  torso.add(lapelL);

  const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.025), matGold);
  lapelR.position.set(0.11, 0.06, 0.145);
  lapelR.rotation.z = 0.24;
  torso.add(lapelR);

  // -------------------------------------------------------------------------
  // B. POPPED SWASHBUCKLER COLLAR (Frames back & sides of head)
  // -------------------------------------------------------------------------
  const collarGroup = new THREE.Group();
  collarGroup.position.set(0, 0.21, -0.06);
  torso.add(collarGroup);

  // Flared standing collar wings
  const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.18), matCoat);
  collarLeft.position.set(-0.18, 0.08, -0.02);
  collarLeft.rotation.set(-0.25, -0.45, -0.35);
  collarGroup.add(collarLeft);

  const collarTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.025, 0.185), matGold);
  collarTrimL.position.set(-0.18, 0.22, -0.02);
  collarTrimL.rotation.set(-0.25, -0.45, -0.35);
  collarGroup.add(collarTrimL);

  const collarRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.18), matCoat);
  collarRight.position.set(0.18, 0.08, -0.02);
  collarRight.rotation.set(-0.25, 0.45, 0.35);
  collarGroup.add(collarRight);

  const collarTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.025, 0.185), matGold);
  collarTrimR.position.set(0.18, 0.22, -0.02);
  collarTrimR.rotation.set(-0.25, 0.45, 0.35);
  collarGroup.add(collarTrimR);

  const collarBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.02), matCoat);
  collarBack.position.set(0, 0.09, -0.11);
  collarBack.rotation.x = -0.38;
  collarGroup.add(collarBack);

  const collarBackTrim = new THREE.Mesh(new THREE.BoxGeometry(0.325, 0.025, 0.022), matGold);
  collarBackTrim.position.set(0, 0.22, -0.16);
  collarBackTrim.rotation.x = -0.38;
  collarGroup.add(collarBackTrim);

  // -------------------------------------------------------------------------
  // C. TRENCH COAT SKIRTS (Split tails flowing downward)
  // -------------------------------------------------------------------------
  const skirts = new THREE.Group();
  skirts.position.set(0, -0.22, 0);
  torso.add(skirts);

  // Back coat flap
  const skirtBack = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.48, 10, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    matCoat
  );
  skirtBack.position.set(0, -0.24, -0.05);
  skirtBack.rotation.x = 0.20;
  skirts.add(skirtBack);

  // Left coat flap
  const skirtLeft = new THREE.Mesh(
    new THREE.ConeGeometry(0.30, 0.45, 8, 1, true, 0, Math.PI * 0.48),
    matCoat
  );
  skirtLeft.position.set(-0.11, -0.22, 0.02);
  skirtLeft.rotation.set(-0.08, 0, 0.24);
  skirts.add(skirtLeft);

  // Right coat flap
  const skirtRight = new THREE.Mesh(
    new THREE.ConeGeometry(0.30, 0.45, 8, 1, true, 0, Math.PI * 0.48),
    matCoat
  );
  skirtRight.position.set(0.11, -0.22, 0.02);
  skirtRight.rotation.set(-0.08, 0, -0.24);
  skirtRight.scale.x = -1;
  skirts.add(skirtRight);

  // Gold trim on coat front edges
  const skirtEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.42, 0.02), matGold);
  skirtEdgeL.position.set(-0.12, -0.22, 0.16);
  skirtEdgeL.rotation.z = -0.12;
  skirts.add(skirtEdgeL);

  const skirtEdgeR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.42, 0.02), matGold);
  skirtEdgeR.position.set(0.12, -0.22, 0.16);
  skirtEdgeR.rotation.z = 0.12;
  skirts.add(skirtEdgeR);

  // -------------------------------------------------------------------------
  // D. SCULPTED FOX HEAD & DETAILS
  // -------------------------------------------------------------------------
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 1.18, 0);
  spine.add(neck);

  const neckFur = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.14, 12), matWhiteFur);
  neck.add(neckFur);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.13, 0.02);
  neck.add(head);

  // Cranium (Aerodynamic Fox Skull)
  const skullGeo = new THREE.SphereGeometry(0.18, 18, 14);
  const skull = new THREE.Mesh(skullGeo, matOrangeFur);
  skull.scale.set(0.95, 1.04, 1.12);
  head.add(skull);

  // Fox Muzzle / Snout (Smooth tapered bridge)
  const muzzleGeo = new THREE.ConeGeometry(0.108, 0.30, 14);
  const muzzle = new THREE.Mesh(muzzleGeo, matOrangeFur);
  muzzle.position.set(0, -0.015, 0.18);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.scale.set(1.08, 1.0, 0.70);
  head.add(muzzle);

  // White Undersnout & Chin
  const chinGeo = new THREE.ConeGeometry(0.092, 0.28, 10);
  const chin = new THREE.Mesh(chinGeo, matWhiteFur);
  chin.position.set(0, -0.058, 0.17);
  chin.rotation.x = Math.PI / 2;
  chin.scale.set(1.0, 1.0, 0.50);
  head.add(chin);

  // Black Nose Tip
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), matNose);
  nose.position.set(0, 0.016, 0.33);
  nose.scale.set(1.1, 0.82, 0.95);
  head.add(nose);

  // Expressive Slanted Fox Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), matEye);
  eyeL.name = 'eye_l';
  eyeL.position.set(-0.096, 0.045, 0.132);
  eyeL.rotation.set(0.12, -0.38, -0.16);
  eyeL.scale.set(0.88, 1.25, 0.95);
  head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), matEye);
  eyeR.name = 'eye_r';
  eyeR.position.set(0.096, 0.045, 0.132);
  eyeR.rotation.set(0.12, 0.38, 0.16);
  eyeR.scale.set(0.88, 1.25, 0.95);
  head.add(eyeR);

  // Eyeliner / Brow marks
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.012, 0.025), matNose);
  browL.position.set(-0.098, 0.095, 0.122);
  browL.rotation.z = -0.26;
  head.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.012, 0.025), matNose);
  browR.position.set(0.098, 0.095, 0.122);
  browR.rotation.z = 0.26;
  head.add(browR);

  // Cheek Fur Tufts (Flaring out horizontally)
  const cheekL1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 6), matWhiteFur);
  cheekL1.position.set(-0.18, -0.02, 0.05);
  cheekL1.rotation.set(0.15, -0.25, Math.PI / 2.3);
  head.add(cheekL1);

  const cheekR1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 6), matWhiteFur);
  cheekR1.position.set(0.18, -0.02, 0.05);
  cheekR1.rotation.set(0.15, 0.25, -Math.PI / 2.3);
  head.add(cheekR1);

  // Tall Pointed Ears (Orange shell + White interior + Black tips)
  function createSculptedEar(isLeft) {
    const earGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // Outer Orange Shell
    const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.36, 10), matOrangeFur);
    earOuter.scale.set(1.0, 1.0, 0.50);
    earGroup.add(earOuter);

    // Inner White Fluff
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.28, 8), matWhiteFur);
    earInner.position.set(0, -0.02, 0.024);
    earInner.scale.set(0.9, 0.95, 0.35);
    earGroup.add(earInner);

    // Dark Ear Tip
    const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.11, 8), matNose);
    earTip.position.y = 0.135;
    earTip.scale.set(1.0, 1.0, 0.50);
    earGroup.add(earTip);

    earGroup.position.set(sign * 0.12, 0.27, -0.02);
    earGroup.rotation.set(-0.15, 0, sign * 0.20);
    return earGroup;
  }

  const earL = createSculptedEar(true);
  earL.name = 'ear_l';
  head.add(earL);

  const earR = createSculptedEar(false);
  earR.name = 'ear_r';
  head.add(earR);

  // -------------------------------------------------------------------------
  // E. ARMS, PAULDRONS & LEATHER GAUNTLETS
  // -------------------------------------------------------------------------
  function createArm(isLeft) {
    const sign = isLeft ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.name = isLeft ? 'arm_l' : 'arm_r';
    shoulder.position.set(sign * 0.26, 1.06, 0);

    // Rounded Pauldron Cap with Gold Rim
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      matCoat
    );
    pauldron.rotation.z = sign * -0.35;
    shoulder.add(pauldron);

    const pauldronRim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), matGold);
    pauldronRim.position.y = 0.01;
    shoulder.add(pauldronRim);

    // Upper Arm Fur
    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.24, 10), matOrangeFur);
    bicep.position.set(sign * 0.03, -0.11, 0);
    bicep.rotation.z = sign * -0.12;
    shoulder.add(bicep);

    // Forearm & Leather Gauntlet
    const forearm = new THREE.Group();
    forearm.name = isLeft ? 'forearm_l' : 'forearm_r';
    forearm.position.set(sign * 0.06, -0.23, 0);
    shoulder.add(forearm);

    // Flared Leather Bracer
    const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.076, 0.22, 10), matLeather);
    bracer.position.set(0, -0.08, 0);
    forearm.add(bracer);

    // Gold Gauntlet Cuffs (Snug collar rings)
    const cuffTop = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.094, 0.025, 12), matGold);
    cuffTop.position.set(0, 0.02, 0);
    forearm.add(cuffTop);

    const cuffBtm = new THREE.Mesh(new THREE.CylinderGeometry(0.080, 0.080, 0.02, 12), matGold);
    cuffBtm.position.set(0, -0.16, 0);
    forearm.add(cuffBtm);

    // Leather Gloved Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.066, 10, 8), matCoat);
    hand.name = isLeft ? 'hand_l' : 'hand_r';
    hand.position.set(0, -0.21, 0.02);
    forearm.add(hand);

    return shoulder;
  }

  const armL = createArm(true);
  spine.add(armL);

  const armR = createArm(false);
  spine.add(armR);

  // -------------------------------------------------------------------------
  // F. DIGITIGRADE LEGS, HIGH BOOTS & CLAWED PAWS
  // -------------------------------------------------------------------------
  function createLeg(isLeft) {
    const sign = isLeft ? -1 : 1;
    const leg = new THREE.Group();
    leg.name = isLeft ? 'leg_l' : 'leg_r';
    leg.position.set(sign * 0.14, 0.65, 0);

    // Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.085, 0.30, 10), matLeather);
    thigh.position.set(0, -0.13, 0);
    leg.add(thigh);

    // Knee & Shin
    const calf = new THREE.Group();
    calf.name = isLeft ? 'calf_l' : 'calf_r';
    calf.position.set(0, -0.26, 0);
    leg.add(calf);

    // High Leather Boot
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.30, 10), matLeather);
    boot.position.set(0, -0.13, 0.02);
    calf.add(boot);

    // Snug boot rim
    const bootGoldRim = new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.090, 0.025, 12), matGold);
    bootGoldRim.position.set(0, 0.01, 0.02);
    calf.add(bootGoldRim);

    // Digitigrade Fox Paw (White fur with claws)
    const foot = new THREE.Group();
    foot.name = isLeft ? 'foot_l' : 'foot_r';
    foot.position.set(0, -0.30, 0.06);
    calf.add(foot);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.06, 0.17), matWhiteFur);
    foot.add(paw);

    for (let t = -1; t <= 1; t++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), matWhiteFur);
      toe.position.set(t * 0.036, -0.01, 0.088);
      foot.add(toe);

      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.028, 4), matNose);
      claw.position.set(t * 0.036, -0.01, 0.11);
      claw.rotation.x = Math.PI / 2;
      foot.add(claw);
    }

    return leg;
  }

  const legL = createLeg(true);
  root.add(legL);

  const legR = createLeg(false);
  root.add(legR);

  // -------------------------------------------------------------------------
  // G. ICONIC SPLINE-LOFTED SWEEPING FOX TAIL (Majestic Arched Plume)
  // -------------------------------------------------------------------------
  // Tail Root Group (Animated for sway)
  const tail1 = new THREE.Group();
  tail1.name = 'tail_1';
  tail1.position.set(0, 0.72, -0.14);
  spine.add(tail1);

  // Lower orange half of tail: smooth upward sweeping plume
  const tailLowerPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.08, -0.20),
    new THREE.Vector3(0, 0.28, -0.38),
    new THREE.Vector3(0, 0.54, -0.36)
  ];
  const curveLower = new THREE.CatmullRomCurve3(tailLowerPoints);
  const tailLowerGeo = new THREE.TubeGeometry(curveLower, 16, 0.19, 14, false);
  const tailLowerMesh = new THREE.Mesh(tailLowerGeo, matOrangeFur);
  tail1.add(tailLowerMesh);

  // Tail Mid Group (Second animation bone)
  const tail2 = new THREE.Group();
  tail2.name = 'tail_2';
  tail2.position.set(0, 0.54, -0.36);
  tail1.add(tail2);

  // Upper white plume & curving tip
  const tailUpperPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.22, 0.06),
    new THREE.Vector3(0, 0.38, 0.18),
    new THREE.Vector3(0, 0.44, 0.24)
  ];
  const curveUpper = new THREE.CatmullRomCurve3(tailUpperPoints);
  const tailUpperGeo = new THREE.TubeGeometry(curveUpper, 16, 0.18, 14, false);
  const tailUpperMesh = new THREE.Mesh(tailUpperGeo, matWhiteFur);
  tail2.add(tailUpperMesh);

  // Stylized flame tip tapering forward
  const tailTipCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 10), matWhiteFur);
  tailTipCone.position.set(0, 0.48, 0.30);
  tailTipCone.rotation.x = Math.PI / 3;
  tail2.add(tailTipCone);

  // Sharp anime fur crests along outer tail curve
  for (let k = 0; k < 3; k++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 6), matOrangeFur);
    tuft.position.set(0, 0.15 + k * 0.14, -0.18 - k * 0.08);
    tuft.rotation.x = -0.75;
    tail1.add(tuft);
  }

  // -------------------------------------------------------------------------
  // H. WEAPONS: ZWEIHÄNDER GREATSWORD (Back) & HIP ARMING SWORD
  // -------------------------------------------------------------------------
  const greatsword = new THREE.Group();
  greatsword.name = 'greatsword';
  greatsword.position.set(-0.06, 1.15, -0.20);
  greatsword.rotation.set(0.10, 0.25, -0.72); // Diagonally across back
  spine.add(greatsword);

  // Greatsword Blade (Broad double-bevel steel blade)
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.096, 1.25, 0.016), matSteel);
  blade.position.y = 0.52;
  greatsword.add(blade);

  // Diamond Point Blade Tip
  const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.18, 4), matSteel);
  bladeTip.position.y = 1.23;
  bladeTip.rotation.y = Math.PI / 4;
  greatsword.add(bladeTip);

  // Central Blood Groove Fuller
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.024, 1.02, 0.018), matSteelGroove);
  fuller.position.y = 0.48;
  greatsword.add(fuller);

  // Swept Crossguard with Curved Quillons
  const guardBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.40, 10), matGold);
  guardBar.position.y = -0.11;
  guardBar.rotation.z = Math.PI / 2;
  greatsword.add(guardBar);

  const quillonL = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.075, 6), matGold);
  quillonL.position.set(-0.21, -0.09, 0);
  quillonL.rotation.z = 0.45;
  greatsword.add(quillonL);

  const quillonR = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.075, 6), matGold);
  quillonR.position.set(0.21, -0.09, 0);
  quillonR.rotation.z = -0.45;
  greatsword.add(quillonR);

  // Long Two-Handed Leather-Bound Hilt
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.020, 0.30, 8), matLeather);
  hilt.position.y = -0.27;
  greatsword.add(hilt);

  // Gold Ring Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), matGold);
  pommel.position.y = -0.43;
  greatsword.add(pommel);

  // Secondary Hip Arming Sword in Scabbard
  const hipSword = new THREE.Group();
  hipSword.name = 'hip_sword';
  hipSword.position.set(-0.22, 0.72, 0.06);
  hipSword.rotation.set(0.16, 0, 0.40);
  spine.add(hipSword);

  const scabbard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.66, 0.026), matLeather);
  scabbard.position.y = -0.29;
  hipSword.add(scabbard);

  const scabbardTip = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.07, 0.030), matGold);
  scabbardTip.position.y = -0.61;
  hipSword.add(scabbardTip);

  const hipGuard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.026, 0.036), matGold);
  hipGuard.position.y = 0.04;
  hipSword.add(hipGuard);

  const hipHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.145, 8), matCoat);
  hipHilt.position.y = 0.125;
  hipSword.add(hipHilt);

  const hipPommel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), matGold);
  hipPommel.position.y = 0.21;
  hipSword.add(hipPommel);

  // -------------------------------------------------------------------------
  // I. ANIMATION CLIPS (Idle, Walk, Run)
  // -------------------------------------------------------------------------
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

  // 1. Idle Clip (Ready swordsman pose, subtle breath, tail wave)
  const idleTimes = [0, 1.2, 2.4, 3.6, 4.8];
  const idleTracks = [
    pTrack('spine', idleTimes, [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.022, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.020, 0),
      new THREE.Vector3(0, 0, 0)
    ]),
    qTrack('head', idleTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05, 0.08, 0.02)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.03, -0.06, -0.02)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.04, 0.05, 0.02)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
    ]),
    qTrack('tail_1', idleTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, 0.18, 0.08)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05, -0.18, -0.10)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, 0.15, 0.07)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
    ]),
    qTrack('tail_2', idleTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.10, 0.24, 0.14)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, -0.26, -0.16)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.09, 0.20, 0.12)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
    ]),
    qTrack('arm_l', idleTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0, -0.03)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.04, 0, 0.03)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
    ])
  ];
  const idleClip = new THREE.AnimationClip('idle', 4.8, idleTracks);

  // 2. Walk Clip (Swashbuckler stride)
  const walkTimes = [0, 0.35, 0.70, 1.05, 1.40];
  const walkTracks = [
    pTrack('spine', walkTimes, [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.035, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.035, 0),
      new THREE.Vector3(0, 0, 0)
    ]),
    qTrack('leg_l', walkTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.40, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.40, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.40, 0, 0))
    ]),
    qTrack('leg_r', walkTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.40, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.40, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.40, 0, 0))
    ]),
    qTrack('arm_l', walkTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.32, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0, 0))
    ]),
    qTrack('arm_r', walkTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.32, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.32, 0, 0))
    ]),
    qTrack('tail_1', walkTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.22, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.22, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.22, 0))
    ])
  ];
  const walkClip = new THREE.AnimationClip('walk', 1.40, walkTracks);

  // 3. Run Clip (Fast ninja dash)
  const runTimes = [0, 0.20, 0.40, 0.60, 0.80];
  const runTracks = [
    pTrack('spine', runTimes, [
      new THREE.Vector3(0, -0.04, 0),
      new THREE.Vector3(0, 0.07, 0),
      new THREE.Vector3(0, -0.04, 0),
      new THREE.Vector3(0, 0.07, 0),
      new THREE.Vector3(0, -0.04, 0)
    ]),
    qTrack('spine', runTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.20, 0.06, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.20, -0.06, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, 0, 0))
    ]),
    qTrack('leg_l', runTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.68, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.68, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.68, 0, 0))
    ]),
    qTrack('leg_r', runTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.68, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.68, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.68, 0, 0))
    ]),
    qTrack('tail_1', runTimes, [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, 0.28, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.22, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, -0.28, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.22, 0, 0)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, 0.28, 0))
    ])
  ];
  const runClip = new THREE.AnimationClip('run', 0.80, runTracks);

  // -------------------------------------------------------------------------
  // J. EXPORT BINARY GLB
  // -------------------------------------------------------------------------
  console.log('[SellswordFox] Exporting GLB with embedded clips...');
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (glb) => {
        resolve({ glb, root, clips: [idleClip, walkClip, runClip] });
      },
      (err) => reject(err),
      {
        binary: true,
        animations: [idleClip, walkClip, runClip]
      }
    );
  });
}
