#!/usr/bin/env node
'use strict';

/**
 * Announce an interactive session worker as available for Subdirector dispatch.
 * Law: docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md
 * Bus: docs/protocols/AGENT_BUS_CONTRACT.md
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const REGISTRY_KEY = 'tnf:agent-registry';
const DEFAULT_SUBDIRECTOR = 'tnf-cli-agent';
const DEFAULT_CADENCE_SEC = 900;

function argValue(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

function detectTty() {
  try {
    const out = spawnSync('tty', { encoding: 'utf8' });
    const t = String(out.stdout || '').trim().replace(/^\/dev\//, '');
    return t && t !== 'not a tty' ? t : 'notty';
  } catch {
    return 'notty';
  }
}

/** Prefer TNF env, then host runtime signals — never hard-bound to Claude. */
function detectPlatform() {
  if (process.env.TNF_PLATFORM) return String(process.env.TNF_PLATFORM).trim();
  if (process.env.CURSOR_TRACE_ID || process.env.CURSOR_AGENT || process.env.CURSOR) return 'cursor';
  if (process.env.CLAUDECODE || process.env.CLAUDE_CODE_ENTRYPOINT) return 'claude';
  if (process.env.CODEX_HOME || process.env.OPENAI_CODEX) return 'codex';
  if (process.env.KILO_HOME || process.env.KILO_CLI) return 'kilo';
  if (process.env.OPENCODE || process.env.OPENCODE_HOME) return 'opencode';
  if (process.env.GEMINI_CLI || process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.PI_CODING_AGENT) return 'pi';
  return 'tnf';
}

function defaultName(platform) {
  if (process.env.TNF_AGENT_NAME) return String(process.env.TNF_AGENT_NAME).trim();
  if (platform === 'tnf') return 'tnf-session-worker';
  return `tnf-${platform}-worker`;
}

function stableAgentId(name, platform, tty) {
  const host = os.hostname().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'host';
  const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  const safePlat = String(platform).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 20);
  const safeTty = String(tty).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 16);
  return `agent_${safePlat}-${safeName}_${host}_${safeTty}`;
}

function redisCli(args, input = null) {
  const res = spawnSync('redis-cli', args, {
    encoding: 'utf8',
    input: input || undefined,
    cwd: ROOT,
  });
  if (res.status !== 0) {
    throw new Error(`redis-cli ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  }
  return String(res.stdout || '').trim();
}

function loadExisting(agentId) {
  try {
    const raw = redisCli(['HGET', REGISTRY_KEY, agentId]);
    if (!raw || raw === '(nil)') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function main() {
  const offline = hasFlag('--offline');
  const jsonOut = hasFlag('--json');
  const platform = argValue('--platform', detectPlatform());
  const name = argValue('--name', defaultName(platform));
  const role = argValue('--role', 'worker');
  const subdirector = argValue('--to', DEFAULT_SUBDIRECTOR);
  const cadence = Number(argValue('--cadence-sec', String(DEFAULT_CADENCE_SEC))) || DEFAULT_CADENCE_SEC;
  const tty = argValue('--tty', detectTty());
  const caps = String(argValue('--capabilities', 'code_edit,frontend,protocol,personal_intelligence,cli'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const agentId = argValue('--agent-id', stableAgentId(name, platform, tty));
  const cwd = process.cwd();
  const now = new Date().toISOString();

  if (redisCli(['PING']) !== 'PONG') {
    throw new Error('Redis not reachable at default redis-cli target');
  }

  const prior = loadExisting(agentId) || {};
  const agentInfo = {
    ...prior,
    id: agentId,
    name,
    role,
    platform,
    status: offline ? 'offline' : 'idle',
    isOnline: !offline,
    dispatchable: !offline,
    capabilities: caps,
    currentLoad: offline ? 0 : Number(prior.currentLoad || 0),
    maxLoad: Number(prior.maxLoad || 1),
    expectedCadenceSec: cadence,
    registeredAt: prior.registeredAt || now,
    lastSeen: now,
    tty,
    cwd,
    host: os.hostname(),
    announceProtocol: 'TNF_AGENT_AVAILABILITY_ANNOUNCE',
    metadata: {
      ...(prior.metadata || {}),
      event: offline ? 'agent_unavailable' : 'agent_available_for_dispatch',
      sessionKind: 'interactive',
      announcedAt: now,
    },
  };

  redisCli(['HSET', REGISTRY_KEY, agentId, JSON.stringify(agentInfo)]);

  const frameId = crypto.randomUUID();
  const content = offline
    ? `${name} (${platform}) going offline — withdraw from Subdirector dispatch`
    : `${name} (${platform}) available for Subdirector-delegated tasks`;
  const envelope = {
    id: frameId,
    timestamp: now,
    type: 'status',
    from: {
      agentId,
      agentName: name,
      role,
      platform,
    },
    to: { agentId: subdirector },
    content,
    payload: {
      event: agentInfo.metadata.event,
      agentInfo,
      dispatchable: agentInfo.dispatchable,
      capabilities: caps,
      cwd,
      tty,
    },
    idempotencyKey: `announce:${agentId}:${offline ? 'off' : 'on'}:${now.slice(0, 16)}`,
  };

  // Durable Subdirector lane (DispatchGuard QUEUE_DRAINED_RECIPIENTS).
  const queueKey = `tnf:direct:sub-director:${subdirector}`;
  redisCli(['LPUSH', queueKey, JSON.stringify(envelope)]);

  // Also publish on conversations for live bus observers.
  try {
    redisCli(['PUBLISH', 'tnf:conversations', JSON.stringify({ ...envelope, to: { broadcast: true } })]);
    redisCli(['PUBLISH', 'tnf:agents', JSON.stringify(envelope)]);
  } catch {
    // Queue write is the durable authority; pub/sub is best-effort.
  }

  // Persist a local receipt for the session operator.
  const receiptDir = path.join(os.homedir(), '.tnf', 'receipts');
  fs.mkdirSync(receiptDir, { recursive: true });
  const receiptPath = path.join(receiptDir, `availability-announce-${agentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
  fs.writeFileSync(
    receiptPath,
    JSON.stringify(
      {
        ok: true,
        protocol: 'TNF_AGENT_AVAILABILITY_ANNOUNCE',
        agentId,
        subdirector,
        queueKey,
        frameId,
        dispatchable: agentInfo.dispatchable,
        status: agentInfo.status,
        receiptPath,
        at: now,
      },
      null,
      2
    )
  );

  const result = {
    ok: true,
    agentId,
    name,
    role,
    platform,
    status: agentInfo.status,
    dispatchable: agentInfo.dispatchable,
    subdirector,
    queueKey,
    queueLen: Number(redisCli(['LLEN', queueKey]) || 0),
    frameId,
    receiptPath,
    capabilities: caps,
  };

  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`=== Availability Announce (${offline ? 'OFFLINE' : 'AVAILABLE'}) ===`);
    console.log(`- agent: ${name} @ ${platform}`);
    console.log(`- id: ${agentId}`);
    console.log(`- status: ${agentInfo.status} (dispatchable=${agentInfo.dispatchable})`);
    console.log(`- subdirector: ${subdirector}`);
    console.log(`- durable queue: ${queueKey} (llen=${result.queueLen})`);
    console.log(`- capabilities: ${caps.join(', ')}`);
    console.log(`- receipt: ${receiptPath}`);
  }
}

try {
  main();
} catch (err) {
  console.error(`[announce-availability] FAIL: ${err.message || err}`);
  process.exit(1);
}
