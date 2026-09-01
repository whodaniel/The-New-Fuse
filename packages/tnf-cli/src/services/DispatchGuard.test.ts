/**
 * Guard for fleet dispatch honesty.
 *
 * Pins the behaviour whose absence was measured on 2026-08-12: `tnf send`
 * printed "📤 Message sent" and exited 0 for a nonexistent agent id and for a
 * director whose last heartbeat was four hours old. Every automated caller —
 * cron, the full-auto loop, handoff fan-out — read that exit 0 as delivery.
 *
 * The assertions below are the contract that makes dispatch capable of
 * failing. If a future change makes `resolveRecipient` optimistic again, this
 * goes red instead of the fleet going quiet.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import {
  DEFAULT_LIVENESS_WINDOW_MS,
  decideDispatch,
  resolveRecipient,
  type RegisteredAgent,
} from './DispatchGuard.js';

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

const NOW = Date.parse('2026-08-12T08:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

// Mirrors the real roster shape observed from `tnf agents list`.
const ROSTER: RegisteredAgent[] = [
  {
    agentId: 'agent_hermes-codegen-worker_1782364000001',
    name: 'hermes-codegen-worker',
    role: 'worker',
    lastSeen: ago(5_000),
  },
  {
    agentId: 'agent_hermes-infra-worker_1782364000002',
    name: 'hermes-infra-worker',
    role: 'worker',
    lastSeen: ago(9_000),
  },
  {
    agentId: 'DIRECTOR-1786507420823',
    name: 'TNF Runtime Director',
    role: 'director',
    lastSeen: ago(4 * 60 * 60 * 1000),
  },
  {
    agentId: 'tnf-local-subdirector',
    name: 'tnf-local-subdirector',
    role: 'director',
    lastSeen: ago(57 * 60 * 1000),
  },
];

const opts = { now: NOW };

console.log('\ndispatch — recipient resolution');

const live = resolveRecipient('agent_hermes-codegen-worker_1782364000001', ROSTER, opts);
check('a heartbeating worker resolves live', live.status === 'live', live.status);
check('resolution carries the role', live.role === 'worker');

// The exact failure measured in production.
const deadDirector = resolveRecipient('DIRECTOR-1786507420823', ROSTER, opts);
check(
  'a four-hour-dead director resolves STALE, not live',
  deadDirector.status === 'stale',
  deadDirector.status
);
check('staleness is quantified', deadDirector.staleSeconds === 4 * 60 * 60);
check('summary names the age', deadDirector.summary.includes('4h ago'), deadDirector.summary);

const subdirector = resolveRecipient('tnf-local-subdirector', ROSTER, opts);
check('an hour-stale director is also stale', subdirector.status === 'stale');

// The other exact failure measured in production.
const ghost = resolveRecipient('agent_does_not_exist_12345', ROSTER, opts);
check('a nonexistent id resolves UNKNOWN', ghost.status === 'unknown', ghost.status);
check('unknown ids are not silently accepted', ghost.agentId === undefined);

console.log('\ndispatch — addressing conveniences');

check(
  'resolves by human name too',
  resolveRecipient('hermes-infra-worker', ROSTER, opts).status === 'live'
);
check(
  'id matching is case-insensitive',
  resolveRecipient('director-1786507420823', ROSTER, opts).status === 'stale'
);
check(
  'a typo suggests the real id',
  resolveRecipient('codegen', ROSTER, opts).suggestions.some((s) => s.includes('codegen')),
  JSON.stringify(resolveRecipient('codegen', ROSTER, opts).suggestions)
);

const broadcast = resolveRecipient(undefined, ROSTER, opts);
check('omitting --to is an explicit broadcast, not an error', broadcast.status === 'broadcast');
check('broadcast reports the audience size', broadcast.summary.includes('4'), broadcast.summary);

console.log('\ndispatch — liveness window');

const edge = resolveRecipient(
  'agent_hermes-codegen-worker_1782364000001',
  [
    {
      agentId: 'agent_hermes-codegen-worker_1782364000001',
      lastSeen: ago(DEFAULT_LIVENESS_WINDOW_MS + 1000),
    },
  ],
  opts
);
check('just past the window is stale', edge.status === 'stale');
check(
  'the registry’s own isOnline wins when present (one liveness source)',
  resolveRecipient(
    'x',
    [{ agentId: 'x', lastSeen: ago(10 * 60 * 60 * 1000), isOnline: true }],
    opts
  ).status === 'live'
);
check(
  'a missing lastSeen is stale, never assumed live',
  resolveRecipient('y', [{ agentId: 'y' }], opts).status === 'stale'
);

// Cron workers beat every 300-900s. Under the flat 60s window a healthy
// codegen worker read stale 80% of the time and the infra worker 93%, so the
// roster flickered for exactly the agents operators delegate to.
check(
  'a cron worker inside its declared cadence is LIVE',
  resolveRecipient(
    'cron',
    [{ agentId: 'cron', lastSeen: ago(240_000), expectedCadenceSec: 300 }],
    opts
  ).status === 'live'
);
check(
  'the same agent WITHOUT a declared cadence is stale (old rule preserved)',
  resolveRecipient('cron', [{ agentId: 'cron', lastSeen: ago(240_000) }], opts).status === 'stale'
);
check(
  'two missed beats is the limit — beyond it is still stale',
  resolveRecipient(
    'cron',
    [{ agentId: 'cron', lastSeen: ago(700_000), expectedCadenceSec: 300 }],
    opts
  ).status === 'stale'
);
check(
  'a nonsense cadence falls back to the flat window rather than trusting it',
  resolveRecipient(
    'cron',
    [{ agentId: 'cron', lastSeen: ago(240_000), expectedCadenceSec: -1 }],
    opts
  ).status === 'stale'
);

console.log('\ndispatch — decision policy');

const unknownDecision = decideDispatch(ghost);
check('unknown recipient refuses to send', unknownDecision.proceed === false);
check('unknown recipient exits non-zero', unknownDecision.exitCode === 2);
check('unknown recipient is an error', unknownDecision.level === 'error');

const staleDefault = decideDispatch(deadDirector);
check('stale still queues by default (the queue is durable)', staleDefault.proceed === true);
check('stale warns rather than claiming delivery', staleDefault.level === 'warn');
check('stale exits 0 so humans are not blocked', staleDefault.exitCode === 0);

const staleStrict = decideDispatch(deadDirector, { requireLive: true });
check('--require-live refuses a stale recipient', staleStrict.proceed === false);
check('--require-live exits non-zero for automation', staleStrict.exitCode === 3);

const liveDecision = decideDispatch(live);
check('live proceeds cleanly', liveDecision.proceed && liveDecision.exitCode === 0);
check('broadcast proceeds cleanly', decideDispatch(broadcast).proceed === true);

console.log('\ndispatch — capacity (bus contract v1)');

const BUSY_ROSTER: RegisteredAgent[] = [
  {
    agentId: 'agent_busy_1',
    name: 'busy-agent',
    role: 'worker',
    lastSeen: ago(5_000),
    status: 'busy',
  },
  {
    agentId: 'agent_loaded_1',
    name: 'loaded-agent',
    role: 'worker',
    lastSeen: ago(5_000),
    status: 'active',
    currentLoad: 2,
    maxLoad: 2,
  },
  {
    agentId: 'agent_free_1',
    name: 'free-agent',
    role: 'worker',
    lastSeen: ago(5_000),
    status: 'active',
    currentLoad: 0,
    maxLoad: 2,
  },
  {
    agentId: 'agent_legacy_1',
    name: 'legacy-agent',
    role: 'worker',
    lastSeen: ago(5_000),
  },
];

const busyRes = resolveRecipient('agent_busy_1', BUSY_ROSTER, opts);
check('declared-busy row reports busy capacity', busyRes.capacity?.busy === true);
check('capacity summary says declared busy', busyRes.capacity?.summary === 'declared busy');

const loadedRes = resolveRecipient('agent_loaded_1', BUSY_ROSTER, opts);
check('load-at-max row reports busy even when status active', loadedRes.capacity?.busy === true);
check('load-at-max summary shows the counter', loadedRes.capacity?.summary === 'at capacity (2/2)');

const freeRes = resolveRecipient('agent_free_1', BUSY_ROSTER, opts);
check('spare-capacity row is not busy', freeRes.capacity?.busy === false);
check(
  'spare-capacity summary shows the counter',
  freeRes.capacity?.summary === 'spare capacity (0/2)'
);

const legacyRes = resolveRecipient('agent_legacy_1', BUSY_ROSTER, opts);
check('legacy row declares nothing', legacyRes.capacity?.declared === false);
check('legacy row is not busy (backward compatible)', legacyRes.capacity?.busy === false);

const busyRefusal = decideDispatch(busyRes, { requireCapacity: true });
check('--require-capacity refuses a busy recipient', busyRefusal.proceed === false);
check('--require-capacity exits 4 for automation', busyRefusal.exitCode === 4);
check('--require-capacity is an error', busyRefusal.level === 'error');

const loadedRefusal = decideDispatch(loadedRes, { requireCapacity: true });
check('--require-capacity refuses a load-saturated recipient', loadedRefusal.proceed === false);

const freePass = decideDispatch(freeRes, { requireCapacity: true });
check('--require-capacity passes a recipient with spare capacity', freePass.proceed === true);

const legacyPass = decideDispatch(legacyRes, { requireCapacity: true });
check(
  '--require-capacity passes an undeclared recipient (backward compatible)',
  legacyPass.proceed === true
);

const busyDefault = decideDispatch(busyRes);
check('busy queues fine without the gate (opt-in semantics)', busyDefault.proceed === true);

console.log(`\ndispatch: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
