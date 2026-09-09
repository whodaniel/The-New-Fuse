#!/usr/bin/env node
'use strict';
/**
 * Tests for scripts/protocols/sweep-source-gate.cjs — pure classification +
 * violation logic. The git-layer parts (hook wiring, staged-path collection)
 * are exercised by committing; these tests pin the rules.
 */
const assert = require('node:assert');
const { classifySweep, sweepViolations, SOURCE_PATTERNS } = require('./sweep-source-gate.cjs');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${passed} - ${name}`);
}

test('classifySweep: message starting with sweep: is a sweep', () => {
  assert.strictEqual(classifySweep('sweep: terminal board data (3 files)\n\n- a.md: x\n'), true);
});

test('classifySweep: normal commit messages are not sweeps', () => {
  assert.strictEqual(classifySweep('feat(harness): land rollout\n\nbody mentions sweep: nowhere at start\n'), false);
  assert.strictEqual(classifySweep(''), false);
  assert.strictEqual(classifySweep(null), false);
});

test('classifySweep: "sweep:" only counts at line start (subject line)', () => {
  assert.strictEqual(classifySweep('chore: x\n\nsee sweep: discussion below\n'), false);
});

test('sweepViolations: catches source trees and script extensions', () => {
  const hits = sweepViolations([
    'packages/tnf-cli/src/cli.ts',
    'packages/shared/src/index.ts',
    'scripts/harness/check-workspace-lease.cjs',
    'apps/frontend/src/App.tsx',
    '.husky/pre-commit',
    'lib/thing.sh',
  ]);
  assert.deepStrictEqual(hits.sort(), [
    '.husky/pre-commit',
    'apps/frontend/src/App.tsx',
    'lib/thing.sh',
    'packages/shared/src/index.ts',
    'packages/tnf-cli/src/cli.ts',
    'scripts/harness/check-workspace-lease.cjs',
  ]);
});

test('sweepViolations: allows the legitimate sweep payload (data/docs/reports)', () => {
  const hits = sweepViolations([
    'apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md',
    'data/harness/ANOMALY_PAYLOAD.md',
    'data/harness/active-sieve-manifest.json',
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
    'docs/protocols/lessons/INDEX.md',
  ]);
  assert.deepStrictEqual(hits, []);
});

test('sweepViolations: empty and null input are clean', () => {
  assert.deepStrictEqual(sweepViolations([]), []);
  assert.deepStrictEqual(sweepViolations(null), []);
});

test('SOURCE_PATTERNS: pattern set covers the heartbeat rule exactly', () => {
  for (const p of ['packages/**/src/**', 'apps/**/src/**', 'scripts/**', '.husky/**']) {
    assert.ok(SOURCE_PATTERNS.includes(p), `missing ${p}`);
  }
});

console.log(`\n# tests ${passed}\n# pass ${passed}\n# fail 0`);
