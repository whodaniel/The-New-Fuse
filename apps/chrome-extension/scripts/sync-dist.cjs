#!/usr/bin/env node
/**
 * sync-dist.cjs — Sync dist-v7 -> dist without ever deleting the dist directory.
 *
 * WHY THIS EXISTS: Chrome loads the unpacked extension from
 * `apps/chrome-extension/dist` (see Chrome Profile 10 → Secure Preferences,
 * extension id fkbcklmcikdhpggaimfhomgncneppkbj). The previous build tail was
 * `rm -rf dist && cp -R dist-v7 dist`, which removes the loaded directory out
 * from under the running MV3 service worker on every build. The SW can then
 * never be woken again and every chrome.runtime.sendMessage fails with
 * "Could not establish connection. Receiving end does not exist." until a
 * manual chrome://extensions reload.
 *
 * STRATEGY: prune stale files first (never manifest.json / service-worker.js),
 * copy everything else, then write manifest.json and finally service-worker.js
 * last so the SW script is never missing while its registration restarts.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'dist-v7');
const dest = path.join(root, 'dist');

// Written last, in this order: manifest first, SW script last.
const WRITTEN_LAST = ['manifest.json', 'service-worker.js'];

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

if (!fs.existsSync(path.join(src, 'service-worker.js'))) {
  console.error('sync-dist: dist-v7/service-worker.js missing — run webpack first');
  process.exit(1);
}
if (!fs.existsSync(path.join(src, 'manifest.json'))) {
  console.error('sync-dist: dist-v7/manifest.json missing — run webpack first');
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

const srcFiles = new Set(listFiles(src));

// 1. Prune files that no longer exist in the source (never the protected two).
for (const rel of listFiles(dest)) {
  if (WRITTEN_LAST.includes(rel)) continue;
  if (!srcFiles.has(rel)) {
    fs.rmSync(path.join(dest, rel), { force: true });
  }
}

// 2. Copy everything except the protected two.
for (const rel of srcFiles) {
  if (WRITTEN_LAST.includes(rel)) continue;
  const to = path.join(dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(src, rel), to);
}

// 3. Replace the protected two last (manifest first, SW script last).
for (const rel of WRITTEN_LAST) {
  fs.copyFileSync(path.join(src, rel), path.join(dest, rel));
}

console.log('sync-dist: dist synced from dist-v7 (service-worker.js written last)');
