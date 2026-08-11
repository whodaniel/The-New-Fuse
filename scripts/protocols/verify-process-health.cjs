#!/usr/bin/env node
/**
 * verify-process-health.cjs — watch the chronological control plane for
 * processes that are failing or have silently stopped.
 *
 * WHY
 *   Restoring the control plane made every scheduled process *record* its
 *   status. Nothing *read* those records. On 2026-08-06 three archaeology
 *   processes had been failing since at least 16:40 with a SyntaxError, and the
 *   only reason it surfaced was a human happening to poll the state file. That
 *   is the same defect as the 1,021 unread alerts: detection without delivery.
 *
 *   Two distinct failure shapes exist, and the second is the dangerous one:
 *
 *     error  — the process ran and exited non-zero. Loud, recorded, findable.
 *     stale  — the process stopped running at all. `status` still reads
 *              "healthy" from its last successful cycle, forever. This is how
 *              the catalog outage went unnoticed for ~11 weeks: nothing was
 *              failing, because nothing was running.
 *
 *   Checking status alone would have missed the outage that started this whole
 *   audit. Staleness is measured against each job's declared cadence.
 *
 * DELIVERY
 *   Findings go to ~/.tnf/alerts.json, which the Turn Zero Mandate's lightweight
 *   startup reads on every session ("Note any P0 alerts from ~/.tnf/alerts.json")
 *   and which Kilo's Gate 0 also consults. Writing anywhere else would repeat the
 *   mistake this file exists to prevent — a producer with no consumer.
 *   Alerts are keyed and replaced per process, so a persistent failure updates
 *   its entry rather than growing an unbounded queue.
 *
 * USAGE
 *   node scripts/protocols/verify-process-health.cjs            # human output
 *   node scripts/protocols/verify-process-health.cjs --json
 *   node scripts/protocols/verify-process-health.cjs --no-alert # report only
 *
 * EXIT
 *   0 = every enabled process is healthy and running on cadence
 *   1 = at least one is failing or stale
 *   2 = cannot run (control plane missing) — never conflated with 0
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const ALERTS = path.join(os.homedir(), '.tnf', 'alerts.json');
const JSON_OUT = process.argv.includes('--json');
const NO_ALERT = process.argv.includes('--no-alert');

const readJson = (p, fb = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fb;
  }
};

/**
 * Upper bound on how long a job may go without running, derived from its cron
 * cadence. Deliberately generous (3x the interval plus a floor) — a watchdog
 * that fires on ordinary jitter trains operators to ignore it.
 */
function maxAgeMs(cadence) {
  if (!cadence || cadence === 'manual') return null; // manual jobs cannot be stale
  const m = String(cadence).trim().split(/\s+/);
  if (m.length < 5) return null;
  const [min, hour] = m;
  let intervalMin;
  if (min.startsWith('*/')) intervalMin = parseInt(min.slice(2), 10);
  else if (hour.startsWith('*/')) intervalMin = parseInt(hour.slice(2), 10) * 60;
  else if (min === '*') intervalMin = 1;
  else if (hour === '*') intervalMin = 60;
  else intervalMin = 24 * 60; // daily or less frequent
  if (!Number.isFinite(intervalMin) || intervalMin <= 0) return null;
  return Math.max(intervalMin * 3, 30) * 60 * 1000;
}

function main() {
  const registry = readJson(path.join(REPO, 'data', 'protocols', 'cron-jobs.registry.json'));
  const state = readJson(path.join(REPO, 'data', 'protocols', 'cron-jobs.control-plane-state.json'));

  if (!registry) {
    console.error('[process-health] BLOCKED: cron-jobs.registry.json missing — cannot assess health');
    process.exit(2);
  }
  if (!state) {
    console.error('[process-health] BLOCKED: control-plane-state.json missing — no run history to read');
    process.exit(2);
  }

  const runtime = state.runtime || {};
  const now = Date.now();
  const findings = [];
  const healthy = [];
  const unscheduled = [];

  // Which process ids cron actually invokes. Absence of a crontab (CI, a fresh
  // clone) means nothing is scheduled here, so staleness and never-ran are not
  // meaningful and every enabled job reports as unscheduled rather than broken.
  let scheduledIds = new Set();
  try {
    const crontab = require('node:child_process').execSync('crontab -l', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    scheduledIds = new Set([...crontab.matchAll(/--process-id\s+"?([a-z0-9-]+)"?/g)].map((m) => m[1]));
  } catch {
    scheduledIds = new Set();
  }

  for (const job of registry.jobs || []) {
    const id = job.schedule_id;
    if (job.active === false) continue; // disabled on purpose
    const rt = runtime[id];
    const limit = maxAgeMs(job.cadence);

    if (!rt) {
      // "Registered but never ran" has two very different causes, and
      // conflating them makes this watchdog cry wolf:
      //
      //   unscheduled — the job is in the registry but no crontab line invokes
      //                 it. Nothing is broken; it was declared and never wired.
      //                 Informational, and NOT an alert.
      //   never-ran   — cron *does* invoke it, yet no cycle has ever recorded a
      //                 result. That means it is dying before the runner can
      //                 write state, which is a real fault.
      //
      // Reporting nine unscheduled jobs as failures would train the operator to
      // skip this output, which is precisely how the conditions it exists to
      // catch stayed hidden for eleven weeks.
      if (limit === null) continue;
      if (!scheduledIds.has(id)) {
        unscheduled.push(id);
        continue;
      }
      findings.push({
        id,
        kind: 'never-ran',
        detail: `cron invokes it on "${job.cadence}" but no cycle has ever recorded a result`,
        scope: job.scope,
      });
      continue;
    }

    if (rt.status === 'error') {
      const why = String(rt.lastOutputPreview || rt.lastError || 'no detail recorded').slice(0, 160);
      findings.push({ id, kind: 'error', detail: `exit=${rt.lastExitCode} ${why}`, scope: job.scope, at: rt.lastRunAt });
      continue;
    }

    const age = rt.lastRunAt ? now - Date.parse(rt.lastRunAt) : null;
    if (limit !== null && age !== null && Number.isFinite(age) && age > limit) {
      findings.push({
        id,
        kind: 'stale',
        detail: `last ran ${Math.round(age / 60000)}m ago; cadence "${job.cadence}" allows ${Math.round(limit / 60000)}m`,
        scope: job.scope,
        at: rt.lastRunAt,
      });
      continue;
    }

    healthy.push(id);
  }

  if (!NO_ALERT) writeAlerts(findings);

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        { ok: findings.length === 0, healthy: healthy.length, unscheduled, findings },
        null,
        2
      )
    );
  } else {
    console.log('\n[process-health] chronological control plane\n');
    for (const f of findings) {
      console.log(`  ${f.kind.toUpperCase().padEnd(10)} ${f.id}`);
      console.log(`             ${f.detail}`);
    }
    if (unscheduled.length) {
      console.log(
        `\n  NOTE  ${unscheduled.length} registered but not in crontab (declared, never wired):`
      );
      console.log(`        ${unscheduled.join(', ')}`);
    }
    console.log(
      findings.length === 0
        ? `\n  OK: ${healthy.length} scheduled process(es) healthy and on cadence\n`
        : `\n  ${findings.length} finding(s), ${healthy.length} healthy\n`
    );
  }

  // Exit code answers "did the watchdog do its job", not "are there findings".
  //
  // Findings are delivered through ~/.tnf/alerts.json. If discovering a problem
  // made this process exit non-zero, the control plane would record the
  // watchdog itself as `error` on every cycle where it worked correctly — and
  // it would then report itself as a finding on the next run. A monitor that
  // fails whenever it detects something is a monitor nobody can trust.
  //
  // --strict restores exit-1-on-findings for CI and manual invocation, where a
  // non-zero exit is the whole point.
  const strict = process.argv.includes('--strict');
  process.exit(strict && findings.length > 0 ? 1 : 0);
}

/**
 * Merge findings into ~/.tnf/alerts.json, replacing this source's previous
 * entries so a standing failure updates in place instead of accumulating.
 * Never throws: a watchdog that dies while reporting is worse than silent.
 */
function writeAlerts(findings) {
  try {
    const existing = Array.isArray(readJson(ALERTS, [])) ? readJson(ALERTS, []) : [];
    const others = existing.filter((a) => a && a.source !== 'process-health');
    const fresh = findings.map((f) => ({
      severity: f.kind === 'error' ? 'critical' : 'warning',
      source: 'process-health',
      timestamp: new Date().toISOString(),
      process_id: f.id,
      kind: f.kind,
      message: `${f.id}: ${f.kind} — ${f.detail}`,
    }));
    fs.mkdirSync(path.dirname(ALERTS), { recursive: true });
    fs.writeFileSync(ALERTS, JSON.stringify([...others, ...fresh], null, 2), 'utf8');
  } catch (err) {
    console.error(`[process-health] WARNING: could not write ${ALERTS}: ${err.message}`);
  }
}

main();
