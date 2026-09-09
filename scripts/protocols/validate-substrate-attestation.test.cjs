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

/**
 * Digest guards. The seal has always recorded a sha256 per CLI-critical
 * artifact, but the check only asked whether the file existed — so a rebuilt or
 * swapped dist passed while the recorded digest silently went stale. These pin
 * the comparison.
 */
const CLI_ARTIFACT_RELS = {
  '@the-new-fuse/infrastructure': 'packages/infrastructure/dist/index.js',
  '@the-new-fuse/shared': 'packages/shared/dist/index.js',
  '@the-new-fuse/tnf-core': 'packages/tnf-core/dist/index.js',
  '@the-new-fuse/tnf-note-taking': 'packages/tnf-note-taking/dist/index.js',
  '@the-new-fuse/tnf-browser': 'packages/tnf-browser/index.js',
};

function sha256(text) {
  return require('node:crypto').createHash('sha256').update(Buffer.from(text)).digest('hex');
}

/**
 * Materialize every CLI-critical artifact plus a seal describing them, run the
 * validator, then restore whatever was on disk before.
 */
function withSealedArtifacts({ contents, sealOverrides = {}, omitFromSeal = [] }, fn) {
  const repo = path.resolve(__dirname, '..', '..');
  const sealPath = path.join(repo, 'docs/operations/tnf-substrate-seal.json');
  const sealBackup = fs.existsSync(sealPath) ? fs.readFileSync(sealPath, 'utf8') : null;
  const created = [];
  const backups = new Map();

  try {
    const artifacts = {};
    for (const [pkg, rel] of Object.entries(CLI_ARTIFACT_RELS)) {
      const full = path.join(repo, rel);
      if (fs.existsSync(full)) backups.set(full, fs.readFileSync(full));
      else created.push(full);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const body = contents[pkg] ?? `// ${pkg}\n`;
      fs.writeFileSync(full, body);
      if (!omitFromSeal.includes(pkg)) {
        artifacts[pkg] = { rel, sha256: sealOverrides[pkg] ?? sha256(body) };
      }
    }
    const lockPath = path.join(repo, 'pnpm-lock.yaml');
    fs.writeFileSync(
      sealPath,
      `${JSON.stringify(
        {
          schema: 'tnf/substrate-seal/0.1',
          writtenAt: new Date().toISOString(),
          lockfile: 'pnpm-lock.yaml',
          lockfileSha256: require('node:crypto')
            .createHash('sha256')
            .update(fs.readFileSync(lockPath))
            .digest('hex'),
          cliCriticalArtifacts: artifacts,
        },
        null,
        2,
      )}\n`,
    );

    const result = run(['--mode=warn', '--json']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    return fn(summary.checks.find((c) => c.id === 'cli-critical-dist'));
  } finally {
    for (const [full, buf] of backups) fs.writeFileSync(full, buf);
    for (const full of created) if (fs.existsSync(full)) fs.unlinkSync(full);
    if (sealBackup != null) fs.writeFileSync(sealPath, sealBackup);
    else if (fs.existsSync(sealPath)) fs.unlinkSync(sealPath);
  }
}

test('cli-critical-dist passes when every artifact matches the seal', () => {
  withSealedArtifacts({ contents: {} }, (check) => {
    assert.ok(check, 'cli-critical-dist check missing');
    assert.equal(check.ok, true, check.detail);
    assert.match(check.detail, /match seal/);
  });
});

test('cli-critical-dist catches a dist that drifted from the seal', () => {
  withSealedArtifacts(
    { contents: {}, sealOverrides: { '@the-new-fuse/shared': sha256('a different build') } },
    (check) => {
      assert.equal(check.ok, false, 'a drifted digest must not pass');
      assert.equal(check.severity, 'hard', 'digest drift is a hard failure');
      assert.match(check.detail, /digest drift/);
      assert.match(check.detail, /@the-new-fuse\/shared/);
      assert.deepEqual(check.missing, [], 'the file exists; only its content drifted');
    },
  );
});

test('an artifact the seal never recorded is unverified, not passed', () => {
  withSealedArtifacts({ contents: {}, omitFromSeal: ['@the-new-fuse/tnf-core'] }, (check) => {
    assert.equal(check.ok, false, 'an unsealed artifact cannot be reported as verified');
    assert.equal(check.severity, 'soft', 'unsealed is unknown, not broken');
    assert.match(check.detail, /unsealed/);
    assert.ok(check.unverified.includes('@the-new-fuse/tnf-core'));
  });
});

/**
 * Gate-token honesty. The check used to read process.env only, so a box whose
 * token lives in ~/.tnf/credentials.env was reported "unset". It also treated
 * presence as health, which a revoked token satisfies.
 */
function withHome(homeDir, env, fn) {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'tnf-gate-'));
  try {
    if (homeDir) homeDir(tmp);
    const result = run(['--mode=warn', '--json'], { HOME: tmp, TNF_GATE_POLICY_TOKEN: '', ...env });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    return fn(summary.checks.find((c) => c.id === 'gate-policy-token'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test('gate token absent everywhere is reported absent, with the authorize path', () => {
  withHome(null, {}, (check) => {
    assert.ok(check, 'gate-policy-token check missing');
    assert.equal(check.ok, false);
    assert.equal(check.state, 'absent');
    assert.match(check.detail, /authorize-gate-token/);
  });
});

test('gate token in ~/.tnf/credentials.env is found, not reported unset', () => {
  withHome(
    (tmp) => {
      fs.mkdirSync(path.join(tmp, '.tnf'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.tnf', 'credentials.env'),
        'export TNF_GATE_POLICY_TOKEN="from-credentials-file"\n',
      );
    },
    { TNF_GATE_TOKEN_SKIP_VERIFY: '1' },
    (check) => {
      assert.notEqual(check.state, 'absent', 'a provisioned token must not read as absent');
      assert.match(check.detail, /credentials\.env/);
    },
  );
});

test('skip-verify passes but says the token was not verified', () => {
  withHome(
    (tmp) => {
      fs.mkdirSync(path.join(tmp, '.tnf'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.tnf', 'credentials.env'), 'TNF_GATE_POLICY_TOKEN=xyz\n');
    },
    { TNF_GATE_TOKEN_SKIP_VERIFY: '1' },
    (check) => {
      assert.equal(check.ok, true);
      assert.equal(check.state, 'unverified');
      assert.match(check.detail, /not verified/);
    },
  );
});

test('a dead full-auto loop is a hard failure, not a warning', () => {
  withFullAutoState(
    {
      mode: 'running',
      intervalMinutes: 60,
      failedCycles: 0,
      completedCycles: 9,
      updatedAt: new Date(Date.now() - 100 * HOUR).toISOString(),
      lastRun: { cycle: 9, ok: true },
    },
    (check) => {
      assert.equal(check.ok, false);
      assert.equal(check.severity, 'hard', 'a false liveness claim is not a soft warning');
      assert.match(check.detail, /still claims running/);
    },
  );
});

/**
 * Operator preference (~/.tnf/config.yaml `full_auto.enabled`). The point of
 * wiring it is that a declared-on loop which is not actually running gets
 * surfaced — and that the preference is satisfied by liveness, never by the
 * state file's own `mode` string.
 */
function withPreference(configYaml, state, fn) {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'tnf-pref-'));
  const configPath = path.join(dir, 'config.yaml');
  if (configYaml != null) fs.writeFileSync(configPath, configYaml);
  const repo = path.resolve(__dirname, '..', '..');
  const statePath = path.join(repo, 'docs/operations/tnf-full-auto-state.json');
  const backup = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;
  try {
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    const result = run(['--mode=warn', '--json'], { TNF_CONFIG_YAML: configPath });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const summary = JSON.parse(result.stdout);
    return fn(summary.checks.find((c) => c.id === 'full-auto-preference'));
  } finally {
    if (backup != null) fs.writeFileSync(statePath, backup);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const liveLoop = {
  mode: 'running',
  intervalMinutes: 60,
  failedCycles: 0,
  completedCycles: 3,
  updatedAt: new Date().toISOString(),
  lastRun: { cycle: 3, ok: true },
};

test('declared-on preference is satisfied by a verifiably live loop', () => {
  withPreference('full_auto:\n  enabled: true\n', liveLoop, (check) => {
    assert.ok(check, 'full-auto-preference check missing');
    assert.equal(check.ok, true, check.detail);
    assert.match(check.detail, /verifiably running/);
  });
});

test('declared-on preference is NOT satisfied by a state file that merely claims running', () => {
  withPreference(
    'full_auto:\n  enabled: true\n',
    { ...liveLoop, updatedAt: new Date(Date.now() - 100 * HOUR).toISOString() },
    (check) => {
      assert.equal(check.ok, false, 'a dead loop must not satisfy a declared-on preference');
      assert.match(check.detail, /liveness failed/);
    },
  );
});

test('a stopped loop with no declared preference is not flagged', () => {
  withPreference('full_auto:\n  enabled: false\n', { ...liveLoop, mode: 'idle' }, (check) => {
    assert.equal(check.ok, true);
    assert.match(check.detail, /not declared enabled/);
  });
});

test('missing optional-settings config is not treated as a preference', () => {
  withPreference(null, { ...liveLoop, mode: 'idle' }, (check) => {
    assert.equal(check.ok, true);
    assert.match(check.detail, /no optional-settings config/);
  });
});
