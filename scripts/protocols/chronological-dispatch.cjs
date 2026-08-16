#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('redis');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
const DEFAULT_QUEUE = 'tnf:master:tasks:planning';
const COMPAT_QUEUE = 'tnf:master:tasks:pending';
const REALTIME_QUEUE = 'tnf:master:tasks:realtime';
const LOG_QUEUE = 'tnf:master:logs';

/** Queues that are first-class homes — never dual-write into pending. */
const NO_COMPAT_DUAL_WRITE = new Set([
  REALTIME_QUEUE,
  COMPAT_QUEUE,
  'tnf:master:tasks:analytics',
  'tnf:master:tasks:maintenance',
  'tnf:master:tasks:context',
  'tnf:master:tasks:quality',
  'tnf:master:tasks:planning',
]);

/** Lanes the broker consumes via realtime (keep in sync with task-scheduler.service.ts). */
const REALTIME_LANES = new Set([
  'realtime_broker_routing',
  'relay_federation',
  'redis_sync',
  'tauri_sync',
  'directive',
  'orchestration',
  'reliability',
  'quality',
  'context',
  'self_improvement',
]);

function resolveTargetQueue(profile, queueItem) {
  const configured = profile.targetQueue || DEFAULT_QUEUE;
  const lane = String(queueItem?.itinerary?.lane || '').toLowerCase();
  // Broker only BRPOPs realtime. Do not park realtime-eligible work on planning
  // (or dual-write it into pending) or it becomes a write-only black hole.
  if (REALTIME_LANES.has(lane)) {
    return REALTIME_QUEUE;
  }
  return configured;
}

function parseArgs(argv) {
  const options = {
    processId: '',
    repoRoot: process.env.TNF_REPO_ROOT || '',
    allowLocalFallback:
      process.env.ALLOW_LOCAL_DISPATCH_FALLBACK === 'true' ||
      process.env.TNF_ALLOW_LOCAL_DISPATCH_FALLBACK === 'true',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--process-id') {
      options.processId = argv[++i] || '';
    } else if (arg === '--repo-root') {
      options.repoRoot = argv[++i] || '';
    } else if (arg === '--allow-local-fallback') {
      options.allowLocalFallback = true;
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.processId) {
    throw new Error('Missing required --process-id');
  }

  return options;
}

function printUsage() {
  console.log(
    'Usage: node scripts/protocols/chronological-dispatch.cjs --process-id <id> [--repo-root <path>] [--allow-local-fallback]'
  );
}

function resolveRepoRoot(explicitRoot) {
  if (explicitRoot) return path.resolve(explicitRoot);
  const marker = path.join('data', 'protocols', 'chronological-dispatch-profiles.json');
  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(current, marker))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function buildLocalGateDecisions(createdAt) {
  const gates = [
    'TENANT_SCOPE_GATE',
    'TRACE_CONTINUITY_GATE',
    'TERMINAL_BINDING_GATE',
    'HIGH_RISK_RUNTIME_GATE',
    'CHANNEL_MEMBERSHIP_GATE',
  ];
  return gates.map((gate) => ({
    gate,
    decision: 'allow',
    reason: 'local chronological dispatch under Local Subdirector authority',
    at: createdAt,
  }));
}

function buildQueueItem(processId, profile) {
  const dispatchId = `${processId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const localTenantId = process.env.TNF_LOCAL_TENANT_ID || 'local';
  const localSubdirector =
    process.env.TNF_LOCAL_SUBDIRECTOR_AGENT_ID ||
    process.env.TNF_AGENT_ID ||
    'tnf-cli-agent';
  return {
    id: dispatchId,
    title: profile.title || processId,
    description: profile.instruction || '',
    priority: profile.priority || 'medium',
    status: 'queued',
    votes: { up: 0, down: 0 },
    source: 'chronological-dispatch',
    processId,
    kind: profile.kind || 'agent-turn',
    createdAt,
    // Local tenant scope so federation TENANT_SCOPE / cumulative checks pass for
    // machine-local loops that report to Local Subdirector (tnf-cli-agent).
    scope: {
      tenantId: localTenantId,
      authority: 'local_subdirector',
    },
    cumulativeId: {
      scope: { tenant_id: localTenantId },
      lineage: { processId, clockSource: 'master-clock' },
    },
    gateDecisions: buildLocalGateDecisions(createdAt),
    itinerary: profile.itinerary || {
      lane: 'directive',
      horizon: 'short_term',
      coordinationMode: 'brokered',
      signalSources: ['master-clock'],
      clockSource: 'master-clock',
    },
    metadata: {
      scheduledProcessId: processId,
      dispatchSource: 'master-clock',
      importedFromLegacyCron: true,
      localAuthority: 'local_subdirector',
      reportTo: localSubdirector,
      tenantId: localTenantId,
    },
  };
}

async function dispatchToRedis(redisUrl, queueItem, targetQueue) {
  const redis = createClient({ url: redisUrl });
  await redis.connect();
  try {
    const payload = JSON.stringify(queueItem);
    await redis.lPush(targetQueue, payload);
    // Compat dual-write only when the target is not already a first-class queue.
    // Dual-writing realtime/specialty work into pending recreated black holes.
    const dualWrite = !NO_COMPAT_DUAL_WRITE.has(targetQueue);
    if (dualWrite) {
      await redis.lPush(COMPAT_QUEUE, payload);
    }
    await redis.lPush(
      LOG_QUEUE,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType: 'chronological_dispatch',
        content: `Dispatched ${queueItem.processId} to ${targetQueue}`,
        metadata: {
          processId: queueItem.processId,
          dispatchId: queueItem.id,
          targetQueue,
          priority: queueItem.priority,
          compatDualWrite: dualWrite,
        },
      })
    );
    await redis.lTrim(LOG_QUEUE, 0, 999);
  } finally {
    await redis.quit();
  }
}

function writeFallbackArtifact(repoRoot, queueItem, targetQueue) {
  const outDir = path.join(repoRoot, 'reports', 'chronological-dispatch', 'pending');
  fs.mkdirSync(outDir, { recursive: true });
  const artifactPath = path.join(outDir, `${queueItem.id}.json`);
  fs.writeFileSync(
    artifactPath,
    JSON.stringify(
      {
        targetQueue,
        queueItem,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ),
    'utf8'
  );
  return artifactPath;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  // Per-process-id single-instance guard: prevents duplicate concurrent dispatches
  // of the same process-id from multiple agents/cron sources
  const _guard = singleInstanceGuard({ lockName: `tnf-chrono-dispatch-${options.processId}`, staleMs: 30000 });
  if (!_guard.acquired) {
    console.log(JSON.stringify({ ok: true, skipped: 'already-running', processId: options.processId, lock: _guard.existingLock }));
    process.exit(0);
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  const profilesPath = path.join(repoRoot, 'data', 'protocols', 'chronological-dispatch-profiles.json');
  const profiles = readJson(profilesPath, { entries: {} });
  const profile = profiles.entries?.[options.processId];
  if (!profile) {
    throw new Error(`No dispatch profile registered for ${options.processId}`);
  }

  const queueItem = buildQueueItem(options.processId, profile);
  const targetQueue = resolveTargetQueue(profile, queueItem);
  const explicitUrl = process.env.REDIS_URL || '';
  // An unset REDIS_URL in the cron environment routed every dispatch to the
  // local-artifact fallback for months while Redis was running normally on the
  // conventional port. Absence of the variable is not evidence of absence of
  // Redis, so probe the default before declaring the queue unreachable.
  const attempts = explicitUrl
    ? [{ url: explicitUrl, source: 'REDIS_URL' }]
    : [{ url: DEFAULT_REDIS_URL, source: 'default-local' }];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await dispatchToRedis(attempt.url, queueItem, targetQueue);
      console.log(
        JSON.stringify(
          {
            ok: true,
            dispatched: true,
            processId: options.processId,
            dispatchId: queueItem.id,
            targetQueue,
            resolvedFrom: attempt.source,
          },
          null,
          2
        )
      );
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (!options.allowLocalFallback) {
    throw new Error(
      `Chronological dispatch could not reach Redis (${lastError?.message || 'unknown error'})`
    );
  }

  const artifactPath = writeFallbackArtifact(repoRoot, queueItem, targetQueue);
  // Persisting the item is not the same as delivering it. The caller
  // (run-chronological-process.cjs) records only our exit code, so reporting
  // ok:true / exit 0 here is precisely what let undelivered items pile up
  // unnoticed while every cycle logged healthy.
  console.log(
    JSON.stringify(
      {
        ok: false,
        dispatched: false,
        fallback: 'local-artifact',
        reason: `redis unreachable: ${lastError?.message || 'no REDIS_URL and default probe failed'}`,
        processId: options.processId,
        dispatchId: queueItem.id,
        targetQueue,
        artifactPath,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message || String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
