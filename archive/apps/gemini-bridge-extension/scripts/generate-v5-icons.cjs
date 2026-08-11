/**
 * Generate Fuse Connect Branded Icons
 * TNF Neon Cyberpunk Theme
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, 'assets', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - Deep space dark with slight gradient
  const bgGradient = ctx.createLinearGradient(0, 0, size, size);
  bgGradient.addColorStop(0, '#0a0a0f');
  bgGradient.addColorStop(1, '#12121a');

  // Draw rounded rectangle background
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = bgGradient;
  ctx.fill();

  // Neon border glow
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
  ctx.lineWidth = size * 0.03;
  ctx.stroke();

  // Lightning bolt gradient
  const boltGradient = ctx.createLinearGradient(size * 0.3, size * 0.1, size * 0.7, size * 0.9);
  boltGradient.addColorStop(0, '#00D9FF'); // Cyan
  boltGradient.addColorStop(0.5, '#9D4EDD'); // Purple
  boltGradient.addColorStop(1, '#FF006E'); // Pink

  // Draw lightning bolt (stylized F for Fuse)
  ctx.beginPath();
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.35; // Scale factor

  // Lightning bolt path
  ctx.moveTo(cx + s * 0.2, cy - s * 0.8); // Top right
  ctx.lineTo(cx - s * 0.4, cy - s * 0.1); // Middle left
  ctx.lineTo(cx + s * 0.1, cy - s * 0.1); // Middle center
  ctx.lineTo(cx - s * 0.2, cy + s * 0.8); // Bottom left
  ctx.lineTo(cx + s * 0.4, cy + s * 0.1); // Middle right
  ctx.lineTo(cx - s * 0.1, cy + s * 0.1); // Middle center
  ctx.closePath();

  ctx.fillStyle = boltGradient;
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = '#00D9FF';
  ctx.shadowBlur = size * 0.15;
  ctx.fill();

  // Reset shadow
  ctx.shadowBlur = 0;

  return canvas;
}

function generateStatusIcon(size, status) {
  const canvas = generateIcon(size);
  const ctx = canvas.getContext('2d');

  // Add status indicator
  const indicatorSize = size * 0.25;
  const indicatorX = size - indicatorSize - size * 0.05;
  const indicatorY = size - indicatorSize - size * 0.05;

  // Status colors
  const statusColors = {
    connected: '#00FF88',
    disconnected: '#FF3366',
    connecting: '#FFB800',
    error: '#FF006E',
  };

  // Draw indicator background
  ctx.beginPath();
  ctx.arc(
    indicatorX + indicatorSize / 2,
    indicatorY + indicatorSize / 2,
    indicatorSize / 2,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = '#12121a';
  ctx.fill();

  // Draw status dot
  ctx.beginPath();
  ctx.arc(
    indicatorX + indicatorSize / 2,
    indicatorY + indicatorSize / 2,
    indicatorSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = statusColors[status] || statusColors.disconnected;
  ctx.fill();

  // Glow
  ctx.shadowColor = statusColors[status];
  ctx.shadowBlur = 5;
  ctx.fill();

  return canvas;
}

// Generate all icons
console.log('Generating Fuse Connect icons...');

sizes.forEach((size) => {
  // Base icon
  const icon = generateIcon(size);
  const iconPath = path.join(outputDir, `icon${size}.png`);
  fs.writeFileSync(iconPath, icon.toBuffer('image/png'));
  console.log(`  ✓ icon${size}.png`);

  // Status variants
  ['connected', 'disconnected', 'connecting', 'error'].forEach((status) => {
    const statusIcon = generateStatusIcon(size, status);
    const statusPath = path.join(outputDir, `icon${size}-${status}.png`);
    fs.writeFileSync(statusPath, statusIcon.toBuffer('image/png'));
    console.log(`  ✓ icon${size}-${status}.png`);
  });
});

console.log('\n✅ All icons generated successfully!');
console.log(`   Output: ${outputDir}`);
