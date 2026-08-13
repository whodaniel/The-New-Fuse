#!/usr/bin/env node
/**
 * Handoff packet lifecycle CLI.
 *
 *   node scripts/handoff/sweep-packet-lifecycle.cjs [--dry-run]
 *   node scripts/handoff/sweep-packet-lifecycle.cjs verify --packet <uuid> --by <id> --evidence <ref>[,ref...] [--note ...]
 *
 * Protocol: docs/protocols/HANDOFF_PACKET_LIFECYCLE.md
 */

'use strict';

const path = require('node:path');

function parseArgs(argv) {
  const args = {
    mode: 'sweep',
    dryRun: false,
    packet: null,
    by: null,
    evidence: [],
    note: null,
    result: 'pass',
    softRetireOnly: false,
  };
  const rest = [...argv];
  if (rest[0] === 'verify' || rest[0] === 'sweep') {
    args.mode = rest.shift();
  }
  while (rest.length) {
    const token = rest.shift();
    if (token === '--dry-run') args.dryRun = true;
    else if (token === '--soft-retire-only') args.softRetireOnly = true;
    else if (token === '--packet') args.packet = rest.shift();
    else if (token === '--by') args.by = rest.shift();
    else if (token === '--evidence') {
      const raw = rest.shift() || '';
      args.evidence = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (token === '--note') args.note = rest.shift();
    else if (token === '--result') args.result = rest.shift();
    else if (token === '--help' || token === '-h') args.help = true;
    else {
      console.error(`Unknown arg: ${token}`);
      process.exit(2);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/handoff/sweep-packet-lifecycle.cjs [--dry-run] [--soft-retire-only]
  node scripts/handoff/sweep-packet-lifecycle.cjs verify --packet <uuid> --by <id> --evidence <ref>[,ref...] [--note ...] [--result pass|fail]
`);
}

async function loadLifecycle() {
  const dist = path.resolve(
    __dirname,
    '../../packages/relay-core/dist/services/handoff-packet-lifecycle.service.js'
  );
  try {
    return require(dist);
  } catch (error) {
    console.error(
      'Failed to load lifecycle service from dist. Run: pnpm --filter @the-new-fuse/relay-core run build'
    );
    throw error;
  }
}

async function connectRedis() {
  const { createStandaloneRedisClient, connectStandaloneRedisClient } = require(
    path.resolve(__dirname, '../../packages/infrastructure/dist/index.js')
  );
  const redis = createStandaloneRedisClient({ lazyConnect: true });
  await connectStandaloneRedisClient(redis);
  return redis;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const lifecycle = await loadLifecycle();
  const redis = await connectRedis();

  try {
    if (args.mode === 'verify') {
      if (!args.packet || !args.by || args.evidence.length === 0) {
        usage();
        process.exit(2);
      }
      const receipt = await lifecycle.writeVerificationReceipt(redis, {
        packetId: args.packet,
        verifiedAt: new Date().toISOString(),
        verifiedBy: args.by,
        result: args.result === 'fail' ? 'fail' : 'pass',
        evidenceRefs: args.evidence,
        ...(args.note ? { note: args.note } : {}),
      });
      console.log(JSON.stringify({ ok: true, action: 'verify', receipt }, null, 2));
      return;
    }

    const result = await lifecycle.sweepHandoffPacketLifecycle(redis, {
      dryRun: args.dryRun,
      softRetireOnly: args.softRetireOnly,
    });
    console.log(JSON.stringify({ ok: true, action: 'sweep', result }, null, 2));
  } finally {
    try {
      await redis.quit();
    } catch {
      /* ignore */
    }
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
