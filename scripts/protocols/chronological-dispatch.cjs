#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('redis');

const DEFAULT_QUEUE = 'tnf:master:tasks:planning';
const COMPAT_QUEUE = 'tnf:master:tasks:pending';
const LOG_QUEUE = 'tnf:master:logs';

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

function buildQueueItem(processId, profile) {
  const dispatchId = `${processId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
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
    },
  };
}

async function dispatchToRedis(redisUrl, queueItem, targetQueue) {
  const redis = createClient({ url: redisUrl });
  await redis.connect();
  try {
    await redis.lPush(targetQueue, JSON.stringify(queueItem));
    await redis.lPush(COMPAT_QUEUE, JSON.stringify(queueItem));
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
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const profilesPath = path.join(repoRoot, 'data', 'protocols', 'chronological-dispatch-profiles.json');
  const profiles = readJson(profilesPath, { entries: {} });
  const profile = profiles.entries?.[options.processId];
  if (!profile) {
    throw new Error(`No dispatch profile registered for ${options.processId}`);
  }

  const queueItem = buildQueueItem(options.processId, profile);
  const targetQueue = profile.targetQueue || DEFAULT_QUEUE;
  const redisUrl = process.env.REDIS_URL || '';

  if (redisUrl) {
    await dispatchToRedis(redisUrl, queueItem, targetQueue);
    console.log(
      JSON.stringify(
        {
          ok: true,
          dispatched: true,
          processId: options.processId,
          dispatchId: queueItem.id,
          targetQueue,
        },
        null,
        2
      )
    );
    return;
  }

  if (!options.allowLocalFallback) {
    throw new Error('REDIS_URL is required for TNF-native chronological dispatch');
  }

  const artifactPath = writeFallbackArtifact(repoRoot, queueItem, targetQueue);
  console.log(
    JSON.stringify(
      {
        ok: true,
        dispatched: false,
        fallback: 'local-artifact',
        processId: options.processId,
        dispatchId: queueItem.id,
        targetQueue,
        artifactPath,
      },
      null,
      2
    )
  );
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
