#!/usr/bin/env node
'use strict';

/**
 * 12 fail_closed_vs_advisory_unenlisted_host
 *
 * SUBJECT_UNDER_TEST: scripts/install-agent-frontload.cjs (classify)
 * INVARIANT: Missing optional/unenlisted host context is advisory skip
 *            (unverified without --include-unverified), not a TNF-wide failure.
 *            Absent runtime dir is absent/skip ok.
 * SETUP: Synthetic target objects (no real HOME mutation).
 * ACTION_BY_REAL_SUBJECT: classify(target)
 * PASS_PREDICATE: unverified/absent states as defined by production classify.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { classify } = require('../../../scripts/install-agent-frontload.cjs');

test('12 fail_closed_vs_advisory — absent host is skip-ok classification', () => {
  const missingDir = path.join(os.tmpdir(), `tnf-hlc-absent-${process.pid}-${Date.now()}`);
  const target = {
    id: 'ghost',
    runtime: 'Ghost',
    scope: 'global',
    contextFile: path.join(missingDir, 'AGENTS.md'),
    dirHint: missingDir,
  };
  const c = classify(target);
  assert.equal(c.state, 'absent');
  assert.equal(c.fileExists, false);
  assert.equal(c.dirExists, false);
});

test('12b unverified host dir without context file is advisory-class unverified', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-hlc-unverified-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = {
    id: 'partial',
    runtime: 'Partial',
    scope: 'global',
    contextFile: path.join(dir, 'AGENTS.md'),
    dirHint: dir,
  };
  const c = classify(target);
  assert.equal(c.state, 'unverified');
  assert.equal(c.dirExists, true);
  assert.equal(c.fileExists, false);
});
