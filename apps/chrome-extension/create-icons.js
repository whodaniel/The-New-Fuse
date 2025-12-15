// Icon Generation Script for The New Fuse Chrome Extension
// Run with: node create-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple 1x1 purple pixel PNG (proper PNG structure)
// This is a minimal valid PNG that will work as a placeholder
function createPlaceholderPNG(size) {
  // PNG file structure
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data) - purple gradient circle
  const rawData = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte for each row
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        // Inside circle - gradient from purple to blue
        const gradientPos = (x + y) / (size * 2);
        const r = Math.round(102 + (118 - 102) * gradientPos); // 0x66 to 0x76
        const g = Math.round(126 + (75 - 126) * gradientPos); // 0x7e to 0x4b
        const b = Math.round(234 + (162 - 234) * gradientPos); // 0xea to 0xa2
        const a = 255;

        rawData.push(r, g, b, a);
      } else {
        // Outside circle - transparent
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  // Very simple zlib compression (store only, no actual compression)
  const zlibData = deflateRaw(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', zlibData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

// Simple CRC32 implementation
function crc32(buffer) {
  let crc = 0xffffffff;
  const table = makeCrcTable();

  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

// Simple deflate (zlib compression)
function deflateRaw(data) {
  const zlib = require('zlib');
  return zlib.deflateSync(data, { level: 9 });
}

// Generate icons
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

console.log('Generating The New Fuse Chrome Extension icons...');

sizes.forEach((size) => {
  try {
    const png = createPlaceholderPNG(size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, png);
    console.log(`✅ Created ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to create icon${size}.png:`, error.message);
  }
});

console.log('\nIcon generation complete!');
console.log('These are programmatically generated placeholders.');
console.log('For production, replace with professionally designed icons.');
