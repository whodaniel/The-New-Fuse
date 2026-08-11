#!/usr/bin/env node
/**
 * Static MV3 extension — no bundler. Build validates required artifacts exist
 * so turbo `build:apps` does not fail on a missing scripts/build.js.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'manifest.json',
  'service-worker.js',
  'content-script.js',
  'runtime-config.js',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
if (missing.length) {
  console.error('[browser-extension] missing required files:', missing.join(', '));
  process.exit(1);
}

console.log('[browser-extension] static package OK (%d files verified)', required.length);
process.exit(0);
