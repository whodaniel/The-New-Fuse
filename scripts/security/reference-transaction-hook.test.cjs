#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');
const HOOK = path.join(ROOT, '.husky', 'reference-transaction');

function runHook(env = {}) {
  return spawnSync('/bin/sh', [HOOK, 'prepared'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function fakeNode(exitCode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-hook-node-'));
  const file = path.join(dir, 'node');
  fs.writeFileSync(file, `#!/bin/sh\nexit ${exitCode}\n`, 'utf8');
  fs.chmodSync(file, 0o755);
  return { dir, file };
}

test('reference-transaction fails open when configured Node is unavailable', () => {
  const missing = path.join(os.tmpdir(), `tnf-node-missing-${process.pid}-${Date.now()}`);
  const result = runHook({ TNF_NODE_BIN: missing });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /node unavailable in hook environment; allowing ref transaction/);
});

test('reference-transaction preserves a deliberate guard block', (t) => {
  const fake = fakeNode(1);
  t.after(() => fs.rmSync(fake.dir, { recursive: true, force: true }));
  const result = runHook({ TNF_NODE_BIN: fake.file });
  assert.equal(result.status, 1);
});

test('reference-transaction preserves guard success', (t) => {
  const fake = fakeNode(0);
  t.after(() => fs.rmSync(fake.dir, { recursive: true, force: true }));
  const result = runHook({ TNF_NODE_BIN: fake.file });
  assert.equal(result.status, 0, result.stderr);
});
