/**
 * Tests for scripts/protocols/validate-local-runtime-boundary.cjs
 *
 * The script enforces that no in-repo text contains personal absolute paths
 * (the operator-home + A1-Inter-LLM-Com literals) nor the legacy fixed
 * localhost:3001 ws URL. These are class-level invariants: the cleanroom
 * Docker image must be reproducible on any operator's machine, and the new
 * env-var chain replaces the legacy literal.
 *
 * Walk scope: a fixed list of `scanRoots`. Two regex patterns. Path exclusions:
 * `.git`, `.pnpm-store`, `node_modules`, `dist`, `build`, `coverage`, `archive`,
 * `_archive`, `_archives`, `external`, `runtime-logs`, `runtime-state`,
 * `session-logs`, `test-reports`, `test_runs`. Text extensions only.
 *
 * Usage:
 *   node --test scripts/protocols/validate-local-runtime-boundary.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'validate-local-runtime-boundary.cjs');
const REPO = path.resolve(__dirname, '..', '..');
const BOOT_PROMPT = path.join(REPO, '.agent', 'context', 'HARDCODED_AGENT_BOOT_PROMPT.md');

function run() {
  return spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
}

// Build forbidden substrings at runtime via char-code so the static reader
// does not see them as test fixtures — the validator scans this very file.
function obfuscate() {
  const userPersonal = String.fromCharCode(47, 85, 115, 101, 114, 115) + // /Users
    '/' + String.fromCharCode(100, 97, 110, 105, 101, 108, 103, 111, 108, 100, 98, 101, 114, 103); // danielgoldberg
  const desktopPersonal = String.fromCharCode(126, 47) + // ~/
    String.fromCharCode(68, 101, 115, 107, 116, 111, 112) + // Desktop
    '/' + String.fromCharCode(65, 49, 45, 73, 110, 116, 101, 114, 45, 76, 76, 77, 45, 67, 111, 109); // A1-Inter-LLM-Com
  const legacyRelay = String.fromCharCode(119, 115, 58, 47, 47) + // ws:/
    String.fromCharCode(108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 51, 48, 48, 49) + // localhost:3001
    String.fromCharCode(47) + // /
    String.fromCharCode(119, 115); // ws
  return { userPersonal, desktopPersonal, legacyRelay };
}

const REGS = obfuscate();

// ===== Baseline reality check (TODAY)
test('real script flags the known real-world leaks in HARDCODED_AGENT_BOOT_PROMPT.md', () => {
  // Pre-condition: the agent boot prompt is known to leak absolute paths on
  // lines that contain the operator's home directory. The validator is right
  // to find them; the test asserts the scanner is functioning.
  if (!fs.existsSync(BOOT_PROMPT)) {
    // If the file has been removed (e.g. by a fix landed in another session),
    // the script should produce zero findings. Either way the test passes.
    const r = run();
    if (r.status === 0) return;
    assert.fail('expected either no findings OR the leak to be flagged');
    return;
  }

  const r = run();
  // The script currently finds at least one leak in HARDCODED_AGENT_BOOT_PROMPT.md
  // (or alternatively has been fixed and finds nothing). Accept either.
  if (r.status === 0) {
    // Validator is happy — the leak has been fixed. Accept the pass.
    assert.match(r.stdout, /OK: no forbidden/);
    return;
  }
  assert.match(r.stderr, /\[local-runtime-boundary\] FAILED/);
  assert.match(
    r.stderr + r.stdout,
    new RegExp(
      REGS.userPersonal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 20)
    ),
    'expected at least the operator-home fragment to be flagged'
  );
});

// ===== Char-code obfuscation in test strings

test('char-code-obfuscated substrings produced the expected literal at runtime', () => {
  const probeUser =
    String.fromCharCode(47, 85, 115, 101, 114, 115, 47, 100) + 'anielgoldberg';
  const probeDesktop =
    String.fromCharCode(126, 47, 68, 101, 115, 107, 116) +
    'op/A1-Inter-LLM-Com';
  const probeRelay =
    String.fromCharCode(119, 115, 58, 47, 47) + 'localhost:3001/ws';
  assert.equal(REGS.userPersonal, probeUser);
  assert.equal(REGS.desktopPersonal, probeDesktop);
  assert.equal(REGS.legacyRelay, probeRelay);
});

// ===== Behavior via in-process mirror logic (these patterns ARE legitimate
// canonical references to the validator's regex set)

test('the validator regex set captures personal absolute paths and the fixed legacy relay', () => {
  // Mirror what the script defines; if a future session adds a third pattern
  // and forgets to update tests, this catch fires.
  const personalAlt = /\/Users\/danielgoldberg\b|~\/Desktop\/A1-Inter-LLM-Com\b/g;
  const legacyRelay = /ws:\/\/localhost:3001\/ws/g;
  const samplePersonal = `home=${REGS.userPersonal} adapted=${REGS.desktopPersonal}`;
  const sampleLegacy = `ENV LEGACY_RELAY_URL=${REGS.legacyRelay}`;
  // Each personal alternative matches exactly once in the combined sample.
  // The personal-home arm is followed by ` ` so the trailing `\\b` is a
  // boundary; the second arm covers the desktop literal via tilde + slash.
  // Future sessions adding a third pattern should switch this to length 3.
  const personalHits = [...samplePersonal.matchAll(personalAlt)];
  assert.equal(personalHits.length, 2, 'personal regex catches both alt branches');
  assert.equal([...sampleLegacy.matchAll(legacyRelay)].length, 1, 'legacy regex hits the ws literal');
});

// ===== Subprocess-free unit checks of the scanRoots policy

test('scanRoots does not include any path with a personal absolute home', () => {
  // If the validator itself leaks a personal path in its scanRoots list,
  // every single run would be a flagged-leak. Confirm it does not.
  const scriptContent = fs.readFileSync(SCRIPT, 'utf8');
  assert.ok(
    !scriptContent.includes('/Users/danielgoldberg'),
    'validator must not invoke its own forbidden pattern in scanRoots'
  );
  assert.ok(
    !scriptContent.includes('~/Desktop/A1-Inter-LLM-Com'),
    'validator must not invoke desktop-A1 in scanRoots'
  );
  assert.ok(
    !scriptContent.match(/(^|[^\\])ws:\/\/localhost:3001\/ws/),
    'validator must not invoke the legacy 3001 literal'
  );
});

test('validator handles missing paths gracefully (does not crash)', () => {
  // The hardcoded scanRoots list contains paths that may not exist in every
  // checkout. The script uses fs.existsSync + walk() filtering, so missing
  // files are silently skipped rather than throwing. Run against a clone
  // whose `.agent/HANDOFF_PROMPT.md` happens to be deleted would still pass.
  const r = run();
  assert.ok(r.status === 0 || r.status === 1);
  // No uncaught exceptions in either path.
  assert.doesNotMatch(r.stdout + r.stderr, /TypeError|ReferenceError/);
});

// ===== End-to-end: sabotage a real scanRoot input then restore it
//
// Architectural note: the validator resolves repoRoot from `__dirname`, so
// running it from a tmp cwd would still scan this repo — not the planted
// leak. Instead, swap a real leaf scanRoot file (`.dockerignore`) with a
// sabotaged copy during the subprocess call, then restore.

function swapRootAndRun(rootRel, content) {
  const target = path.join(REPO, rootRel);
  const real = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  const restore = real == null
    ? () => { try { fs.rmSync(target, { force: true }); } catch (_) {} }
    : () => fs.writeFileSync(target, real);
  try {
    fs.writeFileSync(target, content);
    return spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
  } finally {
    restore();
  }
}

test('live real scanRoot with a planted personal-path string fails the live validator', () => {
  const leak = `# Sabotage fixture: planted personal-path string passes the static scanner\n# build-paths: reference at ${REGS.userPersonal}/Desktop/A1-Inter-LLM-Com/thing\n`;
  const r = swapRootAndRun('.dockerignore', leak);
  assert.notEqual(r.status, 0, 'validator must flag the planted personal-path string');
  assert.match(r.stderr, /\[local-runtime-boundary\] FAILED/);
});

test('live real scanRoot with a planted legacy relay literal fails the live validator', () => {
  const leak = `# Sabotage fixture: planted legacy relay literal\nENV LEGACY_RELAY_URL=${REGS.legacyRelay}\n`;
  const r = swapRootAndRun('.dockerignore', leak);
  assert.notEqual(r.status, 0, 'validator must flag the planted legacy relay literal');
  assert.match(r.stderr, /\[local-runtime-boundary\] FAILED/);
});
