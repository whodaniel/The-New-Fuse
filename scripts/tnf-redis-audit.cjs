#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * TNF Redis connection audit — diagnose maxclients saturation and duplicate consumers.
 *
 * Usage:
 *   node scripts/tnf-redis-audit.cjs [--json] [--strict]
 *
 * Exit 2 when Redis is saturated or client utilization >= warn threshold.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const WARN_UTILIZATION = 0.8;
const CRITICAL_UTILIZATION = 0.95;

const REDIS_CONSUMER_HINTS = [
  { id: 'green-channel-coordinator', pattern: /green-channel-coordinator/ },
  { id: 'redis-ws-bridge', pattern: /redis-ws-bridge/ },
  { id: 'gemini-redis-wrapper', pattern: /gemini-redis-wrapper/ },
  { id: 'pi-redis-wrapper', pattern: /pi-redis-wrapper/ },
  { id: 'antigravity-redis-wrapper', pattern: /antigravity-redis-wrapper/ },
  { id: 'jules-redis-wrapper', pattern: /jules-redis-wrapper/ },
  { id: 'claude-redis-wrapper', pattern: /claude-redis-wrapper/ },
  { id: 'master-clock', pattern: /master-clock\.js/ },
  { id: 'broker-agent', pattern: /broker-agent\.js/ },
  { id: 'director-agent', pattern: /director-agent\.js/ },
  { id: 'standalone-relay', pattern: /standalone-relay\.js/ },
  { id: 'impetus-loop', pattern: /impetus-loop/ },
  { id: 'project-planner', pattern: /project-planner/ },
  { id: 'relay-channel-monitor', pattern: /relay-channel-monitor/ },
  { id: 'tnf-agent-daemon', pattern: /tnf-agent-daemon/ },
  { id: 'hermes-gateway', pattern: /hermes_cli\.main gateway/ },
];

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    strict: argv.includes('--strict'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function run(cmd, args = [], opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });
}

function runShell(command) {
  return run('/bin/zsh', ['-lc', command]);
}

function redisCmd(...parts) {
  const result = run('redis-cli', parts);
  const out = String(result.stdout || '').trim();
  const err = String(result.stderr || '').trim();
  if (/ERR max number of clients reached/i.test(out + err)) {
    return { ok: false, saturated: true, out, err };
  }
  if (result.status !== 0 && !out) {
    return { ok: false, saturated: false, out, err };
  }
  return { ok: true, saturated: false, out, err };
}

function parseInfoSection(text, section) {
  const lines = String(text || '').split('\n');
  const prefix = `# ${section}`;
  const map = {};
  let inSection = false;
  for (const line of lines) {
    if (line.startsWith('#')) {
      inSection = line.trim() === prefix;
      continue;
    }
    if (!inSection || !line.includes(':')) continue;
    const idx = line.indexOf(':');
    map[line.slice(0, idx)] = line.slice(idx + 1).trim();
  }
  return map;
}

function countLsofRedisConnections() {
  const probe = runShell("lsof -nP -iTCP:6379 2>/dev/null | tail -n +2");
  const rows = [];
  for (const line of String(probe.stdout || '').split('\n')) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;
    rows.push({
      command: parts[0],
      pid: Number.parseInt(parts[1], 10),
      user: parts[2],
      name: parts.slice(8).join(' '),
    });
  }
  const byPid = new Map();
  for (const row of rows) {
    if (!Number.isFinite(row.pid)) continue;
    const prev = byPid.get(row.pid) || { pid: row.pid, command: row.command, connections: 0 };
    prev.connections += 1;
    byPid.set(row.pid, prev);
  }
  return {
    totalConnections: rows.length,
    byPid: Array.from(byPid.values()).sort((a, b) => b.connections - a.connections),
  };
}

function matchConsumer(commandLine) {
  const hay = String(commandLine || '');
  for (const hint of REDIS_CONSUMER_HINTS) {
    if (hint.pattern.test(hay)) return hint.id;
  }
  if (/redis-server/.test(hay)) return 'redis-server';
  if (/node/.test(hay)) return 'node-other';
  return 'other';
}

function listRedisConsumerProcesses() {
  const probe = runShell('ps -axo pid=,command=');
  const consumers = [];
  for (const line of String(probe.stdout || '').split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/);
    if (!m) continue;
    const pid = Number.parseInt(m[1], 10);
    const command = m[2];
    const role = matchConsumer(command);
    if (role === 'other' && !/6379|redis|ioredis|tnf:bus|synaptic/i.test(command)) continue;
    if (role === 'other' && !/redis-wrapper|relay-core|green-channel|impetus-loop|project-planner/.test(command)) {
      continue;
    }
    consumers.push({ pid, role, command: command.slice(0, 180) });
  }
  const byRole = new Map();
  for (const row of consumers) {
    const list = byRole.get(row.role) || [];
    list.push(row);
    byRole.set(row.role, list);
  }
  return {
    processes: consumers.sort((a, b) => a.role.localeCompare(b.role) || a.pid - b.pid),
    byRole: Object.fromEntries(
      Array.from(byRole.entries())
        .map(([role, list]) => [role, list.length])
        .sort((a, b) => b[1] - a[1])
    ),
  };
}

function inferRecommendations(report) {
  const recs = [];
  if (report.redis.ping !== 'PONG') {
    recs.push('Restart local Redis: bash scripts/runtime/redis-local-bootstrap.sh restart');
  }
  if (report.redis.utilization >= CRITICAL_UTILIZATION || report.redis.saturated) {
    recs.push('Redis near/at maxclients — run: bash scripts/runtime/redis-local-bootstrap.sh restart');
    recs.push('Stop duplicate redis wrappers not actively federating (gemini/pi/antigravity/jules).');
  } else if (report.redis.utilization >= WARN_UTILIZATION) {
    recs.push('Redis client utilization high — audit duplicate Node consumers and shared pools.');
  }
  const dupRoles = Object.entries(report.processes.byRole || {}).filter(([, n]) => n > 1);
  for (const [role, count] of dupRoles) {
    if (role.endsWith('-redis-wrapper') && count > 1) {
      recs.push(`Multiple ${role} instances (${count}) — keep one listener per lane.`);
    }
  }
  const heavy = report.lsof.byPid.filter((r) => r.connections >= 4).slice(0, 5);
  for (const row of heavy) {
    recs.push(`PID ${row.pid} (${row.command}) holds ${row.connections} Redis TCP connections — investigate pool leak.`);
    if (row.connections >= 100 && /node/i.test(row.command)) {
      const ps = runShell(`ps -p ${row.pid} -o command= 2>/dev/null`);
      const cmd = String(ps.stdout || '').trim();
      if (/master-clock/.test(cmd)) {
        recs.push(
          'master-clock reconnect leak suspected — restart: pkill -f "node dist/master-clock.js" (supervisor will respawn); ensure relay-core is rebuilt.'
        );
      }
    }
  }
  if (recs.length === 0) {
    recs.push('Redis connection budget looks acceptable; re-run after fleet changes.');
  }
  return [...new Set(recs)];
}

function collectRedisAudit() {
  const ping = redisCmd('ping');
  const infoClients = redisCmd('INFO', 'clients');
  const configMax = redisCmd('CONFIG', 'GET', 'maxclients');

  let connectedClients = null;
  let maxclients = 10000;
  let blockedClients = null;

  if (infoClients.ok) {
    const clients = parseInfoSection(infoClients.out, 'Clients');
    connectedClients = Number.parseInt(clients.connected_clients || '', 10);
    maxclients = Number.parseInt(clients.maxclients || '', 10) || maxclients;
    blockedClients = Number.parseInt(clients.blocked_clients || '', 10);
  }
  if (configMax.ok) {
    const lines = configMax.out.split('\n').map((l) => l.trim()).filter(Boolean);
    const idx = lines.indexOf('maxclients');
    if (idx >= 0 && lines[idx + 1]) {
      maxclients = Number.parseInt(lines[idx + 1], 10) || maxclients;
    }
  }

  const lsof = countLsofRedisConnections();
  if (connectedClients == null && lsof.totalConnections > 0) {
    connectedClients = lsof.totalConnections;
  }

  const utilization =
    connectedClients != null && maxclients > 0 ? connectedClients / maxclients : null;

  let level = 'ok';
  if (ping.saturated || (utilization != null && utilization >= CRITICAL_UTILIZATION)) level = 'critical';
  else if (utilization != null && utilization >= WARN_UTILIZATION) level = 'warn';

  const processes = listRedisConsumerProcesses();
  const report = {
    generatedAt: new Date().toISOString(),
    workspace: ROOT,
    overall: level,
    redis: {
      ping: ping.ok ? ping.out : ping.err || ping.out || 'DOWN',
      saturated: Boolean(ping.saturated),
      connectedClients,
      maxclients,
      blockedClients,
      utilization: utilization != null ? Math.round(utilization * 1000) / 1000 : null,
      utilizationPct: utilization != null ? Math.round(utilization * 100) : null,
    },
    lsof,
    processes,
    recommendations: [],
  };
  report.recommendations = inferRecommendations(report);

  const outDir = path.join(os.homedir(), '.tnf', 'fleet', 'state');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'redis-audit-latest.json'), JSON.stringify(report, null, 2));

  return report;
}

function printHuman(report) {
  console.log('TNF Redis Audit');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Overall: ${report.overall.toUpperCase()}`);
  console.log('');
  console.log('[Redis]');
  console.log(`- ping: ${report.redis.ping}`);
  console.log(
    `- clients: ${report.redis.connectedClients ?? '?'} / ${report.redis.maxclients} (${report.redis.utilizationPct ?? '?'}%)`
  );
  if (report.redis.blockedClients != null) {
    console.log(`- blocked: ${report.redis.blockedClients}`);
  }
  console.log(`- lsof tcp:6379 connections: ${report.lsof.totalConnections}`);
  console.log('');
  console.log('[Consumers by role]');
  for (const [role, count] of Object.entries(report.processes.byRole || {}).sort((a, b) => b[1] - a[1])) {
    console.log(`- ${role}: ${count}`);
  }
  console.log('');
  console.log('[Top connection holders]');
  for (const row of report.lsof.byPid.slice(0, 8)) {
    console.log(`- pid ${row.pid} (${row.command}): ${row.connections}`);
  }
  console.log('');
  console.log('[Recommendations]');
  for (const rec of report.recommendations) {
    console.log(`- ${rec}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/tnf-redis-audit.cjs [--json] [--strict]');
    process.exit(0);
  }
  if (!fs.existsSync(path.join(ROOT, '.agent'))) {
    console.error('FAIL: run from TNF repo root');
    process.exit(1);
  }
  const report = collectRedisAudit();
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
  if (args.strict && report.overall !== 'ok') {
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collectRedisAudit };
