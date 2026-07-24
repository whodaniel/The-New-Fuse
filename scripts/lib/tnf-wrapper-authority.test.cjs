/**
 * Wrapper-authority glue tests.
 *
 * The load-bearing property: DEFAULT-OFF. With the flag unset, gateTask must
 * return allowed:true without touching the authority stack at all — a wrapper
 * that adopts this has zero behaviour change until an operator opts in.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-wrap-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_OPERATOR_KEY_PATH = path.join(TMP, 'authority', 'operator.ed25519');
process.env.TNF_ROLES_PATH = path.join(TMP, 'authority', 'roles.json');
process.env.TNF_KEYS_DIR = path.join(TMP, 'authority', 'keys');
process.env.TNF_PUBKEYS_DIR = path.join(TMP, 'authority', 'pubkeys');
process.env.TNF_PENDING_DIR = path.join(TMP, 'authority', 'pending');
process.env.TNF_DECIDED_DIR = path.join(TMP, 'authority', 'decided');
process.env.TNF_ELEVATION_AUDIT_PATH = path.join(TMP, 'elevation.jsonl');
process.env.TNF_GRANT_AUDIT_PATH = path.join(TMP, 'grants.jsonl');
process.env.TNF_GRANT_CONSUMED_PATH = path.join(TMP, 'consumed.json');
fs.mkdirSync(path.join(TMP, 'authority'), { recursive: true, mode: 0o700 });

const test = require('node:test');
const assert = require('node:assert/strict');

const wrap = require('./tnf-wrapper-authority.cjs');
const brokerLib = require('./tnf-elevation-broker.cjs');
const identity = require('./tnf-identity.cjs');
const trust = require('./tnf-trust-root.cjs');

/** Poll for a pending request by bound task (avoids a fixed-sleep race). */
async function waitForRequest(boundTask, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const req = brokerLib.pending().find((p) => p.boundTask === boundTask);
    if (req) return req;
    await new Promise((r) => setTimeout(r, 25));
  }
  return null;
}

trust.ensureOperatorKey();
identity.setAgentRole('gemini', 'sub-director', { note: 'test' });

function withFlag(v, fn) {
  const saved = process.env.TNF_AUTHORITY_CONSUMER;
  if (v === undefined) delete process.env.TNF_AUTHORITY_CONSUMER;
  else process.env.TNF_AUTHORITY_CONSUMER = v;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.TNF_AUTHORITY_CONSUMER;
    else process.env.TNF_AUTHORITY_CONSUMER = saved;
  }
}

const taskWithCaps = {
  id: 'task-1',
  content: 'do privileged thing',
  payload: { requiredCapabilities: [{ with: 'account:demo.read', can: 'demo.read' }] },
};
const plainTask = { id: 'task-2', content: 'summarize this' };

// --- Default-off ------------------------------------------------------------

test('flag OFF: a task with required capabilities is NOT gated (zero behaviour change)', async () => {
  await withFlag(undefined, async () => {
    const g = await wrap.gateTask(taskWithCaps, { agentId: 'gemini' });
    assert.deepEqual(g, { allowed: true, gated: false });
  });
});

test('flag OFF: isEnabled reports false for unset / false / random values', () => {
  for (const v of [undefined, 'false', '0', 'no', 'off', 'banana']) {
    withFlag(v, () => assert.equal(wrap.isEnabled(), false, `value ${v}`));
  }
});

test('flag ON accepts 1/true/on', () => {
  for (const v of ['1', 'true', 'on', 'TRUE', 'On']) {
    withFlag(v, () => assert.equal(wrap.isEnabled(), true, `value ${v}`));
  }
});

// --- Enabled, but no declared capabilities ----------------------------------

test('flag ON: a plain task (no declared caps) passes through ungated', async () => {
  await withFlag('1', async () => {
    const g = await wrap.gateTask(plainTask, { agentId: 'gemini' });
    assert.deepEqual(g, { allowed: true, gated: false });
  });
});

// --- Capability extraction is strict ----------------------------------------

test('malformed capability entries are ignored, not smuggled through', () => {
  const caps = wrap.extractRequiredCapabilities({
    payload: {
      requiredCapabilities: [
        { with: 'account:x', can: 'read' }, // valid
        { with: 'account:y' }, // missing can
        { can: 'write' }, // missing with
        'not-an-object',
        null,
      ],
    },
  });
  assert.equal(caps.length, 1);
  assert.deepEqual(caps[0], { with: 'account:x', can: 'read' });
});

test('capabilities are read from payload / metadata / top-level', () => {
  const c = { with: 'a', can: 'b' };
  assert.equal(wrap.extractRequiredCapabilities({ payload: { requiredCapabilities: [c] } }).length, 1);
  assert.equal(wrap.extractRequiredCapabilities({ metadata: { requiredCapabilities: [c] } }).length, 1);
  assert.equal(wrap.extractRequiredCapabilities({ requiredCapabilities: [c] }).length, 1);
});

// --- Enabled + declared caps → real elevation flow --------------------------

test('flag ON: declared caps trigger elevation; approval yields a grant', async () => {
  await withFlag('1', async () => {
    // Drive the operator approval concurrently.
    const pending = wrap.gateTask(taskWithCaps, { agentId: 'gemini', timeoutMs: 3000 });
    const req = await waitForRequest('task-1');
    assert.ok(req, 'an elevation request should have been submitted');
    await brokerLib.decide(req.requestId, {
      decision: 'approved',
      capabilities: [{ with: 'account:demo.read', can: 'demo.read' }],
      skipTtyCheck: true,
    });
    const g = await pending;
    assert.equal(g.allowed, true, g.reason);
    assert.equal(g.gated, true);
    assert.ok(g.grant, 'the approved grant is handed back to the wrapper');
  });
});

test('flag ON: denial blocks the task with a reason', async () => {
  await withFlag('1', async () => {
    const pending = wrap.gateTask(
      { id: 'task-deny', content: 'x', payload: { requiredCapabilities: [{ with: 'account:demo.read', can: 'demo.read' }] } },
      { agentId: 'gemini', timeoutMs: 3000 }
    );
    const req = await waitForRequest('task-deny');
    await brokerLib.decide(req.requestId, { decision: 'denied', skipTtyCheck: true });
    const g = await pending;
    assert.equal(g.allowed, false);
    assert.equal(g.gated, true);
    assert.match(g.reason, /denied|timed out/);
  });
});

test('flag ON: timeout blocks the task rather than proceeding', async () => {
  await withFlag('1', async () => {
    const g = await wrap.gateTask(
      { id: 'task-timeout', content: 'x', payload: { requiredCapabilities: [{ with: 'account:demo.read', can: 'demo.read' }] } },
      { agentId: 'gemini', timeoutMs: 300 }
    );
    assert.equal(g.allowed, false);
    assert.match(g.reason, /timed out|denied/);
  });
});

test('flag ON: no agent id is a closed failure, not a passthrough', async () => {
  await withFlag('1', async () => {
    const g = await wrap.gateTask(taskWithCaps, { agentId: undefined });
    assert.equal(g.allowed, false);
    assert.match(g.reason, /no id/i);
  });
});
