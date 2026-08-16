#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * TNF Redis connection guard — prevent local-harness maxclients saturation.
 *
 * Controls:
 *   1. Enforce idle client timeout (CONFIG SET timeout)
 *   2. Reap idle normal clients past threshold
 *   3. Cap duplicate redis-wrapper / known consumer roles (keep newest PID)
 *   4. Gate harness / daemon boot when utilization is critical
 *
 * Usage:
 *   node scripts/runtime/redis-connection-guard.cjs [--dry-run] [--apply] [--gate] [--json]
 *   node scripts/runtime/redis-connection-guard.cjs --preflight   # for daemon/harness boot
 *
 * Exit codes:
 *   0 ok / remediated to ok
 *   1 usage / redis unreachable
 *   2 still critical after remediation (or gate failed)
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TNF_HOME = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
const STATE_DIR = path.join(TNF_HOME, 'fleet', 'state');
const STATE_FILE = path.join(STATE_DIR, 'redis-guard-latest.json');
const ALERTS_FILE = path.join(TNF_HOME, 'alerts.json');

const DEFAULTS = {
  idleTimeoutSec: Number(process.env.TNF_REDIS_IDLE_TIMEOUT || 300),
  reapIdleSec: Number(process.env.TNF_REDIS_REAP_IDLE || 600),
  warnUtil: Number(process.env.TNF_REDIS_WARN_UTIL || 0.5),
  criticalUtil: Number(process.env.TNF_REDIS_CRITICAL_UTIL || 0.8),
  softClientCap: Number(process.env.TNF_REDIS_SOFT_CLIENT_CAP || 1500),
  maxPerRole: Number(process.env.TNF_REDIS_MAX_PER_ROLE || 1),
};

const ROLE_PATTERNS = [
  { id: 'gemini-redis-wrapper', pattern: /gemini-redis-wrapper/ },
  { id: 'pi-redis-wrapper', pattern: /pi-redis-wrapper/ },
  { id: 'antigravity-redis-wrapper', pattern: /antigravity-redis-wrapper/ },
  { id: 'jules-redis-wrapper', pattern: /jules-redis-wrapper/ },
  { id: 'claude-redis-wrapper', pattern: /claude-redis-wrapper/ },
  { id: 'redis-ws-bridge', pattern: /redis-ws-bridge/ },
  { id: 'green-channel-coordinator', pattern: /green-channel-coordinator/ },
  { id: 'tnf-agent-daemon', pattern: /tnf-agent-daemon\.py(\s|$)/ },
  { id: 'master-clock', pattern: /master-clock\.js/ },
  { id: 'director-loop', pattern: /tnf-director-loop\.cjs(\s|$)/ },
];

const NEVER_CULL_ROLES = new Set(['director-loop', 'tnf-agent-daemon']);

function parseArgs(argv) {
  const args = {
    dryRun: argv.includes('--dry-run'),
    apply: argv.includes('--apply') || (!argv.includes('--dry-run') && !argv.includes('--gate')),
    gate: argv.includes('--gate') || argv.includes('--preflight'),
    preflight: argv.includes('--preflight'),
    json: argv.includes('--json'),
    help: argv.includes('-h') || argv.includes('--help'),
    idleTimeoutSec: DEFAULTS.idleTimeoutSec,
    reapIdleSec: DEFAULTS.reapIdleSec,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--idle-timeout' && argv[i + 1]) args.idleTimeoutSec = Number(argv[++i]);
    if (argv[i] === '--reap-idle' && argv[i + 1]) args.reapIdleSec = Number(argv[++i]);
  }
  if (args.preflight) {
    // Preflight: remediate if needed, then gate.
    args.apply = !args.dryRun;
    args.gate = true;
  }
  return args;
}

function run(cmd, args = []) {
  return spawnSync(cmd, args, { encoding: 'utf8' });
}

function redisCli(...parts) {
  const result = run('redis-cli', parts);
  const out = String(result.stdout || '').trim();
  const err = String(result.stderr || '').trim();
  const saturated = /ERR max number of clients reached/i.test(out + err);
  return {
    ok: result.status === 0 && !saturated,
    saturated,
    status: result.status,
    out,
    err,
  };
}

function parseClientList(raw) {
  const clients = [];
  for (const line of String(raw || '').split('\n')) {
    if (!line.trim()) continue;
    const map = {};
    for (const tok of line.trim().split(/\s+/)) {
      const idx = tok.indexOf('=');
      if (idx < 0) continue;
      map[tok.slice(0, idx)] = tok.slice(idx + 1);
    }
    if (!map.id) continue;
    clients.push({
      id: map.id,
      addr: map.addr || '',
      name: map.name || '',
      age: Number.parseInt(map.age || '0', 10) || 0,
      idle: Number.parseInt(map.idle || '0', 10) || 0,
      flags: map.flags || '',
      cmd: map.cmd || '',
      db: map.db || '0',
      user: map.user || '',
    });
  }
  return clients;
}

function parseInfoClients(text) {
  const map = {};
  for (const line of String(text || '').split('\n')) {
    if (!line.includes(':') || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    map[line.slice(0, idx)] = line.slice(idx + 1).trim();
  }
  return {
    connected: Number.parseInt(map.connected_clients || '0', 10) || 0,
    maxclients: Number.parseInt(map.maxclients || '0', 10) || 0,
    blocked: Number.parseInt(map.blocked_clients || '0', 10) || 0,
  };
}

function matchRole(commandLine) {
  const hay = String(commandLine || '');
  for (const hint of ROLE_PATTERNS) {
    if (hint.pattern.test(hay)) return hint.id;
  }
  return null;
}

function listRoleProcesses() {
  const probe = run('/bin/ps', ['-axo', 'pid=,lstart=,command=']);
  const byRole = new Map();
  for (const line of String(probe.stdout || '').split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/);
    if (!m) continue;
    const pid = Number.parseInt(m[1], 10);
    const rest = m[2];
    // lstart is "Day Mon DD HH:MM:SS YYYY" (24 chars-ish) then command —
    // keep it simple: role-match the whole rest.
    const role = matchRole(rest);
    if (!role) continue;
    const list = byRole.get(role) || [];
    list.push({ pid, command: rest.slice(0, 200), startedHint: rest });
    byRole.set(role, list);
  }
  return byRole;
}

function isProtectedClient(client) {
  const flags = String(client.flags || '');
  // Keep pub/sub and blocked (BRPOP/BZPOP) clients — killing them disrupts the bus.
  if (flags.includes('P') || flags.includes('b')) return true;
  const name = String(client.name || '');
  if (/^tnf:(director|heartbeat|guard|agent-daemon|master-heartbeat)/i.test(name)) return true;
  const cmd = String(client.cmd || '').toLowerCase();
  if (cmd === 'subscribe' || cmd === 'psubscribe' || cmd === 'brpop' || cmd === 'bzpopmin') {
    return true;
  }
  return false;
}

function ensureIdleTimeout(idleTimeoutSec, dryRun, actions) {
  const current = redisCli('CONFIG', 'GET', 'timeout');
  let currentVal = 0;
  if (current.ok) {
    const lines = current.out.split('\n').map((l) => l.trim()).filter(Boolean);
    const idx = lines.indexOf('timeout');
    if (idx >= 0) currentVal = Number.parseInt(lines[idx + 1] || '0', 10) || 0;
  }
  if (currentVal === idleTimeoutSec) {
    actions.push({ action: 'idle_timeout', status: 'unchanged', value: currentVal });
    return;
  }
  if (dryRun) {
    actions.push({
      action: 'idle_timeout',
      status: 'would_set',
      from: currentVal,
      to: idleTimeoutSec,
    });
    return;
  }
  const set = redisCli('CONFIG', 'SET', 'timeout', String(idleTimeoutSec));
  actions.push({
    action: 'idle_timeout',
    status: set.ok ? 'set' : 'failed',
    from: currentVal,
    to: idleTimeoutSec,
    error: set.ok ? undefined : set.err || set.out,
  });
}

function reapIdleClients(clients, reapIdleSec, dryRun, actions) {
  const victims = clients.filter(
    (c) => !isProtectedClient(c) && c.idle >= reapIdleSec && Number.isFinite(c.idle)
  );
  let killed = 0;
  for (const c of victims) {
    if (dryRun) {
      actions.push({
        action: 'reap_idle',
        status: 'would_kill',
        id: c.id,
        idle: c.idle,
        name: c.name,
        addr: c.addr,
        cmd: c.cmd,
      });
      continue;
    }
    const kill = redisCli('CLIENT', 'KILL', 'ID', String(c.id));
    if (kill.ok) {
      killed += 1;
      actions.push({
        action: 'reap_idle',
        status: 'killed',
        id: c.id,
        idle: c.idle,
        name: c.name,
        addr: c.addr,
      });
    } else {
      actions.push({
        action: 'reap_idle',
        status: 'failed',
        id: c.id,
        error: kill.err || kill.out,
      });
    }
  }
  return { candidates: victims.length, killed };
}

function cullDuplicateRoles(maxPerRole, dryRun, actions) {
  const byRole = listRoleProcesses();
  let culled = 0;
  for (const [role, procs] of byRole.entries()) {
    // Never SIGTERM the control-plane daemon/director from the guard —
    // only redis wrappers / bridges are safe auto-cull targets.
    if (NEVER_CULL_ROLES.has(role)) continue;
    if (!/-redis-wrapper$|redis-ws-bridge|green-channel-coordinator/.test(role)) continue;
    if (procs.length <= maxPerRole) continue;
    // Prefer keeping the highest PID (usually newest) when start time is ambiguous.
    const sorted = [...procs].sort((a, b) => a.pid - b.pid);
    const keep = sorted.slice(-maxPerRole);
    const drop = sorted.slice(0, sorted.length - maxPerRole);
    for (const proc of drop) {
      if (dryRun) {
        actions.push({
          action: 'cull_duplicate_role',
          status: 'would_kill',
          role,
          pid: proc.pid,
          keepPids: keep.map((p) => p.pid),
        });
        continue;
      }
      try {
        process.kill(proc.pid, 'SIGTERM');
        culled += 1;
        actions.push({
          action: 'cull_duplicate_role',
          status: 'sigterm',
          role,
          pid: proc.pid,
          keepPids: keep.map((p) => p.pid),
        });
      } catch (err) {
        actions.push({
          action: 'cull_duplicate_role',
          status: 'failed',
          role,
          pid: proc.pid,
          error: err.message,
        });
      }
    }
  }
  return { culled, roles: Object.fromEntries([...byRole].map(([k, v]) => [k, v.length])) };
}

function appendAlert(entry) {
  try {
    let alerts = [];
    if (fs.existsSync(ALERTS_FILE)) {
      alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
      if (!Array.isArray(alerts)) alerts = [];
    }
    alerts.push(entry);
    // Keep last 100
    if (alerts.length > 100) alerts = alerts.slice(-100);
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
  } catch {
    // non-fatal
  }
}

function collectSnapshot() {
  const ping = redisCli('PING');
  const info = redisCli('INFO', 'clients');
  const list = redisCli('CLIENT', 'LIST');
  const cfg = redisCli('CONFIG', 'GET', 'maxclients');
  const clientsInfo = info.ok ? parseInfoClients(info.out) : { connected: 0, maxclients: 0, blocked: 0 };
  if (cfg.ok) {
    const lines = cfg.out.split('\n').map((l) => l.trim()).filter(Boolean);
    const idx = lines.indexOf('maxclients');
    if (idx >= 0) clientsInfo.maxclients = Number.parseInt(lines[idx + 1] || '0', 10) || clientsInfo.maxclients;
  }
  const clients = list.ok ? parseClientList(list.out) : [];
  const utilization =
    clientsInfo.maxclients > 0 ? clientsInfo.connected / clientsInfo.maxclients : null;
  return {
    ping: ping.ok ? ping.out : ping.saturated ? 'SATURATED' : 'DOWN',
    saturated: Boolean(ping.saturated || list.saturated),
    ...clientsInfo,
    utilization,
    utilizationPct: utilization != null ? Math.round(utilization * 100) : null,
    clients,
  };
}

function levelFor(snap, warnUtil, criticalUtil, softCap) {
  if (snap.ping !== 'PONG' || snap.saturated) return 'critical';
  if (
    (snap.utilization != null && snap.utilization >= criticalUtil) ||
    snap.connected >= softCap
  ) {
    return 'critical';
  }
  if (snap.utilization != null && snap.utilization >= warnUtil) return 'warn';
  if (snap.connected >= Math.floor(softCap * 0.7)) return 'warn';
  return 'ok';
}

function runGuard(args) {
  const before = collectSnapshot();
  const actions = [];
  const dryRun = Boolean(args.dryRun) || !args.apply;

  if (before.ping !== 'PONG' && !before.saturated) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode: dryRun ? 'dry-run' : 'apply',
      overall: 'critical',
      before,
      after: before,
      actions: [{ action: 'ping', status: 'failed', detail: before.ping }],
      recommendations: ['Start Redis: bash scripts/runtime/redis-local-bootstrap.sh start'],
    };
    return report;
  }

  // Always try to enforce idle timeout when applying / preflighting.
  ensureIdleTimeout(args.idleTimeoutSec, dryRun, actions);

  const beforeLevel = levelFor(before, DEFAULTS.warnUtil, DEFAULTS.criticalUtil, DEFAULTS.softClientCap);
  let reap = { candidates: 0, killed: 0 };
  let cull = { culled: 0, roles: {} };

  // Remediate on warn/critical, or when soft cap exceeded, or always on --apply for idle hygiene.
  const shouldRemediate =
    args.apply || args.preflight || beforeLevel !== 'ok' || before.connected >= DEFAULTS.softClientCap * 0.5;

  if (shouldRemediate) {
    reap = reapIdleClients(before.clients, args.reapIdleSec, dryRun, actions);
    cull = cullDuplicateRoles(DEFAULTS.maxPerRole, dryRun, actions);
  }

  // Brief settle if we killed anything
  if (!dryRun && (reap.killed > 0 || cull.culled > 0)) {
    spawnSync('sleep', ['1']);
  }

  const after = collectSnapshot();
  const overall = levelFor(after, DEFAULTS.warnUtil, DEFAULTS.criticalUtil, DEFAULTS.softClientCap);

  const recommendations = [];
  if (overall === 'critical') {
    recommendations.push(
      'Still critical — consider: bash scripts/runtime/redis-local-bootstrap.sh restart'
    );
    recommendations.push('Run: node scripts/tnf-redis-audit.cjs --json');
  } else if (overall === 'warn') {
    recommendations.push('Monitor duplicate wrappers; re-run guard with --apply');
  } else {
    recommendations.push('Redis connection budget healthy');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'apply',
    overall,
    thresholds: {
      idleTimeoutSec: args.idleTimeoutSec,
      reapIdleSec: args.reapIdleSec,
      warnUtil: DEFAULTS.warnUtil,
      criticalUtil: DEFAULTS.criticalUtil,
      softClientCap: DEFAULTS.softClientCap,
      maxPerRole: DEFAULTS.maxPerRole,
    },
    before: {
      ping: before.ping,
      connected: before.connected,
      maxclients: before.maxclients,
      blocked: before.blocked,
      utilizationPct: before.utilizationPct,
      clientSample: before.clients.length,
    },
    after: {
      ping: after.ping,
      connected: after.connected,
      maxclients: after.maxclients,
      blocked: after.blocked,
      utilizationPct: after.utilizationPct,
      clientSample: after.clients.length,
    },
    remediation: { reap, cullRoles: cull.roles, culledProcesses: cull.culled },
    actions,
    recommendations,
  };

  if (overall !== 'ok' || reap.killed > 0 || cull.culled > 0) {
    appendAlert({
      severity: overall === 'critical' ? 'critical' : overall === 'warn' ? 'warning' : 'info',
      source: 'redis-connection-guard',
      timestamp: report.generatedAt,
      message: `Redis guard ${report.mode}: ${before.connected}→${after.connected} clients (${overall}); reaped=${reap.killed} culled=${cull.culled}`,
    });
  }

  return report;
}

function printHuman(report) {
  console.log('TNF Redis Connection Guard');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Overall: ${String(report.overall).toUpperCase()}`);
  console.log('');
  console.log('[Before]');
  console.log(
    `- clients: ${report.before.connected} / ${report.before.maxclients} (${report.before.utilizationPct ?? '?'}%)`
  );
  console.log('[After]');
  console.log(
    `- clients: ${report.after.connected} / ${report.after.maxclients} (${report.after.utilizationPct ?? '?'}%)`
  );
  console.log('');
  console.log('[Remediation]');
  console.log(
    `- idle reap: candidates=${report.remediation.reap.candidates} killed=${report.remediation.reap.killed}`
  );
  console.log(`- duplicate roles culled: ${report.remediation.culledProcesses}`);
  const roles = report.remediation.cullRoles || {};
  for (const [role, n] of Object.entries(roles).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${role}: ${n}`);
  }
  console.log('');
  console.log('[Recommendations]');
  for (const rec of report.recommendations) console.log(`- ${rec}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/runtime/redis-connection-guard.cjs [options]

Options:
  --preflight     Apply safe remediation then gate (for harness/daemon boot)
  --apply         Apply remediation (default unless --dry-run/--gate)
  --dry-run       Report only, no CLIENT KILL / process cull / CONFIG SET
  --gate          Exit 2 if still critical after run
  --json          Print JSON report
  --idle-timeout <sec>   Redis CONFIG timeout (default ${DEFAULTS.idleTimeoutSec})
  --reap-idle <sec>      Kill unprotected clients idle >= N (default ${DEFAULTS.reapIdleSec})
`);
    process.exit(0);
  }

  const report = runGuard(args);
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(report, null, 2));

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);

  if (args.gate && report.overall === 'critical') process.exit(2);
  if (report.before.ping !== 'PONG' && report.before.ping !== undefined && report.overall === 'critical') {
    // already handled by gate; keep exit 1 when redis is fully down and not gate mode
    if (!args.gate) process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runGuard, collectSnapshot, parseClientList };
