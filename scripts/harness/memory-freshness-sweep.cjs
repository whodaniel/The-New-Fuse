#!/usr/bin/env node
/**
 * [CLASS:SUPPORT] [STATUS:ACTIVE] [DOC_TYPE:CRON_SWEEP] [DOMAIN_SCOPE:MEMORY]
 * TNF Memory Freshness Sweep — the standing inner loop for the dynamic memory layer.
 *
 * Runs on a cron schedule (every 30 minutes via tnf-local-launchd-services or
 * crontab) to keep the memory store fresh:
 *
 *  1. Status check: reports entry count, expired count, TTL horizon.
 *  2. Promotion sweep: recalls entries tagged with 'taskup' or 'session' to
 *     refresh their recency position (promotion-on-recall). This keeps
 *     active-context entries from decaying below stale entries.
 *  3. TTL sweep log: reports how many entries would be auto-tombstoned on the
 *     next recall (the actual tombstoning happens lazily in recall(), not here).
 *
 * Single-instance guard prevents overlapping runs (stale lock after 5 min).
 *
 * Usage:
 *   node scripts/harness/memory-freshness-sweep.cjs [--json] [--promote-tags taskup,session]
 *
 * Environment:
 *   TNF_MEMORY_TTL_DAYS=90   TTL horizon (passed through to memory-layer recall)
 *   TNF_MEMORY_PROMOTE=0     Disable promotion-on-recall (sweep still reports status)
 */
'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..');
const MEMORY_LAYER = path.join(ROOT, 'scripts', 'harness', 'memory-layer.cjs');
const LOCK_FILE = path.join(ROOT, '.agent/runtime-logs/memory-freshness-sweep.lock');

// Simple single-instance guard (same pattern as agent-poll-pulse.cjs).
function acquireLock() {
  const lockDir = path.dirname(LOCK_FILE);
  if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });

  const staleMs = 5 * 60 * 1000; // 5 min
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const stat = fs.statSync(LOCK_FILE);
      if (Date.now() - stat.mtimeMs < staleMs) {
        return { acquired: false, reason: 'already-running' };
      }
    } catch {
      // corrupt lock — remove and continue
    }
  }
  fs.writeFileSync(LOCK_FILE, String(Date.now()));
  return { acquired: true };
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  } catch {
    // non-fatal
  }
}

function runMemoryLayer(args) {
  try {
    const out = execFileSync(process.execPath, [MEMORY_LAYER, ...args], {
      encoding: 'utf8',
      timeout: 30000,
      cwd: ROOT,
    });
    return out.trim();
  } catch (err) {
    return `ERROR: ${err.message}`;
  }
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const promoteTagsArg = args.find((a) => a.startsWith('--promote-tags'));
  const promoteTags = promoteTagsArg
    ? promoteTagsArg.split('=')[1] || promoteTagsArg[args.indexOf(promoteTagsArg) + 1]
    : 'taskup,session';
  const tags = String(promoteTags).split(',').map((s) => s.trim()).filter(Boolean);

  const guard = acquireLock();
  if (!guard.acquired) {
    if (jsonMode) console.log(JSON.stringify({ ok: true, skipped: guard.reason }));
    else console.log(`memory-freshness-sweep: skipped (${guard.reason})`);
    return;
  }

  try {
    // 1. Status check
    const statusRaw = runMemoryLayer(['status', '--json']);
    const status = JSON.parse(statusRaw);

    // 2. Promotion sweep: recall each tag to refresh recency
    const promotedTags = [];
    for (const tag of tags) {
      const recallRaw = runMemoryLayer(['recall', '--query', tag, '--limit', '5', '--json']);
      try {
        const recall = JSON.parse(recallRaw);
        if (recall.ok && recall.matches.length > 0) {
          promotedTags.push({ tag, promoted: recall.matches.length });
        }
      } catch {
        // recall failed for this tag — skip
      }
    }

    // 3. Report
    const sweep = {
      ok: true,
      at: new Date().toISOString(),
      status: {
        count: status.count,
        pinned: status.pinned,
        expired: status.expired,
        ttlDays: status.ttlDays,
      },
      promoted: promotedTags,
      summary: `${status.count} entries (${status.pinned} pinned, ${status.expired} expired), ${promotedTags.reduce((s, t) => s + t.promoted, 0)} promoted`,
    };

    if (jsonMode) {
      console.log(JSON.stringify(sweep, null, 2));
    } else {
      console.log(`[memory-freshness-sweep] ${sweep.summary}`);
    }
  } finally {
    releaseLock();
  }
}

main();
