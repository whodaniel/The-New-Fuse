#!/usr/bin/env node

/**
 * TNF FULLY AUTONOMOUS DIRECTOR (v4)
 *
 * Logic delegated to Sub-Agent Directive: "RESONANCE"
 * Uses the official TNF Envelope Protocol via Redis Bus to delegate tasks.
 */

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _directorGuard = singleInstanceGuard({ lockName: 'tnf-director-loop', staleMs: 5 * 60 * 1000 });
if (!_directorGuard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _directorGuard.existingLock }));
  process.exit(0);
}

const { RedisAgentClient } = require('../lib/redis-agent-client.cjs');
const { createSuperAdminFanout } = require('./lib/super-admin-fanout.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..', '..');

const config = {
  root: process.env.TNF_ROOT_DIR || DEFAULT_REPO_ROOT,
  stateDir: path.join(os.homedir(), '.tnf', 'director', 'state'),
  logFile: path.join(os.homedir(), '.tnf', 'director', 'logs', 'director.log'),
  heartbeatSource: path.join(os.homedir(), '.tnf', 'local-subdirector', 'state', 'local-subdirector-heartbeat.json'),
  terminalHeartbeatSource: path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json'),
  terminalHeartbeatHistoryDir: path.join(
    os.homedir(),
    '.tnf',
    'terminal-heartbeat',
    'state',
    'history'
  ),
  healthStateFile: path.join(os.homedir(), '.tnf', 'director', 'state', 'director-health.json'),
  localHeartbeatMaxAgeMs: parsePositiveInt(process.env.TNF_DIRECTOR_LOCAL_HEARTBEAT_MAX_AGE_MS, 10 * 60 * 1000),
  terminalHeartbeatMaxAgeMs: parsePositiveInt(process.env.TNF_DIRECTOR_TERMINAL_HEARTBEAT_MAX_AGE_MS, 5 * 60 * 1000),
  terminalHistoryMaxAgeMs: parsePositiveInt(process.env.TNF_DIRECTOR_TERMINAL_HISTORY_MAX_AGE_MS, 12 * 60 * 60 * 1000),
  // LDA Issued resonancePool
  resonancePool: [
    'RESONANCE: Port MapReducePattern to terminal workflow.',
    'RESONANCE: Execute Consensus round for refactoring.',
    'RESONANCE: Fix Turbo concurrency collisions.',
    'RESONANCE: Resolve package.json conflicts.',
    'RESONANCE: Cleanup legacy prototype noise.',
    'OPTIMIZATION: Refine force-submission protocol.',
    'INFRA: Audit Redis/WS communication backbone.'
  ]
};

const superAdminFanout = createSuperAdminFanout({ log });

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function log(message, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    role: 'Local-Director-Agent',
    ...metadata
  };
  console.log(JSON.stringify(entry));
  fs.appendFileSync(config.logFile, JSON.stringify(entry) + '\n');
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    log('Failed to parse JSON', { filePath, error: String(error.message || error) });
    return null;
  }
}

function fileAgeMs(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const stat = fs.statSync(filePath);
    return Math.max(0, Date.now() - stat.mtimeMs);
  } catch (_error) {
    return null;
  }
}

function loadHealthState() {
  const parsed = safeReadJson(config.healthStateFile);
  if (!parsed || typeof parsed !== 'object') return { status: 'unknown', updatedAt: null };
  return {
    status: String(parsed.status || 'unknown'),
    updatedAt: parsed.updatedAt || null,
  };
}

function writeHealthState(status, metadata = {}) {
  fs.mkdirSync(path.dirname(config.healthStateFile), { recursive: true });
  const payload = {
    status,
    updatedAt: new Date().toISOString(),
    ...metadata,
  };
  const tempPath = `${config.healthStateFile}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tempPath, config.healthStateFile);
}

function loadSessions() {
  const diagnostics = {
    localMissing: !fs.existsSync(config.heartbeatSource),
    terminalMissing: !fs.existsSync(config.terminalHeartbeatSource),
    localHeartbeatAgeMs: fileAgeMs(config.heartbeatSource),
    terminalHeartbeatAgeMs: fileAgeMs(config.terminalHeartbeatSource),
    localStale: false,
    terminalStale: false,
    fallbackUsed: false,
    source: 'none',
  };

  let sessions = [];
  const localHeartbeat = safeReadJson(config.heartbeatSource);
  if (localHeartbeat && Array.isArray(localHeartbeat.sessions)) {
    diagnostics.localStale =
      diagnostics.localHeartbeatAgeMs !== null &&
      diagnostics.localHeartbeatAgeMs > config.localHeartbeatMaxAgeMs;
    if (!diagnostics.localStale && localHeartbeat.sessions.length > 0) {
      sessions = localHeartbeat.sessions;
      diagnostics.source = 'local-subdirector';
      return { sessions, diagnostics };
    }
  }

  const terminalHeartbeat = safeReadJson(config.terminalHeartbeatSource);
  if (terminalHeartbeat && Array.isArray(terminalHeartbeat.observed)) {
    diagnostics.terminalStale =
      diagnostics.terminalHeartbeatAgeMs !== null &&
      diagnostics.terminalHeartbeatAgeMs > config.terminalHeartbeatMaxAgeMs;
    if (!diagnostics.terminalStale) {
      const fallbackSessions = terminalHeartbeat.observed
        .filter((session) => session && session.agentLike)
        .map((session) => ({
          agentId: session.agentId,
          tty: session.tty || null,
          status: session.busy ? 'active' : 'idle',
        }));
      if (fallbackSessions.length > 0) {
        diagnostics.fallbackUsed = true;
        diagnostics.source = 'terminal-heartbeat';
        sessions = fallbackSessions;
      }
    }
  }

  if (sessions.length === 0) {
    const historical = loadHistoricalTerminalSessions();
    if (historical.length > 0) {
      diagnostics.fallbackUsed = true;
      diagnostics.source = 'terminal-heartbeat-history';
      sessions = historical;
    }
  }

  return { sessions, diagnostics };
}

function loadHistoricalTerminalSessions() {
  try {
    if (!fs.existsSync(config.terminalHeartbeatHistoryDir)) return [];
    const files = fs
      .readdirSync(config.terminalHeartbeatHistoryDir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => path.join(config.terminalHeartbeatHistoryDir, name))
      .sort((left, right) => {
        const rightMs = fs.statSync(right).mtimeMs;
        const leftMs = fs.statSync(left).mtimeMs;
        return rightMs - leftMs;
      })
      .slice(0, 80);

    const nowMs = Date.now();
    for (const filePath of files) {
      const stat = fs.statSync(filePath);
      const ageMs = Math.max(0, nowMs - stat.mtimeMs);
      if (ageMs > config.terminalHistoryMaxAgeMs) continue;
      const parsed = safeReadJson(filePath);
      if (!parsed || !Array.isArray(parsed.observed)) continue;
      const sessions = parsed.observed
        .filter((session) => session && session.agentLike)
        .map((session) => ({
          agentId: session.agentId,
          tty: session.tty || null,
          status: session.busy ? 'active' : 'idle',
        }));
      if (sessions.length > 0) {
        log('Using terminal heartbeat history fallback', {
          filePath,
          sessions: sessions.length,
          ageMs,
        });
        return sessions;
      }
    }
    return [];
  } catch (error) {
    log('Failed loading terminal heartbeat history fallback', {
      error: String(error.message || error),
    });
    return [];
  }
}

function computeDirectorStatus(snapshot) {
  const { sessions, diagnostics } = snapshot;
  const bothMissing = diagnostics.localMissing && diagnostics.terminalMissing;
  if (bothMissing || sessions.length === 0) {
    return 'critical';
  }
  if (diagnostics.localStale || diagnostics.fallbackUsed) {
    return 'degraded';
  }
  return 'healthy';
}

async function notifySuperAdmin(event) {
  try {
    const result = await superAdminFanout.notify({
      actorId: 'tnf-director-loop',
      ...event,
    });
    log('Super Admin notify result', {
      code: event.code,
      sent: result.sent,
      skipped: result.skipped || null,
      dedupeKey: result.dedupeKey || null,
    });
    return result;
  } catch (error) {
    log('Super Admin notify failed', {
      code: event.code,
      error: String(error.message || error),
    });
    return null;
  }
}

async function emitHealthEscalations(snapshot, idleAgentsCount) {
  const { sessions, diagnostics } = snapshot;
  const bothMissing = diagnostics.localMissing && diagnostics.terminalMissing;
  if (bothMissing) {
    await notifySuperAdmin({
      severity: 'critical',
      code: 'director_heartbeat_sources_missing',
      dedupeKey: 'director:heartbeat-sources-missing',
      message: 'Both local-subdirector and terminal-heartbeat sources are missing.',
      metadata: {
        heartbeatSource: config.heartbeatSource,
        terminalHeartbeatSource: config.terminalHeartbeatSource,
      },
    });
  }

  if (diagnostics.localStale) {
    await notifySuperAdmin({
      severity: 'warning',
      code: 'director_local_subdirector_stale',
      dedupeKey: 'director:local-subdirector-stale',
      message: 'local-subdirector heartbeat is stale; director is using fallback logic.',
      metadata: {
        localHeartbeatAgeMs: diagnostics.localHeartbeatAgeMs,
        staleThresholdMs: config.localHeartbeatMaxAgeMs,
        fallbackUsed: diagnostics.fallbackUsed,
      },
    });
  }

  if (diagnostics.terminalStale) {
    await notifySuperAdmin({
      severity: 'warning',
      code: 'director_terminal_heartbeat_stale',
      dedupeKey: 'director:terminal-heartbeat-stale',
      message: 'terminal-heartbeat snapshot is stale.',
      metadata: {
        terminalHeartbeatAgeMs: diagnostics.terminalHeartbeatAgeMs,
        staleThresholdMs: config.terminalHeartbeatMaxAgeMs,
      },
    });
  }

  if (sessions.length === 0) {
    await notifySuperAdmin({
      severity: 'critical',
      code: 'director_no_agent_sessions_visible',
      dedupeKey: 'director:no-agent-sessions',
      message: 'Director cannot see any agent-like sessions; human interaction may be required.',
      metadata: {
        source: diagnostics.source,
        idleAgentsCount,
        localMissing: diagnostics.localMissing,
        terminalMissing: diagnostics.terminalMissing,
      },
    });
  }
}

async function main() {
  log('LDA Relay Delegation Cycle Start');

  const snapshot = loadSessions();
  const sessions = Array.isArray(snapshot.sessions) ? snapshot.sessions : [];
  const idleAgents = sessions.filter((session) => session.status === 'idle' || session.status === 'stalled');
  const directorStatus = computeDirectorStatus(snapshot);
  const previousHealthState = loadHealthState();

  log('Session inventory loaded', {
    source: snapshot.diagnostics.source,
    observed: sessions.length,
    idleAgents: idleAgents.length,
    localHeartbeatAgeMs: snapshot.diagnostics.localHeartbeatAgeMs,
    terminalHeartbeatAgeMs: snapshot.diagnostics.terminalHeartbeatAgeMs,
    fallbackUsed: snapshot.diagnostics.fallbackUsed,
  });

  await emitHealthEscalations(snapshot, idleAgents.length);

  if (previousHealthState.status && previousHealthState.status !== 'healthy' && directorStatus === 'healthy') {
    await notifySuperAdmin({
      severity: 'info',
      code: 'director_recovered',
      dedupeKey: 'director:recovered',
      message: 'Director recovered to healthy status.',
      metadata: {
        previousStatus: previousHealthState.status,
        observedSessions: sessions.length,
      },
      force: true,
    });
  }
  writeHealthState(directorStatus, {
    source: snapshot.diagnostics.source,
    observedSessions: sessions.length,
    idleAgents: idleAgents.length,
  });

  const client = new RedisAgentClient();
  let publishFailures = 0;
  let zeroSubscriberPublishes = 0;
  let published = 0;
  try {
    await client.initialize();

    for (const agent of idleAgents) {
      if (config.resonancePool.length === 0) break;
      const task = config.resonancePool.shift();
      const pingId = `relay_task_${Date.now()}_${agent.agentId}`;
      const envelope = {
        id: crypto.randomUUID(),
        type: 'event',
        from: { agentId: 'Local-Director', role: 'orchestrator' },
        to: { broadcast: true },
        payload: {
          eventType: 'wake_ping',
          data: {
            pingId,
            targetAgentId: agent.agentId,
            customPrompt: `TNF Resonance Task: ${task}. This is a RELAY-delegated directive. Execute and report.`,
          },
        },
        timestamp: new Date().toISOString(),
      };

      log('Publishing Delegation Envelope', { agentId: agent.agentId, task });
      try {
        const delivered = await client.publisher.publish('tnf:bus:ingress', JSON.stringify(envelope));
        published += 1;
        if (Number(delivered) <= 0) zeroSubscriberPublishes += 1;
      } catch (error) {
        publishFailures += 1;
        log('Publish failure', {
          agentId: agent.agentId,
          error: String(error.message || error),
        });
      }
    }
  } finally {
    try {
      await client.cleanup();
    } catch (_error) {}
  }

  if (publishFailures > 0) {
    await notifySuperAdmin({
      severity: 'critical',
      code: 'director_publish_failures',
      dedupeKey: 'director:publish-failures',
      message: 'Director failed to publish one or more wake envelopes.',
      metadata: {
        publishFailures,
        published,
      },
    });
  }
  if (published > 0 && zeroSubscriberPublishes === published) {
    await notifySuperAdmin({
      severity: 'warning',
      code: 'director_bus_no_subscribers',
      dedupeKey: 'director:bus-no-subscribers',
      message: 'Wake envelopes were published but no relay subscribers acknowledged.',
      metadata: {
        published,
        zeroSubscriberPublishes,
      },
    });
  }

  log('LDA Relay Delegation Cycle Complete');
}

// Ensure Directories
if (!fs.existsSync(path.dirname(config.logFile))) {
  fs.mkdirSync(path.dirname(config.logFile), { recursive: true });
}
if (!fs.existsSync(config.stateDir)) {
  fs.mkdirSync(config.stateDir, { recursive: true });
}

main().catch(err => {
  log('LDA Relay Error', { error: err.message });
  notifySuperAdmin({
    severity: 'critical',
    code: 'director_loop_fatal',
    dedupeKey: 'director:loop-fatal',
    message: 'Director loop crashed.',
    metadata: {
      error: String(err.message || err),
    },
    force: true,
  }).catch(() => {});
  process.exit(1);
});
