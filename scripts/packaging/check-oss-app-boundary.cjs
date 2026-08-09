#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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

/** The committed copy of sync-repos.sh, or null outside a git checkout. */
function readCommittedSyncScript() {
  const result = spawnSync('git', ['show', 'HEAD:scripts/sync-repos.sh'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0 || typeof result.stdout !== 'string') return null;
  return result.stdout;
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const entries = manifestEntries(manifest);
  const knownApps = listTopLevelApps();
  const syncScript = fs.readFileSync(SYNC_SCRIPT_PATH, 'utf8');
  const proprietaryDirs = new Set(readShellArray(syncScript, 'PROPRIETARY_DIRS'));
  const alwaysExclude = new Set(readShellArray(syncScript, 'ALWAYS_EXCLUDE'));
  const errors = [];
  const warnings = [];

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

  // The checks above read the WORKING TREE copy of sync-repos.sh. If the exclusions
  // are only in an uncommitted edit, this reports OK while a clean clone, CI job, or
  // anyone who runs the sync after a checkout still publishes the excluded apps —
  // false assurance on exactly the paths that matter most (payments, personal data).
  const committedSync = readCommittedSyncScript();
  if (committedSync === null) {
    warnings.push(
      'Could not read the committed scripts/sync-repos.sh (not a git checkout?); ' +
        'verified the working tree only.'
    );
  } else {
    const committedExclude = new Set([
      ...readShellArray(committedSync, 'ALWAYS_EXCLUDE'),
      ...readShellArray(committedSync, 'PROPRIETARY_DIRS'),
    ]);
    const uncommitted = [...byPath.entries()]
      .filter(([appPath, entry]) => {
        if (!knownApps.includes(appPath)) return false;
        return entry.tier !== 'regularOpenSourceDownload' && !committedExclude.has(appPath);
      })
      .map(([appPath]) => appPath);

    if (uncommitted.length > 0) {
      errors.push(
        `Boundary is not committed. These are excluded in the working tree but NOT in ` +
          `HEAD, so a clean checkout would publish them: ${uncommitted.join(', ')}`
      );
    }
  }

  if (errors.length > 0) {
    console.error('[oss-app-boundary] FAIL');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  for (const warning of warnings) console.warn(`[oss-app-boundary] WARN ${warning}`);

  console.log('[oss-app-boundary] OK');
  console.log(`regularOpenSourceDownload=${manifest.regularOpenSourceDownload.length}`);
  console.log(`separateOpenSourceSatellites=${manifest.separateOpenSourceSatellites.length}`);
  console.log(`nonOssOrPersonalApps=${manifest.nonOssOrPersonalApps.length}`);
}

main();
