const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'validate-substrate-attestation.cjs');

function run(args = [], env = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TNF_SKIP_SUBSTRATE: '', TNF_REQUIRE_SUBSTRATE: '', ...env },
    cwd: path.resolve(__dirname, '..', '..'),
  });
}

test('warn mode exits 0 and emits JSON schema', () => {
  const result = run(['--mode=warn', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.schema, 'tnf/substrate-attestation/0.1');
  assert.ok(Array.isArray(summary.checks));
  assert.ok(summary.checks.some((c) => c.id === 'cli-critical-dist'));
  assert.ok(summary.checks.some((c) => c.id === 'full-auto-quarantine'));
});

test('TNF_SKIP_SUBSTRATE short-circuits', () => {
  const result = run(['--mode=require'], { TNF_SKIP_SUBSTRATE: '1' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /SKIP/);
});

/**
 * Liveness regression guard. A loop that dies freezes its state file, so the
 * failure-streak counter stops advancing and the old check reported green
 * indefinitely. These cases pin the clock-based verdict instead.
 */
function withFullAutoState(state, fn) {
  const repo = path.resolve(__dirname, '..', '..');
  const statePath = path.join(repo, 'docs/operations/tnf-full-auto-state.json');
  const backup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    const result = run(['--mode=warn', '--json']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    return fn(summary.checks.find((c) => c.id === 'full-auto-quarantine'));
  } finally {
    if (backup != null) fs.writeFileSync(statePath, backup);
    else if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  }
}

const HOUR = 3600 * 1000;

test('stale running full-auto is reported dead, not healthy', () => {
  withFullAutoState(
    {
      mode: 'running',
      intervalMinutes: 60,
      failedCycles: 3, // deliberately under FULL_AUTO_FAIL_STREAK
      completedCycles: 14,
      updatedAt: new Date(Date.now() - 100 * HOUR).toISOString(),
      lastRun: { cycle: 25, ok: false, error: 'synthetic' },
    },
    (check) => {
      assert.ok(check, 'full-auto-quarantine check missing');
      assert.equal(check.ok, false, 'a 100h-stale running loop must not pass');
      assert.match(check.detail, /STALE/);
    },
  );
});

test('freshly ticking full-auto still passes', () => {
  withFullAutoState(
    {
      mode: 'running',
      intervalMinutes: 60,
      failedCycles: 3,
      completedCycles: 14,
      updatedAt: new Date().toISOString(),
      lastRun: { cycle: 26, ok: true },
    },
    (check) => {
      assert.ok(check);
      assert.equal(check.ok, true, 'a live loop must not be flagged stale');
    },
  );
});

test('full-auto with unparseable updatedAt is not treated as live', () => {
  withFullAutoState(
    {
      mode: 'running',
      intervalMinutes: 60,
      failedCycles: 0,
      completedCycles: 1,
      lastRun: { cycle: 1, ok: true },
    },
    (check) => {
      assert.ok(check);
      assert.equal(check.ok, false, 'missing updatedAt means liveness is unverifiable');
      assert.match(check.detail, /liveness unverifiable/);
    },
  );
});

/**
 * The gate reads the run log, not the lifetime `failedCycles` counter, so these
 * fixtures must stage both. Backs up and restores each file.
 */
function withFullAutoFixture(state, runEvents, args, fn) {
  const repo = path.resolve(__dirname, '..', '..');
  const statePath = path.join(repo, 'docs/operations/tnf-full-auto-state.json');
  const logPath = path.join(repo, 'docs/operations/tnf-full-auto-runs.jsonl');
  const stateBackup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;
  const logBackup = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : null;
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    fs.writeFileSync(logPath, runEvents.map((e) => JSON.stringify(e)).join('\n') + '\n');
    const result = run(args);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    fn(
      summary.checks.find((c) => c.id === 'full-auto-quarantine'),
      () => JSON.parse(fs.readFileSync(statePath, 'utf8')),
    );
  } finally {
    if (stateBackup != null) fs.writeFileSync(statePath, stateBackup);
    else if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
    if (logBackup != null) fs.writeFileSync(logPath, logBackup);
    else if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  }
}

const liveState = (extra = {}) => ({
  mode: 'running',
  intervalMinutes: 60,
  failedCycles: 9,
  completedCycles: 0,
  updatedAt: new Date().toISOString(),
  ...extra,
});

test('apply-quarantine marks streaking full-auto state', () => {
  withFullAutoFixture(
    liveState({ lastRun: { cycle: 99, ok: false, error: 'synthetic' } }),
    Array.from({ length: 9 }, (_, i) => ({ cycle: 91 + i, ok: false, error: 'synthetic' })),
    ['--mode=warn', '--json', '--apply-quarantine'],
    (q, readState) => {
      assert.ok(q);
      assert.equal(q.ok, false);
      assert.equal(readState().mode, 'quarantined');
    },
  );
});

/**
 * The bug this replaced: `failedCycles` is cumulative, so `failed >= 5` latched
 * true forever, and the `!lastOk` escape hatch meant a single passing cycle at
 * the tail cleared the gate no matter how bad the history. This repo rode a
 * 212-cycle unbroken failure streak with the loop still marked healthy.
 */
test('lifetime failures with a recovered tail do not quarantine', () => {
  withFullAutoFixture(
    liveState({ failedCycles: 200, completedCycles: 2, lastRun: { cycle: 202, ok: true } }),
    [...Array.from({ length: 200 }, (_, i) => ({ cycle: i + 1, ok: false })), { cycle: 201, ok: true }],
    ['--mode=warn', '--json'],
    (q) => {
      assert.ok(q);
      assert.equal(q.ok, true, 'a recovered loop must not be gated on ancient failures');
      assert.match(q.detail, /consecutiveFailures=0/);
    },
  );
});

test('an active streak is flagged even when the tail once passed', () => {
  withFullAutoFixture(
    liveState({ failedCycles: 6, completedCycles: 50, lastRun: { cycle: 56, ok: false } }),
    [
      ...Array.from({ length: 50 }, (_, i) => ({ cycle: i + 1, ok: true })),
      ...Array.from({ length: 6 }, (_, i) => ({ cycle: 51 + i, ok: false, error: 'synthetic' })),
    ],
    ['--mode=warn', '--json'],
    (q) => {
      assert.ok(q);
      assert.equal(q.ok, false, '6 consecutive failures must trip the breaker');
      assert.match(q.detail, /consecutiveFailures=6/);
    },
  );
});
