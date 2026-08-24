#!/usr/bin/env node

// Issue #176 — CLI mode of the shared TNF single-instance guard.
// Verifies atomic acquire, mutual exclusion across concurrent acquirers,
// owner-scoped release, and stale takeover. Locks go to a temp dir so host
// state under ~/.tnf/locks is never touched.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const GUARD = path.join(__dirname, '..', 'lib', 'tnf-single-instance-guard.cjs');

function tmpLocksDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-guard-test-'));
}

function runGuard(args, env = {}) {
  const result = spawnSync(process.execPath, [GUARD, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  let payload = null;
  try {
    payload = JSON.parse((result.stdout || '').trim().split('\n').pop() || 'null');
  } catch {}
  return { status: result.status, payload };
}

test('acquire succeeds then mutual-excludes a second acquirer', () => {
  const locksDir = tmpLocksDir();
  const first = runGuard(['acquire', '--lock-name', 't1', '--locks-dir', locksDir]);
  assert.equal(first.status, 0);
  assert.equal(first.payload.acquired, true);

  const second = runGuard(['acquire', '--lock-name', 't1', '--locks-dir', locksDir]);
  assert.equal(second.status, 1);
  assert.equal(second.payload.acquired, false);

  runGuard(['release', '--lock-name', 't1', '--locks-dir', locksDir]);
});

test('release by non-owner pid refuses; release by owner pid clears lock', () => {
  const locksDir = tmpLocksDir();
  const shellPid = process.pid + 100000; // not a real holder
  const acquired = runGuard([
    'acquire', '--lock-name', 't2', '--locks-dir', locksDir, '--pid', String(shellPid),
  ]);
  assert.equal(acquired.status, 0);
  assert.equal(acquired.payload.owner.pid, shellPid, 'owner pid honors --pid');

  const wrongRelease = runGuard([
    'release', '--lock-name', 't2', '--locks-dir', locksDir, '--pid', String(shellPid + 1),
  ]);
  assert.equal(wrongRelease.status, 1);
  assert.equal(wrongRelease.payload.released, false);
  assert.equal(wrongRelease.payload.reason, 'pid-mismatch');

  // Wrong-pid release must NOT clear the lock.
  const stillHeld = runGuard(['check', '--lock-name', 't2', '--locks-dir', locksDir]);
  assert.equal(stillHeld.payload.held, true);

  const rightRelease = runGuard([
    'release', '--lock-name', 't2', '--locks-dir', locksDir, '--pid', String(shellPid),
  ]);
  assert.equal(rightRelease.status, 0);
  assert.equal(rightRelease.payload.released, true);

  const gone = runGuard(['check', '--lock-name', 't2', '--locks-dir', locksDir]);
  assert.equal(gone.payload.held, false);
});

test('concurrent acquirers: exactly one wins (mkdir atomicity)', async () => {
  const locksDir = tmpLocksDir();

  // Sequential: helper defaults to owner = invoking shell (this live test
  // process), so later acquirers see a LIVE owner and must lose.
  const procs = [];
  for (let i = 0; i < 3; i += 1) {
    procs.push(spawnSync(process.execPath, [
      GUARD, 'acquire', '--lock-name', 'seq', '--locks-dir', locksDir,
    ], { encoding: 'utf8' }));
  }
  const seqWinners = procs.filter(
    (p) => p.status === 0 && /"acquired":true/.test(p.stdout || '')
  );
  assert.equal(seqWinners.length, 1, 'live-owner lock excludes later acquirers');
  fs.rmSync(path.join(locksDir, 'seq.lock'), { recursive: true, force: true });

  // True simultaneity: launch six acquires at once; atomic mkdir admits one.
  const collected = Array.from({ length: 6 }, () =>
    new Promise((resolve) => {
      const child = spawn(process.execPath, [
        GUARD, 'acquire', '--lock-name', 'race2', '--locks-dir', locksDir,
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      child.stdout.on('data', (d) => { out += d; });
      child.on('exit', (code) => resolve({ code, out }));
    })
  );
  const entries = await Promise.all(collected);
  const acquiredCount = entries.filter(
    (e) => e.code === 0 && /"acquired":true/.test(e.out)
  ).length;
  assert.equal(acquiredCount, 1, 'exactly one simultaneous acquirer wins');
  for (const entry of entries) {
    if (!/"acquired":true/.test(entry.out)) {
      assert.equal(entry.code, 1, 'loser exits 1 with acquired:false');
    }
  }
  fs.rmSync(path.join(locksDir, 'race2.lock'), { recursive: true, force: true });
});

test('stale takeover: dead-owner lock is recoverable', () => {
  const locksDir = tmpLocksDir();
  const deadPid = 4000000 + Math.floor(Math.random() * 100000); // almost surely unused
  const acquired = runGuard([
    'acquire', '--lock-name', 'stale', '--locks-dir', locksDir,
    '--pid', String(deadPid), '--stale-ms', '60000',
  ]);
  assert.equal(acquired.status, 0);

  // Owner is dead -> next acquire recovers even inside the stale window.
  const takeover = runGuard([
    'acquire', '--lock-name', 'stale', '--locks-dir', locksDir,
    '--pid', String(deadPid + 1),
  ]);
  assert.equal(takeover.status, 0);
  assert.equal(takeover.payload.acquired, true);
  assert.equal(takeover.payload.recovered, true, 'dead-owner lock recovered');
});
