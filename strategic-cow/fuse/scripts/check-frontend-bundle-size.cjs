#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const distAssetsDir = path.join(repoRoot, 'apps/frontend/dist/assets/js');
const maxChunkKb = Number(process.env.MAX_FRONTEND_CHUNK_KB || '600');
const maxTotalJsMb = Number(process.env.MAX_FRONTEND_TOTAL_JS_MB || '6');

if (!fs.existsSync(distAssetsDir)) {
  console.error(`FAIL: missing frontend build output at ${distAssetsDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(distAssetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const fullPath = path.join(distAssetsDir, file);
    const sizeBytes = fs.statSync(fullPath).size;
    return { file, sizeBytes };
  });

if (files.length === 0) {
  console.error('FAIL: no frontend JS chunks found');
  process.exit(1);
}

const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
const totalMb = totalBytes / (1024 * 1024);

const offenders = files
  .filter((file) => file.sizeBytes > maxChunkKb * 1024)
  .sort((a, b) => b.sizeBytes - a.sizeBytes);

const largest = [...files].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5);

console.log(`Frontend bundle summary: ${files.length} chunks, ${totalMb.toFixed(2)} MB total JS`);
console.log('Top 5 largest chunks:');
for (const file of largest) {
  console.log(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
}

let failed = false;

if (totalMb > maxTotalJsMb) {
  console.error(
    `FAIL: total JS ${totalMb.toFixed(2)} MB exceeds limit ${maxTotalJsMb.toFixed(2)} MB`
  );
  failed = true;
}

if (offenders.length > 0) {
  console.error(`FAIL: ${offenders.length} chunk(s) exceed ${maxChunkKb} KB limit:`);
  for (const file of offenders) {
    console.error(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
  }
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('PASS: frontend bundle size checks are within configured limits');
