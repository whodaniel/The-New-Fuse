const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function processLogo() {
  try {
    const sourcePath = '../../assets/brand/primary/tnf-logo.png';
    console.log('Loading image from:', sourcePath);
    const img = await loadImage(sourcePath);

    // Create the main icon.png (128x128)
    const canvas = createCanvas(128, 128);
    const ctx = canvas.getContext('2d');

    // Draw scaled down image
    ctx.drawImage(img, 0, 0, 128, 128);

    let buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('media/icon.png', buffer);
    console.log('Created media/icon.png');

    // Create the activity-icon.png (24x24) with white background removed (mask)
    const iconCanvas = createCanvas(24, 24);
    const iCtx = iconCanvas.getContext('2d');
    iCtx.drawImage(img, 0, 0, 24, 24);

    // Make dark colors solid and light colors transparent
    const imgData = iCtx.getImageData(0, 0, 24, 24);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Assume a bright background (white/gray)
      const brightness = (r + g + b) / 3;
      if (brightness > 200) {
        data[i + 3] = 0; // Make transparent
      } else {
        // Solid shape for the icon
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    iCtx.putImageData(imgData, 0, 0);

    buffer = iconCanvas.toBuffer('image/png');
    fs.writeFileSync('media/activity-icon.png', buffer);
    console.log('Created media/activity-icon.png for sidebar');

    // For good measure, let's also write a dummy SVG that references it
    fs.writeFileSync(
      'media/activity-icon.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <image href="data:image/png;base64,${buffer.toString('base64')}" width="24" height="24" />
    </svg>`
    );
    console.log('Created media/activity-icon.svg just in case');
  } catch (e) {
    console.error('Error processing image:', e);
  }
}
processLogo();
