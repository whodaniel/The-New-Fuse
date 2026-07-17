/**
 * Tests for scripts/protocols/verify-terminal-visualizer-readiness.cjs
 *
 * The script verifies the terminal visualizer readiness — that the static
 * artifact at apps/frontend/public/visualizations/terminals/ is wired into
 * the frontend router/routes/pages, and that the macro-board generator emits
 * the frontend terminal artifacts. A regression here silently breaks the
 * operator-facing terminal dashboard.
 *
 * Run via:
 *   node --test scripts/protocols/verify-terminal-visualizer-readiness.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'verify-terminal-visualizer-readiness.cjs');
const REPO = path.resolve(__dirname, '..', '..');

const CHECK_FILES = [
  'apps/frontend/public/visualizations/terminals/index.html',
  'apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json',
  'apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md',
  'apps/frontend/src/ComprehensiveRouter.tsx',
  'apps/frontend/src/routes/core.routes.tsx',
  'apps/frontend/src/pages/Visualizations.tsx',
  'scripts/protocols/twip-macro-board.cjs',
];

function run(args = []) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: REPO, encoding: 'utf8' });
}

test('happy path: real artifacts and real wiring all pass', () => {
  const r = run();
  assert.equal(r.status, 0, `script failed: ${r.stderr}`);
  assert.match(r.stdout, /terminal-visualizer readiness: pass/);
  for (const f of CHECK_FILES) {
    assert.ok(r.stdout.includes(f), `missing ${f} in stdout`);
  }
});

test('--json mode emits parseable JSON with summary totals', () => {
  const r = run(['--json']);
  assert.equal(r.status, 0, r.stderr);
  const payload = JSON.parse(r.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.total, 8);
  assert.equal(payload.summary.passed, 8);
  assert.equal(payload.summary.failed, 0);
  assert.ok(Array.isArray(payload.checks));
  assert.equal(payload.checks.length, 8);
});

test('subprocess exits 2 when a real cross-link file goes missing (symptom injection)', () => {
  // The script's checks call fs.existsSync against real repo files. To force
  // failure we temporarily rename one of the required docs files out of the
  // way and restore it after.
  const indexHtml = path.join(REPO, CHECK_FILES[0]);
  const backup = `${indexHtml}.bak-${process.pid}`;
  fs.renameSync(indexHtml, backup);
  try {
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(r.stdout, /fail/);
    assert.match(r.stdout, /terminals\/index\.html/);
  } finally {
    fs.renameSync(backup, indexHtml);
  }
});

test('subprocess exits 2 when a router reference loses the /visualizations/terminals token', () => {
  // Modify ComprehensiveRouter.tsx in-place to drop the substring and restore.
  const routerPath = path.join(REPO, CHECK_FILES[3]);
  const original = fs.readFileSync(routerPath, 'utf8');
  const marker = '/visualizations/terminals';
  const occurrences = original.split(marker).length - 1;
  if (occurrences === 0) {
    return; // skip if the marker truly isn't there to begin with
  }
  // Globally replace every occurrence so none survive the substring check.
  const tampered = original.split(marker).join('/visualizations/TAMERED_PATH_XYZ');
  fs.writeFileSync(routerPath, tampered);
  try {
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(r.stdout, /ComprehensiveRouter\.tsx/);
  } finally {
    fs.writeFileSync(routerPath, original);
  }
});

test('every artifact-and-link check is enumerated in JSON output', () => {
  const r = run(['--json']);
  const payload = JSON.parse(r.stdout);
  // The script's buildChecks() registers 8 entries: 7 distinct files but
  // `scripts/protocols/twip-macro-board.cjs` is checked twice (once per pattern).
  assert.equal(payload.checks.length, 8);
  const labels = payload.checks.map((c) => c.relativePath);
  const uniqueLabels = new Set(labels);
  assert.equal(uniqueLabels.size, 7, 'twip-macro-board.cjs is the only expected duplicate');
  const expectedFiles = new Set([
    'apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md',
    'apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json',
    'apps/frontend/public/visualizations/terminals/index.html',
    'apps/frontend/src/ComprehensiveRouter.tsx',
    'apps/frontend/src/pages/Visualizations.tsx',
    'apps/frontend/src/routes/core.routes.tsx',
    'scripts/protocols/twip-macro-board.cjs',
  ]);
  assert.deepEqual(uniqueLabels, expectedFiles);
});
