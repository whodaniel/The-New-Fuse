#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  buildBlock,
  applyBlock,
  classify,
  isClaudeTarget,
  resolveCanonicalRepoRoot,
  TARGETS,
} = require('./install-agent-frontload.cjs');

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
test('zcode is a managed global target on the ZCode user instruction file', () => {
  const zcode = TARGETS.find((t) => t.id === 'zcode');
  assert.ok(zcode, 'zcode target registered in TARGETS');
  assert.equal(zcode.scope, 'global');
  assert.ok(zcode.contextFile.endsWith(path.join('.zcode', 'AGENTS.md')), zcode.contextFile);
});
test('zcode surface classifies through the standard managed lifecycle', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-zcode-'));
  const target = { id: 'zcode', runtime: 'ZCode', scope: 'global', contextFile: path.join(dir, 'AGENTS.md'), dirHint: dir };
  // Runtime home exists but instruction file does not yet: first materialization
  // must go through --include-unverified, then verify/repair manage it normally.
  assert.equal(classify(target).state, 'unverified');
  fs.writeFileSync(target.contextFile, applyBlock('', buildBlock('/repo')));
  assert.equal(classify(target).state, 'managed-current');
});
test('linked worktrees resolve global frontloads through the canonical checkout', () => {
  assert.equal(
    resolveCanonicalRepoRoot('/repo/worktrees/rc-candidate', '/repo/The-New-Fuse/.git'),
    '/repo/The-New-Fuse',
  );
  assert.equal(resolveCanonicalRepoRoot('/repo/The-New-Fuse', '.git'), '/repo/The-New-Fuse');
});
test('Claude Code can be selected as a standalone repair target', () => {
  assert.equal(isClaudeTarget(new Set(['claude'])), true);
  assert.equal(isClaudeTarget(new Set(['claude.sessionstart'])), true);
  assert.equal(isClaudeTarget(new Set(['codex'])), false);
});
