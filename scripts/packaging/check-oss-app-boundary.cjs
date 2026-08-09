#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'distribution', 'oss-app-boundary.json');
const SYNC_SCRIPT_PATH = path.join(ROOT, 'scripts', 'sync-repos.sh');
const PARENT = path.dirname(ROOT);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listCoreApps() {
  const appsDir = path.join(ROOT, 'apps');
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => {
      if (entry.name === 'extensions') return false;
      return entry.isDirectory() || entry.isSymbolicLink();
    })
    .filter((entry) => {
      const full = path.join(appsDir, entry.name);
      try {
        return fs.statSync(full).isDirectory();
      } catch {
        return false;
      }
    })
    .map((entry) => `apps/${entry.name}`)
    .sort();
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

function readCommittedSyncScript() {
  const result = spawnSync('git', ['show', 'HEAD:scripts/sync-repos.sh'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0 || typeof result.stdout !== 'string') return null;
  return result.stdout;
}

function extAbs(entry) {
  const rootName = entry.root || 'TNF-Extensions';
  return path.join(PARENT, rootName, entry.path);
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const coreApps = listCoreApps();
  const syncScript = fs.readFileSync(SYNC_SCRIPT_PATH, 'utf8');
  const proprietaryDirs = new Set(readShellArray(syncScript, 'PROPRIETARY_DIRS'));
  const alwaysExclude = new Set(readShellArray(syncScript, 'ALWAYS_EXCLUDE'));
  const errors = [];
  const warnings = [];

  const redirect = manifest.appsExtensionsRedirect;
  if (!redirect || redirect.path !== 'apps/extensions') {
    errors.push('appsExtensionsRedirect.path must be apps/extensions');
  } else {
    const redirectFull = path.join(ROOT, redirect.path);
    if (!fs.existsSync(redirectFull)) {
      errors.push(`Missing redirect: ${redirect.path}`);
    } else {
      const st = fs.lstatSync(redirectFull);
      if (!st.isSymbolicLink()) {
        errors.push('apps/extensions must be a symlink to TNF-Extensions');
      } else {
        const linkTarget = fs.readlinkSync(redirectFull);
        const expected = redirect.target || '../../TNF-Extensions';
        if (linkTarget !== expected && path.resolve(path.dirname(redirectFull), linkTarget) !==
            path.resolve(path.dirname(redirectFull), expected)) {
          errors.push(
            `apps/extensions symlink target is "${linkTarget}", expected "${expected}"`
          );
        }
        const resolved = fs.realpathSync(redirectFull);
        const expectedAbs = path.join(PARENT, 'TNF-Extensions');
        if (resolved !== expectedAbs) {
          errors.push(`apps/extensions resolves to ${resolved}, expected ${expectedAbs}`);
        }
      }
    }
  }

  if (!alwaysExclude.has('apps/extensions')) {
    errors.push('apps/extensions must be in ALWAYS_EXCLUDE so public export does not follow the symlink');
  }

  const byCorePath = new Map();
  for (const entry of manifest.regularOpenSourceDownload) {
    if (!entry.path || !entry.path.startsWith('apps/')) {
      errors.push(`Invalid regular path: ${entry.path || '(missing)'}`);
      continue;
    }
    if (entry.path === 'apps/extensions') {
      errors.push('apps/extensions must not be listed as regularOpenSourceDownload');
      continue;
    }
    if (byCorePath.has(entry.path)) {
      errors.push(`Duplicate regular entry: ${entry.path}`);
      continue;
    }
    byCorePath.set(entry.path, entry);
    if (!fs.existsSync(path.join(ROOT, entry.path))) {
      errors.push(`Manifest path does not exist: ${entry.path}`);
    }
  }

  for (const appPath of coreApps) {
    if (!byCorePath.has(appPath)) errors.push(`Unclassified core app: ${appPath}`);
  }
  for (const appPath of byCorePath.keys()) {
    if (!coreApps.includes(appPath)) {
      errors.push(`regularOpenSourceDownload entry missing on disk: ${appPath}`);
    }
  }

  for (const appPath of byCorePath.keys()) {
    if (alwaysExclude.has(appPath) || proprietaryDirs.has(appPath)) {
      errors.push(`${appPath} is regularOpenSourceDownload but is excluded from the public export`);
    }
  }

  const external = [
    ...(manifest.separateOpenSourceSatellites || []).map((e) => ({ ...e, tier: 'satellite' })),
    ...(manifest.nonOssOrPersonalApps || []).map((e) => ({ ...e, tier: 'nonOss' })),
  ];
  const seenExt = new Set();
  for (const entry of external) {
    const key = `${entry.root || 'TNF-Extensions'}/${entry.path}`;
    if (seenExt.has(key)) errors.push(`Duplicate extension entry: ${key}`);
    seenExt.add(key);
    if (!entry.path || entry.path.includes('/') || entry.path.startsWith('apps/')) {
      errors.push(`Extension paths are bare names under TNF-Extensions, got: ${entry.path}`);
      continue;
    }
    const abs = extAbs(entry);
    if (!fs.existsSync(abs)) errors.push(`Missing extension app (${entry.tier}): ${abs}`);
  }

  for (const prop of ['apps/extensions/nexus-orchestrator', 'apps/extensions/picoclaw-overseer']) {
    if (!proprietaryDirs.has(prop)) {
      warnings.push(`Expected PROPRIETARY_DIRS to include ${prop} (control-plane extract via redirect)`);
    }
  }

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
    if (!committedExclude.has('apps/extensions')) {
      warnings.push(
        'HEAD scripts/sync-repos.sh does not yet ALWAYS_EXCLUDE apps/extensions — commit after this move'
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
  console.log(`separateOpenSourceSatellites=${(manifest.separateOpenSourceSatellites || []).length}`);
  console.log(`nonOssOrPersonalApps=${(manifest.nonOssOrPersonalApps || []).length}`);
  console.log(`appsExtensionsRedirect=${redirect ? redirect.path : '(missing)'}`);
}

main();
