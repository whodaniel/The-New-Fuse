import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from the file URL (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED = ['icon16.png', 'icon48.png', 'icon128.png'];
const SOURCE_CANDIDATES = [
  path.join(__dirname, 'assets', 'icons'),
  path.join(__dirname, 'default-icons'),
  path.join(__dirname, 'src', '_legacy', 'icons'),
  path.join(__dirname, 'dist-v6', 'icons'),
];

function findSourceIcon(fileName) {
  for (const dir of SOURCE_CANDIDATES) {
    const candidate = path.join(dir, fileName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 100) {
      return candidate;
    }
  }
  return null;
}

function writeMinimalPlaceholder(targetPath) {
  const minimalIcon = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]);
  fs.writeFileSync(targetPath, minimalIcon);
}

/**
 * Populate ./icons for webpack copy. Prefer real assets over 1x1 placeholders —
 * Chrome rejects loadable extensions when action icons are missing from dist.
 */
function generateIcons() {
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sizes = [16, 48, 128];
  const states = ['', '-connected', '-error', '-partial', '-disconnected', '-connecting'];

  sizes.forEach((size) => {
    states.forEach((state) => {
      const fileName = `icon${size}${state}.png`;
      const targetPath = path.join(iconsDir, fileName);
      const source = findSourceIcon(fileName);

      try {
        if (source) {
          fs.copyFileSync(source, targetPath);
          return;
        }
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 100) {
          // Keep existing real icons; do not overwrite with a 1x1 placeholder.
          return;
        }
        // Optional state variants may be placeholders; required sizes must come from assets.
        if (!REQUIRED.includes(fileName)) {
          writeMinimalPlaceholder(targetPath);
        }
      } catch (error) {
        console.warn(`Failed to generate ${fileName}:`, error);
      }
    });
  });

  const missing = REQUIRED.filter((name) => {
    const p = path.join(iconsDir, name);
    return !fs.existsSync(p) || fs.statSync(p).size <= 100;
  });
  if (missing.length) {
    throw new Error(
      `Missing required extension icons after generate-icons: ${missing.join(', ')}. ` +
        `Expected real PNGs under assets/icons/.`
    );
  }

  console.log('Icons generated successfully!');
}

try {
  generateIcons();
} catch (error) {
  console.error('Error generating icons:', error);
  throw error;
}
