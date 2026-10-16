const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
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
  <body style="margin:0; background:#18181b; overflow:hidden; display:flex; justify-content:center; align-items:center; height:100vh;">
  <div id="container" style="width:900px; height:700px;"></div>
  <script type="module">
    import * as THREE from '../node_modules/three/build/three.module.js';
    import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 900 / 700, 0.1, 100);
    camera.position.set(0, 1.0, 4.5);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(900, 700);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    document.getElementById('container').appendChild(renderer.domElement);

    // Studio 3-Point Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcceeff, 1.1);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8833, 2.4);
    rimLight.position.set(-2, 5, -4);
    scene.add(rimLight);

    const loader = new GLTFLoader();
    loader.load('../src/ui/assets/SellswordFox.glb', (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.rotation.y = -Math.PI / 6; // Angled front view
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      if (gltf.animations && gltf.animations.length > 0) {
        const action = mixer.clipAction(gltf.animations[0]); // Idle
        action.play();
        mixer.update(0.6);
      }

      renderer.render(scene, camera);
      console.log('[RENDER] Rendered successfully!');

      const { ipcRenderer } = require('electron');
      ipcRenderer.send('rendered-ready');
    });
  </script>
  </body>
  </html>
  `;

  fs.writeFileSync(path.join(__dirname, 'render_preview.html'), html);

  win.webContents.on('console-message', (e, lvl, msg) => console.log('[LOG]', msg));

  ipcMain.on('rendered-ready', async () => {
    await new Promise(r => setTimeout(r, 600));
    const image = await win.webContents.capturePage();
    const outPng = path.resolve('..', 'scratch', 'sellsword_fox_render.png');
    fs.writeFileSync(outPng, image.toPNG());
    console.log('[SNAPSHOT] Saved screenshot to:', outPng, 'Size:', image.toPNG().length);
    app.quit();
  });

  await win.loadFile(path.join(__dirname, 'render_preview.html'));
});
