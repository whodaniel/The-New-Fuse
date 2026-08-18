/**
 * Elevation broker tests.
 *
 * Central property: an agent must not be able to approve its own request.
 * That is the 2026-07-21 incident class (CHALLENGE_RATIONALE_LOG.md) — an agent
 * citing an operator handshake that never happened.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-elev-'));
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

const test = require('node:test');
const assert = require('node:assert/strict');

const broker = require('./tnf-elevation-broker.cjs');
const identity = require('./tnf-identity.cjs');
const grants = require('./tnf-capability-grant.cjs');
const trust = require('./tnf-trust-root.cjs');

const AGENT_DID = 'did:key:zRequestingAgent';
const CAPS = [{ with: 'agent:worker-1', can: 'lane_coordination' }];

// Tests run non-interactively, so the TTY check would fire for reasons unrelated
// to what is under test. Everything else in detectAgentContext stays live.
const OPERATOR = { skipTtyCheck: true };

function cleanEnv() {
  for (const v of ['TNF_AGENT_ID', 'AGENT_ID', 'TNF_AGENT_USER_ACTIVE', 'CI']) delete process.env[v];
}
cleanEnv();

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

test('an agent can submit a request; submitting grants nothing', async () => {
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    requested: CAPS,
    justification: 'need to coordinate lanes',
    tier: 'operational',
  });
  assert.match(requestId, /^req_/);
  const pending = broker.pending();
  assert.ok(pending.find((p) => p.requestId === requestId));
  assert.equal(fs.existsSync(path.join(process.env.TNF_DECIDED_DIR, `${requestId}.json`)), false);
});

test('the requester cannot state its own role — the registry decides', async () => {
  identity.setAgentRole('agent-modest', 'worker');
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    agentId: 'agent-modest',
    requesterRole: 'super-director', // self-asserted, must be ignored
    requested: CAPS,
    justification: 'x',
  });
  const req = broker.getRequest(requestId);
  assert.equal(req.requesterRole, 'worker', 'registry must win');
  assert.equal(req.claimedRole, 'super-director', 'the claim is recorded, not honoured');
});

test('a request with no capabilities is refused', async () => {
  await assert.rejects(
    () => broker.submit({ requesterDid: AGENT_DID, requested: [] }),
    /at least one capability/
  );
});

test('a non-DID requester is refused', async () => {
  await assert.rejects(
    () => broker.submit({ requesterDid: 'agent-7', requested: CAPS }),
    /must be a DID/
  );
});

// ---------------------------------------------------------------------------
// Agent context refusal — the core property
// ---------------------------------------------------------------------------

test('an agent CANNOT approve its own request (TNF_AGENT_ID set)', async () => {
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    requested: CAPS,
    justification: 'self-approval attempt',
  });

  process.env.TNF_AGENT_ID = 'agent-selfapprover';
  try {
    await assert.rejects(
      () => broker.decide(requestId, { decision: 'approved', ...OPERATOR }),
      /refusing to decide from agent context/
    );
  } finally {
    cleanEnv();
  }

  // The request must remain pending — a refused approval decides nothing.
  assert.ok(broker.pending().find((p) => p.requestId === requestId));
  const lines = fs.readFileSync(process.env.TNF_ELEVATION_AUDIT_PATH, 'utf8').trim().split('\n');
  const refusal = lines.map((l) => JSON.parse(l)).reverse().find((e) => e.event === 'elevation_decide_refused');
  assert.ok(refusal, 'the refusal must be audited');
});

test('CI context is also refused', async () => {
  const { requestId } = await broker.submit({ requesterDid: AGENT_DID, requested: CAPS });
  process.env.CI = 'true';
  try {
    await assert.rejects(
      () => broker.decide(requestId, { decision: 'approved', ...OPERATOR }),
      /refusing to decide/
    );
  } finally {
    cleanEnv();
  }
});

test('a non-TTY process is refused when the TTY check is live', async () => {
  const { requestId } = await broker.submit({ requesterDid: AGENT_DID, requested: CAPS });
  await assert.rejects(
    () => broker.decide(requestId, { decision: 'approved' }), // no skipTtyCheck
    /not a TTY/
  );
});

test('detectAgentContext reports every reason it found', () => {
  process.env.TNF_AGENT_ID = 'a';
  process.env.CI = '1';
  try {
    const ctx = broker.detectAgentContext({ skipTtyCheck: true });
    assert.equal(ctx.isAgent, true);
    assert.ok(ctx.reasons.length >= 2, 'should list both reasons');
  } finally {
    cleanEnv();
  }
});

// ---------------------------------------------------------------------------
// Approve / deny
// ---------------------------------------------------------------------------

test('an operator approval issues a usable, verifiable grant', async () => {
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    requested: CAPS,
    justification: 'legitimate',
  });
  const record = await broker.decide(requestId, { decision: 'approved', ...OPERATOR });

  assert.equal(record.decision, 'approved');
  assert.ok(record.grant);

  const rootPem = fs.readFileSync(`${process.env.TNF_OPERATOR_KEY_PATH}.pub`, 'utf8');
  const res = grants.verifyGrant(record.grant, {
    resolvePublicKeyPem: (did) => (did === record.grant.grant.iss ? rootPem : null),
  });
  assert.equal(res.authorized, true, res.reason);
  assert.equal(grants.grantAuthorizes(res, 'agent:worker-1', 'lane_coordination'), true);

  // Decided requests leave the pending queue.
  assert.equal(broker.pending().find((p) => p.requestId === requestId), undefined);
});

test('an approval may narrow but never widen what was requested', async () => {
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    requested: [{ with: 'agent:worker-1', can: 'lane_coordination' }],
  });
  await assert.rejects(
    () =>
      broker.decide(requestId, {
        decision: 'approved',
        capabilities: [{ with: 'agent:*', can: 'master_clock_control' }],
        ...OPERATOR,
      }),
    /more than was requested/
  );
});

test('narrowing to a subset is allowed', async () => {
  const { requestId } = await broker.submit({
    requesterDid: AGENT_DID,
    requested: [
      { with: 'agent:worker-1', can: 'lane_coordination' },
      { with: 'agent:worker-1', can: 'cloud_sync' },
    ],
  });
  const record = await broker.decide(requestId, {
    decision: 'approved',
    capabilities: [{ with: 'agent:worker-1', can: 'lane_coordination' }],
    ...OPERATOR,
  });
  assert.equal(record.grant.grant.att.length, 1);
});

test('denial records a decision and issues no grant', async () => {
  const { requestId } = await broker.submit({ requesterDid: AGENT_DID, requested: CAPS });
  const record = await broker.decide(requestId, {
    decision: 'denied',
    reason: 'not justified',
    ...OPERATOR,
  });
  assert.equal(record.decision, 'denied');
  assert.equal(record.grant, undefined);
  assert.equal(broker.pending().find((p) => p.requestId === requestId), undefined);
});

test('deciding an unknown request fails rather than inventing one', async () => {
  await assert.rejects(
    () => broker.decide('req_doesnotexist', { decision: 'approved', ...OPERATOR }),
    /no pending request/
  );
});

test('the audit records which trust root signed, and whether it was degraded', async () => {
  const { requestId } = await broker.submit({ requesterDid: AGENT_DID, requested: CAPS });
  await broker.decide(requestId, { decision: 'approved', ...OPERATOR });
  const entries = fs
    .readFileSync(process.env.TNF_ELEVATION_AUDIT_PATH, 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  const approved = entries.reverse().find((e) => e.event === 'elevation_approved');
  assert.ok(approved.rootKind, 'root kind must be recorded');
  assert.equal(typeof approved.rootDegraded, 'boolean');
});

test('awaitDecision returns null on timeout rather than assuming approval', async () => {
  const { requestId } = await broker.submit({ requesterDid: AGENT_DID, requested: CAPS });
  const result = await broker.awaitDecision(requestId, 150, 50);
  assert.equal(result, null);
});
