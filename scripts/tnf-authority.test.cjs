/**
 * Tests for the confirm-isolation straggler scan.
 *
 * The property: the file-denial test is necessary but NOT sufficient. A worker
 * agent still running as the operator can read the key regardless, so the scan
 * must catch it — otherwise confirm-isolation would certify a boundary that does
 * not hold (the same over-claim class as the trust-root probe bug).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { workerAgentsRunningAsOperator, WORKER_AGENT_PATTERNS } = require('./tnf-authority.cjs');

// uid 501 is the "operator" in these fixtures; 442 is the agent account.
const OPERATOR_UID = 501;

function ps(lines) {
  return `  UID   PID COMMAND\n${lines.join('\n')}\n`;
}

test('flags a worker wrapper running as the operator', () => {
  const out = ps([
    '  501 18110 node scripts/gemini-redis-wrapper.cjs',
    '  501   900 node scripts/protocols/run-chronological-process.cjs --process-id x',
  ]);
  const hits = workerAgentsRunningAsOperator({ psOutput: out, selfUid: OPERATOR_UID });
  assert.equal(hits.length, 1);
  assert.match(hits[0], /gemini-redis-wrapper/);
});

test('does NOT flag operator-side processes (cron, master-clock, this CLI)', () => {
  const out = ps([
    '  501   900 node scripts/protocols/run-chronological-process.cjs',
    '  501   901 node dist/master-clock.js',
    '  501   902 node scripts/tnf-authority.cjs review',
  ]);
  assert.deepEqual(workerAgentsRunningAsOperator({ psOutput: out, selfUid: OPERATOR_UID }), []);
});

test('does NOT flag a worker running as the AGENT account (the goal state)', () => {
  const out = ps([
    '  442 18110 node scripts/gemini-redis-wrapper.cjs',
    '  442 18111 node scripts/jules-redis-wrapper.cjs',
  ]);
  assert.deepEqual(workerAgentsRunningAsOperator({ psOutput: out, selfUid: OPERATOR_UID }), []);
});

test('flags multiple stragglers across wrapper types', () => {
  const out = ps([
    '  501 1 node scripts/gemini-redis-wrapper.cjs',
    '  501 2 node scripts/jules-redis-wrapper.cjs',
    '  501 3 node scripts/claude-redis-wrapper.cjs',
    '  442 4 node scripts/antigravity-redis-wrapper.cjs',
  ]);
  const hits = workerAgentsRunningAsOperator({ psOutput: out, selfUid: OPERATOR_UID });
  assert.equal(hits.length, 3, 'three run as operator; the uid-442 one is fine');
});

test('empty fleet yields no stragglers', () => {
  assert.deepEqual(workerAgentsRunningAsOperator({ psOutput: ps([]), selfUid: OPERATOR_UID }), []);
});

test('the pattern list is non-empty and covers the known wrappers', () => {
  assert.ok(WORKER_AGENT_PATTERNS.includes('gemini-redis-wrapper'));
  assert.ok(WORKER_AGENT_PATTERNS.includes('jules-redis-wrapper'));
  assert.ok(WORKER_AGENT_PATTERNS.length >= 4);
});

test('under sudo, SUDO_UID is the operator uid for the straggler scan', () => {
  const { operatorUid } = require('./lib/tnf-authority-workers.cjs');
  const saved = process.env.SUDO_UID;
  process.env.SUDO_UID = '501';
  try {
    assert.equal(operatorUid(), 501);
    const out = ps(['  501 1 node scripts/jules-redis-wrapper.cjs', '  0 2 node scripts/jules-redis-wrapper.cjs']);
    const hits = workerAgentsRunningAsOperator({ psOutput: out });
    assert.equal(hits.length, 1);
    assert.match(hits[0], /jules-redis-wrapper/);
  } finally {
    if (saved === undefined) delete process.env.SUDO_UID;
    else process.env.SUDO_UID = saved;
  }
});
