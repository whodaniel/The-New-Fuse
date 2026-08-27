#!/usr/bin/env node

/**
 * TNF Resource Watchdog
 *
 * The runtime-enforcement layer that was entirely missing before 2026-08-27:
 * tnf-resource-guard.cjs / tnf-launchd-guard.sh gate a job BEFORE it starts,
 * but nothing was watching an already-running job and stopping it once it
 * exceeded a budget. com.thenewfuse.qa-swarm passed any reasonable preflight
 * (it started fine) and only became a problem minutes into an unbounded
 * vite-build loop — a preflight-only design can never catch that class of
 * failure. This closes that gap.
 *
 * WHAT IT DOES, every cycle (~20s, self-throttling):
 *   1. Takes a system snapshot (scripts/lib/tnf-resource-guard.cjs).
 *   2. Attributes running processes to TNF jobs by reading the small
 *      registration files tnf-launchd-guard.sh writes to
 *      ~/.tnf/resource-watchdog/registry/ (jobLabel/jobClass/rootPid), then
 *      walking the live ps process tree from each rootPid to collect its
 *      descendants. (An earlier design tagged jobs via an env var and read
 *      it back with `ps eww`. That failed empirically — macOS blocks
 *      reading another process's environment across the launchd
 *      bootstrap-namespace boundary, so it could never see tags on the
 *      exact class of processes, launchd daemons, this exists to protect.
 *      The registry approach also means this file never reads any process's
 *      environment at all, which sidesteps entirely the fact that `ps eww`
 *      output contains live secrets for every process on the box.)
 *   3. Per-job: if a job's aggregate CPU%/RSS/wall-clock exceeds its declared
 *      resourceBudget, SIGTERM its process group, grace period, SIGKILL.
 *   4. Fleet-wide: if the system itself is overloaded regardless of
 *      attribution, trip the existing fleet-pause switch
 *      (scripts/lib/tnf-fleet-mode.cjs — already respected by every
 *      cron-routed job) and kill the single worst CPU offender among
 *      TNF-tagged processes. This productionizes what was previously a
 *      manual step (tnf-process-health.sh --kill-stuck).
 *   5. Auto-resumes a pause IT set once the system has been healthy for a
 *      few consecutive samples — but never clears a pause an operator set
 *      themselves (checks fleet mode's updatedBy field first).
 *
 * SAFETY BOUNDARIES (read before touching kill logic):
 *   - This process NEVER signals anything that isn't attributed to a
 *     TNF_JOB_LABEL-tagged process tree. It has no "kill top CPU consumer
 *     system-wide" mode — that would risk the user's own shell, Terminal, or
 *     editor. Only processes descended from a job the guard wrapper started
 *     are ever candidates.
 *   - PROTECTED_LABELS (see below) are monitored/alerted on but never
 *     killed automatically — e.g. the Redis bus, because an unbounded
 *     restart/kill loop against it has been a real recurring incident here
 *     before. Breaches there are loud alerts, not automatic action.
 *   - Attribution never reads any process's environment (see above) — only
 *     pid/ppid/cpu/rss/etime/comm, which carry no secrets. Do not "simplify"
 *     this back to env-var introspection; besides the secrets exposure, it
 *     does not work for launchd-spawned processes on this OS (see above).
 *
 * Run under its own launchd job (com.tnf.resource-watchdog), itself routed
 * through tnf-launchd-guard.sh with class=watchdog (Nice 10, tight budget)
 * so it can never become the runaway process it exists to catch.
 */

'use strict';

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const guard = require('../lib/tnf-resource-guard.cjs');
const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const { readFleetMode, setFleetMode, isFleetPaused } = require('../lib/tnf-fleet-mode.cjs');

const REGISTRY_DIR = path.join(os.homedir(), '.tnf', 'resource-watchdog', 'registry');
const REGISTRY_STALE_MS = 24 * 60 * 60 * 1000; // prune entries whose root died >24h ago

const BASE_INTERVAL_MS = Number(process.env.TNF_WATCHDOG_INTERVAL_MS || 20000);
const BACKOFF_INTERVAL_MS = Number(process.env.TNF_WATCHDOG_BACKOFF_MS || 45000);
const GRACE_MS = Number(process.env.TNF_WATCHDOG_GRACE_MS || 5000);
const HEALTHY_STREAK_TO_RESUME = Number(process.env.TNF_WATCHDOG_RESUME_STREAK || 3);
const SELF_LABEL = 'com.tnf.resource-watchdog';

// Never an automatic-kill target. Monitored and alerted on like anything
// else, but a human decides what happens to these — see file header.
const PROTECTED_LABELS = new Set([
  'com.thenewfuse.redis-tnf-bus',
  SELF_LABEL,
]);

function nowIso() {
  return new Date().toISOString();
}

// macOS ps has no `etimes` (raw-seconds elapsed) keyword — that's GNU/Linux
// ps only. BSD ps gives `etime` as [[dd-]hh:]mm:ss, parsed here instead.
function parseEtimeToSeconds(etime) {
  const m = String(etime).trim().match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/);
  if (!m) return 0;
  const [, days, hours, minutes, seconds] = m;
  return (
    (Number(days) || 0) * 86400 +
    (Number(hours) || 0) * 3600 +
    (Number(minutes) || 0) * 60 +
    (Number(seconds) || 0)
  );
}

function safeExec(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', timeout: 5000, maxBuffer: 8 * 1024 * 1024 });
  } catch (err) {
    return err && err.stdout ? String(err.stdout) : '';
  }
}

/**
 * Safe columns only — pid/ppid/pcpu/rss/etime/comm. No args, no env, safe to
 * log/alert with verbatim. This is the ONLY ps call the watchdog makes.
 */
function collectProcesses() {
  const user = os.userInfo().username;
  const safeOut = safeExec('ps', ['-U', user, '-ww', '-o', 'pid,ppid,pcpu,rss,etime,comm']);
  const byPid = new Map();
  for (const line of safeOut.split('\n').slice(1)) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    const [, pid, ppid, pcpu, rssKb, etime, comm] = m;
    byPid.set(Number(pid), {
      pid: Number(pid),
      ppid: Number(ppid),
      pcpu: Number(pcpu),
      rssMb: Number(rssKb) / 1024,
      etimeSec: parseEtimeToSeconds(etime),
      comm: comm.trim(),
    });
  }
  return byPid;
}

/**
 * Reads ~/.tnf/resource-watchdog/registry/*.json (written by
 * tnf-launchd-guard.sh right before it execs a job's real command — see that
 * script's header for why registry files replace env-var tagging here).
 * Prunes entries whose rootPid has been dead for more than REGISTRY_STALE_MS
 * so the directory doesn't grow unbounded across job restarts.
 */
function readRegistry() {
  let files = [];
  try {
    files = fs.readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const entries = [];
  for (const file of files) {
    const fullPath = path.join(REGISTRY_DIR, file);
    try {
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (!raw.jobLabel || !Number.isFinite(raw.rootPid)) continue;
      entries.push(raw);
    } catch {
      continue;
    }
  }
  return entries;
}

// process.kill(pid, 0) throws ESRCH when the pid genuinely doesn't exist,
// but EPERM when it exists and simply isn't ours to signal (e.g. pid 1,
// root-owned). Treating EPERM as "not alive" would silently and permanently
// drop a registry entry if a job's root pid were ever owned by another user
// — unlikely in this fleet (everything runs as the same user) but cheap to
// get right.
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === 'EPERM';
  }
}

/**
 * For each registry entry, walks the ps process tree (by ppid) starting at
 * rootPid to find every live descendant, and aggregates their CPU/RSS/max
 * elapsed time into one job record. A root whose pid is no longer alive
 * contributes nothing this cycle (the job has exited) — its registry file
 * is left for the next cycle's staleness sweep rather than deleted here, so
 * a job that restarts under the same label just overwrites it naturally.
 */
function groupByJob(byPid, registryEntries) {
  const childrenByPpid = new Map();
  for (const p of byPid.values()) {
    if (!childrenByPpid.has(p.ppid)) childrenByPpid.set(p.ppid, []);
    childrenByPpid.get(p.ppid).push(p.pid);
  }

  const jobs = [];
  const attributedPids = new Set();
  for (const entry of registryEntries) {
    if (!isPidAlive(entry.rootPid)) continue;
    const root = byPid.get(entry.rootPid);
    if (!root) continue; // alive but not owned by this user / already gone from the snapshot

    const treePids = [];
    const stack = [entry.rootPid];
    const seen = new Set();
    while (stack.length > 0) {
      const pid = stack.pop();
      if (seen.has(pid)) continue;
      seen.add(pid);
      const proc = byPid.get(pid);
      if (!proc) continue;
      treePids.push(pid);
      for (const childPid of childrenByPpid.get(pid) || []) stack.push(childPid);
    }
    if (treePids.length === 0) continue;

    const job = {
      jobLabel: entry.jobLabel,
      jobClass: entry.jobClass || 'default',
      pids: treePids,
      pcpuSum: 0,
      rssMbSum: 0,
      maxEtimeSec: 0,
    };
    for (const pid of treePids) {
      const proc = byPid.get(pid);
      job.pcpuSum += proc.pcpu;
      job.rssMbSum += proc.rssMb;
      job.maxEtimeSec = Math.max(job.maxEtimeSec, proc.etimeSec);
      attributedPids.add(pid);
    }
    jobs.push(job);
  }
  return jobs;
}

function killGroup(job, reason) {
  for (const pid of job.pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  guard.appendAlert({
    severity: 'warning',
    source: 'resource-watchdog',
    message: `SIGTERM sent job=${job.jobLabel} class=${job.jobClass} pids=${job.pids.length} reason=${reason} cpuSum=${job.pcpuSum.toFixed(0)}% rssSum=${job.rssMbSum.toFixed(0)}MB wallClockSec=${job.maxEtimeSec}`,
  });
  setTimeout(() => {
    let stillAlive = 0;
    for (const pid of job.pids) {
      try {
        process.kill(pid, 0);
        process.kill(pid, 'SIGKILL');
        stillAlive += 1;
      } catch {
        /* already exited cleanly after SIGTERM */
      }
    }
    if (stillAlive > 0) {
      guard.appendAlert({
        severity: 'error',
        source: 'resource-watchdog',
        message: `SIGKILL escalation job=${job.jobLabel} pids_force_killed=${stillAlive} (did not exit within ${GRACE_MS}ms of SIGTERM)`,
      });
    }
  }, GRACE_MS);
}

// Pure decision function — no process.kill, no alerts, no I/O. Exercised
// directly by --self-test against fabricated data so the breach logic can be
// verified without spawning real load-generating processes.
function detectBreaches(job, budgetOverride) {
  const budget = budgetOverride || guard.classify(job.jobClass);
  const breaches = [];
  if (budget.maxCpuPercent && job.pcpuSum > budget.maxCpuPercent) {
    breaches.push(`cpu ${job.pcpuSum.toFixed(0)}%>${budget.maxCpuPercent}%`);
  }
  if (budget.maxRssMb && job.rssMbSum > budget.maxRssMb) {
    breaches.push(`rss ${job.rssMbSum.toFixed(0)}MB>${budget.maxRssMb}MB`);
  }
  if (budget.maxWallClockMs && job.maxEtimeSec * 1000 > budget.maxWallClockMs) {
    breaches.push(`wallclock ${job.maxEtimeSec}s>${(budget.maxWallClockMs / 1000).toFixed(0)}s`);
  }
  return breaches;
}

function enforcePerJobBudgets(jobs) {
  for (const job of jobs) {
    if (job.jobLabel === SELF_LABEL) continue; // never self-target
    const breaches = detectBreaches(job);
    if (breaches.length === 0) continue;

    if (PROTECTED_LABELS.has(job.jobLabel)) {
      guard.appendAlert({
        severity: 'warning',
        source: 'resource-watchdog',
        message: `PROTECTED job=${job.jobLabel} breached budget (${breaches.join(', ')}) — alert only, no automatic kill (see PROTECTED_LABELS)`,
      });
      continue;
    }

    killGroup(job, breaches.join(', '));
  }
}

function enforceFleetCircuitBreaker(jobs, snapshot) {
  const overload = guard.isOverloaded(snapshot);
  const fleetState = readFleetMode();

  if (overload.overloaded) {
    if (!fleetState.paused) {
      setFleetMode(
        'paused',
        `resource-watchdog: fleet overloaded (load1=${snapshot.load1.toFixed(2)}, memPressure=${snapshot.memPressurePercent.toFixed(1)}%)`,
        'resource-watchdog'
      );
      guard.appendAlert({
        severity: 'error',
        source: 'resource-watchdog',
        message: `FLEET PAUSED: load1=${snapshot.load1.toFixed(2)} memPressure=${snapshot.memPressurePercent.toFixed(1)}% — all cron-routed work halted until resource pressure clears`,
      });
    }
    const candidates = jobs
      .filter((j) => !PROTECTED_LABELS.has(j.jobLabel))
      .sort((a, b) => b.pcpuSum - a.pcpuSum);
    const worst = candidates[0];
    if (worst && worst.pcpuSum > 50) {
      killGroup(worst, 'fleet-wide-overload-worst-offender');
    }
    return { pausedThisCycle: true, healthyStreak: 0 };
  }

  return { pausedThisCycle: false };
}

function maybeAutoResume(healthyStreak) {
  const fleetState = readFleetMode();
  if (!fleetState.paused) return healthyStreak;
  if (fleetState.updatedBy !== 'resource-watchdog') {
    // An operator (or something else) paused the fleet — not ours to clear.
    return 0;
  }
  const nextStreak = healthyStreak + 1;
  if (nextStreak >= HEALTHY_STREAK_TO_RESUME) {
    setFleetMode('running', 'resource-watchdog: system healthy for consecutive samples, auto-resuming', 'resource-watchdog');
    guard.appendAlert({
      severity: 'info',
      source: 'resource-watchdog',
      message: `FLEET RESUMED: healthy for ${nextStreak} consecutive samples`,
    });
    return 0;
  }
  return nextStreak;
}

async function tick(state) {
  const snapshot = guard.systemSnapshot({ fresh: true });
  const byPid = collectProcesses();
  const registryEntries = readRegistry();
  const jobs = groupByJob(byPid, registryEntries);

  enforcePerJobBudgets(jobs);
  const breaker = enforceFleetCircuitBreaker(jobs, snapshot);

  if (breaker.pausedThisCycle) {
    state.healthyStreak = 0;
    state.intervalMs = BACKOFF_INTERVAL_MS;
  } else {
    state.healthyStreak = maybeAutoResume(state.healthyStreak);
    state.intervalMs = isFleetPaused() ? BACKOFF_INTERVAL_MS : BASE_INTERVAL_MS;
  }
}

async function main() {
  const selfGuard = singleInstanceGuard({ lockName: 'tnf-resource-watchdog', staleMs: 60000 });
  if (!selfGuard.acquired) {
    console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: selfGuard.existingLock }));
    return;
  }

  guard.appendAlert({ severity: 'info', source: 'resource-watchdog', message: `watchdog started pid=${process.pid}` });

  const state = { intervalMs: BASE_INTERVAL_MS, healthyStreak: 0 };
  let stopping = false;

  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    selfGuard.release();
    guard.appendAlert({ severity: 'info', source: 'resource-watchdog', message: 'watchdog stopping' });
    process.exit(0);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  // eslint-disable-next-line no-constant-condition
  while (!stopping) {
    try {
      await tick(state);
    } catch (err) {
      guard.appendAlert({
        severity: 'error',
        source: 'resource-watchdog',
        message: `tick failed: ${err && err.message ? err.message : String(err)}`,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, state.intervalMs));
  }
}

// --------------------------------------------------------------------------
// Self-test: exercises the pure decision logic (detectBreaches, groupByJob,
// PROTECTED_LABELS exclusion, fleet-overload classification) against
// fabricated job/snapshot data. No real processes are touched, nothing is
// killed, nothing is written to alerts.json or fleet mode — this only proves
// the decision logic itself is correct, per the user's request to verify
// without spawning a synthetic load process.
// --------------------------------------------------------------------------
function selfTest() {
  let pass = 0;
  let fail = 0;
  const check = (label, condition) => {
    if (condition) {
      pass += 1;
      console.log(`  PASS  ${label}`);
    } else {
      fail += 1;
      console.log(`  FAIL  ${label}`);
    }
  };

  console.log('TNF Resource Watchdog — self test (no real processes touched)\n');

  console.log('detectBreaches:');
  const overCpu = { jobLabel: 'x', jobClass: 'probe', pcpuSum: 250, rssMbSum: 10, maxEtimeSec: 5 };
  check('CPU over budget (probe: maxCpuPercent=40) is flagged', detectBreaches(overCpu).some((b) => b.startsWith('cpu')));

  const overRss = { jobLabel: 'x', jobClass: 'probe', pcpuSum: 1, rssMbSum: 9999, maxEtimeSec: 5 };
  check('RSS over budget is flagged', detectBreaches(overRss).some((b) => b.startsWith('rss')));

  const overWall = { jobLabel: 'x', jobClass: 'build', pcpuSum: 1, rssMbSum: 1, maxEtimeSec: 999999 };
  check('wall-clock over budget (build: maxWallClockMs=6min) is flagged', detectBreaches(overWall).some((b) => b.startsWith('wallclock')));

  const healthy = { jobLabel: 'x', jobClass: 'default', pcpuSum: 1, rssMbSum: 1, maxEtimeSec: 5 };
  check('healthy job produces zero breaches', detectBreaches(healthy).length === 0);

  console.log('\ngroupByJob attribution (registry + process-tree walk, no env reads):');
  // isPidAlive uses process.kill(pid, 0), which throws EPERM (not ESRCH) for
  // a real-but-not-ours pid like 1 (root-owned launchd) — using this test
  // process's OWN pid as the fake root avoids that permission-vs-existence
  // ambiguity entirely. A separate case below covers the not-alive path.
  const selfPid = process.pid;
  const fakeChildPid = selfPid + 1; // synthetic, only used as a map key here
  const fakeByPid = new Map([
    [selfPid, { pid: selfPid, ppid: 0, pcpu: 100, rssMb: 500, etimeSec: 10, comm: 'node' }],
    [fakeChildPid, { pid: fakeChildPid, ppid: selfPid, pcpu: 100, rssMb: 500, etimeSec: 8, comm: 'vite' }],
    [999999, { pid: 999999, ppid: 0, pcpu: 999, rssMb: 9999, etimeSec: 999999, comm: 'unrelated' }],
  ]);
  const fakeRegistry = [{ jobLabel: 'job-a', jobClass: 'build', rootPid: selfPid }];
  const jobs = groupByJob(fakeByPid, fakeRegistry);
  check('a process with no registry entry is never attributed to any job', jobs.length === 1 && jobs[0].jobLabel === 'job-a');
  check('a child process (by ppid) is folded into its root\'s job via tree walk', jobs[0].pids.includes(fakeChildPid));
  check('tagged processes in the same tree aggregate CPU/RSS correctly', jobs[0].pcpuSum === 200 && jobs[0].rssMbSum === 1000);

  const deadRootRegistry = [{ jobLabel: 'job-dead', jobClass: 'build', rootPid: 424242 }];
  const jobsFromDeadRoot = groupByJob(fakeByPid, deadRootRegistry);
  check('a registry entry whose rootPid is not alive contributes no job (isPidAlive gate)', jobsFromDeadRoot.length === 0);

  console.log('\nPROTECTED_LABELS safety boundary:');
  check('redis bus is in PROTECTED_LABELS (never auto-killed)', PROTECTED_LABELS.has('com.thenewfuse.redis-tnf-bus'));
  check('the watchdog itself is in PROTECTED_LABELS (never self-targets)', PROTECTED_LABELS.has(SELF_LABEL));

  console.log('\nFleet-wide overload classification (guard.isOverloaded):');
  const overloadedSnap = { cpus: 4, load1: 999, load5: 0, load15: 0, memPressurePercent: 10 };
  check('extreme load1 alone trips overload', guard.isOverloaded(overloadedSnap).overloaded === true);
  const memSnap = { cpus: 4, load1: 0.1, load5: 0, load15: 0, memPressurePercent: 99 };
  check('extreme memory pressure alone trips overload', guard.isOverloaded(memSnap).overloaded === true);
  const okSnap = { cpus: 4, load1: 1, load5: 1, load15: 1, memPressurePercent: 40 };
  check('normal snapshot does not trip overload', guard.isOverloaded(okSnap).overloaded === false);

  console.log('\netime parsing (BSD ps format, not Linux etimes):');
  check('"05:30" -> 330s', parseEtimeToSeconds('05:30') === 330);
  check('"01:02:03" -> 3723s', parseEtimeToSeconds('01:02:03') === 3723);
  check('"2-01:00:00" -> 176400s', parseEtimeToSeconds('2-01:00:00') === 176400);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

module.exports = { detectBreaches, groupByJob, isPidAlive, parseEtimeToSeconds, PROTECTED_LABELS, SELF_LABEL };

if (require.main === module) {
  if (process.argv.includes('--self-test')) {
    selfTest();
  } else {
    main().catch((err) => {
      console.error(JSON.stringify({ ok: false, error: err.message || String(err) }));
      process.exit(1);
    });
  }
}
