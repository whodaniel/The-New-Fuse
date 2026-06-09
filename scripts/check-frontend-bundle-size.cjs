#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const distAssetsDir = path.join(repoRoot, 'apps/frontend/dist/assets/js');
const maxChunkKb = Number(process.env.MAX_FRONTEND_CHUNK_KB || '600');
const maxTotalJsMb = Number(process.env.MAX_FRONTEND_TOTAL_JS_MB || '6');
const maxLazyChunkKb = Number(process.env.MAX_FRONTEND_LAZY_CHUNK_KB || '2000');
const bundleScope = process.env.FRONTEND_BUNDLE_SCOPE || 'initial';
const htmlEntrypoints = ['apps/frontend/dist/index.html', 'apps/frontend/dist/app.html'];

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

const initialFileNames = new Set();
for (const htmlPath of htmlEntrypoints) {
  const fullHtmlPath = path.join(repoRoot, htmlPath);
  if (!fs.existsSync(fullHtmlPath)) continue;

  const html = fs.readFileSync(fullHtmlPath, 'utf8');
  const assetMatches = html.matchAll(
    /(?:src|href)=["'](?:\/)?assets\/js\/([^"']+\.js)["']/g
  );
  for (const match of assetMatches) {
    initialFileNames.add(match[1]);
  }
}

const initialFiles = files.filter((file) => initialFileNames.has(file.file));
const lazyFiles = files.filter((file) => !initialFileNames.has(file.file));
const measuredFiles = bundleScope === 'all' ? files : initialFiles;
const measuredBytes = measuredFiles.reduce((sum, file) => sum + file.sizeBytes, 0);
const measuredMb = measuredBytes / (1024 * 1024);

const offenders = files
  .filter((file) => file.sizeBytes > maxChunkKb * 1024)
  .sort((a, b) => b.sizeBytes - a.sizeBytes);
const measuredOffenders = measuredFiles
  .filter((file) => file.sizeBytes > maxChunkKb * 1024)
  .sort((a, b) => b.sizeBytes - a.sizeBytes);
const lazyWarnings = lazyFiles
  .filter((file) => file.sizeBytes > maxLazyChunkKb * 1024)
  .sort((a, b) => b.sizeBytes - a.sizeBytes);

const largest = [...files].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5);

console.log(`Frontend bundle summary: ${files.length} chunks, ${totalMb.toFixed(2)} MB total JS`);
console.log(
  `Measured scope: ${bundleScope} (${measuredFiles.length} chunks, ${measuredMb.toFixed(2)} MB JS)`
);
console.log('Top 5 largest chunks:');
for (const file of largest) {
  console.log(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
}

let failed = false;

if (measuredFiles.length === 0) {
  console.error('FAIL: no initial JS chunks could be resolved from built HTML entrypoints');
  failed = true;
}

if (measuredMb > maxTotalJsMb) {
  console.error(
    `FAIL: measured JS ${measuredMb.toFixed(2)} MB exceeds limit ${maxTotalJsMb.toFixed(2)} MB`
  );
  failed = true;
}

if (measuredOffenders.length > 0) {
  console.error(`FAIL: ${measuredOffenders.length} measured chunk(s) exceed ${maxChunkKb} KB limit:`);
  for (const file of measuredOffenders) {
    console.error(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
  }
  failed = true;
}

const nonMeasuredOffenders = offenders.filter((file) => !measuredFiles.includes(file));
if (nonMeasuredOffenders.length > 0) {
  console.warn(`WARN: ${nonMeasuredOffenders.length} lazy chunk(s) exceed ${maxChunkKb} KB:`);
  for (const file of nonMeasuredOffenders) {
    console.warn(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
  }
}

if (lazyWarnings.length > 0) {
  console.warn(`WARN: ${lazyWarnings.length} lazy chunk(s) exceed ${maxLazyChunkKb} KB warning limit:`);
  for (const file of lazyWarnings) {
    console.warn(`  - ${file.file}: ${(file.sizeBytes / 1024).toFixed(2)} KB`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('PASS: frontend bundle size checks are within configured limits');
