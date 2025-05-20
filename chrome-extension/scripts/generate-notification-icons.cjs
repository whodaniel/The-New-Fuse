/**
 * Generate notification icons for The New Fuse - AI Bridge
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Get the directory name (CommonJS version)
const __dirname = path.dirname(__filename);

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate notification icons
generateNotificationIcons();

/**
 * Generate notification icons
 */
function generateNotificationIcons() {
  console.log('Generating notification icons...');

  // Generate success icon
  generateIcon('icon-success.png', '#34a853', '✓');

  // Generate warning icon
  generateIcon('icon-warning.png', '#fbbc05', '!');

  // Generate error icon
  generateIcon('icon-error.png', '#ea4335', '✕');

  console.log('Notification icons generated successfully.');
}

/**
 * Generate an icon
 * @param {string} filename - Icon filename
 * @param {string} color - Icon color
 * @param {string} symbol - Icon symbol
 */
function generateIcon(filename, color, symbol) {
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw symbol
  ctx.font = 'bold 80px sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, size / 2, size / 2);

  // Save icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Generated ${filename}`);
}