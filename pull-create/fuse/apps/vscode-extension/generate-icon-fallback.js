const fs = require('fs');

console.log('Creating minimal PNG with transparency...');

// Proper 128x128 PNG with RGBA data
// This is a minimal valid PNG with a purple gradient-like appearance and transparent corners
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
  0x08, // bit depth: 8
  0x06, // color type: 6 (RGBA)
  0x00, // compression
  0x00, // filter
  0x00, // interlace
]);

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function calculateCRC(type, data) {
  let crc = 0xffffffff;
  const combined = Buffer.concat([type, data]);
  for (let i = 0; i < combined.length; i++) {
    crc = crcTable[(crc ^ combined[i]) & 0xff] ^ (crc >>> 8);
  }
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return buf;
}

const ihdrCrc = calculateCRC(ihdrType, ihdrData);
const ihdr = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

// Create IDAT with image data (purple gradient with brain-like shape)
const rawData = [];
for (let y = 0; y < height; y++) {
  rawData.push(0x00); // filter byte
  for (let x = 0; x < width; x++) {
    // Coordinates normalized to -1 to 1
    const dx = (x - 64) / 64;
    const dy = (y - 64) / 64;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Purple colors
    // Main gradient
    let r = 124;
    let g = 58;
    let b = 237;
    let a = 0;

    if (dist < 0.9) {
      // Inside the circle
      a = 255;

      // Gradient effect
      r = Math.floor(124 - dist * 40);
      g = Math.floor(58 - dist * 20);
      b = Math.floor(237 - dist * 100);

      // "Brain" details (simplified white shapes)
      // Left lobe
      const dLeft = Math.sqrt(Math.pow(dx + 0.3, 2) + Math.pow(dy + 0.1, 2));
      if (dLeft < 0.35) {
        r = 255;
        g = 255;
        b = 255;
      }

      // Right lobe
      const dRight = Math.sqrt(Math.pow(dx - 0.3, 2) + Math.pow(dy + 0.1, 2));
      if (dRight < 0.35) {
        r = 255;
        g = 255;
        b = 255;
      }

      // Brain stem
      if (dy > 0.3 && Math.abs(dx) < 0.15) {
        r = 233;
        g = 213;
        b = 255; // #e9d5ff
      }
    }

    rawData.push(r, g, b, a);
  }
}

const rawBuffer = Buffer.from(rawData);
// Compress using zlib
const zlib = require('zlib');
const compressed = zlib.deflateSync(rawBuffer);

const idatLength = Buffer.alloc(4);
idatLength.writeUInt32BE(compressed.length, 0);

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
console.log('Created media/icon.png');
