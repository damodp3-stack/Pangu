import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const models = [
  { name: 'fox', path: '../src/ui/assets/Fox.glb' },
  { name: 'sellsword_fox', path: '../src/ui/assets/SellswordFox.glb' },
  { name: 'dragon', path: '../src/ui/assets/Dragon.glb' },
  { name: 'cat', path: '../src/ui/assets/cat.glb' }
];

async function checkAll() {
  for (const m of models) {
    await new Promise((resolve) => {
      loader.load(m.path, (gltf) => {
        console.log(`=== MODEL: ${m.name} ===`);
        console.log(`Animations (${gltf.animations.length}):`, gltf.animations.map(a => a.name));
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        console.log(`Bounding Box size: x=${size.x.toFixed(2)}, y=${size.y.toFixed(2)}, z=${size.z.toFixed(2)}`);
        
        // Find bones
        const bones = [];
        gltf.scene.traverse(c => {
          if (c.isBone || c.type === 'Bone') bones.push(c.name);
        });
        console.log(`Bones count: ${bones.length}, sample:`, bones.slice(0, 10));
        resolve();
      }, undefined, (err) => {
        console.error(`Error loading ${m.name}:`, err);
        resolve();
      });
    });
  }

  if (typeof require !== 'undefined') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('test-passed');
  }
}

checkAll();
