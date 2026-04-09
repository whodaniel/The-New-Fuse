const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const canvas = createCanvas(128, 128);
const ctx = canvas.getContext('2d');

// Clear with purple gradient background
const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 70);
gradient.addColorStop(0, '#a855f7');
gradient.addColorStop(0.4, '#7c3aed');
gradient.addColorStop(1, '#5b21b6');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

// Draw brain shape - left hemisphere
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.ellipse(42, 56, 22, 30, -0.2, 0, Math.PI * 2);
ctx.fill();

// Right hemisphere
ctx.beginPath();
ctx.ellipse(86, 56, 22, 30, 0.2, 0, Math.PI * 2);
ctx.fill();

// Brain stem
ctx.fillStyle = '#f3e8ff';
ctx.beginPath();
ctx.moveTo(54, 82);
ctx.lineTo(74, 82);
ctx.lineTo(70, 100);
ctx.lineTo(58, 100);
ctx.closePath();
ctx.fill();

// Brain fold lines - left
ctx.strokeStyle = '#c4b5fd';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(30, 50);
ctx.quadraticCurveTo(40, 45, 48, 52);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(28, 65);
ctx.quadraticCurveTo(38, 60, 48, 67);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(30, 80);
ctx.quadraticCurveTo(40, 75, 48, 82);
ctx.stroke();

// Brain fold lines - right
ctx.beginPath();
ctx.moveTo(98, 50);
ctx.quadraticCurveTo(88, 45, 80, 52);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(100, 65);
ctx.quadraticCurveTo(90, 60, 80, 67);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(98, 80);
ctx.quadraticCurveTo(88, 75, 80, 82);
ctx.stroke();

// TNF Text - bold and centered
ctx.fillStyle = '#7c3aed';
ctx.font = 'bold 26px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('TNF', 64, 60);

// Add subtle glow effect
ctx.shadowColor = '#a855f7';
ctx.shadowBlur = 15;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;

// Add neural connection dots
ctx.fillStyle = '#ffffff';
ctx.shadowBlur = 5;
ctx.beginPath();
ctx.arc(18, 64, 4, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(110, 64, 4, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 15, 3, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 113, 3, 0, Math.PI * 2);
ctx.fill();

// Save PNG
const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
fs.writeFileSync('media/icon.png', buffer);
console.log('Created media/icon.png:', buffer.length, 'bytes');
console.log('Icon dimensions: 128x128');
