#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const script = path.join(__dirname, 'resolve-workspace-tier.cjs');
const { classifyFromDescription } = require(script);
const policy = JSON.parse(fs.readFileSync(path.join(root, 'docs/protocols/agent-workspace-policy.json'), 'utf8'));

test('classifyFromDescription covers every task class the policy declares', () => {
  const samples = {
    analysis: 'audit the relay logs and report',
    edit: 'fix the typo in the sidebar label',
    refactor: 'refactor the whole terminal subsystem across many files',
    'large-refactor': 'rewrite the auth subsystem',
    'release-build': 'cut the release build and tag it',
    'branch-maintenance': 'reconcile the branch list across remotes',
    'history-rewrite': 'force-push a rewritten feature branch history',
    'dependency-upgrade': 'upgrade all dependencies to latest',
  };
  for (const [expected, description] of Object.entries(samples)) {
    assert.strictEqual(classifyFromDescription(description), expected, `classify("${description}")`);
  }
});

test('every byTaskClass entry maps to a declared tier', () => {
  const tierNames = new Set(Object.keys(policy.tiers));
  for (const [taskClass, tier] of Object.entries(policy.byTaskClass)) {
    assert.ok(tierNames.has(tier), `byTaskClass.${taskClass} -> unknown tier "${tier}"`);
  }
});

test('resolver is task-aware and reports real fields (no phantom EnterWorktree guidance)', () => {
  const run = spawnSync(process.execPath, [script, '--describe', 'rewrite the auth subsystem', '--json'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(run.status, 0);
  const parsed = JSON.parse(run.stdout);
  assert.strictEqual(parsed.taskClass, 'large-refactor');
  assert.strictEqual(parsed.tier, 'worktree');
  assert.ok(parsed.guidance.includes('resolve-workspace-tier.cjs --describe'), 'guidance should point at the real provision command');
  assert.ok(!/EnterWorktree/.test(run.stdout), 'EnterWorktree is a phantom reference and must not reappear');
});

test('--provision without task context exits 2 with usage guidance', () => {
  const run = spawnSync(process.execPath, [script, '--provision', '--json'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(run.status, 2);
  assert.match(run.stderr, /--provision needs the task context/);
});

test('--provision is a no-op for shared tiers', () => {
  const run = spawnSync(process.execPath, [script, '--describe', 'fix the typo in the sidebar label', '--provision', '--json'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(run.status, 0);
  const parsed = JSON.parse(run.stdout);
  assert.strictEqual(parsed.provision.attempted, false);
  assert.match(parsed.provision.reason, /does not require an isolated workspace/);
  assert.ok(!fs.existsSync(path.join(root, '.tnf', 'worktrees')) || fs.readdirSync(path.join(root, '.tnf', 'worktrees')).every((n) => n !== 'agent-edit'));
});

test('unknown task class fails open with the known-classes list', () => {
  const run = spawnSync(process.execPath, [script, '--task-class', 'nonexistent'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(run.status, 0, 'unknown class must fail open, not block');
  assert.match(run.stderr, /known task classes/);
});
