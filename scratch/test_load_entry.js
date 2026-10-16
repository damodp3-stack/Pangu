import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('../src/ui/assets/SellswordFox.glb', (gltf) => {
  console.log('[TEST LOAD] SellswordFox.glb loaded successfully!');
  console.log('[TEST LOAD] Scene children:', gltf.scene.children.length);
  console.log('[TEST LOAD] Animations count:', gltf.animations.length);
  gltf.animations.forEach(a => console.log(' -> Animation Clip:', a.name, 'Duration:', a.duration, 'Tracks:', a.tracks.length));
  const box = new THREE.Box3().setFromObject(gltf.scene);
  console.log('[TEST LOAD] Height:', box.max.y - box.min.y);

  if (typeof require !== 'undefined') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('test-passed', { clips: gltf.animations.length, height: box.max.y - box.min.y });
  }
}, undefined, (err) => {
  console.error('[TEST LOAD ERROR]', err);
});
