#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'distribution', 'oss-app-boundary.json');
const SYNC_SCRIPT_PATH = path.join(ROOT, 'scripts', 'sync-repos.sh');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listTopLevelApps() {
  const appsDir = path.join(ROOT, 'apps');
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `apps/${entry.name}`)
    .sort();
}

function manifestEntries(manifest) {
  return [
    ...manifest.regularOpenSourceDownload.map((entry) => ({ ...entry, tier: 'regularOpenSourceDownload' })),
    ...manifest.separateOpenSourceSatellites.map((entry) => ({ ...entry, tier: 'separateOpenSourceSatellites' })),
    ...manifest.nonOssOrPersonalApps.map((entry) => ({ ...entry, tier: 'nonOssOrPersonalApps' })),
  ];
}

function readShellArray(scriptText, name) {
  const match = scriptText.match(new RegExp(`${name}=\\(\\n([\\s\\S]*?)\\n\\)`, 'm'));
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((line) => line.replace(/^['"]|['"]$/g, ''));
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const entries = manifestEntries(manifest);
  const knownApps = listTopLevelApps();
  const syncScript = fs.readFileSync(SYNC_SCRIPT_PATH, 'utf8');
  const proprietaryDirs = new Set(readShellArray(syncScript, 'PROPRIETARY_DIRS'));
  const alwaysExclude = new Set(readShellArray(syncScript, 'ALWAYS_EXCLUDE'));
  const errors = [];

  const byPath = new Map();
  for (const entry of entries) {
    if (!entry.path || !entry.path.startsWith('apps/')) {
      errors.push(`Invalid app path in ${entry.tier}: ${entry.path || '(missing)'}`);
      continue;
    }
    if (byPath.has(entry.path)) {
      errors.push(`Duplicate app boundary entry: ${entry.path}`);
      continue;
    }
    byPath.set(entry.path, entry);
    if (!fs.existsSync(path.join(ROOT, entry.path))) {
      errors.push(`Manifest path does not exist: ${entry.path}`);
    }
  }

  for (const appPath of knownApps) {
    if (!byPath.has(appPath)) errors.push(`Unclassified top-level app: ${appPath}`);
  }

  for (const [appPath, entry] of byPath.entries()) {
    if (!knownApps.includes(appPath)) continue;
    const shouldBeExcluded = entry.tier !== 'regularOpenSourceDownload';
    const isExcluded = alwaysExclude.has(appPath) || proprietaryDirs.has(appPath);
    if (shouldBeExcluded && !isExcluded) {
      errors.push(`${appPath} is ${entry.tier} but is not excluded from the public export`);
    }
    if (!shouldBeExcluded && isExcluded) {
      errors.push(`${appPath} is regularOpenSourceDownload but is excluded from the public export`);
    }
  }

  if (errors.length > 0) {
    console.error('[oss-app-boundary] FAIL');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log('[oss-app-boundary] OK');
  console.log(`regularOpenSourceDownload=${manifest.regularOpenSourceDownload.length}`);
  console.log(`separateOpenSourceSatellites=${manifest.separateOpenSourceSatellites.length}`);
  console.log(`nonOssOrPersonalApps=${manifest.nonOssOrPersonalApps.length}`);
}

main();
