#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define source and destination paths
const sourceDir = path.join(__dirname, '../../browser-hub');
const destDir = path.join(__dirname, '../dist/browser-hub');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all HTML files from browser-hub to electron-desktop dist
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.html'));

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);

  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to ${destPath}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${file}:`, error.message);
  }
});

console.log(`🎉 Browser hub files copied successfully! (${files.length} files)`);