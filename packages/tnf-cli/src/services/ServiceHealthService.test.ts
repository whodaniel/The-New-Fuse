/**
 * Guard for the launchd service health surface.
 *
 * This surface exists because on 2026-08-12 two services failed for hours with
 * nothing reporting it: com.tnf.ws-green-blue-bridge in a permanent OOM crash
 * loop, and com.tnf.subdirector-autopilot unloaded entirely after ENOSPC. They
 * appeared in no TNF health output — only in raw `launchctl list` exit codes.
 *
 * The classification rules below are the ones that make a crash loop
 * distinguishable from a healthy restart, which is the whole difficulty: under
 * KeepAlive, launchd shows a fresh pid moments after every crash.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { ServiceHealthService, classify, parseLaunchctlList } from './ServiceHealthService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

console.log('\nservice health — launchctl parsing');

// Real shape, including the '-' placeholders launchctl uses.
const RAW = [
  'PID\tStatus\tLabel',
  '1273\t0\tcom.tnf.local-subdirector',
  '14886\t-6\tcom.tnf.ws-green-blue-bridge',
  '-\t-15\tcom.tnf.subdirector-autopilot',
  '-\t1\tcom.tnf.master-heartbeat',
  '-\t0\tcom.thenewfuse.api-local',
  '51743\t1\tcom.tnf.federation-broker.fuse-activity-log',
].join('\n');

const rows = parseLaunchctlList(RAW);
check(
  'header row is skipped',
  rows.every((r) => r.label !== 'Label')
);
check('parses all six services', rows.length === 6, String(rows.length));
check(
  'numeric pid parsed',
  rows.find((r) => r.label === 'com.tnf.local-subdirector')?.pid === 1273
);
check(
  'dash pid becomes null',
  rows.find((r) => r.label === 'com.tnf.subdirector-autopilot')?.pid === null
);
check(
  'negative status preserved',
  rows.find((r) => r.label === 'com.tnf.ws-green-blue-bridge')?.status === -6
);
check('malformed lines are dropped', parseLaunchctlList('garbage\n\n').length === 0);

console.log('\nservice health — classification');

const by = (label: string) => rows.find((r) => r.label === label)!;

// The core distinction, in both directions.
//
// A signal-killed service under KeepAlive is running again by the time you
// look, so pid presence must not imply health — BUT a live pid with clean
// logs is an operator restart, not a crash loop. Reporting seven healthy
// services as crash-looping (which an earlier version did, after a
// `launchctl kickstart -k`) destroys trust in this output just as thoroughly
// as missing a real crash. Corroborating evidence decides.
check(
  'SIGABRT + live pid + recent fatal logs is a crash loop',
  classify(by('com.tnf.ws-green-blue-bridge'), true) === 'crash-loop'
);
check(
  'SIGABRT + live pid + NO fatal logs is a restart, not a crash loop',
  classify(by('com.tnf.ws-green-blue-bridge'), false) === 'restarted'
);
check(
  'signal-killed with NO pid is a crash loop regardless of logs',
  classify(by('com.tnf.subdirector-autopilot'), false) === 'crash-loop'
);
check(
  'SIGTERM with no pid is a crash loop',
  classify(by('com.tnf.subdirector-autopilot')) === 'crash-loop'
);
check('positive exit with no pid is failed', classify(by('com.tnf.master-heartbeat')) === 'failed');
check(
  'positive exit + live pid + fatal logs is failed',
  classify(by('com.tnf.federation-broker.fuse-activity-log'), true) === 'failed'
);
check(
  'positive exit + live pid + clean logs is a restart',
  classify(by('com.tnf.federation-broker.fuse-activity-log'), false) === 'restarted'
);
check('exit 0 with a pid is running', classify(by('com.tnf.local-subdirector')) === 'running');
check(
  'exit 0 with no pid is idle, not failed',
  classify(by('com.thenewfuse.api-local')) === 'idle'
);

console.log('\nservice health — problem detection');

const report = [
  { label: 'a', state: 'running' as const, pid: 1, lastExit: 0, detail: '' },
  { label: 'b', state: 'idle' as const, pid: null, lastExit: 0, detail: '' },
];
check('a healthy report has no problems', !ServiceHealthService.hasProblems(report));
check(
  'a crash loop is a problem',
  ServiceHealthService.hasProblems([
    ...report,
    { label: 'c', state: 'crash-loop', pid: null, lastExit: -6, detail: '' },
  ])
);
check(
  'a not-loaded plist is a problem — the autopilot failure mode',
  ServiceHealthService.hasProblems([
    ...report,
    { label: 'd', state: 'not-loaded', pid: null, lastExit: null, detail: '' },
  ])
);
check(
  'a restarted service is NOT a problem — it is up with clean logs',
  !ServiceHealthService.hasProblems([
    ...report,
    { label: 'e', state: 'restarted', pid: 9, lastExit: -15, detail: '' },
  ])
);

console.log('\nservice health — live host');

// Not asserting specific services: this must work on any machine, including
// one with no TNF services installed.
const live = new ServiceHealthService().report();
check('report() returns an array without throwing', Array.isArray(live));
check(
  'every entry carries a label and a state',
  live.every((s) => typeof s.label === 'string' && typeof s.state === 'string')
);
check(
  'problems sort ahead of healthy services',
  (() => {
    const firstHealthy = live.findIndex((s) => s.state === 'running' || s.state === 'idle');
    const lastProblem = live.map((s) => s.state).lastIndexOf('crash-loop');
    return firstHealthy === -1 || lastProblem === -1 || lastProblem < firstHealthy;
  })()
);

console.log(`\nservice-health: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
