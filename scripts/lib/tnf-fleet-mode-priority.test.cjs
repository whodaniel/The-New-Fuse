#!/usr/bin/env node
/**
 * Priority-admission tests for the fleet-mode gate and the resource guard.
 *
 * These exercise the decision functions against a temporary HOME so nothing
 * touches the operator's real ~/.tnf/fleet/mode.json, and no process is
 * started, signalled or paused. Run: node scripts/lib/tnf-fleet-mode-priority.test.cjs
 */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-fleet-mode-test-'));
process.env.HOME = tmpHome;
// Pin thresholds so the assertions do not drift with the host's core count.
process.env.TNF_CRON_MAX_LOAD_AVG = '16';
process.env.TNF_MAX_MEM_PRESSURE_PERCENT = '85';
process.env.TNF_PRIORITY_LOAD_MULTIPLIER = '2.5';
process.env.TNF_PRIORITY_MAX_MEM_PRESSURE_PERCENT = '96';

const guard = require('./tnf-resource-guard.cjs');
const fleet = require('./tnf-fleet-mode.cjs');

let pass = 0;
const results = [];
function it(label, fn) {
  try {
    fn();
    pass += 1;
    results.push(`  PASS  ${label}`);
  } catch (err) {
    results.push(`  FAIL  ${label}\n        ${err.message}`);
  }
}

function writeMode(mode, updatedBy, reason = 'test') {
  const dir = path.join(tmpHome, '.tnf', 'fleet');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'mode.json'),
    JSON.stringify({ mode, updatedBy, reason, updatedAt: new Date().toISOString() }, null, 2)
  );
}
function writeRawMode(text) {
  const dir = path.join(tmpHome, '.tnf', 'fleet');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mode.json'), text);
}
function clearMode() {
  fs.rmSync(path.join(tmpHome, '.tnf', 'fleet', 'mode.json'), { force: true });
}

// The exact snapshot that paused the fleet on 2026-09-05, and one past the
// priority ceiling.
const OVERLOADED = { cpus: 4, load1: 20.81, load5: 0, load15: 0, memPressurePercent: 95.6 };
const CATASTROPHIC = { cpus: 4, load1: 120, load5: 0, load15: 0, memPressurePercent: 99 };

console.log('TNF fleet-mode priority admission — self test (no real jobs touched)\n');

console.log('thresholds:');
it('normal bar is unchanged by the priority feature', () => {
  const t = guard.defaultThresholds(OVERLOADED, 'normal');
  assert.strictEqual(t.loadThreshold, 16);
  assert.strictEqual(t.memPressureThreshold, 85);
});
it('high bar is a raised ceiling, not disabled', () => {
  const t = guard.defaultThresholds(OVERLOADED, 'high');
  assert.strictEqual(t.loadThreshold, 40);
  assert.strictEqual(t.memPressureThreshold, 96);
});
it('an unrecognised priority string degrades to normal, never to high', () => {
  assert.strictEqual(guard.normalizePriority('sort-of-important'), 'normal');
  assert.strictEqual(guard.normalizePriority(undefined), 'normal');
  assert.strictEqual(guard.normalizePriority(''), 'normal');
  assert.strictEqual(guard.normalizePriority('HIGH'), 'high');
});
it("the guard speaks the broker's priority vocabulary, not a second one", () => {
  // Mirrors TaskSchedulerService.taskPriorityWeight: p0/urgent/critical/p1/high
  // outrank normal/p2/medium/p3/low. Same words, same meaning, both layers.
  for (const word of ['p0', 'urgent', 'critical', 'p1', 'high', 'P0', ' Urgent ']) {
    assert.strictEqual(guard.normalizePriority(word), 'high', `${word} should be high`);
  }
  for (const word of ['normal', 'medium', 'p2', 'p3', 'low']) {
    assert.strictEqual(guard.normalizePriority(word), 'normal', `${word} should be normal`);
  }
});
it('the 2026-09-05 pause snapshot is over the normal bar and under the ceiling', () => {
  assert.strictEqual(guard.isOverloaded(OVERLOADED, guard.defaultThresholds(OVERLOADED, 'normal')).overloaded, true);
  assert.strictEqual(guard.isOverloaded(OVERLOADED, guard.defaultThresholds(OVERLOADED, 'high')).overloaded, false);
});
it('a catastrophic snapshot is over the ceiling too', () => {
  assert.strictEqual(guard.isOverloaded(CATASTROPHIC, guard.defaultThresholds(CATASTROPHIC, 'high')).overloaded, true);
});

console.log('\nfleet admission:');
it('no mode file means running, at every priority', () => {
  clearMode();
  assert.strictEqual(fleet.fleetAdmission({}).admit, true);
  assert.strictEqual(fleet.fleetAdmission({ priority: 'high' }).admit, true);
});
it('a watchdog pause still stops normal work', () => {
  writeMode('paused', 'resource-watchdog');
  const d = fleet.fleetAdmission({ priority: 'normal' });
  assert.strictEqual(d.admit, false);
  assert.strictEqual(d.reason, 'fleet-paused');
});
it('an OPERATOR pause is absolute — high priority does not pass', () => {
  writeMode('paused', 'operator');
  const d = fleet.fleetAdmission({ priority: 'high' });
  assert.strictEqual(d.admit, false);
  assert.strictEqual(d.reason, 'operator-pause-is-absolute');
});
it('a pause by any non-watchdog actor is treated as an operator pause', () => {
  writeMode('paused', 'tnf-cli');
  assert.strictEqual(fleet.fleetAdmission({ priority: 'high' }).reason, 'operator-pause-is-absolute');
});
it('an unreadable mode file fails safe to paused at high priority', () => {
  writeRawMode('{ this is not json');
  const d = fleet.fleetAdmission({ priority: 'high' });
  assert.strictEqual(d.admit, false);
  assert.strictEqual(d.reason, 'fleet-mode-unreadable');
});
it('injection-paused never becomes an injection licence via priority', () => {
  writeMode('injection-paused', 'resource-watchdog');
  // Admitted as ordinary work (that is what injection-paused means), but the
  // injection gate itself stays closed regardless of priority.
  assert.strictEqual(fleet.fleetAdmission({ priority: 'high' }).reason, 'injection-paused-only');
  assert.strictEqual(fleet.isInjectionPaused(), true);
});
it('legacy isFleetPaused() with no argument is unchanged', () => {
  writeMode('paused', 'resource-watchdog');
  assert.strictEqual(fleet.isFleetPaused(), true);
  writeMode('injection-paused', 'resource-watchdog');
  assert.strictEqual(fleet.isFleetPaused(), false);
  clearMode();
  assert.strictEqual(fleet.isFleetPaused(), false);
});

// preflight() reads the real snapshot through a module-local binding, so the
// thresholds are what these tests move, not the machine. Each case sets the
// bars relative to the live load so the outcome is deterministic on any host.
console.log('\npreflight (thresholds moved around the live snapshot):');
const live = guard.systemSnapshot({ fresh: true });
function withBars({ normalLoad, priorityMultiplier }, fn) {
  const saved = { ...process.env };
  process.env.TNF_CRON_MAX_LOAD_AVG = String(normalLoad);
  process.env.TNF_PRIORITY_LOAD_MULTIPLIER = String(priorityMultiplier);
  // Keep memory out of the decision so these cases isolate the load path.
  process.env.TNF_MAX_MEM_PRESSURE_PERCENT = '100';
  process.env.TNF_PRIORITY_MAX_MEM_PRESSURE_PERCENT = '100';
  try {
    return fn();
  } finally {
    process.env = saved;
  }
}
// Bars placed below / above the live load1, whatever it currently is.
const under = Math.max(0.01, live.load1 / 2);
const overMultiplier = ((live.load1 * 4) / under) + 1;

it('a normal job is deferred over the normal bar', () => {
  withBars({ normalLoad: under, priorityMultiplier: overMultiplier }, () => {
    const r = guard.preflight({ jobId: 'test-normal', jobClass: 'probe' });
    assert.strictEqual(r.allow, false);
    assert.strictEqual(r.reason, 'load-average');
  });
});
it('a high-priority job is admitted over the normal bar', () => {
  withBars({ normalLoad: under, priorityMultiplier: overMultiplier }, () => {
    const r = guard.preflight({ jobId: 'test-priority', jobClass: 'probe', priority: 'high' });
    assert.strictEqual(r.allow, true);
    assert.strictEqual(r.reason, 'priority-admitted');
    assert.strictEqual(r.deferReason, 'load-average');
  });
});
it('a high-priority job is REFUSED above the ceiling', () => {
  // Ceiling sits at under * 1, still below the live load — nothing passes.
  withBars({ normalLoad: under, priorityMultiplier: 1 }, () => {
    const r = guard.preflight({ jobId: 'test-ceiling', jobClass: 'probe', priority: 'high' });
    assert.strictEqual(r.allow, false);
    assert.ok(r.reason.endsWith('-above-priority-ceiling'), `reason was ${r.reason}`);
  });
});
it('a healthy box allows both priorities with reason ok', () => {
  withBars({ normalLoad: live.load1 + 1000, priorityMultiplier: 2.5 }, () => {
    assert.strictEqual(guard.preflight({ jobId: 'h1', jobClass: 'probe' }).reason, 'ok');
    assert.strictEqual(guard.preflight({ jobId: 'h2', jobClass: 'probe', priority: 'high' }).reason, 'ok');
  });
});

console.log(results.join('\n'));
const total = results.length;
console.log(`\n${pass} passed, ${total - pass} failed`);
fs.rmSync(tmpHome, { recursive: true, force: true });
process.exit(pass === total ? 0 : 1);
