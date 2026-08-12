#!/usr/bin/env node
/**
 * Substrate attestation — install + foundational runtime probes.
 *
 * Preflight historically checked protocol *documents* only. This validator
 * checks whether the TNF control-plane substrate is actually installed and
 * runnable (lockfile, CLI-critical package builds, Redis, optional relay,
 * gate token, stale full-auto quarantine).
 *
 * Modes:
 *   warn    (default) — always exit 0; print OK/WARN/FAIL lines
 *   require / ci      — exit 1 on any hard failure
 *
 * Env:
 *   TNF_REQUIRE_SUBSTRATE=1  force require mode
 *   TNF_SKIP_SUBSTRATE=1     skip entirely (exit 0)
 *   TNF_GATE_POLICY_TOKEN    presence checked as soft/hard depending on mode
 *
 * Seal (optional):
 *   docs/operations/tnf-substrate-seal.json — when present, lockfile sha256
 *   must match. Create/update with --write-seal.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SEAL_REL = 'docs/operations/tnf-substrate-seal.json';
const FULL_AUTO_STATE_REL = 'docs/operations/tnf-full-auto-state.json';
const FULL_AUTO_RUN_LOG_REL = 'docs/operations/tnf-full-auto-runs.jsonl';
/** Must match FULL_AUTO_FAIL_STREAK in packages/tnf-cli/src/utils/full-auto-cycle.ts. */
const FULL_AUTO_FAIL_STREAK = 5;
/**
 * A loop that dies (crashed supervisor, unloaded LaunchAgent, removed crontab
 * entry) freezes its state file mid-flight and keeps reporting mode=running
 * forever. Failure-streak counting cannot see that — the streak stops advancing
 * precisely because nothing runs. Liveness must be judged on the clock instead:
 * if mode=running and the state has not been touched in this many intervals,
 * the loop is presumed dead rather than healthy.
 */
const FULL_AUTO_STALE_INTERVALS = 3;
/** Floor for the staleness window when intervalMinutes is missing or absurdly small. */
const FULL_AUTO_MIN_STALE_MS = 60 * 60 * 1000;

/** Packages the CLI launcher cannot start without. */
const CLI_CRITICAL_ARTIFACTS = [
  { package: '@the-new-fuse/infrastructure', rel: 'packages/infrastructure/dist/index.js' },
  { package: '@the-new-fuse/shared', rel: 'packages/shared/dist/index.js' },
  { package: '@the-new-fuse/tnf-core', rel: 'packages/tnf-core/dist/index.js' },
  { package: '@the-new-fuse/tnf-note-taking', rel: 'packages/tnf-note-taking/dist/index.js' },
  { package: '@the-new-fuse/tnf-browser', rel: 'packages/tnf-browser/index.js' },
];

function isTruthy(value) {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function abs(rel) {
  return path.join(REPO_ROOT, rel);
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function probeTcp(port, host = '127.0.0.1', timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (ok, detail) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok, detail });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, `tcp://${host}:${port} open`));
    socket.once('timeout', () => finish(false, `tcp://${host}:${port} timeout`));
    socket.once('error', (err) => finish(false, `tcp://${host}:${port} ${err.code || err.message}`));
    socket.connect(port, host);
  });
}

function parseArgs(argv) {
  let mode = 'warn';
  let json = false;
  let writeSeal = false;
  let applyQuarantine = false;
  let clearQuarantine = false;
  let clearEscalation = false;
  let strictRuntime = false;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg === '--write-seal') writeSeal = true;
    else if (arg === '--apply-quarantine') applyQuarantine = true;
    else if (arg === '--clear-quarantine') clearQuarantine = true;
    else if (arg === '--clear-escalation') clearEscalation = true;
    else if (arg === '--strict-runtime') strictRuntime = true;
    else if (arg.startsWith('--mode=')) mode = arg.slice('--mode='.length);
    else if (arg === '--mode') {
      /* next handled below via index walk */
    }
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--mode' && argv[i + 1]) mode = argv[i + 1];
  }
  if (isTruthy(process.env.TNF_REQUIRE_SUBSTRATE)) mode = 'require';
  if (mode === 'ci') mode = 'require';
  return {
    mode,
    json,
    writeSeal,
    applyQuarantine,
    clearQuarantine,
    clearEscalation,
    strictRuntime,
  };
}

function checkLockfile() {
  const lockRelCandidates = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
  for (const rel of lockRelCandidates) {
    const p = abs(rel);
    if (fs.existsSync(p)) {
      const digest = sha256File(p);
      return {
        id: 'lockfile',
        severity: 'hard',
        ok: true,
        detail: `${rel} sha256=${digest.slice(0, 16)}…`,
        digest,
        rel,
      };
    }
  }
  return {
    id: 'lockfile',
    severity: 'hard',
    ok: false,
    detail: 'no lockfile found (pnpm-lock.yaml / package-lock.json / yarn.lock)',
  };
}

function checkSeal(lockCheck) {
  const sealPath = abs(SEAL_REL);
  if (!fs.existsSync(sealPath)) {
    return {
      id: 'install-seal',
      severity: 'soft',
      ok: true,
      detail: `${SEAL_REL} absent — run with --write-seal after a known-good install`,
    };
  }
  if (!lockCheck.ok || !lockCheck.digest) {
    return {
      id: 'install-seal',
      severity: 'hard',
      ok: false,
      detail: 'cannot verify seal without lockfile',
    };
  }
  try {
    const seal = JSON.parse(fs.readFileSync(sealPath, 'utf8'));
    const expected = seal.lockfileSha256 || seal.pnpmLockSha256;
    if (!expected) {
      return {
        id: 'install-seal',
        severity: 'hard',
        ok: false,
        detail: 'seal file missing lockfileSha256',
      };
    }
    const match = expected === lockCheck.digest;
    return {
      id: 'install-seal',
      severity: 'hard',
      ok: match,
      detail: match
        ? `lockfile matches seal (${String(expected).slice(0, 16)}…)`
        : `lockfile drift vs seal (have ${lockCheck.digest.slice(0, 16)}… want ${String(expected).slice(0, 16)}…)`,
    };
  } catch (err) {
    return {
      id: 'install-seal',
      severity: 'hard',
      ok: false,
      detail: `seal unreadable: ${err.message}`,
    };
  }
}

function checkCliArtifacts() {
  const missing = [];
  const present = [];
  for (const art of CLI_CRITICAL_ARTIFACTS) {
    if (fs.existsSync(abs(art.rel))) present.push(art.package);
    else missing.push(`${art.package} (${art.rel})`);
  }
  return {
    id: 'cli-critical-dist',
    severity: 'hard',
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? `${present.length}/${CLI_CRITICAL_ARTIFACTS.length} CLI-critical artifacts present`
        : `missing: ${missing.join('; ')}`,
    missing,
  };
}

async function checkRedis() {
  const port = Number(process.env.TNF_REDIS_PORT || process.env.REDIS_PORT || 6379);
  const host = process.env.TNF_REDIS_HOST || process.env.REDIS_HOST || '127.0.0.1';
  const probe = await probeTcp(port, host);
  return {
    id: 'redis',
    severity: 'soft',
    ok: probe.ok,
    detail: probe.ok ? `Redis reachable (${probe.detail})` : `Redis unreachable (${probe.detail})`,
  };
}

async function checkRelay() {
  const httpPort = Number(process.env.TNF_RELAY_HEALTH_PORT || 3007);
  const wsPort = Number(process.env.TNF_RELAY_WS_PORT || 3000);
  const host = '127.0.0.1';
  const http = await probeTcp(httpPort, host);
  if (http.ok) {
    return {
      id: 'relay',
      severity: 'soft',
      ok: true,
      detail: `relay health port open (${http.detail})`,
    };
  }
  const ws = await probeTcp(wsPort, host);
  return {
    id: 'relay',
    severity: 'soft',
    ok: ws.ok,
    detail: ws.ok
      ? `relay ws port open (${ws.detail}); health :${httpPort} closed`
      : `relay unreachable (health :${httpPort} and ws :${wsPort} closed)`,
  };
}

function checkGateToken() {
  const present = Boolean(
    process.env.TNF_GATE_POLICY_TOKEN && String(process.env.TNF_GATE_POLICY_TOKEN).trim()
  );
  return {
    id: 'gate-policy-token',
    severity: 'soft',
    ok: present,
    detail: present
      ? 'TNF_GATE_POLICY_TOKEN set'
      : 'TNF_GATE_POLICY_TOKEN unset (master-clock / federation gate will 401)',
  };
}

function checkLaunchAgents() {
  if (process.platform !== 'darwin') {
    return {
      id: 'launch-agents',
      severity: 'soft',
      ok: true,
      detail: `skipped (platform=${process.platform})`,
    };
  }
  const home = process.env.HOME || '';
  const dir = path.join(home, 'Library', 'LaunchAgents');
  const expected = ['com.tnf.master-heartbeat.plist', 'com.tnf.local-subdirector.plist'];
  const loaded = [];
  const missing = [];
  for (const name of expected) {
    if (fs.existsSync(path.join(dir, name))) loaded.push(name);
    else missing.push(name);
  }
  // Best-effort: ask launchctl which are running (non-fatal if launchctl fails)
  let runningHint = '';
  try {
    const listed = spawnSync('launchctl', ['list'], { encoding: 'utf8', timeout: 2000 });
    if (listed.status === 0 && listed.stdout) {
      const lines = listed.stdout.split('\n');
      const hit = expected.filter((name) =>
        lines.some((line) => line.includes(name.replace(/\.plist$/, '')))
      );
      runningHint = hit.length
        ? `; launchctl lists ${hit.length}/${expected.length}`
        : '; launchctl lists 0 expected labels (may be unloaded)';
    }
  } catch {
    /* ignore */
  }
  return {
    id: 'launch-agents',
    severity: 'soft',
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? `LaunchAgent plists present (${loaded.join(', ')})${runningHint}`
        : `missing plists: ${missing.join(', ')}${runningHint}`,
  };
}

function clearFullAutoQuarantine() {
  const statePath = abs(FULL_AUTO_STATE_REL);
  if (!fs.existsSync(statePath)) {
    return {
      id: 'full-auto-quarantine',
      severity: 'soft',
      ok: true,
      detail: 'no full-auto state file to clear',
    };
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const next = {
    ...state,
    mode: 'idle',
    failedCycles: 0,
    updatedAt: new Date().toISOString(),
    clearedQuarantineAt: new Date().toISOString(),
    quarantineReason: undefined,
    quarantinedAt: undefined,
  };
  fs.writeFileSync(statePath, `${JSON.stringify(next, null, 2)}\n`);
  return {
    id: 'full-auto-quarantine',
    severity: 'soft',
    ok: true,
    detail: 'cleared quarantine → mode=idle failedCycles=0',
  };
}

function clearEscalationHalt() {
  const escalationPath = abs('docs/operations/tnf-escalation-state.json');
  const next = {
    schema: 'tnf/escalation/0.1',
    updatedAt: new Date().toISOString(),
    consecutiveIdenticalFailures: 0,
    halted: false,
  };
  fs.mkdirSync(path.dirname(escalationPath), { recursive: true });
  fs.writeFileSync(escalationPath, `${JSON.stringify(next, null, 2)}\n`);
  return {
    id: 'escalation-halt',
    severity: 'soft',
    ok: true,
    detail: 'cleared escalation halt',
  };
}

/**
 * Consecutive failed cycles at the tail of the run log. A missing or unreadable
 * log yields 0: absence of evidence must not synthesize a quarantine.
 */
function countTrailingFailures() {
  const logPath = abs(FULL_AUTO_RUN_LOG_REL);
  if (!fs.existsSync(logPath)) return 0;
  let lines;
  try {
    lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  } catch {
    return 0;
  }
  let streak = 0;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const raw = lines[i].trim();
    if (!raw) continue;
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      continue;
    }
    if (event.ok) break;
    streak += 1;
  }
  return streak;
}

function checkFullAutoQuarantine(applyQuarantine) {
  const statePath = abs(FULL_AUTO_STATE_REL);
  if (!fs.existsSync(statePath)) {
    return {
      id: 'full-auto-quarantine',
      severity: 'soft',
      ok: true,
      detail: 'no full-auto state file',
    };
  }
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (err) {
    return {
      id: 'full-auto-quarantine',
      severity: 'hard',
      ok: false,
      detail: `full-auto state unreadable: ${err.message}`,
    };
  }
  if (state.mode === 'quarantined') {
    return {
      id: 'full-auto-quarantine',
      severity: 'hard',
      ok: false,
      detail: `full-auto quarantined (failedCycles=${state.failedCycles ?? '?'}; clear after remediation with --clear-quarantine)`,
    };
  }
  const failed = Number(state.failedCycles || 0);
  // `failedCycles` is a lifetime counter, so `failed >= N` latches true forever
  // after the fifth failure this repo ever had. Pairing it with `!lastOk` then
  // made the gate collapse the other way: one passing cycle at the tail cleared
  // it regardless of history. Neither answers "is the loop failing now" — count
  // the trailing streak in the run log instead.
  const streakLength = countTrailingFailures();

  // Liveness before health: a frozen state file is not a passing one.
  if (state.mode === 'running') {
    const stamp = Date.parse(state.updatedAt || '');
    if (!Number.isFinite(stamp)) {
      return {
        id: 'full-auto-quarantine',
        severity: 'soft',
        ok: false,
        detail: `full-auto mode=running but updatedAt is missing/unparseable (${state.updatedAt ?? 'absent'}) — liveness unverifiable`,
      };
    }
    const intervalMs = Number(state.intervalMinutes || 0) * 60 * 1000;
    const window = Math.max(
      intervalMs * FULL_AUTO_STALE_INTERVALS,
      FULL_AUTO_MIN_STALE_MS,
    );
    const age = Date.now() - stamp;
    if (age > window) {
      const hrs = (age / 3600000).toFixed(1);
      const winHrs = (window / 3600000).toFixed(1);
      return {
        id: 'full-auto-quarantine',
        severity: 'soft',
        ok: false,
        detail: `full-auto STALE: mode=running but last update ${hrs}h ago (>${winHrs}h window) — loop presumed dead, not healthy`,
      };
    }
  }

  const streak = streakLength >= FULL_AUTO_FAIL_STREAK && state.mode === 'running';
  if (!streak) {
    return {
      id: 'full-auto-quarantine',
      severity: 'soft',
      ok: true,
      detail: `full-auto ok (mode=${state.mode}; consecutiveFailures=${streakLength}; lifetimeFailed=${failed})`,
    };
  }
  if (applyQuarantine) {
    const next = {
      ...state,
      mode: 'quarantined',
      quarantinedAt: new Date().toISOString(),
      quarantineReason: `${streakLength} consecutive failed cycles (>= ${FULL_AUTO_FAIL_STREAK})`,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(statePath, `${JSON.stringify(next, null, 2)}\n`);
    return {
      id: 'full-auto-quarantine',
      severity: 'hard',
      ok: false,
      detail: `applied quarantine: ${streakLength} consecutive failures; mode→quarantined`,
    };
  }
  return {
    id: 'full-auto-quarantine',
    severity: 'hard',
    ok: false,
    detail: `active fail streak: mode=${state.mode} consecutiveFailures=${streakLength} (lifetimeFailed=${failed}) — re-run with --apply-quarantine or remediate then reset state`,
  };
}

function writeSeal(lockCheck) {
  if (!lockCheck.ok || !lockCheck.digest) {
    throw new Error('cannot write seal without lockfile digest');
  }
  const artifacts = {};
  for (const art of CLI_CRITICAL_ARTIFACTS) {
    const p = abs(art.rel);
    artifacts[art.package] = fs.existsSync(p)
      ? { rel: art.rel, sha256: sha256File(p) }
      : { rel: art.rel, sha256: null, missing: true };
  }
  const seal = {
    schema: 'tnf/substrate-seal/0.1',
    writtenAt: new Date().toISOString(),
    lockfile: lockCheck.rel,
    lockfileSha256: lockCheck.digest,
    cliCriticalArtifacts: artifacts,
    note: 'Generated by validate-substrate-attestation.cjs --write-seal after a known-good install/build.',
  };
  const out = abs(SEAL_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(seal, null, 2)}\n`);
  return out;
}

async function main() {
  if (isTruthy(process.env.TNF_SKIP_SUBSTRATE)) {
    console.log('[substrate] SKIP (TNF_SKIP_SUBSTRATE=1)');
    process.exit(0);
  }

  const opts = parseArgs(process.argv.slice(2));
  const checks = [];

  if (opts.clearEscalation) {
    checks.push(clearEscalationHalt());
  }
  if (opts.clearQuarantine) {
    checks.push(clearFullAutoQuarantine());
  }

  const lockCheck = checkLockfile();
  checks.push(lockCheck);
  if (opts.writeSeal) {
    const sealPath = writeSeal(lockCheck);
    console.log(`[substrate] wrote seal → ${path.relative(REPO_ROOT, sealPath)}`);
  }
  checks.push(checkSeal(lockCheck));
  checks.push(checkCliArtifacts());

  const redis = await checkRedis();
  const relay = await checkRelay();
  if (opts.strictRuntime) {
    redis.severity = 'hard';
    relay.severity = 'hard';
  }
  checks.push(redis);
  checks.push(relay);
  checks.push(checkGateToken());
  checks.push(checkLaunchAgents());
  if (!opts.clearQuarantine) {
    checks.push(checkFullAutoQuarantine(opts.applyQuarantine));
  }

  const hardFails = checks.filter((c) => c.severity === 'hard' && !c.ok);
  const softFails = checks.filter((c) => c.severity === 'soft' && !c.ok);
  const okCount = checks.filter((c) => c.ok).length;

  const summary = {
    schema: 'tnf/substrate-attestation/0.1',
    mode: opts.mode,
    timestamp: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    ok: hardFails.length === 0,
    hardFailures: hardFails.length,
    softFailures: softFails.length,
    passed: okCount,
    total: checks.length,
    checks,
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`[substrate] mode=${opts.mode} hard=${hardFails.length} soft=${softFails.length}`);
    for (const c of checks) {
      const label = c.ok ? 'OK' : c.severity === 'hard' ? 'FAIL' : 'WARN';
      console.log(`[substrate] ${label} ${c.id}: ${c.detail}`);
    }
    if (hardFails.length === 0 && softFails.length === 0) {
      console.log('[substrate] ALL CHECKS PASSED');
    } else if (hardFails.length === 0) {
      console.log('[substrate] PASSED WITH WARNINGS (install/runtime soft probes)');
    } else {
      console.log('[substrate] HARD FAILURES — remediate before requiring substrate');
      console.log(
        '[substrate] hint: rebuild CLI packages (infrastructure, shared, tnf-core, tnf-note-taking); ensure Redis; set TNF_GATE_POLICY_TOKEN; quarantine full-auto if streaking'
      );
    }
  }

  if (opts.mode === 'require' && hardFails.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(`[substrate] fatal: ${err.message}`);
  process.exit(1);
});
