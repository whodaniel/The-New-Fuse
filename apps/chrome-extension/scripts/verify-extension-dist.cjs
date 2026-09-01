#!/usr/bin/env node
'use strict';

/**
 * Fail the extension build if Chrome-required assets are missing from dist.
 * Prevents "Could not load icon ... specified in action" on Load Unpacked.
 */

const fs = require('node:fs');
const path = require('node:path');

const distArg = process.argv[2] || 'dist-v7';
const distDir = path.resolve(__dirname, '..', distArg);
const required = [
  'manifest.json',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'service-worker.js',
  'content/index.js',
  'popup/index.html',
  'popup/popup.js',
  'sidepanel/index.html',
  'sidepanel/sidepanel.js',
];

const missing = required.filter((rel) => {
  const full = path.join(distDir, rel);
  if (!fs.existsSync(full)) return true;
  try {
    return fs.statSync(full).size <= 0;
  } catch {
    return true;
  }
});

if (missing.length) {
  console.error(`[verify-extension-dist] ${distArg} is incomplete:`);
  for (const rel of missing) console.error(`  - missing ${rel}`);
  console.error('Run: pnpm run build:v7 (icons come from assets/icons via generate-icons.js)');
  process.exit(1);
}

console.log(`[verify-extension-dist] ${distArg} ok (${required.length} required assets present)`);
