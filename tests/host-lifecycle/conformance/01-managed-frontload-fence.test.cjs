#!/usr/bin/env node
'use strict';

/**
 * 01 managed_frontload_fence_restore
 *
 * SUBJECT_UNDER_TEST: scripts/install-agent-frontload.cjs (buildBlock + applyBlock)
 * INVARIANT: Corrupting the managed TNF-FRONTLOAD fence, then invoking production
 *            applyBlock(buildBlock(repoRoot)), restores managed content while preserving
 *            operator text outside the fence.
 * SETUP: Disposable context file with operator head/tail + managed block.
 * ACTION_BY_REAL_SUBJECT: applyBlock(corrupted, buildBlock(repoRoot))
 * OBSERVED_EFFECT: Managed block matches buildBlock output; operator text intact.
 * PASS_PREDICATE: restored includes VERSION + tnf:onboard; head/tail preserved;
 *                 harness did not write the restored file via cp of a backup.
 * EVIDENCE: before/after hashes of managed block region.
 * TEST_HARNESS_DOES_NOT_SELF_SATISFY_INVARIANT: harness only corrupts; restore via applyBlock.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildBlock,
  applyBlock,
  VERSION,
} = require('../../../scripts/install-agent-frontload.cjs');

const BEGIN = '<!-- TNF-FRONTLOAD:BEGIN';
const END = '<!-- TNF-FRONTLOAD:END -->';

function sha16(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

test('01 managed_frontload_fence_restore — production applyBlock restores fence', () => {
  const repoRoot = '/tmp/tnf-conformance-repo-root';
  const operatorHead = '# Operator owned head\nkeep-me-head\n\n';
  const operatorTail = '\n\n# Operator owned tail\nkeep-me-tail\n';
  const originalBlock = buildBlock(repoRoot);
  const original = `${operatorHead}${originalBlock}${operatorTail}`;
  const originalBlockHash = sha16(originalBlock);

  // SETUP: corrupt only the managed region (simulate vendor overwrite of fence interior)
  const corruptedInterior = `${BEGIN} — managed by scripts/install-agent-frontload.cjs; edits inside are overwritten -->\n<!-- CORRUPTED -->\n# VENDOR OVERWRITE\n${END}`;
  const corrupted = `${operatorHead}${corruptedInterior}${operatorTail}`;
  assert.notEqual(sha16(corruptedInterior), originalBlockHash, 'corruption must change managed bytes');

  // ACTION_BY_REAL_SUBJECT — not harness shutil/cp restore
  const restored = applyBlock(corrupted, buildBlock(repoRoot));

  // OBSERVED_EFFECT / PASS_PREDICATE
  assert.match(restored, /keep-me-head/, 'operator head must survive');
  assert.match(restored, /keep-me-tail/, 'operator tail must survive');
  assert.match(restored, new RegExp(VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(restored, /pnpm run tnf:onboard/);
  assert.doesNotMatch(restored, /VENDOR OVERWRITE/);
  assert.equal(restored.includes(operatorHead), true);
  assert.equal(restored.includes(operatorTail), true);

  const start = restored.indexOf(BEGIN);
  const end = restored.indexOf(END) + END.length;
  const restoredBlock = restored.slice(start, end);
  assert.equal(sha16(restoredBlock), sha16(buildBlock(repoRoot)));

  // Idempotent second apply by subject
  const again = applyBlock(restored, buildBlock(repoRoot));
  assert.equal(again, restored);

  // Evidence marker (no secret content)
  assert.ok(originalBlockHash);
  assert.ok(sha16(restoredBlock));
});

test('01b TEST_HARNESS_DOES_NOT_SELF_SATISFY — restore path is applyBlock export', () => {
  const src = fs.readFileSync(path.join(__dirname, '01-managed-frontload-fence.test.cjs'), 'utf8');
  assert.match(src, /applyBlock\(/);
  assert.doesNotMatch(src, /shutil\.copy|fs\.copyFileSync\([^)]*backup/);
  assert.match(src, /ACTION_BY_REAL_SUBJECT/);
});
