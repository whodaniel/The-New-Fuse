#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const script = path.join(__dirname, 'check-workspace-lease.cjs');
const { matchPath, activeLeases, isExpired, acquireLeases } = require(script);

test('matchPath handles exact paths, directory prefixes and globs', () => {
  assert.strictEqual(matchPath('apps/frontend/src/App.tsx', 'apps/frontend/src/App.tsx'), true);
  assert.strictEqual(matchPath('apps/frontend', 'apps/frontend/src/App.tsx'), true, 'bare dir matches everything under it');
  assert.strictEqual(matchPath('apps/frontend', 'apps/api/src/index.ts'), false);
  assert.strictEqual(matchPath('apps/**', 'apps/frontend/src/App.tsx'), true);
  assert.strictEqual(matchPath('apps/**', 'packages/tnf-cli/src/cli.ts'), false);
  assert.strictEqual(matchPath('**/*.test.cjs', 'scripts/harness/foo.test.cjs'), true);
  assert.strictEqual(matchPath('**/*.test.cjs', 'scripts/harness/foo.cjs'), false);
  assert.strictEqual(matchPath('apps/*/src/*.ts', 'apps/frontend/src/index.ts'), true);
  assert.strictEqual(matchPath('apps/*/src/*.ts', 'apps/frontend/src/nested/index.ts'), false, '* does not cross segments');
});

test('expired and malformed leases are inert', () => {
  const now = Date.parse('2026-09-05T12:00:00.000Z');
  assert.strictEqual(isExpired({ acquiredAt: '2026-09-05T10:00:00.000Z', ttlMinutes: 60 }, now), true, '1h TTL expired 1h ago');
  assert.strictEqual(isExpired({ acquiredAt: '2026-09-05T11:30:00.000Z', ttlMinutes: 60 }, now), false, 'still inside TTL');
  assert.strictEqual(isExpired({ acquiredAt: 'garbage' }, now), true, 'malformed acquiredAt claims nothing');
  const active = activeLeases(
    [
      { agent: 'codex', acquiredAt: '2026-09-05T11:30:00.000Z', ttlMinutes: 60 },
      { agent: 'claude', acquiredAt: '2026-09-05T08:00:00.000Z', ttlMinutes: 60 },
      { agent: 'pi', acquiredAt: 'nonsense' },
    ],
    now,
  );
  assert.deepStrictEqual(active.map((l) => l.agent), ['codex']);
});

test('live run: empty lease registry means zero violations and exit 0', () => {
  const leaseFile = JSON.parse(fs.readFileSync(path.join(root, 'docs/protocols/workspace-leases.json'), 'utf8'));
  assert.ok(Array.isArray(leaseFile.leases), 'lease registry must keep a leases array');
  const out = execFileSync(process.execPath, [script, '--json'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  const parsed = JSON.parse(out);
  assert.strictEqual(parsed.violations.length, 0, 'with no declared leases nothing can violate');
  assert.strictEqual(typeof parsed.dirtyCount, 'number');
});

test('overlap with a foreign active lease is reported; own lease never violates', () => {
  const tmpRoot = fs.mkdtempSync('/tmp/tnf-lease-test-');
  fs.mkdirSync(path.join(tmpRoot, 'docs', 'protocols'), { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, 'docs', 'protocols', 'agent-workspace-policy.json'), '{}\n'); // repo-root marker for discovery
  fs.writeFileSync(path.join(tmpRoot, 'dirty.ts'), 'x\n');
  execFileSync('git', ['init', '-q'], { cwd: tmpRoot });
  execFileSync('git', ['add', 'dirty.ts'], { cwd: tmpRoot });
  const leaseFile = path.join(tmpRoot, 'leases.json');
  const selfLeaseFile = path.join(tmpRoot, 'leases-self.json');
  const now = new Date().toISOString();
  fs.writeFileSync(leaseFile, JSON.stringify({
    schemaVersion: 1,
    leases: [
      { agent: 'codex', task: 'terminal work', paths: ['**'], acquiredAt: now, ttlMinutes: 240 },
      { agent: 'danielgoldberg', task: 'mine', paths: ['**'], acquiredAt: now, ttlMinutes: 240 },
    ],
  }, null, 2));
  fs.writeFileSync(selfLeaseFile, JSON.stringify({
    schemaVersion: 1,
    leases: [{ agent: 'danielgoldberg', task: 'mine', paths: ['**'], acquiredAt: now, ttlMinutes: 240 }],
  }, null, 2));
  const foreign = spawnSync(process.execPath, [script, '--json', '--agent', 'danielgoldberg', '--lease-file', leaseFile], { cwd: tmpRoot, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(foreign.status, 0, 'advisory mode exits 0 even on violation');
  const foreignParsed = JSON.parse(foreign.stdout);
  assert.strictEqual(foreignParsed.violations.length, 1, 'codex lease must flag the dirty set');
  assert.strictEqual(foreignParsed.violations[0].agent, 'codex');

  const self = spawnSync(process.execPath, [script, '--json', '--agent', 'danielgoldberg', '--lease-file', selfLeaseFile], { cwd: tmpRoot, encoding: 'utf8', timeout: 30000 });
  const selfParsed = JSON.parse(self.stdout);
  assert.strictEqual(selfParsed.violations.length, 0, 'own lease must never violate against you');

  const enforced = spawnSync(process.execPath, [script, '--json', '--enforce', '--agent', 'danielgoldberg', '--lease-file', leaseFile], { cwd: tmpRoot, encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(enforced.status, 1, 'enforce mode exits 1 on foreign overlap');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('acquireLeases dedupes identical claims per agent and refreshes the row', () => {
  const tmpRoot = fs.mkdtempSync('/tmp/tnf-lease-acquire-');
  const leaseFile = path.join(tmpRoot, 'leases.json');
  const t0 = Date.parse('2026-09-05T12:00:00.000Z');
  const t1 = Date.parse('2026-09-05T12:30:00.000Z');
  const paths = ['apps/frontend/src', 'docs/protocols/LIVING_STATE.md'];

  acquireLeases(tmpRoot, { leaseFile, agent: 'pi', task: 'first', paths, ttlMinutes: 60 }, t0);
  const refreshed = acquireLeases(tmpRoot, { leaseFile, agent: 'pi', task: 'refresh', paths, ttlMinutes: 90 }, t1);
  let parsed = JSON.parse(fs.readFileSync(leaseFile, 'utf8'));
  const piRows = parsed.leases.filter((l) => l.agent === 'pi');
  assert.strictEqual(piRows.length, 1, 'identical re-claim must replace, not duplicate');
  assert.strictEqual(piRows[0].task, 'refresh', 're-claim overwrites task');
  assert.strictEqual(piRows[0].ttlMinutes, 90, 're-claim overwrites TTL');
  assert.strictEqual(piRows[0].acquiredAt, new Date(t1).toISOString(), 're-claim refreshes acquiredAt');
  assert.deepStrictEqual([...piRows[0].paths].sort(), [...paths].sort());
  assert.strictEqual(refreshed.agent, 'pi');

  // Same scope claimed with paths in a different order is still the same claim.
  acquireLeases(tmpRoot, { leaseFile, agent: 'pi', paths: [...paths].reverse(), ttlMinutes: 30 }, t1);
  parsed = JSON.parse(fs.readFileSync(leaseFile, 'utf8'));
  assert.strictEqual(parsed.leases.filter((l) => l.agent === 'pi').length, 1, 'order-insensitive dedupe');

  // A different agent claiming the same scope is a distinct lease.
  acquireLeases(tmpRoot, { leaseFile, agent: 'codex', paths, ttlMinutes: 30 }, t1);
  parsed = JSON.parse(fs.readFileSync(leaseFile, 'utf8'));
  assert.strictEqual(parsed.leases.length, 2, 'foreign agent over same scope is a separate row');
  assert.strictEqual(parsed.schemaVersion, 1);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
