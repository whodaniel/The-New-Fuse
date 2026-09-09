#!/usr/bin/env node
/**
 * TNF Continuous Correction Flywheel — Phase 1 property health monitor.
 *
 * Inline-probe detection (curl, no LLM children — 429-safe). Compares live
 * HTTP/infra state against the verified baseline, persists structured findings,
 * and posts a state-change alert to TNF channel "green" on the federation
 * relay (:3007). Designed to run hourly via the chronological-process runner
 * (single-instance guard, fleet-pause and resource guards inherited).
 *
 * Baseline authority: tnf-continuous-correction-flywheel skill, verified 2026-09-01.
 */

const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const { promisify: p } = require('node:util');

const execFileAsync = promisify(execFile);

const REPO_ROOT = (() => {
  let dir = __dirname;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, 'data', 'protocols', 'chronological-process-catalog.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
})();

const STATE_DIR = path.join(REPO_ROOT, 'logs', 'flywheel');
const LATEST = path.join(STATE_DIR, 'property-health-latest.json');
const HISTORY = path.join(STATE_DIR, 'property-health-history.jsonl');
const STATE = path.join(STATE_DIR, 'alert-state.json');
const HISTORY_MAX = 500;

// Verified baseline 2026-09-01. extreamix 525 = intentionally benched (not a regression).
const HTTP_CHECKS = [
  { target: 'https://thenewfuse.com', expect: [200] },
  { target: 'https://app.thenewfuse.com', expect: [200] },
  { target: 'https://api.thenewfuse.com', expect: [200] },
  { target: 'https://api.thenewfuse.com/docs', expect: [200] },
  { target: 'https://relay.thenewfuse.com', expect: [200] },
  { target: 'https://extreamix.com', expect: [525], note: 'benched 2026-08-06 — alert only on change' },
  { target: 'https://app.extreamix.com', expect: [525], note: 'benched 2026-08-06 — alert only on change' },
];

const INFRA_CHECKS = [
  { target: 'local-relay-3007', kind: 'relay-health' },
  { target: 'local-redis', kind: 'redis-ping' },
];

function log(line) {
  process.stdout.write(`[${new Date().toISOString()}] ${line}\n`);
}

async function probeHttp(target) {
  try {
    const { stdout } = await execFileAsync(
      'curl',
      ['-sS', '-L', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '10', '--max-redirs', '5', target],
      { timeout: 15000 }
    );
    const code = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(code) ? code : 0;
  } catch {
    return 0; // ERR / timeout
  }
}

async function probeRelay() {
  try {
    const { stdout } = await execFileAsync('curl', ['-s', '--max-time', '5', 'http://127.0.0.1:3007/health'], {
      timeout: 8000,
    });
    const health = JSON.parse(stdout);
    return health.status === 'ok' ? 'ok' : `degraded:${health.status}`;
  } catch {
    return 'down';
  }
}

async function probeRedis() {
  try {
    const { stdout } = await execFileAsync('redis-cli', ['-h', '127.0.0.1', 'ping'], { timeout: 5000 });
    return stdout.trim() === 'PONG' ? 'ok' : `unexpected:${stdout.trim()}`;
  } catch {
    return 'down';
  }
}

async function runChecks() {
  const checks = [];
  for (const c of HTTP_CHECKS) {
    const actual = await probeHttp(c.target);
    checks.push({
      target: c.target,
      kind: 'http',
      expected: c.expect,
      actual,
      status: c.expect.includes(actual) ? 'ok' : 'finding',
      note: c.note || null,
    });
  }
  for (const c of INFRA_CHECKS) {
    const actual = c.kind === 'relay-health' ? await probeRelay() : await probeRedis();
    checks.push({ target: c.target, kind: c.kind, expected: 'ok', actual, status: actual === 'ok' ? 'ok' : 'finding' });
  }
  return checks;
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/**
 * Alert only on STATE CHANGE to avoid hourly spam for known-persistent issues.
 * A finding is a "new" alert if its signature was not present in the last run.
 * extreamix 525-benched findings only alert when the code CHANGES away from 525.
 */
function diffFindings(current, previous) {
  const sig = (c) => `${c.kind}:${c.target}=${c.actual}`;
  const prevSigs = new Set((previous?.checks || []).filter((c) => c.status === 'finding').map(sig));
  const curFindings = current.checks.filter((c) => c.status === 'finding');
  const curSigs = new Set(curFindings.map(sig));

  const fresh = curFindings.filter((c) => !prevSigs.has(sig(c)));
  const resolved = (previous?.checks || []).filter(
    (c) => c.status === 'finding' && !c.note && !curSigs.has(sig(c))
  );
  return { fresh, resolved };
}

async function alertGreen(fresh, resolved, allChecks) {
  if (!fresh.length && !resolved.length) return 'quiet';
  let client;
  try {
    ({ FederationRelayClient } = require(path.join(REPO_ROOT, 'scripts', 'lib', 'federation-relay-client.cjs')));
    client = new FederationRelayClient({
      relayUrl: process.env.TNF_RELAY_URL || 'ws://127.0.0.1:3007/ws',
      agentId: 'flywheel-monitor',
      operationalHandle: 'flywheel-monitor',
      platform: 'tnf-flywheel',
      provider: 'TNF_RUNTIME',
      channels: ['green'],
      autoReconnect: false,
    });
    const parts = [];
    if (fresh.length) {
      parts.push(
        `🚨 NEW (${fresh.length}): ${fresh.map((c) => `${c.target} → ${c.actual} (expected ${c.expect})`).join('; ')}`
      );
    }
    if (resolved.length) {
      parts.push(`✅ RESOLVED (${resolved.length}): ${resolved.map((c) => `${c.target} → ${c.actual}`).join('; ')}`);
    }
    if (!fresh.length && resolved.length) parts.push('No new findings.');
    const text = `[flywheel] Property health ${new Date().toISOString()} — ${parts.join(' | ')}`;
    await client.connect();
    // small delay for REGISTRATION_CONFIRMED → CHANNEL_JOIN round trip
    await new Promise((r) => setTimeout(r, 1500));
    client.sendChannelMessage('green', text, { to: 'broadcast' });
    await new Promise((r) => setTimeout(r, 1500));
    client.cleanupSocket?.();
    log(`alerted #green: ${text}`);
    return 'alerted';
  } catch (err) {
    log(`alert error (non-fatal): ${err.message}`);
    return 'alert-failed';
  } finally {
    try {
      client?.cleanupSocket?.();
      process.exitCode = process.exitCode || 0;
    } catch {}
  }
}

async function main() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const started = Date.now();
  const checks = await runChecks();
  const findings = checks.filter((c) => c.status === 'finding');

  const report = {
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - started,
    summary: { total: checks.length, ok: checks.length - findings.length, findings: findings.length },
    checks,
  };

  const previous = loadJson(LATEST, null);
  fs.writeFileSync(LATEST, JSON.stringify(report, null, 2));
  fs.appendFileSync(HISTORY, JSON.stringify(report) + '\n');
  // trim history
  try {
    const lines = fs.readFileSync(HISTORY, 'utf8').trim().split('\n');
    if (lines.length > HISTORY_MAX) fs.writeFileSync(HISTORY, lines.slice(-HISTORY_MAX).join('\n') + '\n');
  } catch {}

  const alertState = loadJson(STATE, {});
  const { fresh, resolved } = diffFindings(report, previous);
  let alertOutcome = 'quiet';
  if (fresh.length || resolved.length) {
    alertOutcome = await alertGreen(fresh, resolved, checks);
    alertState.lastAlertAt = report.timestamp;
    alertState.lastAlert = { fresh: fresh.length, resolved: resolved.length };
    fs.writeFileSync(STATE, JSON.stringify(alertState, null, 2));
  }

  log(
    `flywheel sweep: ${report.summary.ok}/${report.summary.total} ok, ${report.summary.findings} findings, alert=${alertOutcome}, ${report.durationMs}ms`
  );
  if (findings.length) {
    for (const f of findings) log(`FINDING ${f.kind} ${f.target}: actual=${f.actual} expected=${f.expect}`);
  }
  // Monitor, not gate: always exit 0 so the chronological runner records a clean run.
  process.exit(0);
}

main().catch((err) => {
  log(`FATAL (monitor continues next cycle): ${err.message}`);
  process.exit(0);
});
