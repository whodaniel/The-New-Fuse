#!/usr/bin/env node
/**
 * Proves `worktreeHygiene` actually detects the states it claims to.
 *
 * A hygiene scan that reports "0 hazards" on a healthy fleet has demonstrated
 * nothing — it would report the same if it were checking the wrong path, reading
 * the wrong index, or returning early. Per .agent/skills/tnf-honest-guard-review
 * ("prove the new guard is real"), each condition is synthesised here and the
 * scanner must find it.
 *
 * The conditions are the ones observed on 2026-09-07:
 *   - a 6-day-old index.lock that froze a worktree's index silently
 *   - 27,083 staged deletions sitting armed in that frozen index
 *   - branches whose only copy was the local disk
 */
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { worktreeHygiene } = require('./checkout-ledger.cjs');

const run = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hygiene-test-'));
const repo = path.join(root, 'repo');
fs.mkdirSync(repo);

run(['init', '-q', '-b', 'main'], repo);
run(['config', 'user.email', 'test@example.com'], repo);
run(['config', 'user.name', 'test'], repo);
for (let i = 0; i < 12; i += 1) {
  fs.writeFileSync(path.join(repo, `f${i}.txt`), `content ${i}\n`);
}
run(['add', '-A'], repo);
run(['commit', '-qm', 'seed'], repo);

const findingsFor = (res, kind) => res.findings.filter((f) => f.kind === kind);

/* -------------------------------------------------- baseline: clean is clean */
let res = worktreeHygiene(repo);
assert.equal(res.scanned, 1, 'should scan the primary worktree');
assert.equal(res.counts.HAZARD, 0, `clean repo should have no hazards, got ${JSON.stringify(res.findings)}`);
console.log('ok  clean repo reports no hazard');

/* ------------------------------------------------------ 1. staged deletions */
run(['rm', '-q', '--cached', ...Array.from({ length: 12 }, (_, i) => `f${i}.txt`)], repo);
res = worktreeHygiene(repo, { stagedDeleteMax: 5 });
const staged = findingsFor(res, 'staged-deletion');
assert.equal(staged.length, 1, 'staged mass deletion must be detected');
assert.equal(staged[0].severity, 'HAZARD');
assert.equal(staged[0].count, 12, `expected 12 staged deletions, got ${staged[0].count}`);
assert.match(staged[0].remedy, /git -C .* reset/, 'must offer the non-destructive remedy');
console.log('ok  staged mass deletion detected as HAZARD');

// Below the threshold it must NOT fire — a guard that always fires is not a guard.
res = worktreeHygiene(repo, { stagedDeleteMax: 50 });
assert.equal(findingsFor(res, 'staged-deletion').length, 0, 'must not fire under threshold');
console.log('ok  staged deletions under threshold do not fire');
run(['reset', '-q'], repo);

/* ------------------------------------------------------------ 2. stale lock */
const lock = path.join(repo, '.git', 'index.lock');
fs.writeFileSync(lock, '');
const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
fs.utimesSync(lock, sixDaysAgo, sixDaysAgo);

res = worktreeHygiene(repo);
const stale = findingsFor(res, 'stale-lock');
assert.equal(stale.length, 1, 'stale index.lock must be detected');
assert.equal(stale[0].severity, 'HAZARD');
assert.ok(stale[0].ageMin > 8000, `expected a ~6-day age in minutes, got ${stale[0].ageMin}`);
console.log(`ok  stale index.lock detected as HAZARD (${stale[0].ageMin}m old)`);

// A fresh lock may belong to a live git process and must not be flagged.
const now = new Date();
fs.utimesSync(lock, now, now);
res = worktreeHygiene(repo);
assert.equal(findingsFor(res, 'stale-lock').length, 0, 'a fresh lock must not be flagged');
console.log('ok  fresh index.lock is not flagged');
fs.rmSync(lock);

/* ---------------------------------------------------- 3. unprotected branch */
res = worktreeHygiene(repo);
const noRemote = findingsFor(res, 'no-remote');
assert.equal(noRemote.length, 1, 'commits with no remote must be reported');
assert.equal(noRemote[0].severity, 'WARN', 'exposure is a warning, not a hazard');
assert.match(noRemote[0].remedy, /push -u origin/, 'must offer the push remedy');
console.log('ok  branch with no remote copy detected as WARN');

/* -------------------------------------------- 4. both at once, and counting */
// Stage FIRST, then plant the lock: a present index.lock blocks git's own
// index writes, which is the whole point of the condition being tested.
run(['rm', '-q', '--cached', 'f0.txt', 'f1.txt', 'f2.txt', 'f3.txt', 'f4.txt', 'f5.txt'], repo);
fs.writeFileSync(lock, '');
fs.utimesSync(lock, sixDaysAgo, sixDaysAgo);
res = worktreeHygiene(repo, { stagedDeleteMax: 2 });
assert.equal(res.counts.HAZARD, 2, `expected 2 hazards together, got ${res.counts.HAZARD}`);
assert.ok(res.counts.WARN >= 1, 'the no-remote warning should still be reported alongside');
console.log('ok  concurrent hazards are reported together, not shadowed');
fs.rmSync(lock); // must clear the lock before git can touch the index again
run(['reset', '-q'], repo);

/* --------------------------------------- 5. unreadable worktree != "clean" */
const orphan = path.join(root, 'gone');
fs.mkdirSync(orphan);
run(['worktree', 'add', '-q', '--detach', orphan, 'HEAD'], repo);
fs.rmSync(orphan, { recursive: true, force: true });
res = worktreeHygiene(repo);
const missing = res.findings.filter((f) => f.kind === 'missing-path');
assert.equal(missing.length, 1, 'a vanished worktree must be reported');
assert.equal(missing[0].severity, 'UNKNOWN', 'cannot-look must be UNKNOWN, never clean');
console.log('ok  vanished worktree reports UNKNOWN rather than passing');

fs.rmSync(root, { recursive: true, force: true });
console.log('\ncheckout-ledger.hygiene.test.cjs: OK');
