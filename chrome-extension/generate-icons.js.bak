import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// Get the directory name from the file URL (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple icon generation that copies pre-made icons
function generateIcons() {
  // Create icons directory if it doesn't exist
  if (!fs.existsSync('./icons')) {
    fs.mkdirSync('./icons');
  }

  // Copy default icons for now instead of generating them
  const sizes = [16, 48, 128];
  const states = ['', '-connected', '-error', '-partial'];

  sizes.forEach(size => {
    states.forEach(state => {
      try {
        // Try to copy from a default-icons directory first
        const defaultPath = path.join(__dirname, 'default-icons', `icon${size}${state}.png`);
        const targetPath = path.join(__dirname, 'icons', `icon${size}${state}.png`);
        
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, targetPath);
        } else {
          // If no default icon exists, create a minimal placeholder
          const minimalIcon = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00,
            0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
            0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
            0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63,
            0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
          ]);
          fs.writeFileSync(targetPath, minimalIcon);
        }
      } catch (error) {
        console.warn(`Failed to generate icon${size}${state}.png:`, error);
      }
    });
  });

  console.log('Icons generated successfully!');
}

// Execute icon generation
try {
  generateIcons();
} catch (error) {
  console.error('Error generating icons:', error);
  // In ESM we can't use process.exit directly without importing
  // Just throw the error to terminate with a non-zero exit code
  throw error;
}
