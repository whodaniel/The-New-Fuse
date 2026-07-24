/**
 * End-to-end authority test — the whole stack from an agent's point of view.
 *
 * This is the "wire one consumer" validation from AUTHORITY_INTEGRATION_MAP.md:
 * it drives the agent-side client through the real request → operator-approve →
 * spend loop against the real broker and credential broker, proving the phases
 * compose. If this passes, a wrapper can adopt the client with confidence.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-e2e-'));
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
process.env.TNF_BROKER_ACTIONS_PATH = path.join(TMP, 'authority', 'broker-actions.json');
process.env.TNF_BROKER_AUDIT_PATH = path.join(TMP, 'broker.jsonl');
process.env.TNF_BROKER_SECRET_FILE = path.join(TMP, 'secrets');
process.env.TNF_ISOLATION_MARKER = path.join(TMP, 'authority', 'isolation-confirmed');

fs.mkdirSync(path.join(TMP, 'authority'), { recursive: true, mode: 0o700 });
fs.mkdirSync(process.env.TNF_BROKER_SECRET_FILE, { recursive: true });
fs.writeFileSync(path.join(process.env.TNF_BROKER_SECRET_FILE, 'demo-api'), 'demo-secret-value-1234567');

const test = require('node:test');
const assert = require('node:assert/strict');

const client = require('./tnf-authority-client.cjs');
const brokerLib = require('./tnf-elevation-broker.cjs');
const identity = require('./tnf-identity.cjs');
const trust = require('./tnf-trust-root.cjs');

// Operator side: ensure the root key exists, grant the agent a director role,
// declare a read-only broker action.
trust.ensureOperatorKey();
identity.setAgentRole('agent-e2e', 'sub-director', { note: 'e2e fixture' });
fs.writeFileSync(
  process.env.TNF_BROKER_ACTIONS_PATH,
  JSON.stringify({
    actions: [
      {
        name: 'demo.read',
        requiredCapability: 'account:demo.read',
        readOnly: true,
        secretRef: { service: 'demo-api' },
        command: { argv: ['node', '-e', 'process.stdout.write("result-for-agent")'] },
      },
    ],
  })
);

const AGENT_DID = trust.didKeyFromPem(fs.readFileSync(`${process.env.TNF_OPERATOR_KEY_PATH}.pub`, 'utf8')) + '-agent';

// A test operator that approves out of band, simulating `tnf-authority approve`.
async function operatorApproves(requestId, capabilities) {
  return brokerLib.decide(requestId, {
    decision: 'approved',
    capabilities,
    skipTtyCheck: true,
  });
}

test('canRequestElevation reflects the registry role', () => {
  assert.equal(client.canRequestElevation('agent-e2e'), true);
  assert.equal(client.canRequestElevation('agent-unknown'), false);
});

test('full loop: request → operator approves → agent spends the grant', async () => {
  const caps = [{ with: 'account:demo.read', can: 'demo.read' }];

  // Agent requests.
  const { requestId } = await client.requestElevation({
    agentId: 'agent-e2e',
    agentDid: AGENT_DID,
    capabilities: caps,
    task: 'task-e2e',
    justification: 'need to read demo data',
  });
  assert.match(requestId, /^req_/);

  // Operator approves (separate actor).
  await operatorApproves(requestId, caps);

  // Agent collects the grant and verifies it against the operator root.
  const grant = await client.awaitGrant(requestId, 2000);
  assert.ok(grant, 'grant should be issued on approval');
  const verified = client.verifyHeldGrant(grant, { task: 'task-e2e' });
  assert.equal(verified.authorized, true, verified.reason);

  // Agent spends it through the credential broker.
  const res = await client.useCredential('demo.read', {}, grant, { task: 'task-e2e' });
  assert.equal(res.ok, true, res.reason);
  assert.equal(res.output, 'result-for-agent');
  assert.ok(!JSON.stringify(res).includes('demo-secret-value'), 'secret must never reach the agent');
});

test('denied elevation yields no grant and the agent cannot proceed', async () => {
  const caps = [{ with: 'account:demo.read', can: 'demo.read' }];
  const { requestId } = await client.requestElevation({
    agentId: 'agent-e2e',
    agentDid: AGENT_DID,
    capabilities: caps,
  });
  await brokerLib.decide(requestId, { decision: 'denied', skipTtyCheck: true });
  const grant = await client.awaitGrant(requestId, 1500);
  assert.equal(grant, null, 'denial must yield no grant');
});

test('withElevation runs fn only with a verified approved grant', async () => {
  const caps = [{ with: 'account:demo.read', can: 'demo.read' }];
  let ranWith = null;

  // Drive approval concurrently with the withElevation await.
  const pending = client.withElevation(
    { agentId: 'agent-e2e', agentDid: AGENT_DID, capabilities: caps, task: 't2', timeoutMs: 3000 },
    async (grant, verified) => {
      ranWith = verified.authorized;
      return client.useCredential('demo.read', {}, grant, { task: 't2' });
    }
  );

  // Give the request a beat to land, then approve it.
  await new Promise((r) => setTimeout(r, 200));
  const req = brokerLib.pending().find((p) => p.boundTask === 't2');
  assert.ok(req, 'request should be pending');
  await operatorApproves(req.requestId, caps);

  const outcome = await pending;
  assert.equal(outcome.ok, true, outcome.reason);
  assert.equal(ranWith, true, 'fn must only run with a verified grant');
  assert.equal(outcome.result.output, 'result-for-agent');
});

test('withElevation refuses obviously bad input without touching the broker', async () => {
  const bad = await client.withElevation({ agentDid: '', capabilities: [] }, async () => 'nope');
  assert.equal(bad.ok, false);
  assert.match(bad.reason, /required/);
});

test('a timed-out elevation returns a typed failure, never a grant', async () => {
  const caps = [{ with: 'account:demo.read', can: 'demo.read' }];
  const outcome = await client.withElevation(
    { agentId: 'agent-e2e', agentDid: AGENT_DID, capabilities: caps, timeoutMs: 300 },
    async () => 'should not run'
  );
  assert.equal(outcome.ok, false);
  assert.match(outcome.reason, /denied or timed out/);
});
