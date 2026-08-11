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

test('apply-quarantine marks streaking full-auto state', () => {
  const repo = path.resolve(__dirname, '..', '..');
  const statePath = path.join(repo, 'docs/operations/tnf-full-auto-state.json');
  const backup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;
  const tmpState = {
    mode: 'running',
    failedCycles: 9,
    completedCycles: 0,
    updatedAt: new Date().toISOString(),
    lastRun: { cycle: 99, ok: false, error: 'synthetic' },
  };
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(tmpState, null, 2)}\n`);
    const result = run(['--mode=warn', '--json', '--apply-quarantine']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    const q = summary.checks.find((c) => c.id === 'full-auto-quarantine');
    assert.ok(q);
    assert.equal(q.ok, false);
    const written = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.equal(written.mode, 'quarantined');
  } finally {
    if (backup != null) fs.writeFileSync(statePath, backup);
    else if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  }
});
