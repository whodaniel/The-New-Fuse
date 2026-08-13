/**
 * Chokepoint authority-gate tests (scripts/tnf-agent-cli.cjs gateAndDispatch).
 *
 * The gate lives at the single RedisAgentClient dispatch point, so it covers
 * every wrapper uniformly. Two load-bearing properties:
 *   - DEFAULT-OFF: with the flag unset, a task (even one declaring capabilities)
 *     reaches handlers exactly as before — zero behaviour change.
 *   - When enabled, a task declaring requiredCapabilities does NOT reach any
 *     handler until an operator approves an elevation grant; denial/timeout/
 *     error all fail closed (handler never runs).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-gate-'));
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
process.env.TNF_AUTH_AUDIT_PATH = path.join(TMP, 'auth.jsonl');
fs.mkdirSync(path.join(TMP, 'authority'), { recursive: true, mode: 0o700 });
// Warn mode so Phase 0 auth doesn't reject unsigned test envelopes; we're
// testing the gate, not signature verification (covered elsewhere).
process.env.TNF_MESSAGE_AUTH_MODE = 'warn';

const test = require('node:test');
const assert = require('node:assert/strict');

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const brokerLib = require('./lib/tnf-elevation-broker.cjs');
const identity = require('./lib/tnf-identity.cjs');
const trust = require('./lib/tnf-trust-root.cjs');

trust.ensureOperatorKey();
identity.setAgentRole('gemini', 'sub-director', { note: 'gate test' });

function makeClient() {
  const client = new RedisAgentClient();
  client.agentInfo = { id: 'gemini', name: 'gemini', role: 'worker', platform: 'test' };
  client.logIncomingMessage = () => {};
  client.logDelegationSuggestion = () => {};
  client.send = async () => {}; // swallow refusal notices
  const delivered = [];
  client.messageHandlers.set('task', [(m) => delivered.push(m)]);
  return { client, delivered };
}

function taskMsg(id, caps) {
  return JSON.stringify({
    id,
    type: 'task',
    from: { agentId: 'peer', role: 'worker' },
    payload: { message: 'do work', ...(caps ? { requiredCapabilities: caps } : {}) },
  });
}

const CAPS = [{ with: 'account:demo.read', can: 'demo.read' }];

async function waitFor(pred, timeoutMs = 2000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (pred()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}

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

// --- Default-off ------------------------------------------------------------

test('flag OFF: a task declaring capabilities is delivered immediately', async () => {
  await withFlag(undefined, async () => {
    const { client, delivered } = makeClient();
    client.handleIncomingMessage('tnf:agents', taskMsg('t-off', CAPS));
    // Synchronous dispatch path — delivered before the next tick.
    assert.equal(delivered.length, 1, 'default-off must dispatch synchronously, ungated');
  });
});

// --- Enabled, no declared caps ---------------------------------------------

test('flag ON: a task with NO declared caps is delivered (ungated passthrough)', async () => {
  await withFlag('1', async () => {
    const { client, delivered } = makeClient();
    client.handleIncomingMessage('tnf:agents', taskMsg('t-nocaps'));
    assert.ok(await waitFor(() => delivered.length === 1), 'plain task should still be delivered');
  });
});

// --- Enabled + caps → gated -------------------------------------------------

test('flag ON: a task declaring caps is NOT delivered until approved', async () => {
  await withFlag('1', async () => {
    const { client, delivered } = makeClient();
    client.handleIncomingMessage('tnf:agents', taskMsg('t-gated', CAPS));

    // A request should appear; the handler must NOT have run yet.
    assert.ok(await waitFor(() => brokerLib.pending().some((p) => p.boundTask === 't-gated')));
    assert.equal(delivered.length, 0, 'handler must not run before approval');

    const req = brokerLib.pending().find((p) => p.boundTask === 't-gated');
    await brokerLib.decide(req.requestId, { decision: 'approved', capabilities: CAPS, skipTtyCheck: true });

    assert.ok(await waitFor(() => delivered.length === 1), 'approved task should be delivered');
    assert.ok(delivered[0].authorityGrant, 'the approved grant is attached to the message');
  });
});

test('flag ON: a denied task is never delivered', async () => {
  await withFlag('1', async () => {
    const { client, delivered } = makeClient();
    client.handleIncomingMessage('tnf:agents', taskMsg('t-denied', CAPS));
    assert.ok(await waitFor(() => brokerLib.pending().some((p) => p.boundTask === 't-denied')));
    const req = brokerLib.pending().find((p) => p.boundTask === 't-denied');
    await brokerLib.decide(req.requestId, { decision: 'denied', skipTtyCheck: true });
    // Give it a moment; it must NOT be delivered.
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(delivered.length, 0);
  });
});
