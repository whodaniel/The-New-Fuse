#!/usr/bin/env node

/**
 * TNF Resource Guard
 *
 * Single source of truth for "is the system healthy enough to start/keep
 * running work right now." Every entry point in the fleet — the shared cron
 * runner (run-chronological-process.cjs) and every launchd job (via
 * tnf-launchd-guard.sh) — calls into this instead of reimplementing its own
 * os.loadavg() check.
 *
 * WHY THIS EXISTS
 *   2026-08-27: com.thenewfuse.qa-swarm (a KeepAlive launchd job with no
 *   guard at all) ran an unbounded continuous vite-build loop, drove load
 *   average to 84-88 and free memory to ~15MB on a 2-core box, and the
 *   resulting resource starvation crashed shell processes across every open
 *   terminal ("[Process completed]"). Audit found:
 *     - the cron path had a CPU-load-only preflight gate (no memory check)
 *     - every launchd job had NO preflight gate of any kind
 *     - nothing enforced budgets on an already-running process
 *   This module is the first of those three fixes. See also
 *   tnf-resource-watchdog.cjs (runtime enforcement) and
 *   tnf-launchd-guard.sh (launchd entry-point preflight).
 *
 * macOS memory note
 *   os.freemem()/totalmem() do not count reclaimable inactive/purgeable
 *   pages, so they read far more dire than Activity Monitor's "Memory
 *   Pressure." We shell out to vm_stat and compute pressure the same way
 *   Activity Monitor does: (active + wired + compressed) / total pages.
 *
 * CLI:
 *   node tnf-resource-guard.cjs snapshot                       # print JSON snapshot
 *   node tnf-resource-guard.cjs preflight --job <id> --class <class> [--repo-root <path>]
 *   node tnf-resource-guard.cjs release --job <id> --class <class>
 *   node tnf-resource-guard.cjs --self-test                    # human-readable snapshot + vm_stat cross-check
 */

'use strict';

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { singleInstanceGuard } = require('./tnf-single-instance-guard.cjs');

const ALERTS_FILE = path.join(os.homedir(), '.tnf', 'alerts.json');

// --------------------------------------------------------------------------
// System snapshot (cached briefly so bursts of callers don't hammer vm_stat)
// --------------------------------------------------------------------------

let cachedSnapshot = null;
let cachedAt = 0;
const SNAPSHOT_CACHE_MS = 2000;

function parseVmStat() {
  try {
    const out = execFileSync('vm_stat', { encoding: 'utf8', timeout: 2000 });
    const pageSizeMatch = out.match(/page size of (\d+) bytes/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 4096;
    const pages = {};
    for (const line of out.split('\n')) {
      const m = line.match(/^Pages\s+([a-zA-Z0-9 \-]+):\s+(\d+)\.?/);
      if (m) pages[m[1].trim()] = Number(m[2]);
    }
    const free = pages['free'] || 0;
    const speculative = pages['speculative'] || 0;
    const active = pages['active'] || 0;
    const inactive = pages['inactive'] || 0;
    const wired = pages['wired down'] || 0;
    const compressed = pages['occupied by compressor'] || 0;
    const totalPages = free + speculative + active + inactive + wired + compressed;
    const reclaimablePages = free + speculative;
    const pressurePages = active + wired + compressed;
    const pressurePercent = totalPages > 0 ? (pressurePages / totalPages) * 100 : 0;
    return {
      ok: true,
      pageSize,
      totalBytes: totalPages * pageSize,
      reclaimableBytes: reclaimablePages * pageSize,
      pressurePercent,
    };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'vm_stat failed' };
  }
}

/**
 * @returns {{
 *   cpus: number, load1: number, load5: number, load15: number,
 *   memPressurePercent: number, memOk: boolean,
 *   totalMemBytes: number, reclaimableMemBytes: number,
 * }}
 */
function systemSnapshot({ fresh = false } = {}) {
  const now = Date.now();
  if (!fresh && cachedSnapshot && now - cachedAt < SNAPSHOT_CACHE_MS) {
    return cachedSnapshot;
  }
  const cpus = Math.max(os.cpus().length, 1);
  const [load1, load5, load15] = os.loadavg();
  const vm = process.platform === 'darwin' ? parseVmStat() : null;
  let memPressurePercent;
  let totalMemBytes;
  let reclaimableMemBytes;
  let memOk;
  if (vm && vm.ok) {
    memPressurePercent = vm.pressurePercent;
    totalMemBytes = vm.totalBytes;
    reclaimableMemBytes = vm.reclaimableBytes;
    memOk = true;
  } else {
    // Non-macOS or vm_stat unavailable: fall back to the coarser os.* view.
    const total = os.totalmem();
    const free = os.freemem();
    totalMemBytes = total;
    reclaimableMemBytes = free;
    memPressurePercent = total > 0 ? ((total - free) / total) * 100 : 0;
    memOk = false;
  }
  const snapshot = {
    cpus,
    load1: load1 || 0,
    load5: load5 || 0,
    load15: load15 || 0,
    memPressurePercent,
    memOk,
    totalMemBytes,
    reclaimableMemBytes,
    takenAt: new Date(now).toISOString(),
  };
  cachedSnapshot = snapshot;
  cachedAt = now;
  return snapshot;
}

// --------------------------------------------------------------------------
// Thresholds / classes
// --------------------------------------------------------------------------

function envFlag(name, defaultValue = true) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return !['0', 'false', 'no', 'off'].includes(String(raw).trim().toLowerCase());
}

/** The two admission tiers this guard decides between. */
const PRIORITY_LEVELS = new Set(['normal', 'high']);

/**
 * Priority words, taken from the vocabulary the broker already speaks.
 *
 * TNF had a message-priority protocol before this guard did:
 * `TaskSchedulerService.taskPriorityWeight()`
 * (packages/relay-core/src/services/task-scheduler.service.ts, live — the
 * master clock instantiates it and ranks the dispatch queue by
 * taskDispatchScore) scores p0/urgent=500, critical=400, p1/high=300,
 * normal/p2=200, p3/low=100, and adds an itinerary-lane weight on top.
 *
 * The two layers answer different questions and neither replaces the other:
 *   broker  → given capacity, WHICH message goes first (ordering).
 *   guard   → whether ANY work may start at all right now (admission).
 * They were never connected, so the broker could rank a directive p0 while
 * this guard denied the process on load average without ever seeing the word.
 * Rather than invent a third vocabulary, the tiers below are aliases of the
 * broker's, so one `priority` field means the same thing at both layers.
 */
const HIGH_PRIORITY_ALIASES = new Set(['high', 'p0', 'p1', 'urgent', 'critical']);

/** Anything unrecognised is 'normal' — priority is opt-in, never inferred. */
function normalizePriority(priority) {
  const value = String(priority ?? 'normal')
    .trim()
    .toLowerCase();
  return HIGH_PRIORITY_ALIASES.has(value) ? 'high' : 'normal';
}

/**
 * Load/memory bars a job must be under to start.
 *
 * `normal` is the bar the whole fleet has always been held to. `high` is a
 * RAISED CEILING, not an off switch: it exists so an operator directive can
 * still reach the sub-director while routine cron work stays deferred, which
 * is the only way a loaded box ever gets told what to do about being loaded.
 * Above the high bar even a priority job is refused — a directive that
 * finishes the machine off delivers nothing.
 */
function defaultThresholds(snapshot, priority) {
  const base = {
    loadThreshold: Number(process.env.TNF_CRON_MAX_LOAD_AVG || Math.max(8, snapshot.cpus * 4)),
    memPressureThreshold: Number(process.env.TNF_MAX_MEM_PRESSURE_PERCENT || 85),
    priority: 'normal',
  };
  if (normalizePriority(priority) !== 'high') return base;
  return {
    loadThreshold: base.loadThreshold * Number(process.env.TNF_PRIORITY_LOAD_MULTIPLIER || 2.5),
    memPressureThreshold: Number(process.env.TNF_PRIORITY_MAX_MEM_PRESSURE_PERCENT || 96),
    priority: 'high',
  };
}

function isOverloaded(snapshot, thresholds) {
  const t = thresholds || defaultThresholds(snapshot);
  const loadOverloaded = snapshot.load1 >= t.loadThreshold;
  const memOverloaded = snapshot.memPressurePercent >= t.memPressureThreshold;
  return {
    overloaded: loadOverloaded || memOverloaded,
    loadOverloaded,
    memOverloaded,
    thresholds: t,
  };
}

// Known job classes and their default resource budgets. Registry entries can
// override any field; unlabeled/legacy jobs fall back to these so nothing in
// the fleet runs with zero ceiling.
const CLASS_DEFAULTS = {
  build: { maxCpuPercent: 150, maxRssMb: 1536, maxWallClockMs: 6 * 60 * 1000, maxConcurrent: 1, nice: 10 },
  // For supervised long-running build/test loops (e.g. qa-swarm's
  // `pnpm run test:continuous`) that are *designed* to run indefinitely —
  // as opposed to `build`, a bounded one-shot build. Learned in production
  // 2026-08-27: the watchdog correctly killed a legitimately-running
  // qa-swarm cycle under the `build` class's 6-minute wall-clock cap, which
  // was calibrated for a single vite build, not a continuous supervisor
  // loop. No wall-clock ceiling here by design; CPU/RSS still bounded.
  'continuous-build': { maxCpuPercent: 200, maxRssMb: 2048, maxWallClockMs: null, maxConcurrent: 1, nice: 10 },
  daemon: { maxCpuPercent: 60, maxRssMb: 512, maxWallClockMs: null, maxConcurrent: null, nice: 5 },
  watchdog: { maxCpuPercent: 20, maxRssMb: 256, maxWallClockMs: null, maxConcurrent: 1, nice: 10 },
  probe: { maxCpuPercent: 40, maxRssMb: 256, maxWallClockMs: 60 * 1000, maxConcurrent: null, nice: 5 },
  default: { maxCpuPercent: 80, maxRssMb: 512, maxWallClockMs: 5 * 60 * 1000, maxConcurrent: null, nice: 5 },
};

function classify(jobClass) {
  return CLASS_DEFAULTS[jobClass] || CLASS_DEFAULTS.default;
}

function resourceBudgetFor(jobClass, override) {
  return { ...classify(jobClass), ...(override || {}) };
}

// --------------------------------------------------------------------------
// Alerts (reuse the existing ~/.tnf/alerts.json channel — already read at
// every session's Turn Zero startup; do not invent a second alert file)
// --------------------------------------------------------------------------

function appendAlert({ severity = 'info', source = 'resource-guard', message }) {
  try {
    fs.mkdirSync(path.dirname(ALERTS_FILE), { recursive: true });
    let alerts = [];
    if (fs.existsSync(ALERTS_FILE)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
        if (Array.isArray(parsed)) alerts = parsed;
      } catch {
        alerts = [];
      }
    }
    alerts.push({ severity, source, timestamp: new Date().toISOString(), message });
    if (alerts.length > 200) alerts = alerts.slice(-200);
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
  } catch {
    // Alerting must never be the reason a guard call fails.
  }
}

// --------------------------------------------------------------------------
// Preflight: system health + class-level concurrency lock in one call.
// --------------------------------------------------------------------------

/**
 * @param {{ jobId: string, jobClass?: string, ownerPid?: number, locksDir?: string }} opts
 * @returns {{ allow: boolean, reason: string, snapshot: object, lock?: object }}
 */
function preflight({ jobId, jobClass = 'default', ownerPid, locksDir, priority } = {}) {
  if (!envFlag('TNF_RESOURCE_GUARD', true)) {
    return { allow: true, reason: 'guard-disabled', snapshot: systemSnapshot() };
  }
  const snapshot = systemSnapshot();
  const level = normalizePriority(priority);
  const overload = isOverloaded(snapshot, defaultThresholds(snapshot, 'normal'));
  if (overload.overloaded) {
    const reason = overload.memOverloaded ? 'memory-pressure' : 'load-average';
    const metrics = `load1=${snapshot.load1.toFixed(2)} memPressure=${snapshot.memPressurePercent.toFixed(1)}%`;

    if (level === 'high') {
      const ceiling = isOverloaded(snapshot, defaultThresholds(snapshot, 'high'));
      if (!ceiling.overloaded) {
        // Deliberately a warning, not info: a priority admission means the box
        // was over the normal bar and something ran anyway. That should be
        // visible in the same alert stream an operator already reads at Turn
        // Zero, not silently swallowed.
        appendAlert({
          severity: 'warning',
          source: 'resource-guard',
          message: `preflight PRIORITY-ADMITTED job=${jobId} class=${jobClass} deferReason=${reason} ${metrics} (over normal bar load>=${overload.thresholds.loadThreshold}/mem>=${overload.thresholds.memPressureThreshold}%, under priority ceiling load>=${ceiling.thresholds.loadThreshold}/mem>=${ceiling.thresholds.memPressureThreshold}%)`,
        });
        return { allow: true, reason: 'priority-admitted', priority: level, deferReason: reason, snapshot };
      }
      appendAlert({
        severity: 'error',
        source: 'resource-guard',
        message: `preflight REFUSED priority job=${jobId} class=${jobClass} reason=${reason} ${metrics} — above the priority ceiling, no admission at any priority`,
      });
      return { allow: false, reason: `${reason}-above-priority-ceiling`, priority: level, snapshot };
    }

    appendAlert({
      severity: 'warning',
      source: 'resource-guard',
      message: `preflight deferred job=${jobId} class=${jobClass} reason=${reason} ${metrics}`,
    });
    return { allow: false, reason, priority: level, snapshot };
  }

  const budget = classify(jobClass);
  if (budget.maxConcurrent) {
    const guard = singleInstanceGuard({
      lockName: `tnf-class-${jobClass}`,
      ownerPid: ownerPid || process.ppid || process.pid,
      locksDir,
      staleMs: budget.maxWallClockMs ? budget.maxWallClockMs * 3 : 30 * 60 * 1000,
    });
    if (!guard.acquired) {
      return { allow: false, reason: 'class-concurrency-limit', snapshot, lock: guard.existingLock };
    }
    return { allow: true, reason: 'ok', snapshot, lock: guard };
  }

  return { allow: true, reason: 'ok', snapshot };
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

function cliMain(argv) {
  const cmd = argv[0];
  const opts = {};
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--job') opts.jobId = argv[++i];
    else if (a === '--class') opts.jobClass = argv[++i];
    else if (a === '--pid') opts.ownerPid = Number(argv[++i]);
    else if (a === '--locks-dir') opts.locksDir = argv[++i];
    else if (a === '--priority') opts.priority = argv[++i];
  }

  if (cmd === 'snapshot') {
    console.log(JSON.stringify(systemSnapshot({ fresh: true }), null, 2));
    return;
  }

  if (cmd === 'preflight') {
    if (!opts.jobId) {
      console.log(JSON.stringify({ allow: false, reason: 'missing --job' }));
      process.exit(2);
    }
    const result = preflight({
      jobId: opts.jobId,
      jobClass: opts.jobClass || 'default',
      ownerPid: opts.ownerPid || (process.ppid > 1 ? process.ppid : process.pid),
      locksDir: opts.locksDir,
      priority: opts.priority,
    });
    console.log(JSON.stringify(result));
    process.exit(result.allow ? 0 : 1);
  }

  if (cmd === 'release') {
    if (!opts.jobId) {
      console.log(JSON.stringify({ ok: false, error: 'missing --job' }));
      process.exit(2);
    }
    // Class locks self-heal via liveness detection in singleInstanceGuard,
    // so explicit release is best-effort convenience, not load-bearing.
    const { execFileSync: exec } = require('node:child_process');
    try {
      exec(process.execPath, [
        __filename.replace('tnf-resource-guard.cjs', 'tnf-single-instance-guard.cjs'),
        'release',
        '--lock-name', `tnf-class-${opts.jobClass || 'default'}`,
        '--pid', String(opts.ownerPid || process.ppid),
      ], { stdio: 'inherit' });
    } catch {
      // best effort
    }
    return;
  }

  if (argv.includes('--self-test')) {
    const snapshot = systemSnapshot({ fresh: true });
    const overload = isOverloaded(snapshot);
    console.log('TNF Resource Guard — self test');
    console.log(`  cpus:              ${snapshot.cpus}`);
    console.log(`  load1/5/15:        ${snapshot.load1.toFixed(2)} / ${snapshot.load5.toFixed(2)} / ${snapshot.load15.toFixed(2)}`);
    console.log(`  mem pressure:      ${snapshot.memPressurePercent.toFixed(1)}% (vm_stat ok: ${snapshot.memOk})`);
    console.log(`  reclaimable mem:   ${(snapshot.reclaimableMemBytes / 1024 / 1024).toFixed(0)} MB`);
    console.log(`  overloaded:        ${overload.overloaded} (load: ${overload.loadOverloaded}, mem: ${overload.memOverloaded})`);
    console.log(`  thresholds:        load1>=${overload.thresholds.loadThreshold}, memPressure>=${overload.thresholds.memPressureThreshold}%`);
    console.log('  Cross-check memPressure against Activity Monitor > Memory tab.');
    return;
  }

  console.log('Usage: tnf-resource-guard.cjs snapshot | preflight --job <id> [--class <class>] | release --job <id> [--class <class>] | --self-test');
  process.exit(2);
}

module.exports = {
  systemSnapshot,
  isOverloaded,
  defaultThresholds,
  normalizePriority,
  PRIORITY_LEVELS,
  HIGH_PRIORITY_ALIASES,
  classify,
  resourceBudgetFor,
  preflight,
  appendAlert,
  ALERTS_FILE,
};

if (require.main === module) {
  cliMain(process.argv.slice(2));
}
