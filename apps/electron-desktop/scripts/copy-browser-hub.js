#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define source and destination paths
const sourceDir = path.resolve(__dirname, '../../browser-hub');
const destDir = path.resolve(__dirname, '../dist/browser-hub');

console.log(`Copying Browser Hub from ${sourceDir} to ${destDir}...`);

// Helper to copy recursive
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // skip irrelevant files
    if (src.endsWith('.DS_Store') || src.includes('.git')) return;

    // Ensure parent dir exists
    const dirname = path.dirname(dest);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

try {
  // Clear destination first if easier, or just overwrite
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  copyRecursiveSync(sourceDir, destDir);
  console.log(`🎉 Browser hub files (including assets) copied successfully!`);

  // Also copy TNF Chrome Extension to extensions folder
  const chromeExtSource = path.resolve(__dirname, '../../chrome-extension');
  const chromeExtDest = path.resolve(__dirname, '../extensions/tnf-chrome-extension');

  if (fs.existsSync(chromeExtSource)) {
    console.log(`Copying TNF Chrome Extension from ${chromeExtSource} to ${chromeExtDest}...`);

    // Filter function to exclude non-essential files
    function copyExtensionSync(src, dest) {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      const basename = path.basename(src);

      // Skip non-essential directories and files
      const skipDirs = [
        'node_modules',
        '.git',
        '.turbo',
        '.yarn',
        'test-results',
        'test-screenshots',
        'src',
      ];
      const skipFiles = [
        '.DS_Store',
        '.eslintrc.json',
        '.gitignore',
        'package-lock.json',
        'yarn.lock',
      ];

      if (skipDirs.includes(basename) || skipFiles.includes(basename)) return;
      if (
        basename.endsWith('.sh') ||
        basename.endsWith('.spec.js') ||
        basename.endsWith('.md') ||
        basename.endsWith('.log')
      )
        return;

      if (isDirectory) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
          copyExtensionSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        const dirname = path.dirname(dest);
        if (!fs.existsSync(dirname)) {
          fs.mkdirSync(dirname, { recursive: true });
        }
        fs.copyFileSync(src, dest);
      }
    }

    // Clear old extension first
    if (fs.existsSync(chromeExtDest)) {
      fs.rmSync(chromeExtDest, { recursive: true, force: true });
    }
    fs.mkdirSync(chromeExtDest, { recursive: true });

    copyExtensionSync(chromeExtSource, chromeExtDest);
    console.log(`🎉 TNF Chrome Extension copied successfully!`);
  } else {
    console.warn(`⚠️ TNF Chrome Extension not found at ${chromeExtSource}`);
  }
} catch (error) {
  console.error(`❌ Failed to copy browser hub:`, error);
  process.exit(1);
}
