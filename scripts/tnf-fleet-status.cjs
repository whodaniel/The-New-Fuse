#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const TNF_HOME = path.join(os.homedir(), '.tnf');
const { collectRedisAudit } = require('./tnf-redis-audit.cjs');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return '';
  }
}

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    strict: argv.includes('--strict'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function runShell(command) {
  const result = spawnSync('/bin/zsh', ['-lc', command], { encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
  };
}

function parseDfFreeGb() {
  const out = runShell("df -g / 2>/dev/null | awk 'NR==2 {print $4}'");
  const gb = Number.parseInt(out.stdout, 10);
  return Number.isFinite(gb) ? gb : null;
}

function httpJson(url, timeoutMs = 4000) {
  const out = runShell(
    `curl -s --max-time ${Math.ceil(timeoutMs / 1000)} ${JSON.stringify(url)} 2>/dev/null`
  );
  if (!out.ok || !out.stdout) return null;
  try {
    return JSON.parse(out.stdout);
  } catch {
    return null;
  }
}

function relayHealth(port) {
  const code = runShell(
    `curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:${port}/health 2>/dev/null`
  );
  const http = Number.parseInt(code.stdout, 10);
  const agentsPayload = httpJson(`http://127.0.0.1:${port}/agents`);
  let agentCount = 0;
  if (Array.isArray(agentsPayload)) agentCount = agentsPayload.length;
  else if (agentsPayload && Array.isArray(agentsPayload.agents)) agentCount = agentsPayload.agents.length;
  return {
    port,
    http: Number.isFinite(http) ? http : 0,
    up: http === 200,
    agentCount,
  };
}

function brokerGreenStatus() {
  const pidFile = path.join(TNF_HOME, 'green-coordinator', 'coordinator.pid');
  const pidFromFile = Number.parseInt(readText(pidFile), 10);
  let pid = pidFromFile;
  let alive = isPidAlive(pid, 'green-channel-coordinator');
  if (!alive) {
    const probe = runShell("pgrep -f 'green-channel-coordinator' | head -1");
    const pgPid = Number.parseInt(probe.stdout, 10);
    if (isPidAlive(pgPid, 'green-channel-coordinator')) {
      pid = pgPid;
      alive = true;
    }
  }
  return { pid: alive ? pid : null, alive, pidFile };
}

function processAtlasStatus() {
  const verifyPath = path.join(ROOT, '.verifier', 'process-atlas.verify.json');
  const verify = readJson(verifyPath);
  const digestPath = path.join(ROOT, '.verifier', 'process-atlas.digest.md');
  return {
    verifyPath,
    digestPresent: fs.existsSync(digestPath),
    ok: verify?.ok === true,
    generatedAt: verify?.now || null,
  };
}

function isPidAlive(pid, hint) {
  if (!pid || !Number.isFinite(Number(pid))) return false;
  const probe = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
  if (probe.status !== 0) return false;
  const cmd = String(probe.stdout || '');
  if (hint && !cmd.includes(hint)) return false;
  return true;
}

function countTsserverRamMb() {
  const probe = spawnSync('ps', ['aux'], { encoding: 'utf8' });
  if (probe.status !== 0) return { count: 0, rssMb: 0 };
  let count = 0;
  let rssKb = 0;
  for (const line of String(probe.stdout || '').split('\n')) {
    if (!line.includes('tsserver.js')) continue;
    count += 1;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 6) rssKb += Number.parseInt(parts[5], 10) || 0;
  }
  return { count, rssMb: Math.round(rssKb / 1024) };
}

function portListening(port) {
  const out = runShell(`lsof -iTCP:${port} -sTCP:LISTEN -P 2>/dev/null | wc -l | tr -d ' '`);
  const count = Number.parseInt(out.stdout, 10);
  return Number.isFinite(count) && count > 0;
}

function ageHours(iso) {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.round((ms / 3600000) * 10) / 10;
}

function classifyDisk(freeGb) {
  if (freeGb == null) return { level: 'unknown', warn: false, critical: false };
  if (freeGb < 2) return { level: 'critical', warn: true, critical: true };
  if (freeGb < 5) return { level: 'warn', warn: true, critical: false };
  return { level: 'ok', warn: false, critical: false };
}

function readHandoffFreshness() {
  const canonical = readJson(path.join(ROOT, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'));
  const cache = readJson(path.join(TNF_HOME, 'handoff-current.json'));
  const canonicalId = canonical?.handoff_id || null;
  const cacheId = cache?.handoff_id || cache?.sessionKey || null;
  const ageHoursCanonical = ageHours(canonical?.created_at);
  const ageHoursCache = ageHours(cache?.generatedAt || cache?.UPDATED);
  const synced = Boolean(canonicalId && cacheId && canonicalId === cacheId);
  const stale = ageHoursCanonical != null ? ageHoursCanonical > 24 : true;
  return {
    canonicalId,
    cacheId,
    synced,
    stale,
    ageHoursCanonical,
    ageHoursCache,
    projectIds: canonical?.project_ids || [],
  };
}

function computeCoherenceScore(report, handoff) {
  const factors = [];
  let score = 100;

  if (handoff.synced) factors.push('handoff-cache-synced');
  else {
    score -= 15;
    factors.push('handoff-cache-drift');
  }
  if (handoff.stale) {
    score -= 10;
    factors.push('handoff-stale');
  }
  if (report.disk.critical) {
    score -= 25;
    factors.push('disk-critical');
  } else if (report.disk.warn) {
    score -= 10;
    factors.push('disk-warn');
  }
  if (report.redis.overall === 'critical') {
    score -= 20;
    factors.push('redis-critical');
  } else if (report.redis.overall === 'warn') {
    score -= 8;
    factors.push('redis-warn');
  }
  if (!report.brokerGreen.alive) {
    score -= 10;
    factors.push('broker-green-down');
  }
  if (!report.processes.factorySupervisor.alive) {
    score -= 8;
    factors.push('factory-supervisor-down');
  }
  if (report.roleMap.stale) {
    score -= 8;
    factors.push('role-map-stale');
  }
  if (!report.roleMap.ownerAgentId) {
    score -= 7;
    factors.push('no-launch-owner');
  }
  if (report.terminals.observed > 0 && report.terminals.agentLike >= 4) {
    score -= 5;
    factors.push('high-parallel-agent-count');
  }
  if (report.subdirector.status === 'blocked') {
    score -= 10;
    factors.push('subdirector-blocked');
  }

  score = Math.max(0, Math.min(100, score));
  let level = 'high';
  if (score < 50) level = 'low';
  else if (score < 75) level = 'medium';

  return { score, level, factors };
}

function inferRecommendedAction(report) {
  if (report.redis?.overall === 'critical') {
    return 'Run: bash scripts/runtime/redis-local-bootstrap.sh restart && node scripts/tnf-redis-audit.cjs';
  }
  if (report.redis?.overall === 'warn') {
    return 'Redis client utilization high — run: tnf fleet redis-audit and stop duplicate wrappers.';
  }
  if (!report.brokerGreen.alive) {
    return 'Start BROKER-Green: bash scripts/runtime/green-channel-coordinator-service.sh start';
  }
  if (report.processes.relay3007.up && report.processes.relay3007.agentCount === 0) {
    return 'Relay up but 0 agents — reload chrome extension and open Green chat tabs.';
  }
  if (report.disk.critical) {
    return 'Run: tnf fleet retain — then free git/tmp/build artifacts before full-auto cycles.';
  }
  if (!report.processes.factorySupervisor.alive) {
    return 'Start factory-supervisor via factory-boot.sh.';
  }
  if (report.fullAuto.failedCycles > 0 && !report.fullAuto.lastOk) {
    return 'Restart full-auto with local-safe flags (--skip-scorecard --skip-live-links).';
  }
  if (report.roleMap.stale) {
    return 'Run fleet-role-map-reconcile to refresh terminal role assignments.';
  }
  if (report.memory.tsserverCount > 2) {
    return 'Restart Hermes/IDE lane to drop duplicate TypeScript language servers.';
  }
  if (!report.processes.relay3000.listening && report.processes.relay3007.listening) {
    return 'Relay on :3007 only; run factory-boot if :3000 is required.';
  }
  return 'Fleet coordination path looks healthy; dispatch via Redis/broadcast.';
}

function collectFleetStatus() {
  const terminalHb = readJson(path.join(TNF_HOME, 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json'));
  const subdirectorHb = readJson(path.join(TNF_HOME, 'local-subdirector', 'state', 'local-subdirector-heartbeat.json'));
  const roleMap = readJson(path.join(TNF_HOME, 'session-discovery', 'terminal-role-map.json'));
  const fullAutoState = readJson(path.join(ROOT, 'docs/operations/tnf-full-auto-state.json'));
  const supervisorPidFile = path.join(ROOT, '.agent/runtime-state/supervisor/supervisor.pid');
  const fullAutoPidFile = path.join(ROOT, 'docs/operations/tnf-full-auto-daemon.pid');
  const fleetSnapshot = readJson(path.join(TNF_HOME, 'fleet', 'state', 'fleet-snapshot-latest.json'));

  const supervisorPid = Number.parseInt(readText(supervisorPidFile), 10);
  const fullAutoPid = Number.parseInt(readText(fullAutoPidFile), 10);
  const fullAutoPgrep = runShell("pgrep -f 'full-auto start' | head -1");
  const fullAutoPgrepPid = Number.parseInt(fullAutoPgrep.stdout, 10);
  const fullAutoAlive =
    isPidAlive(fullAutoPid, 'full-auto') || isPidAlive(fullAutoPgrepPid, 'full-auto');
  const supervisorPgrep = runShell("pgrep -f 'factory-supervisor.sh' | head -1");
  const supervisorPgrepPid = Number.parseInt(supervisorPgrep.stdout, 10);
  const supervisorAlive =
    isPidAlive(supervisorPid, 'factory-supervisor') ||
    isPidAlive(supervisorPgrepPid, 'factory-supervisor');
  const freeGb = parseDfFreeGb();
  const disk = { freeGb, ...classifyDisk(freeGb) };
  const memory = countTsserverRamMb();
  const redis = collectRedisAudit();
  const relay3007 = relayHealth(3007);
  const relay3000 = relayHealth(3000);
  const brokerGreen = brokerGreenStatus();
  const processAtlas = processAtlasStatus();
  const handoff = readHandoffFreshness();

  const roleMapAgeH = ageHours(roleMap?.generatedAt);
  const terminalAgeH = ageHours(terminalHb?.generatedAt);
  const subdirectorAgeH = ageHours(subdirectorHb?.generatedAt);

  const report = {
    generatedAt: new Date().toISOString(),
    workspace: ROOT,
    overall: 'healthy',
    disk,
    memory: {
      tsserverCount: memory.count,
      tsserverRssMb: memory.rssMb,
      profile: process.env.TNF_SWARM_RAM_PROFILE || 'conservative-16gb',
      warn: memory.count > 2,
    },
    terminals: {
      observed: terminalHb?.summary?.observedSessions ?? 0,
      agentLike: terminalHb?.summary?.agentSessions ?? 0,
      injections: terminalHb?.summary?.injections ?? 0,
      heartbeatAgeHours: terminalAgeH,
      safeMode: terminalHb?.functionalGaps?.some((g) => String(g).includes('Interactive Safe Mode')) ?? null,
    },
    subdirector: {
      status: subdirectorHb?.status || 'unknown',
      sessions: subdirectorHb?.summary?.observedSessions ?? 0,
      idleSessions: subdirectorHb?.summary?.idleSessions ?? 0,
      unavailableLanes: subdirectorHb?.summary?.unavailableLanes || [],
      heartbeatAgeHours: subdirectorAgeH,
      processFallback: Boolean(subdirectorHb?.summary?.processFallbackActive),
    },
    roleMap: {
      generatedAt: roleMap?.generatedAt || null,
      ageHours: roleMapAgeH,
      stale: roleMapAgeH != null ? roleMapAgeH > 24 : true,
      ownerAgentId: roleMap?.owner?.agentId || null,
      ownerTty: roleMap?.owner?.tty || null,
      aliasCount: roleMap?.aliases ? Object.keys(roleMap.aliases).length : 0,
    },
    processes: {
      factorySupervisor: {
        pid: supervisorAlive
          ? supervisorPgrepPid || supervisorPid || null
          : Number.isFinite(supervisorPid)
            ? supervisorPid
            : null,
        alive: supervisorAlive,
      },
      fullAutoDaemon: {
        pid: fullAutoAlive ? fullAutoPgrepPid || fullAutoPid || null : Number.isFinite(fullAutoPid) ? fullAutoPid : null,
        alive: fullAutoAlive,
      },
      relay3000: { listening: portListening(3000), ...relay3000 },
      relay3007: { listening: portListening(3007), ...relay3007 },
      bridge3005: { listening: portListening(3005) },
    },
    redis: {
      overall: redis.overall,
      ping: redis.redis.ping,
      connectedClients: redis.redis.connectedClients,
      maxclients: redis.redis.maxclients,
      utilizationPct: redis.redis.utilizationPct,
      saturated: redis.redis.saturated,
      topRecommendations: redis.recommendations.slice(0, 3),
    },
    brokerGreen,
    processAtlas,
    fullAuto: {
      mode: fullAutoState?.mode || 'unknown',
      completedCycles: fullAutoState?.completedCycles ?? 0,
      failedCycles: fullAutoState?.failedCycles ?? 0,
      lastOk: fullAutoState?.lastRun?.ok ?? null,
      lastError: fullAutoState?.lastRun?.error || null,
    },
    reconcile: fleetSnapshot?.reconcile || null,
    handoff,
    recommendedAction: '',
  };

  report.coherence = computeCoherenceScore(report, handoff);

  const degradedReasons = [];
  if (redis.overall === 'critical') degradedReasons.push('redis-critical');
  else if (redis.overall === 'warn') degradedReasons.push('redis-warn');
  if (!brokerGreen.alive) degradedReasons.push('broker-green-down');
  if (relay3007.up && relay3007.agentCount === 0) degradedReasons.push('relay-zero-agents');
  if (disk.critical) degradedReasons.push('disk-critical');
  if (!report.processes.factorySupervisor.alive) degradedReasons.push('factory-supervisor-down');
  if (report.fullAuto.failedCycles > 0 && report.fullAuto.lastOk === false) degradedReasons.push('full-auto-failing');
  if (report.roleMap.stale) degradedReasons.push('role-map-stale');
  if (terminalAgeH != null && terminalAgeH > 1) degradedReasons.push('terminal-heartbeat-stale');
  if (subdirectorAgeH != null && subdirectorAgeH > 1) degradedReasons.push('subdirector-heartbeat-stale');
  if (memory.count > 2) degradedReasons.push('tsserver-bloat');

  if (
    degradedReasons.some(
      (r) =>
        r === 'disk-critical' ||
        r === 'factory-supervisor-down' ||
        r === 'redis-critical' ||
        r === 'broker-green-down'
    )
  ) {
    report.overall = 'critical';
  } else if (degradedReasons.length > 0) {
    report.overall = 'degraded';
  }
  report.degradedReasons = degradedReasons;
  report.recommendedAction = inferRecommendedAction(report);

  const outDir = path.join(TNF_HOME, 'fleet', 'state');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'fleet-status-latest.json'), JSON.stringify(report, null, 2));

  return report;
}

function printHuman(report) {
  console.log('TNF Fleet Status');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Overall: ${report.overall.toUpperCase()}`);
  console.log(
    `[Coherence] ${report.coherence.score}/100 (${report.coherence.level}) — ${report.coherence.factors.join(', ') || 'aligned'}`
  );
  console.log('');
  console.log('[Disk]');
  console.log(`- free: ${report.disk.freeGb ?? 'unknown'}GB (${report.disk.level})`);
  console.log('[Memory]');
  console.log(
    `- tsserver: ${report.memory.tsserverCount} instances (~${report.memory.tsserverRssMb}MB RSS)${report.memory.warn ? ' WARN' : ''}`
  );
  console.log('[Redis]');
  console.log(
    `- ping: ${report.redis.ping} clients=${report.redis.connectedClients ?? '?'} / ${report.redis.maxclients} (${report.redis.utilizationPct ?? '?'}%) [${report.redis.overall}]`
  );
  console.log('[Processes]');
  console.log(
    `- broker-green: ${report.brokerGreen.alive ? 'up' : 'DOWN'} (pid=${report.brokerGreen.pid ?? 'n/a'})`
  );
  console.log(
    `- factory-supervisor: ${report.processes.factorySupervisor.alive ? 'up' : 'DOWN'} (pid=${report.processes.factorySupervisor.pid ?? 'n/a'})`
  );
  console.log(
    `- full-auto: ${report.processes.fullAutoDaemon.alive ? 'up' : 'down'} failedCycles=${report.fullAuto.failedCycles}`
  );
  console.log(
    `- relay: :3007=${report.processes.relay3007.up ? 'up' : 'down'} agents=${report.processes.relay3007.agentCount} :3000=${report.processes.relay3000.up ? 'up' : 'down'} bridge:3005=${report.processes.bridge3005.listening ? 'yes' : 'no'}`
  );
  console.log(
    `- process-atlas: verify=${report.processAtlas.ok ? 'ok' : 'stale/missing'} digest=${report.processAtlas.digestPresent ? 'yes' : 'no'}`
  );
  console.log('[Fleet views]');
  console.log(
    `- terminals: observed=${report.terminals.observed} agentLike=${report.terminals.agentLike} age=${report.terminals.heartbeatAgeHours ?? '?'}h`
  );
  console.log(
    `- subdirector: ${report.subdirector.status} sessions=${report.subdirector.sessions} fallback=${report.subdirector.processFallback}`
  );
  console.log(
    `- role-map: age=${report.roleMap.ageHours ?? '?'}h stale=${report.roleMap.stale} owner=${report.roleMap.ownerAgentId ?? 'unset'}`
  );
  console.log(
    `- handoff: canonical=${report.handoff.canonicalId ?? 'n/a'} cache=${report.handoff.cacheId ?? 'n/a'} synced=${report.handoff.synced}`
  );
  if (report.degradedReasons?.length) {
    console.log(`- reasons: ${report.degradedReasons.join(', ')}`);
  }
  console.log('');
  console.log(`Next: ${report.recommendedAction}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/tnf-fleet-status.cjs [--json] [--strict]');
    process.exit(0);
  }
  if (!fs.existsSync(path.join(ROOT, '.agent'))) {
    console.error('FAIL: run from TNF repo root');
    process.exit(1);
  }
  const report = collectFleetStatus();
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
  if (args.strict && report.overall !== 'healthy') {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collectFleetStatus, computeCoherenceScore, readHandoffFreshness };
