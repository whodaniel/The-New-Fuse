#!/usr/bin/env node
/**
 * One-shot / recurring promote: move realtime-eligible tasks from
 * tnf:master:tasks:pending → tnf:master:tasks:realtime.
 *
 * Non-destructive for non-eligible lanes (analytics/maintenance stay on pending).
 * Dedupes by task id against the current realtime queue.
 *
 * Usage:
 *   node scripts/protocols/promote-pending-to-realtime.cjs [--dry-run] [--json]
 */

const { createClient } = require('redis');

const PENDING = 'tnf:master:tasks:pending';
const REALTIME = 'tnf:master:tasks:realtime';
const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';

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

function parseArgs(argv) {
  const opts = { dryRun: false, json: false };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '-h' || arg === '--help') {
      console.log(
        'Usage: node scripts/protocols/promote-pending-to-realtime.cjs [--dry-run] [--json]'
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

function laneOf(task) {
  return String(task?.itinerary?.lane || task?.lane || '').toLowerCase();
}

function isEligible(task) {
  return REALTIME_LANES.has(laneOf(task));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const url = process.env.REDIS_URL || DEFAULT_REDIS_URL;
  const redis = createClient({ url });
  await redis.connect();

  try {
    const pendingRaw = await redis.lRange(PENDING, 0, -1);
    const realtimeRaw = await redis.lRange(REALTIME, 0, -1);
    const realtimeIds = new Set();
    for (const raw of realtimeRaw) {
      try {
        const id = JSON.parse(raw)?.id;
        if (id) realtimeIds.add(id);
      } catch {
        /* ignore malformed */
      }
    }

    const keep = [];
    const promote = [];
    const skippedDup = [];
    const byLane = {};

    for (const raw of pendingRaw) {
      let task;
      try {
        task = JSON.parse(raw);
      } catch {
        keep.push(raw);
        continue;
      }
      const lane = laneOf(task) || 'unknown';
      byLane[lane] = (byLane[lane] || 0) + 1;

      if (!isEligible(task)) {
        keep.push(raw);
        continue;
      }
      if (task?.id && realtimeIds.has(task.id)) {
        skippedDup.push(task.id);
        // Drop duplicate from pending (already on realtime).
        continue;
      }
      promote.push({ raw, task });
      if (task?.id) realtimeIds.add(task.id);
    }

    if (!opts.dryRun) {
      for (const { raw } of promote) {
        await redis.rPush(REALTIME, raw);
      }
      await redis.del(PENDING);
      if (keep.length) {
        await redis.rPush(PENDING, keep);
      }
    }

    const report = {
      ok: true,
      dryRun: opts.dryRun,
      pendingBefore: pendingRaw.length,
      realtimeBefore: realtimeRaw.length,
      promoted: promote.length,
      retainedOnPending: keep.length,
      skippedDuplicates: skippedDup.length,
      promotedIds: promote.map((p) => p.task?.id).filter(Boolean),
      retainedLaneCounts: (() => {
        const c = {};
        for (const raw of keep) {
          try {
            const lane = laneOf(JSON.parse(raw)) || 'unknown';
            c[lane] = (c[lane] || 0) + 1;
          } catch {
            c.malformed = (c.malformed || 0) + 1;
          }
        }
        return c;
      })(),
      pendingLaneCountsBefore: byLane,
      pendingAfter: opts.dryRun ? pendingRaw.length : keep.length,
      realtimeAfter: opts.dryRun
        ? realtimeRaw.length
        : realtimeRaw.length + promote.length,
    };

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `promote-pending-to-realtime: promoted=${report.promoted} retained=${report.retainedOnPending} dupes=${report.skippedDuplicates} dryRun=${report.dryRun}`
      );
      console.log(JSON.stringify(report, null, 2));
    }
  } finally {
    await redis.quit();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message || String(error) }));
  process.exit(1);
});
