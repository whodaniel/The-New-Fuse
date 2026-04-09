const fs = require('fs');
const { execSync } = require('child_process');

// Create a proper PNG icon using canvas if available, otherwise use base64
try {
  // Try to use canvas
  const canvasModule = require('canvas');
  const { createCanvas, loadImage } = canvasModule;

  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');

  // Draw gradient background
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#a855f7');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(1, '#5b21b6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  // Draw brain shape (simplified)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  // Left hemisphere
  ctx.ellipse(44, 54, 20, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right hemisphere
  ctx.beginPath();
  ctx.ellipse(84, 54, 20, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brain stem
  ctx.fillStyle = '#e9d5ff';
  ctx.fillRect(56, 78, 16, 20);

  // Draw TNF text
  ctx.fillStyle = '#7c3aed';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TNF', 64, 62);

  // Save PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('media/icon.png', buffer);
  console.log('Created icon.png using canvas');
} catch (e) {
  // Canvas not available, create a proper minimal PNG manually
  console.log('Canvas not available, creating minimal PNG...');

  // Proper 128x128 PNG with RGBA data
  // This is a minimal valid PNG with a purple gradient-like appearance
  const width = 128;
  const height = 128;

  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrLength = Buffer.from([0x00, 0x00, 0x00, 0x0d]);
  const ihdrType = Buffer.from('IHDR');
  const ihdrData = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x80, // width: 128
    0x00,
    0x00,
    0x00,
    0x80, // height: 128
    0x08,
    0x06, // bit depth: 8, color type: 6 (RGBA)
    0x00,
    0x00,
    00, // compression, filter, interlace
  ]);
  const ihdrCrc = calculateCRC(ihdrType, ihdrData);
  const ihdr = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

  // Create IDAT with image data (purple gradient with brain-like shape)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0x00); // filter byte
    for (let x = 0; x < width; x++) {
      // Purple gradient background
      const dx = (x - 64) / 64;
      const dy = (y - 64) / 64;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Purple colors
      const r = dist < 0.9 ? 124 : 80;
      const g = dist < 0.9 ? 58 : 30;
      const b = dist < 0.9 ? 237 : 130;
      const a = dist < 0.9 ? 255 : 0;

      rawData.push(r, g, b, a);
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const compressed = compressZLIB(rawBuffer);

  const idatLength = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  const idatLengthVal = compressed.length;
  idatLength.writeUInt32BE(idatLengthVal, 0);

  const idatType = Buffer.from('IDAT');
  const idatCrc = calculateCRC(idatType, compressed);
  const idat = Buffer.concat([idatLength, idatType, compressed, idatCrc]);

  // IEND chunk
  const iendLength = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.from([0xae, 0x42, 0x60, 0x82]);
  const iend = Buffer.concat([iendLength, iendType, iendCrc]);

  // Combine all chunks
  const png = Buffer.concat([signature, ihdr, idat, iend]);
  fs.writeFileSync('media/icon.png', png);
  console.log('Created icon.png with purple gradient');
}

function calculateCRC(type, data) {
  // Simplified CRC - for production use proper CRC32
  const crcTable = getCRC32Table();
  let crc = 0xffffffff;

  const combined = Buffer.concat([type, data]);
  for (let i = 0; i < combined.length; i++) {
    crc = crcTable[(crc ^ combined[i]) & 0xff] ^ (crc >>> 8);
  }

  const buf = Buffer.alloc(4);
  buf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return buf;
}

function getCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

function compressZLIB(data) {
  // Simple zlib wrapper - use Node's zlib for production
  const zlib = require('zlib');
  return zlib.deflateSync(data, { level: 9 });
}
