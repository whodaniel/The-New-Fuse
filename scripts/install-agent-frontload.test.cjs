#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const test = require('node:test');
const { buildBlock, applyBlock } = require('./install-agent-frontload.cjs');

test('managed host block routes through canonical tnf:onboard, not legacy onboarder', () => {
  const block = buildBlock('/repo');
  assert.match(block, /pnpm run tnf:onboard/);
  assert.doesNotMatch(block, /tnf-onboard\.cjs/);
  assert.match(block, /FRONTLOAD_MANIFEST/);
});
test('fenced update preserves operator text outside managed block', () => {
  const first = buildBlock('/old');
  const existing = `${first}\n\noperator text\n`;
  const next = applyBlock(existing, buildBlock('/new'));
  assert.match(next, /operator text/);
  assert.match(next, /\/new/);
  assert.doesNotMatch(next, /\/old/);
});
