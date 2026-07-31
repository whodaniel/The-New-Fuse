#!/usr/bin/env node
/**
 * lint-staged with one retry — parallel agents on this branch often race the
 * git index while lint-staged stashes/restores, producing:
 *   "lint-staged failed due to a git error"
 * A short backoff + second attempt clears transient index.lock / stash races
 * without skipping the hook.
 */
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const args = ['lint-staged', '-c', '.lintstagedrc.js', ...process.argv.slice(2)];

function run() {
  return spawnSync('pnpm', ['exec', ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

let result = run();
if (result.status === 0) process.exit(0);

console.error('\n[lint-staged-retry] first attempt failed; waiting 2s and retrying once…\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
result = run();
process.exit(result.status === null ? 1 : result.status);
