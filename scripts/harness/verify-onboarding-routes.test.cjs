#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'data/harness/onboarding-contract.json'), 'utf8'));

test('required onboarding task routes resolve to repository files', () => {
  for (const route of contract.taskRoutes || []) {
    for (const rel of route.load || []) {
      assert.ok(fs.existsSync(path.join(root, rel)), `${rel} should exist`);
    }
  }
});

test('onboarding authority pointers resolve', () => {
  assert.ok(fs.existsSync(path.join(root, contract.authority.turnZero)));
  assert.ok(fs.existsSync(path.join(root, contract.authority.frontloadManifest)));
});

test('standard entrypoint is canonical tnf:onboard', () => {
  assert.strictEqual(contract.standardEntryPoint, 'pnpm run tnf:onboard');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts['tnf:onboard']);
});
