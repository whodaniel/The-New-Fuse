/**
 * Credential broker tests.
 *
 * Two properties matter most:
 *   1. A secret NEVER appears in the broker's output — not on success, not in a
 *      refusal, not in an error path.
 *   2. A weak trust root makes the broker MORE restrictive, not equally
 *      trusting: it is the component guarding real accounts, so it must refuse
 *      what the rest of the stack would allow.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-broker-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_OPERATOR_KEY_PATH = path.join(TMP, 'authority', 'operator.ed25519');
process.env.TNF_BROKER_ACTIONS_PATH = path.join(TMP, 'authority', 'broker-actions.json');
process.env.TNF_BROKER_AUDIT_PATH = path.join(TMP, 'broker.jsonl');
process.env.TNF_GRANT_AUDIT_PATH = path.join(TMP, 'grants.jsonl');
process.env.TNF_GRANT_CONSUMED_PATH = path.join(TMP, 'consumed.json');
process.env.TNF_BROKER_SECRET_FILE = path.join(TMP, 'secrets');
// Force a known-degraded root: no agent account, so selection lands on `file`.
delete process.env.TNF_AGENT_USER;

const test = require('node:test');
const assert = require('node:assert/strict');

const broker = require('./tnf-cred-broker.cjs');
const grants = require('./tnf-capability-grant.cjs');

fs.mkdirSync(path.join(TMP, 'authority'), { recursive: true, mode: 0o700 });

const SECRET = 'super-secret-token-value-4831';
fs.mkdirSync(process.env.TNF_BROKER_SECRET_FILE, { recursive: true });
fs.writeFileSync(path.join(process.env.TNF_BROKER_SECRET_FILE, 'test-api'), SECRET);

// An operator-signing identity, and a resolver for the grant verifier.
const keyring = new Map();
function makeRoot(did) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  keyring.set(did, publicKey.export({ type: 'spki', format: 'pem' }));
  return {
    kind: 'file',
    async getPublicKey() {
      return { did, publicKeyPem: keyring.get(did), algorithm: 'Ed25519' };
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
const root = makeRoot('did:key:zOperatorRoot');
const AGENT = 'did:key:zAgent';
const resolvePublicKeyPem = (did) => keyring.get(did) || null;

// Two declared actions: one read-only echo, one read-only "sensitive", one mutating.
fs.writeFileSync(
  process.env.TNF_BROKER_ACTIONS_PATH,
  JSON.stringify({
    actions: [
      {
        name: 'echo-safe',
        requiredCapability: 'account:echo-safe',
        readOnly: true,
        secretRef: { service: 'test-api' },
        command: { argv: ['node', '-e', 'process.stdout.write("ok:"+process.env.TNF_BROKER_SECRET)'] },
        description: 'echoes the secret back (to test scrubbing)',
      },
      {
        name: 'read-sensitive',
        requiredCapability: 'account:read-sensitive',
        readOnly: true,
        secretRef: { service: 'test-api', sensitive: true },
        command: { argv: ['node', '-e', 'process.stdout.write("sensitive-ok")'] },
      },
      {
        name: 'send-money',
        requiredCapability: 'account:send-money',
        readOnly: false,
        secretRef: { service: 'test-api' },
        command: { argv: ['node', '-e', 'process.stdout.write("moved")'] },
      },
    ],
  })
);

async function grantFor(caps, opts = {}) {
  return grants.issueGrant({ trustRoot: root, audience: AGENT, capabilities: caps, ...opts });
}

// ---------------------------------------------------------------------------

test('a valid read-only invocation returns a result, never the secret', async () => {
  const g = await grantFor([{ with: 'account:echo-safe', can: 'echo-safe' }]);
  const res = await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, true, res.reason);
  assert.ok(res.output.includes('ok:'), 'action ran');
  assert.ok(!res.output.includes(SECRET), 'the secret must be scrubbed from output');
  assert.match(res.output, /«redacted-secret»/);
});

test('the secret never appears anywhere in the result object', async () => {
  const g = await grantFor([{ with: 'account:echo-safe', can: 'echo-safe' }]);
  const res = await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  assert.ok(!JSON.stringify(res).includes(SECRET));
});

test('an undeclared action is refused', async () => {
  const g = await grantFor([{ with: 'account:whatever', can: 'whatever' }]);
  const res = await broker.invoke('not-a-real-action', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'unknown-action');
});

test('a grant that does not hold the capability is refused', async () => {
  const g = await grantFor([{ with: 'account:other', can: 'other' }]);
  const res = await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'capability-missing');
});

test('an invalid / unsigned grant is refused', async () => {
  const g = await grantFor([{ with: 'account:echo-safe', can: 'echo-safe' }]);
  g.signature = 'AAAA';
  const res = await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'grant-invalid');
});

test('an expired grant is refused', async () => {
  const g = await grantFor([{ with: 'account:echo-safe', can: 'echo-safe' }], { ttlSeconds: 1 });
  // Rewrite exp into the past and re-sign so the signature is valid but expired.
  g.grant.exp = Math.floor(Date.now() / 1000) - 10;
  const sig = await root.sign(Buffer.from(grants.canonicalize(g.grant)));
  g.signature = sig.signature;
  const res = await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'grant-invalid');
});

// ---------------------------------------------------------------------------
// Trust-root policy — the honest part
// ---------------------------------------------------------------------------

test('a mutating action is refused in phase 4a regardless of grant', async () => {
  const g = await grantFor([{ with: 'account:send-money', can: 'send-money' }]);
  const res = await broker.invoke('send-money', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'mutating-action-disabled');
});

test('a sensitive-secret action is refused under a degraded (file) root', async () => {
  const g = await grantFor([{ with: 'account:read-sensitive', can: 'read-sensitive' }]);
  const res = await broker.invoke('read-sensitive', {}, g, { resolvePublicKeyPem });
  assert.equal(res.ok, false);
  assert.equal(res.refusal, 'trust-root-too-weak');
  assert.match(res.reason, /not a boundary/);
});

test('rootPolicy allows read-only non-sensitive under a degraded root, with a note', () => {
  const degraded = { degraded: true, descriptor: { kind: 'file' } };
  const p = broker.rootPolicy(degraded, { name: 'x', readOnly: true, secretRef: { service: 's' } });
  assert.equal(p.allow, true);
  assert.equal(p.degradedNote, true);
});

test('rootPolicy refuses a mutating action under a degraded root', () => {
  const degraded = { degraded: true, descriptor: { kind: 'file' } };
  const p = broker.rootPolicy(degraded, { name: 'x', readOnly: false, secretRef: { service: 's' } });
  assert.equal(p.allow, false);
  assert.equal(p.refusal, 'trust-root-too-weak');
});

test('rootPolicy allows everything under a strong root', () => {
  const strong = { degraded: false, descriptor: { kind: 'separate-uid' } };
  assert.equal(broker.rootPolicy(strong, { name: 'x', readOnly: false, secretRef: {} }).allow, true);
});

// ---------------------------------------------------------------------------
// Scrubbing unit
// ---------------------------------------------------------------------------

test('scrub redacts every occurrence and tolerates absence', () => {
  assert.equal(broker.scrub('a SEC b SEC c', 'SEC'), 'a «redacted-secret» b «redacted-secret» c');
  assert.equal(broker.scrub('nothing here', 'SEC'), 'nothing here');
  assert.equal(broker.scrub('x', ''), 'x');
});

// ---------------------------------------------------------------------------
// listAllowed
// ---------------------------------------------------------------------------

test('listAllowed shows only granted, root-permitted actions, and hides internals', async () => {
  const g = await grantFor([
    { with: 'account:echo-safe', can: 'echo-safe' },
    { with: 'account:read-sensitive', can: 'read-sensitive' },
    { with: 'account:send-money', can: 'send-money' },
  ]);
  const allowed = await broker.listAllowed(g, { resolvePublicKeyPem });
  const names = allowed.map((a) => a.name);
  // echo-safe: yes. read-sensitive: filtered by degraded root. send-money: mutating, filtered.
  assert.deepEqual(names, ['echo-safe']);
  assert.equal(allowed[0].secretRef, undefined, 'must not leak secretRef');
  assert.equal(allowed[0].command, undefined, 'must not leak the command');
});

test('listAllowed for an invalid grant returns nothing', async () => {
  const g = await grantFor([{ with: 'account:echo-safe', can: 'echo-safe' }]);
  g.signature = 'bad';
  assert.deepEqual(await broker.listAllowed(g, { resolvePublicKeyPem }), []);
});

test('a broker with no declared actions file can do nothing', () => {
  // ACTIONS_PATH is frozen at module load (like AUDIT_PATH elsewhere), so this
  // exercises the real guarantee: a missing registry yields zero actions.
  const actionsFile = broker.ACTIONS_PATH;
  const backup = fs.readFileSync(actionsFile);
  fs.unlinkSync(actionsFile);
  try {
    assert.deepEqual(broker.loadActions(), []);
  } finally {
    fs.writeFileSync(actionsFile, backup);
  }
});

test('every refusal is audited', async () => {
  const g = await grantFor([{ with: 'account:other', can: 'other' }]);
  await broker.invoke('echo-safe', {}, g, { resolvePublicKeyPem });
  const lines = fs.readFileSync(process.env.TNF_BROKER_AUDIT_PATH, 'utf8').trim().split('\n');
  const refusals = lines.map((l) => JSON.parse(l)).filter((e) => e.event === 'broker_refused');
  assert.ok(refusals.length >= 1);
});
