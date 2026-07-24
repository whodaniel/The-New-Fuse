/**
 * Capability grant tests.
 *
 * The property that matters most: **a delegation chain can only narrow.** If a
 * holder can sub-delegate more than it holds, "sub-director may delegate to a
 * worker" becomes an escalation path, and every other guarantee is decoration.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-grant-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_OPERATOR_KEY_PATH = path.join(TMP, 'authority', 'operator.ed25519');
process.env.TNF_GRANT_AUDIT_PATH = path.join(TMP, 'grants.jsonl');
process.env.TNF_GRANT_CONSUMED_PATH = path.join(TMP, 'consumed.json');

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const trust = require('./tnf-trust-root.cjs');
const grants = require('./tnf-capability-grant.cjs');

const SUB_DIRECTOR = 'did:key:zSubDirectorPlaceholder';
const WORKER = 'did:key:zWorkerPlaceholder';

/** In-memory DID -> PEM resolver, plus a second identity for chain tests. */
const keyring = new Map();

function makeIdentity(did) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = publicKey.export({ type: 'spki', format: 'pem' });
  keyring.set(did, pem);
  return {
    kind: 'file',
    async getPublicKey() {
      return { did, publicKeyPem: pem, algorithm: 'Ed25519' };
    },
    async sign(payload) {
      return {
        signature: crypto.sign(null, Buffer.from(payload), privateKey).toString('base64'),
        algorithm: 'Ed25519',
        signedAt: new Date().toISOString(),
        rootDid: did,
      };
    },
  };
}

const resolvePublicKeyPem = (did) => keyring.get(did) || null;

const operatorRoot = makeIdentity('did:key:zOperatorRoot');
const subDirectorRoot = makeIdentity(SUB_DIRECTOR);

// ---------------------------------------------------------------------------
// Attenuation algebra
// ---------------------------------------------------------------------------

test('exact capability covers itself', () => {
  const c = { with: 'agent:sub-director', can: 'lane_coordination' };
  assert.equal(grants.covers(c, c), true);
});

test('wildcard action covers a specific action', () => {
  assert.equal(
    grants.covers({ with: 'agent:x', can: '*' }, { with: 'agent:x', can: 'prompt_injection' }),
    true
  );
});

test('a specific action does NOT cover a different one', () => {
  assert.equal(
    grants.covers(
      { with: 'agent:x', can: 'lane_coordination' },
      { with: 'agent:x', can: 'master_clock_control' }
    ),
    false
  );
});

test('path-scoped resource covers a subpath but not a sibling', () => {
  const parent = { with: 'fs:/repo', can: 'write' };
  assert.equal(grants.covers(parent, { with: 'fs:/repo/src', can: 'write' }), true);
  assert.equal(grants.covers(parent, { with: 'fs:/etc', can: 'write' }), false);
});

test('unrecognised resource shapes fail closed', () => {
  assert.equal(grants.resourceCovers('weird-shape', 'other-shape'), false);
  assert.equal(grants.resourceCovers(null, 'fs:/repo'), false);
});

test('a child may lower a numeric cap but never raise it', () => {
  const parent = { with: 'net:api', can: 'call', conditions: { maxBytes: 1000 } };
  assert.equal(grants.covers(parent, { with: 'net:api', can: 'call', conditions: { maxBytes: 500 } }), true);
  assert.equal(grants.covers(parent, { with: 'net:api', can: 'call', conditions: { maxBytes: 5000 } }), false);
});

test('dropping a parent condition is widening, so it is not covered', () => {
  const parent = { with: 'net:api', can: 'call', conditions: { hosts: ['a.com'] } };
  assert.equal(grants.covers(parent, { with: 'net:api', can: 'call' }), false);
});

// ---------------------------------------------------------------------------
// Issue / verify
// ---------------------------------------------------------------------------

test('a freshly issued grant verifies and authorizes its capability', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
    purpose: 'test',
  });
  const res = grants.verifyGrant(signed, { resolvePublicKeyPem });
  assert.equal(res.authorized, true, res.reason);
  assert.equal(grants.grantAuthorizes(res, 'agent:worker', 'task_execution'), true);
  assert.equal(grants.grantAuthorizes(res, 'agent:worker', 'prompt_injection'), false);
});

test('refuses to issue an empty grant', async () => {
  await assert.rejects(
    () => grants.issueGrant({ trustRoot: operatorRoot, audience: WORKER, capabilities: [] }),
    /no capabilities/
  );
});

test('TTL is clamped to the ceiling and the clamp is audited', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
    ttlSeconds: 999_999,
  });
  const life = signed.grant.exp - signed.grant.nbf;
  assert.equal(life, grants.MAX_TTL_SECONDS);
  const lines = fs.readFileSync(process.env.TNF_GRANT_AUDIT_PATH, 'utf8').trim().split('\n');
  const last = JSON.parse(lines[lines.length - 1]);
  assert.equal(last.ttlClamped, true);
});

test('an expired grant is rejected', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
    ttlSeconds: 60,
  });
  const res = grants.verifyGrant(signed, {
    resolvePublicKeyPem,
    now: signed.grant.exp + 1,
  });
  assert.equal(res.verdict, 'expired');
  assert.equal(res.authorized, false);
});

test('a tampered capability invalidates the signature', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
  });
  signed.grant.att[0].can = 'master_clock_control';
  const res = grants.verifyGrant(signed, { resolvePublicKeyPem });
  assert.equal(res.verdict, 'signature-invalid');
});

test('an unknown issuer is rejected rather than trusted', async () => {
  const stranger = makeIdentity('did:key:zStranger');
  const signed = await grants.issueGrant({
    trustRoot: stranger,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
  });
  const res = grants.verifyGrant(signed, { resolvePublicKeyPem: () => null });
  assert.equal(res.verdict, 'unknown-issuer');
});

test('a task-bound grant is refused for a different task', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
    boundTask: 'task_1129',
  });
  assert.equal(grants.verifyGrant(signed, { resolvePublicKeyPem, task: 'task_1129' }).authorized, true);
  const wrong = grants.verifyGrant(signed, { resolvePublicKeyPem, task: 'task_9999' });
  assert.equal(wrong.verdict, 'task-mismatch');
});

test('a consumed grant cannot be replayed', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
  });
  assert.equal(grants.verifyGrant(signed, { resolvePublicKeyPem, consume: true }).authorized, true);
  const replay = grants.verifyGrant(signed, { resolvePublicKeyPem });
  assert.equal(replay.verdict, 'replayed');
});

// ---------------------------------------------------------------------------
// Delegation chains — the core property
// ---------------------------------------------------------------------------

test('sub-delegation of a subset verifies through the chain', async () => {
  const parent = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: SUB_DIRECTOR,
    capabilities: [
      { with: 'agent:*', can: 'lane_coordination' },
      { with: 'agent:*', can: 'cloud_sync' },
    ],
  });
  const child = await grants.issueGrant({
    trustRoot: subDirectorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker-1', can: 'lane_coordination' }],
    parentCapabilities: parent.grant.att,
    proof: [JSON.stringify(parent)],
  });

  const res = grants.verifyGrant(child, { resolvePublicKeyPem });
  assert.equal(res.authorized, true, res.reason);
  assert.deepEqual(res.chain, ['did:key:zOperatorRoot', SUB_DIRECTOR]);
  assert.equal(grants.grantAuthorizes(res, 'agent:worker-1', 'lane_coordination'), true);
});

test('sub-delegating MORE than held is refused at issue time', async () => {
  const parent = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: SUB_DIRECTOR,
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
  });
  await assert.rejects(
    () =>
      grants.issueGrant({
        trustRoot: subDirectorRoot,
        audience: WORKER,
        // master_clock_control was never held by the sub-director.
        capabilities: [{ with: 'agent:*', can: 'master_clock_control' }],
        parentCapabilities: parent.grant.att,
        proof: [JSON.stringify(parent)],
      }),
    /would widen authority/
  );
});

test('a forged widening chain is caught at VERIFY time too', async () => {
  // Issue-time enforcement can be bypassed by an attacker who crafts the grant
  // directly, so the verifier must independently re-check attenuation.
  const parent = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: SUB_DIRECTOR,
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
  });
  const forged = await grants.issueGrant({
    trustRoot: subDirectorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:*', can: 'master_clock_control' }],
    proof: [JSON.stringify(parent)],
    // parentCapabilities deliberately omitted to skip the issue-time check
  });

  const res = grants.verifyGrant(forged, { resolvePublicKeyPem });
  assert.equal(res.authorized, false);
  assert.equal(res.verdict, 'exceeds-parent');
});

test('a chain whose parent audience is not the child issuer is broken', async () => {
  const parent = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: 'did:key:zSomeoneElse',
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
  });
  const child = await grants.issueGrant({
    trustRoot: subDirectorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
    proof: [JSON.stringify(parent)],
  });
  const res = grants.verifyGrant(child, { resolvePublicKeyPem });
  assert.equal(res.verdict, 'chain-broken');
});

test('an expired parent invalidates a live child', async () => {
  const parent = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: SUB_DIRECTOR,
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
    ttlSeconds: 60,
  });
  const child = await grants.issueGrant({
    trustRoot: subDirectorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:*', can: 'lane_coordination' }],
    proof: [JSON.stringify(parent)],
  });
  const res = grants.verifyGrant(child, {
    resolvePublicKeyPem,
    now: parent.grant.exp + 1,
  });
  assert.equal(res.authorized, false);
});

// ---------------------------------------------------------------------------
// Malformed input must always fail closed
// ---------------------------------------------------------------------------

test('malformed grants fail closed', () => {
  for (const bad of [null, undefined, 42, 'str', {}, { grant: {} }, { grant: {}, signature: 'x' }]) {
    const res = grants.verifyGrant(bad, { resolvePublicKeyPem });
    assert.equal(res.authorized, false, `should reject ${JSON.stringify(bad)}`);
  }
});

test('an unsupported algorithm is rejected', async () => {
  const signed = await grants.issueGrant({
    trustRoot: operatorRoot,
    audience: WORKER,
    capabilities: [{ with: 'agent:worker', can: 'task_execution' }],
  });
  signed.algorithm = 'none';
  assert.equal(grants.verifyGrant(signed, { resolvePublicKeyPem }).verdict, 'malformed');
});

// ---------------------------------------------------------------------------
// Trust root selection
// ---------------------------------------------------------------------------

test('probe reports every provider with an honest verdict', async () => {
  const all = await trust.probeAll();
  const kinds = all.map((d) => d.kind);
  for (const k of ['file', 'secure-enclave', 'fido2', 'tpm2', 'separate-uid']) {
    assert.ok(kinds.includes(k), `missing provider ${k}`);
  }
  for (const d of all) {
    if (!d.available) assert.ok(d.unavailableReason, `${d.kind} must say why it is unavailable`);
  }
});

test('file is always usable so TNF runs out of the box, and declares its weakness', async () => {
  const all = await trust.probeAll();
  const file = all.find((d) => d.kind === 'file');
  assert.equal(file.available, true);
  assert.equal(file.guarantee.survivesAgentCompromise, false);
  assert.equal(file.guarantee.keyReadableBySameUid, true);
  assert.match(file.summary, /not a security boundary/i);
});

test('selection reports degraded when the chosen root is only a file', async () => {
  const sel = await trust.selectTrustRoot();
  assert.ok(sel.provider);
  if (sel.descriptor.kind === 'file') {
    assert.equal(sel.degraded, true);
    assert.match(trust.describeSelection(sel), /WARNING/);
  }
});

test('a stronger guarantee outranks a weaker one', () => {
  const strong = trust.guaranteeScore({
    keyReadableBySameUid: false,
    hardwareBound: true,
    requiresHumanPresence: true,
    survivesAgentCompromise: true,
  });
  const weak = trust.guaranteeScore({
    keyReadableBySameUid: true,
    hardwareBound: false,
    requiresHumanPresence: false,
    survivesAgentCompromise: false,
  });
  assert.ok(strong > weak);
});

test('did:key encoding round-trips to a stable multibase form', () => {
  const { publicKey } = crypto.generateKeyPairSync('ed25519');
  const pem = publicKey.export({ type: 'spki', format: 'pem' });
  const did = trust.didKeyFromPem(pem);
  assert.match(did, /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
  assert.equal(trust.didKeyFromPem(pem), did);
});
