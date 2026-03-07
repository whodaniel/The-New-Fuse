const fs = require('fs');
const { createCanvas, Image } = require('canvas');

const svgData = `<svg width="128" height="128" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tnfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6" />
      <stop offset="50%" style="stop-color:#06b6d4" />
      <stop offset="100%" style="stop-color:#a855f7" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#tnfGradient)"/>
  <path
    d="M36 12L20 32H30L26 52L44 28H34L36 12Z"
    fill="white"
    filter="url(#glow)"
  />
</svg>`;

const canvas = createCanvas(128, 128);
const ctx = canvas.getContext('2d');

const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0, 128, 128);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('media/icon.png', buffer);
  console.log('Created real media/icon.png as PNG', buffer.length);
};

// Canvas pkg might not support SVG natively in all builds. If it fails, we fall back to manual drawing.
try {
  img.src = Buffer.from(svgData);
} catch (e) {
  console.log('SVG loading failed natively, drawing manually...');

  // Draw it manually on canvas
  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(0.5, '#06b6d4');
  gradient.addColorStop(1, '#a855f7');

  // scale is 128 / 64 = 2
  ctx.scale(2, 2);

  // Background rect
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(4, 4, 56, 56, 14);
  ctx.fill();

  // White bolt
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'white';
  ctx.shadowBlur = 4; // similar to glow
  ctx.beginPath();
  ctx.moveTo(36, 12);
  ctx.lineTo(20, 32);
  ctx.lineTo(30, 32);
  ctx.lineTo(26, 52);
  ctx.lineTo(44, 28);
  ctx.lineTo(34, 28);
  ctx.lineTo(36, 12);
  ctx.closePath();
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('media/icon.png', buffer);
  console.log('Created real media/icon.png as PNG (manual draw)');
}
