const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <body>
  <div id="container" style="width:800px;height:600px;"></div>
  <script type="module">
    import * as THREE from './node_modules/three/build/three.module.js';
    import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

    const loader = new GLTFLoader();
    loader.load('src/ui/assets/Fox.glb', (gltf) => {
      console.log('GLTF loaded');
      const scene = gltf.scene;
      const box = new THREE.Box3().setFromObject(scene);
      console.log('Box min:', box.min.x, box.min.y, box.min.z);
      console.log('Box max:', box.max.x, box.max.y, box.max.z);
      console.log('Box size:', box.max.y - box.min.y);

      // Check bones
      scene.traverse(c => {
        if (c.isBone) {
          console.log('Bone:', c.name, 'rot:', c.rotation.x, c.rotation.y, c.rotation.z);
        }
      });

      // Play Survey animation
      const mixer = new THREE.AnimationMixer(scene);
      const action = mixer.clipAction(gltf.animations[0]); // Survey
      action.play();
      mixer.update(0.1);

      const animBox = new THREE.Box3().setFromObject(scene);
      console.log('After mixer update, box min:', animBox.min.x, animBox.min.y, animBox.min.z);
      console.log('After mixer update, box max:', animBox.max.x, animBox.max.y, animBox.max.z);
    });
  </script>
  </body>
  </html>
  `;

  fs.writeFileSync('scratch/test_fox_anim.html', html);
  win.webContents.on('console-message', (e, lvl, msg) => console.log('[LOG]', msg));
  await win.loadFile('scratch/test_fox_anim.html');
  await new Promise(r => setTimeout(r, 3000));
  app.quit();
});
