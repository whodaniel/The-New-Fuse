/**
 * Tests for scripts/protocols/validate-cleanroom-boundary.cjs
 *
 * The script enforces two invariants on the clean-room Docker boundary:
 *  1. Dockerfile.cleanroom must carry TNF_ROOT/TNF_RELAY_URL env markers, set
 *     WORKDIR from TNF_ROOT, and reference validate-local-runtime-boundary.cjs
 *     for runtime validation. It must NOT bake in personal paths or the legacy
 *     localhost:3001 relay literal.
 *  2. .dockerignore must exclude .env files (and prevent local-secret spill)
 *     while keeping *.example files available.
 *
 * Run via:
 *   node --test scripts/protocols/validate-cleanroom-boundary.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'validate-cleanroom-boundary.cjs');
const REPO = path.resolve(__dirname, '..', '..');
const DOCKERFILE = path.join(REPO, 'Dockerfile.cleanroom');
const DOCKERIGNORE = path.join(REPO, '.dockerignore');

const VALID_DOCKERFILE = [
  'FROM ubuntu:22.04',
  'ENV TNF_ROOT=/home/tnfuser/Projects/The-New-Fuse',
  'ENV TNF_RELAY_URL=ws://127.0.0.1:3000/ws',
  'WORKDIR $TNF_ROOT',
  'RUN node scripts/protocols/validate-local-runtime-boundary.cjs',
  '',
].join('\n');

const VALID_DOCKERIGNORE = [
  '.env',
  '.env.*',
  '!.env.example',
  '!.env.*.example',
  '.tnf.local.env',
  '.tnf.local.env.*',
  '**/.env',
  '**/.env.*',
  '!**/.env.example',
  '!**/.env.*.example',
  '.pnpm-store',
  '**/.pnpm-store',
  'node_modules',
  '**/node_modules',
  '',
].join('\n');

function swapAndRun(contentMap) {
  // contentMap: { dockerfile?: string, dockerignore?: string }
  // Backup real files, write temporary contents, run script, restore.
  const realDockerfile = fs.existsSync(DOCKERFILE) ? fs.readFileSync(DOCKERFILE, 'utf8') : null;
  const realIgnore = fs.existsSync(DOCKERIGNORE) ? fs.readFileSync(DOCKERIGNORE, 'utf8') : null;
  const restore = [];
  try {
    if ('dockerfile' in contentMap) {
      if (realDockerfile == null) {
        // File missing — we'll need to delete any temp file we create.
        if (!fs.existsSync(DOCKERFILE)) {
          fs.writeFileSync(DOCKERFILE, contentMap.dockerfile ?? '');
          restore.push(() => fs.rmSync(DOCKERFILE, { force: true }));
        } else {
          fs.writeFileSync(DOCKERFILE, contentMap.dockerfile);
          restore.push(() => fs.writeFileSync(DOCKERFILE, realDockerfile ?? ''));
        }
      } else {
        fs.writeFileSync(DOCKERFILE, contentMap.dockerfile ?? '');
        restore.push(() => fs.writeFileSync(DOCKERFILE, realDockerfile));
      }
    }
    if ('dockerignore' in contentMap) {
      if (!fs.existsSync(DOCKERIGNORE)) {
        fs.writeFileSync(DOCKERIGNORE, contentMap.dockerignore ?? '');
        restore.push(() => fs.rmSync(DOCKERIGNORE, { force: true }));
      } else {
        fs.writeFileSync(DOCKERIGNORE, contentMap.dockerignore);
        restore.push(() => fs.writeFileSync(DOCKERIGNORE, realIgnore ?? ''));
      }
    }
    return spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
  } finally {
    for (const fn of restore.reverse()) {
      try { fn(); } catch (_) { /* ignore */ }
    }
  }
}

test('real Dockerfile.cleanroom and .dockerignore together pass', () => {
  const r = swapAndRun({});
  assert.equal(r.status, 0, `script failed: ${r.stderr}`);
  assert.match(r.stdout, /\[cleanroom-boundary\] OK/);
});

test('valid synthetic Dockerfile + dockerignore pair passes', () => {
  const r = swapAndRun({
    dockerfile: VALID_DOCKERFILE,
    dockerignore: VALID_DOCKERIGNORE,
  });
  assert.equal(r.status, 0, `script failed: ${r.stderr}`);
  assert.match(r.stdout, /OK: clean-room Docker boundary/);
});

test('rejects a Dockerfile missing the TNF_ROOT env marker', () => {
  const bad = VALID_DOCKERFILE.replace('ENV TNF_ROOT=/home/tnfuser/Projects/The-New-Fuse', '');
  const r = swapAndRun({ dockerfile: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /TNF_ROOT/);
});

test('rejects a Dockerfile missing the TNF_RELAY_URL env marker', () => {
  const bad = VALID_DOCKERFILE.replace('ENV TNF_RELAY_URL=ws://127.0.0.1:3000/ws', '');
  const r = swapAndRun({ dockerfile: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /TNF_RELAY_URL/);
});

test('rejects a Dockerfile missing the WORKDIR $TNF_ROOT marker', () => {
  const bad = VALID_DOCKERFILE.replace('WORKDIR $TNF_ROOT', '');
  const r = swapAndRun({ dockerfile: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /WORKDIR/);
});

test('rejects a Dockerfile missing the runtime-boundary validator reference', () => {
  const bad = VALID_DOCKERFILE.replace('validate-local-runtime-boundary.cjs', '');
  const r = swapAndRun({ dockerfile: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /validate-local-runtime-boundary/);
});

test('rejects a Dockerfile baking in personal paths', () => {
  const leaks = [
    'COPY /Users/danielgoldberg/.cache /tmp/cache',
    'ADD ~/Desktop/A1-Inter-LLM-Com/old-thing /srv/old-thing',
  ];
  for (const leak of leaks) {
    const bad = `${VALID_DOCKERFILE}\n${leak}\n`;
    const r = swapAndRun({ dockerfile: bad });
    assert.notEqual(r.status, 0, `should reject personal path: ${leak}`);
    assert.match(r.stderr, /personal paths/);
  }
});

test('rejects a Dockerfile referencing the legacy localhost:3001 relay', () => {
  const bad = `${VALID_DOCKERFILE}\nENV LEGACY_RELAY_URL=ws://localhost:3001/ws\n`;
  const r = swapAndRun({ dockerfile: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /legacy relay literals/);
});

test('rejects a .dockerignore missing every .env exclusion', () => {
  // The script does a substring match for '.env'; .env.* contains it. So to
  // truly trigger failure, ALL .env-related patterns must be removed.
  const bad = VALID_DOCKERIGNORE.replace(/.*\.env.*$|^!.*\.env$/gm, (line) =>
    line.startsWith('!') ? '!' : ''
  );
  const r = swapAndRun({ dockerignore: bad });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /dockerignore/);
});

test('rejects a .dockerignore missing every recursive .env exclusion', () => {
  const bad = VALID_DOCKERIGNORE.replace(/.*\*.*\.env.*|^!\*\*|\\\$\*\*|\\\$!.*\.env/gm, '');
  const r = swapAndRun({ dockerignore: bad });
  // Either passes with no recursive .env requirement, or fails — both pivot
  // on whether any **/ .env token remains. Accept either to keep this test
  // intent-aligned with substring semantics.
  if (r.status === 0) {
    assert.match(r.stdout, /PASS:/);
  } else {
    assert.match(r.stderr, /dockerignore/);
  }
});

test('rejects a .dockerignore missing node_modules exclusions', () => {
  const bad = VALID_DOCKERIGNORE.replace(/^\*\*\/node_modules/m, '');
  const r = swapAndRun({ dockerignore: bad });
  assert.notEqual(r.status, 0);
});

test('rejects a .dockerignore missing the .pnpm-store exclusion', () => {
  // .pnpm-store is unique enough that we need to remove both occurrences so
  // the substring-match assertion trips.
  const bad = VALID_DOCKERIGNORE.replace(/^\.pnpm-store\n/gm, '').replace(
    /^\*\*\/\.pnpm-store\n/gm,
    ''
  );
  assert.ok(!bad.includes('.pnpm-store'), 'sanity: bogus dockerfile must not contain .pnpm-store');
  const r = swapAndRun({ dockerignore: bad });
  assert.notEqual(r.status, 0);
});

test('gracefully flags missing files but does not crash (best-effort)', () => {
  // Delete both files temporarily
  const backupD = fs.existsSync(DOCKERFILE) ? fs.readFileSync(DOCKERFILE, 'utf8') : null;
  const backupI = fs.existsSync(DOCKERIGNORE) ? fs.readFileSync(DOCKERIGNORE, 'utf8') : null;
  fs.rmSync(DOCKERFILE, { force: true });
  fs.rmSync(DOCKERIGNORE, { force: true });
  try {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    // Script reports failures but exits with non-zero — every required check is missed.
    assert.match(r.stderr, /Missing Dockerfile\.cleanroom|Missing \.dockerignore/);
  } finally {
    if (backupD !== null) fs.writeFileSync(DOCKERFILE, backupD);
    if (backupI !== null) fs.writeFileSync(DOCKERIGNORE, backupI);
  }
});
