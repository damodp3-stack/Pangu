import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

window.startRender = async function() {
  const container = document.getElementById('container');
  const width = 1000;
  const height = 800;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x181e24);

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(0, 1.05, 3.8);
  camera.lookAt(0, 0.95, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1.5);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  // Studio Lighting (Matches Tang Zhu / Joshua C. Hermanto 3D Concept)
  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.5);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa5c9eb, 1.2);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xff9944, 2.8);
  rimLight.position.set(-2, 4, -4);
  scene.add(rimLight);

  const softFloorLight = new THREE.DirectionalLight(0x4ade80, 0.6);
  softFloorLight.position.set(0, -3, 2);
  scene.add(softFloorLight);

  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load('../src/ui/assets/SellswordFox.glb', async (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      if (gltf.animations && gltf.animations.length > 0) {
        const action = mixer.clipAction(gltf.animations[0]); // Idle
        action.play();
        mixer.update(0.75); // Pose into a natural pose
      }

      // Front 3/4 view
      model.rotation.y = -0.45;
      renderer.render(scene, camera);
      const frontData = renderer.domElement.toDataURL('image/png');

      // Back 3/4 view
      model.rotation.y = 2.45;
      renderer.render(scene, camera);
      const backData = renderer.domElement.toDataURL('image/png');

      resolve({ frontData, backData });
    }, undefined, reject);
  });
};
