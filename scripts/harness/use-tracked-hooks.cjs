#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Point git at the TRACKED .husky/ hook directory and prove the chain is live.
 *
 * Why this exists (proven 2026-09-06, twice in one day): husky wires
 * core.hooksPath to .husky/_ — a GENERATED, gitignored directory that only
 * exists in checkouts where someone ran `husky`. Git silently skips ALL hooks
 * when the hooksPath directory is missing, so fresh `git worktree add`
 * checkouts committed and pushed with zero gates until someone remembered to
 * run `npx husky`. Two commits landed ungated exactly that way before the gap
 * was noticed (see
 * docs/protocols/reports/SELF-IMPROVEMENT-COMPONENT-TRIAGE-2026-09-06.md,
 * addendum).
 *
 * The fix is structural: every tracked hook in .husky/ is self-contained (the
 * _/husky.sh shim is a deprecation echo, nothing more), so core.hooksPath
 * points at tracked files that exist in every checkout of the repo. No
 * generation step, no silent skip. This script (run from `prepare`) enforces
 * the wiring and fails loudly — never silently — if anything is off.
 *
 * Fix command when this fails: git config core.hooksPath .husky
 */
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const HOOKS = [
  'pre-commit',
  'pre-push',
  'commit-msg',
  'post-commit',
  'post-checkout',
  'reference-transaction',
];

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

let failed = false;

try {
  git(['config', 'core.hooksPath', '.husky']);
} catch (error) {
  console.error(`[tracked-hooks] FAIL-CLOSED: could not set core.hooksPath: ${error.message}`);
  process.exit(1);
}

for (const hook of HOOKS) {
  const file = path.join(root, '.husky', hook);
  if (!fs.existsSync(file)) {
    console.error(`[tracked-hooks] FAIL-CLOSED: missing hook .husky/${hook}`);
    failed = true;
    continue;
  }
  try {
    fs.accessSync(file, fs.constants.X_OK);
  } catch {
    console.error(
      `[tracked-hooks] FAIL-CLOSED: .husky/${hook} is not executable — git skips it silently. Fix: chmod +x .husky/${hook}`
    );
    failed = true;
  }
  try {
    execFileSync('sh', ['-n', file]);
  } catch (error) {
    console.error(`[tracked-hooks] FAIL-CLOSED: .husky/${hook} has a syntax error: ${error.message}`);
    failed = true;
  }
}

const wired = git(['config', 'core.hooksPath']);
if (wired !== '.husky') {
  console.error(
    `[tracked-hooks] FAIL-CLOSED: core.hooksPath='${wired}' — expected '.husky'. Fix: git config core.hooksPath .husky`
  );
  failed = true;
}

if (failed) process.exit(1);
console.log(
  `[tracked-hooks] OK: core.hooksPath=.husky (tracked, generation-free); ${HOOKS.length} hooks present, executable, syntax-clean`
);
