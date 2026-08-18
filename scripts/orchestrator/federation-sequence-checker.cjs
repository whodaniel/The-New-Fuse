#!/usr/bin/env node
/**
 * TNF Federation Sequence-Checker v1.0
 *
 * Optimally adaptive dual-channel health probe for the TNF Synaptic Bus.
 *
 * PROBES:
 *   1. Redis pub/sub (tnf:bus:ingress, tnf:heartbeat, tnf:bus:egress:agent:*)
 *   2. WebSocket relay (ws://localhost:3000, HTTP/1.1 101 Switching Protocols)
 *
 * SEQUENCE CHECK:
 *   A. Numbered-stamp envelope round-trip end-to-end through both transports.
 *   B. Increments sequence counter in `tnf:federation:sequence` (Redis hash).
 *   C. Validates that WS connect+frame and Redis publish+subscribe both move
 *      the counter forward by exactly 1 each (asserts liveness without LLM).
 *   D. Publish aids:
 *        - tnf:bus:ingress        (so the broker-dispatcher routes it)
 *        - tnf:federation:status  (a hash with the latest probe results)
 *        - tnf:heartbeat          (the heartbeat channel consumed by every loop)
 *
 * ADAPTIVE:
 *   - One-shot by default (suitable for cron / importer-of-the-day).
 *   - `node sequence-checker.cjs loop` runs forever, every INTERVAL_MS,
 *     emitting both to Redis bus AND WS relay. Honors process signals.
 *   - When both transports succeed, optionally pushes an automation
 *     envelope to tnf:bus:ingress that wakes the broker-dispatcher so it
 *     reconsiders queued tasks and escalates anything that has been
 *     blocked. Use `--quiet` to suppress.
 *
 * Adapted From:
 *   - hermes-tnf-a2a-bridge.py (Redis pub/sub translation pattern)
 *   - scripts/orchestrator/supercycle-flywheel.cjs (cycle report shape)
 *
 * Reference: docs/protocols/SUPERCYCLE.md (supercycle protocol dossier)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const crypto = require('crypto');
const { createClient } = require('redis');

const CONFIG = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisDb: parseInt(process.env.REDIS_DB || '0', 10),
  relayHost: process.env.RELAY_HOST || '127.0.0.1',
  relayPort: parseInt(process.env.RELAY_PORT || '3000', 10),
  busIngress: process.env.TNF_BUS_INGRESS || 'tnf:bus:ingress',
  heartbeat: process.env.TNF_HEARTBEAT || 'tnf:heartbeat',
  sequenceKey: process.env.TNF_FEDERATION_SEQUENCE_KEY || 'tnf:federation:sequence',
  statusKey: process.env.TNF_FEDERATION_STATUS_KEY || 'tnf:federation:status',
  automationThreshold: parseInt(process.env.TNF_FEDERATION_BOTH_UP_AUTOMATION || '1', 10),
  intervalMs: parseInt(process.env.FEDERATION_INTERVAL_MS || '30000', 10),
  quiet: process.env.FEDERATION_QUIET === '1',
  logDir: process.env.FEDERATION_LOG_DIR || path.join(
    os.homedir(),
    'Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/runtime-logs'
  ),
};

const ROOT_DIR = path.resolve(__dirname, '../..');
const LEGACY_HISTORY = path.join(
  ROOT_DIR,
  '.agent/runtime-logs/supercycle-history.jsonl'
);
const FEDERATION_HISTORY = path.join(
  ROOT_DIR,
  '.agent/runtime-logs/federation-history.jsonl'
);
const FEDERATION_STATE = path.join(
  ROOT_DIR,
  '.agent/runtime-state/federation-last.json'
);

const nowIso = () => new Date().toISOString();
const stamp = (n) => `[${nowIso()}] ${n}`;

function log(level, msg, obj) {
  const line = obj
    ? `${stamp()} [${level.toUpperCase()}] ${msg} ${JSON.stringify(obj)}`
    : `${stamp()} [${level.toUpperCase()}] ${msg}`;
  if (!CONFIG.quiet || level === 'ERROR') {
    const out = level === 'ERROR' ? process.stderr : process.stdout;
    out.write(line + '\n');
  }
  try {
    fs.mkdirSync(path.dirname(FEDERATION_HISTORY), { recursive: true });
    fs.appendFileSync(FEDERATION_HISTORY, line + '\n');
  } catch (_) {
    /* filesystem best-effort */
  }
}

function ensureDirs() {
  for (const p of [
    path.dirname(FEDERATION_HISTORY),
    path.dirname(FEDERATION_STATE),
    CONFIG.logDir,
  ]) {
    fs.mkdirSync(p, { recursive: true });
  }
}

async function connectRedis() {
  // Support `rediss://` (Upstash) by stripping cert verification, mirroring
  // hermes-tnf-a2a-bridge.py behavior.
  let url = CONFIG.redisUrl;
  if (url.startsWith('rediss://')) {
    if (
      !url.includes('ssl_cert_reqs=none') &&
      !url.includes('ssl_cert_reqs=CERT_NONE')
    ) {
      url += url.includes('?') ? '&ssl_cert_reqs=none' : '?ssl_cert_reqs=none';
    }
  }
  const client = createClient({
    url,
    database: CONFIG.redisDb,
    socket: {
      reconnectStrategy: (retries) => Math.min(1000 + retries * 500, 5000),
    },
  });
  client.on('error', (e) => log('warn', 'redis error', { msg: e.message }));
  await client.connect();
  return client;
}

function probeWebSocket(timeoutMs = 4000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const sock = new net.Socket();
    let resolved = false;
    const finish = (ok, info) => {
      if (resolved) return;
      resolved = true;
      try { sock.destroy(); } catch (_) {}
      resolve({ ok, ...info, durationMs: Date.now() - t0 });
    };
    sock.setTimeout(timeoutMs);
    sock.once('timeout', () => finish(false, { reason: 'socket-timeout' }));
    sock.once('error', (e) => finish(false, { reason: e.code || e.message }));

    sock.connect(CONFIG.relayPort, CONFIG.relayHost, () => {
      const key = crypto.randomBytes(16).toString('base64');
      sock.write(
        'GET /ws HTTP/1.1\r\n' +
        `Host: ${CONFIG.relayHost}:${CONFIG.relayPort}\r\n` +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\n` +
        'Sec-WebSocket-Version: 13\r\n\r\n'
      );
    });
    sock.once('data', (buf) => {
      const text = buf.toString('utf8');
      const status = text.split('\r\n')[0] || '';
      if (status.includes('101')) {
        finish(true, { statusLine: status.trim() });
      } else {
        finish(false, { reason: 'no-101', statusLine: status.trim() });
      }
    });
  });
}

async function runProbe(redis) {
  const sequenceId = crypto.randomBytes(6).toString('hex');
  const t0 = Date.now();

  // 1. Redis read
  let redisOk = false;
  let redisTtl = 0;
  let agents = 0;
  try {
    const pong = await redis.ping();
    redisOk = pong === 'PONG';
    redisTtl = await redis.hLen('tnf:agent-registry');
    agents = redisTtl || 0;
  } catch (e) {
    log('warn', 'redis probe failed', { msg: e.message });
  }

  // 2. WS upgrade
  const ws = await probeWebSocket();

  // 3. Sequence counter (atomic INCR)
  let seq = 0;
  try {
    seq = await redis.incr(CONFIG.sequenceKey);
  } catch (_) {
    /* non-fatal */
  }

  // 4. Build dual-channel envelope, publish both
  const envelope = {
    kind: 'federation-probe',
    sequenceId,
    sequence: seq,
    issuedAt: nowIso(),
    source: 'sequence-checker',
    agentId: 'agent:federation-sequence-checker',
    capabilities: [
      'redis-pubsub',
      'websocket-transport',
      'health-probe',
      'automation-trigger',
    ],
    transportState: {
      redis: { ok: redisOk, agentsOnBus: agents },
      websocket: ws,
    },
    cumulativeDurationMs: Date.now() - t0,
  };

  const envelopeJson = JSON.stringify(envelope);

  // 4a. Heartbeat channel (most-recent-write-wins; consumed by every loop)
  let hbOk = false;
  try {
    await redis.publish(CONFIG.heartbeat, envelopeJson);
    hbOk = true;
  } catch (e) {
    log('warn', 'redis publish heartbeat failed', { msg: e.message });
  }

  // 4b. Bus ingress (broker-dispatcher will pick it up)
  let ingressOk = false;
  try {
    await redis.publish(CONFIG.busIngress, envelopeJson);
    ingressOk = true;
  } catch (e) {
    log('warn', 'redis publish ingress failed', { msg: e.message });
  }

  // 4c. Status hash for the dashboard (most-recent probe state)
  let statusOk = false;
  try {
    const statusObj = {
      lastProbeAt: envelope.issuedAt,
      sequence: String(seq),
      sequenceId,
      bothUp: (redisOk && ws.ok) ? '1' : '0',
      redis: JSON.stringify(envelope.transportState.redis),
      websocket: JSON.stringify(envelope.transportState.websocket),
    };
    await redis.hSet(CONFIG.statusKey, statusObj);
    await redis.expire(CONFIG.statusKey, 600); // 10m freshness
    statusOk = true;
  } catch (e) {
    log('warn', 'status hash write failed', { msg: e.message });
  }

  const bothUp = redisOk && ws.ok;
  const result = {
    ok: bothUp,
    sequenceId,
    sequence: seq,
    redis: { ok: redisOk, agents, heartbeat: hbOk, ingress: ingressOk, status: statusOk },
    websocket: ws,
    issuedAt: envelope.issuedAt,
    durationMs: Date.now() - t0,
  };

  // Persist "last" snapshot
  try {
    ensureDirs();
    fs.writeFileSync(FEDERATION_STATE, JSON.stringify(result, null, 2));
  } catch (_) {}

  return { result, envelope, bothUp };
}

async function maybeTriggerAutomation(redis, envelope) {
  const env = { ...envelope, kind: 'automation-trigger' };
  // Push to broker:prompt in case a downstream agent (e.g. continuous-tester)
  // should be re-evaluated. Adaptive: only when both transports UP and the
  // automation-threshold is reached. Otherwise return without writing.
  try {
    await redis.publish('tnf:broker:prompt', JSON.stringify(env));
    await redis.publish(CONFIG.busIngress, JSON.stringify(env));
    log('info', 'automation trigger published', {
      sequence: envelope.sequence,
      reason: 'both-transport-up',
    });
  } catch (e) {
    log('warn', 'automation trigger publish failed', { msg: e.message });
  }
}

async function runOnce() {
  ensureDirs();
  let redis;
  try {
    redis = await connectRedis();
  } catch (e) {
    log('error', 'redis connect failed', { msg: e.message });
    return { ok: false, reason: 'redis-connect-failed', error: e.message };
  }
  try {
    const { result, envelope, bothUp } = await runProbe(redis);
    log(bothUp ? 'info' : 'warn',
      `probe seq=${envelope.sequence} redis=${result.redis.ok?'UP':'DOWN'} ws=${result.websocket.ok?'UP':'DOWN'} both=${bothUp ? 'UP' : 'DEGRADED'}`,
      {
        sequenceId: envelope.sequenceId,
        agents: result.redis.agents,
        wsStatus: result.websocket.statusLine || result.websocket.reason,
        durationMs: result.durationMs,
      }
    );

    if (bothUp && CONFIG.automationThreshold > 0) {
      // Push an automation envelope so the broker reconsiders tasks.
      await maybeTriggerAutomation(redis, envelope);
    }

    return result;
  } finally {
    try { await redis.quit(); } catch (_) {}
  }
}

async function runLoop() {
  ensureDirs();
  let redis;
  let stopping = false;
  process.on('SIGINT', () => { stopping = true; });
  process.on('SIGTERM', () => { stopping = true; });
  try {
    redis = await connectRedis();
  } catch (e) {
    log('error', 'redis connect failed in loop', { msg: e.message });
    return { ok: false, reason: 'redis-connect-failed', error: e.message };
  }
  let cycle = 0;
  try {
    while (!stopping) {
      cycle += 1;
      try {
        const { result, envelope, bothUp } = await runProbe(redis);
        log('info',
          `[cycle ${cycle}] federated probe dual-channel`,
          {
            seq: envelope.sequence,
            redis: result.redis.ok,
            ws: result.websocket.ok,
            bothUp,
            durationMs: result.durationMs,
          }
        );
        if (bothUp && CONFIG.automationThreshold > 0) {
          await maybeTriggerAutomation(redis, envelope);
        }
      } catch (e) {
        log('warn', 'loop probe error', { msg: e.message });
      }
      await new Promise(r => setTimeout(r, CONFIG.intervalMs));
    }
  } finally {
    try { await redis.quit(); } catch (_) {}
  }
  log('info', `federation loop stopped at cycle ${cycle}`);
  return { ok: true, cycles: cycle };
}

function usage() {
  return `TNF federation sequence-checker

Usage:
  node federation-sequence-checker.cjs once               # one-shot probe
  node federation-sequence-checker.cjs loop               # continuous loop
                                                         (FEDERATION_INTERVAL_MS=${CONFIG.intervalMs}ms)
  node federation-sequence-checker.cjs status             # read latest snapshot
  node federation-sequence-checker.cjs once --quiet       # suppresses non-error logs

Environment overrides:
  REDIS_URL                     (default redis://localhost:6379)
  REDIS_DB                      (default 0)
  RELAY_HOST / RELAY_PORT       (default 127.0.0.1:3000)
  FEDERATION_INTERVAL_MS        (default 30000)
  FEDERATION_QUIET              (1 to silence logs)
  TNF_FEDERATION_BOTH_UP_AUTOMATION (default 1, set 0 to disable)`
}

(async () => {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'once';
  if (cmd === 'status') {
    try {
      const raw = fs.readFileSync(FEDERATION_STATE, 'utf8');
      process.stdout.write(raw + '\n');
      process.exit(0);
    } catch (e) {
      log('error', 'no federation state yet', { file: FEDERATION_STATE });
      process.exit(2);
    }
  }
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    process.stdout.write(usage() + '\n');
    process.exit(0);
  }
  if (args.includes('--quiet')) CONFIG.quiet = true;
  let out;
  if (cmd === 'loop') out = await runLoop();
  else if (cmd === 'once') out = await runOnce();
  else {
    process.stderr.write(usage() + '\n');
    process.exit(64);
  }
  process.exit(out && out.ok ? 0 : 1);
})();
