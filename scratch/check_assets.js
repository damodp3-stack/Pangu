const { app } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const assetsDir = path.join(__dirname, '..', 'src', 'ui', 'assets');
  const files = ['Fox.glb', 'SellswordFox.glb', 'Dragon.glb', 'cat.glb'];
  
  for (const f of files) {
    const fullPath = path.join(assetsDir, f);
    if (!fs.existsSync(fullPath)) {
      console.log(`[FILE MISSING] ${f}`);
      continue;
    }
    const stat = fs.statSync(fullPath);
    console.log(`[FILE FOUND] ${f} - Size: ${(stat.size / 1024).toFixed(1)} KB`);
  }
  app.quit();
});
