/**
 * Per-agent identity binding tests.
 *
 * The property under test: holding A2A_SECRET_KEY must NOT let a process sign
 * as another agent and inherit that agent's registry role.
 *
 * Before this change, verification used the bus-wide shared secret, so
 * `header.agent_id` was a claim any secret-holder could make. resolveRole()
 * then looked that claim up in roles.json — meaning the first `sub-director`
 * grant would have been assumable by every agent on the bus.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-identity-bind-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_ROLES_PATH = path.join(TMP, 'authority', 'roles.json');
process.env.TNF_KEYS_DIR = path.join(TMP, 'authority', 'keys');
process.env.TNF_PUBKEYS_DIR = path.join(TMP, 'authority', 'pubkeys');
process.env.TNF_AUTH_AUDIT_PATH = path.join(TMP, 'audit.jsonl');
process.env.A2A_SECRET_KEY = 'shared-bus-secret-known-to-everyone';

const test = require('node:test');
const assert = require('node:assert/strict');

const identity = require('./tnf-identity.cjs');
const auth = require('./tnf-message-auth.cjs');

const DIRECTOR = 'agent-director';
const ATTACKER = 'agent-attacker';

// The director has a keypair and an operator-granted role.
identity.ensureAgentKeypair(DIRECTOR);
identity.ensureAgentKeypair(ATTACKER);
identity.setAgentRole(DIRECTOR, 'sub-director', { note: 'test fixture' });

function withMode(mode, fn) {
  const saved = process.env.TNF_MESSAGE_AUTH_MODE;
  process.env.TNF_MESSAGE_AUTH_MODE = mode;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.TNF_MESSAGE_AUTH_MODE;
    else process.env.TNF_MESSAGE_AUTH_MODE = saved;
  }
}

function body(agentId) {
  return { type: 'task', channel: 'tnf:agents', data: { from: { agentId, role: 'sub-director' } } };
}

// ---------------------------------------------------------------------------

test('the real director signs an identity-bound envelope', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    const env = auth.signEnvelope({ agent_id: DIRECTOR }, body(DIRECTOR));
    assert.equal(env.header.kid, auth.KID_ED25519);
    assert.equal(env.header.alg, 'Ed25519');

    const res = auth.verifyEnvelope(env);
    assert.equal(res.ok, true, res.reason);
    assert.equal(res.identityBound, true);
    assert.equal(res.agentId, DIRECTOR);
    assert.equal(identity.resolveRole(res.agentId).role, 'sub-director');
  });
});

test('shared-secret holder CANNOT impersonate the director (the whole point)', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    // The attacker knows A2A_SECRET_KEY — every agent does — and forges an
    // envelope claiming to be the director.
    const forged = auth.canonicalize; // touch export to keep intent obvious
    void forged;

    const crypto = require('node:crypto');
    const header = {
      agent_id: DIRECTOR,
      alg: 'HS256',
      kid: auth.KID_SHARED,
      nonce: 'c'.repeat(32),
      timestamp: Date.now(),
    };
    const payload = body(DIRECTOR);
    const signature = crypto
      .createHmac('sha256', process.env.A2A_SECRET_KEY)
      .update(auth.canonicalize({ header, payload }))
      .digest('hex');

    // The HMAC is genuinely correct for the shared secret — this is not a
    // malformed message. It must still be refused, because a correct shared
    // signature says nothing about WHICH agent produced it.
    const res = auth.verifyEnvelope({ header, payload, signature });
    assert.equal(res.ok, false);
    assert.match(res.reason, /identity not individually provable/);
  });
});

test('attacker cannot forge an Ed25519 envelope for the director', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    // Signs with its OWN key but claims the director's id.
    const env = auth.signEnvelope({ agent_id: ATTACKER }, body(ATTACKER));
    env.header.agent_id = DIRECTOR;

    const res = auth.verifyEnvelope(env);
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'signature mismatch');
  });
});

test('an agent with no registered public key cannot be verified', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    const env = auth.signEnvelope({ agent_id: DIRECTOR }, body(DIRECTOR));
    env.header.agent_id = 'agent-never-seen';
    const res = auth.verifyEnvelope(env);
    assert.equal(res.ok, false);
    assert.match(res.reason, /no public key registered/);
  });
});

test('kid cannot be downgraded to dodge Ed25519 verification', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    const env = auth.signEnvelope({ agent_id: DIRECTOR }, body(DIRECTOR));
    env.header.kid = auth.KID_SHARED;
    const res = auth.verifyEnvelope(env);
    assert.equal(res.ok, false);
    assert.match(res.reason, /identity not individually provable/);
  });
});

test('alg cannot be swapped independently of kid', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    const env = auth.signEnvelope({ agent_id: DIRECTOR }, body(DIRECTOR));
    env.header.alg = 'HS256';
    const res = auth.verifyEnvelope(env);
    assert.equal(res.ok, false);
    assert.match(res.reason, /kid\/alg mismatch|signature mismatch/);
  });
});

test('warn mode still accepts shared envelopes but never marks them identity-bound', () => {
  withMode('warn', () => {
    auth._resetNonceCache();
    const crypto = require('node:crypto');
    const header = {
      agent_id: DIRECTOR,
      alg: 'HS256',
      kid: auth.KID_SHARED,
      nonce: 'e'.repeat(32),
      timestamp: Date.now(),
    };
    const payload = body(DIRECTOR);
    const signature = crypto
      .createHmac('sha256', process.env.A2A_SECRET_KEY)
      .update(auth.canonicalize({ header, payload }))
      .digest('hex');

    const res = auth.verifyEnvelope({ header, payload, signature });
    assert.equal(res.ok, true, 'warn mode must not break legacy publishers');
    assert.equal(res.identityBound, false, 'but it must never claim proven identity');
  });
});

test('enforce mode refuses to SIGN without a private key', () => {
  withMode('enforce', () => {
    assert.throws(
      () => auth.signEnvelope({ agent_id: 'agent-with-no-key' }, { type: 'x' }),
      /no Ed25519 private key/
    );
  });
});

test('resolveRoleForMessage forces worker when identity is not bound', () => {
  const res = identity.resolveRoleForMessage({
    verified: false,
    agentId: DIRECTOR,
    claimedRole: 'sub-director',
  });
  assert.equal(res.role, 'worker');
  assert.equal(res.roleVerified, false);
});

test('public keys are distributable; private keys are not world-readable', () => {
  const priv = fs.statSync(identity.privateKeyPathFor(DIRECTOR)).mode & 0o777;
  const pub = fs.statSync(identity.publicKeyPathFor(DIRECTOR)).mode & 0o777;
  assert.equal(priv, 0o600, 'private key must be owner-only');
  assert.equal(pub & 0o044, 0o044, 'public key must be readable for distribution');
});

test('importing a peer public key enables verifying that peer', () => {
  withMode('enforce', () => {
    auth._resetNonceCache();
    const peer = 'agent-remote-peer';
    // Simulate a remote node: generate elsewhere, export only the public half.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-peer-'));
    const savedKeys = process.env.TNF_KEYS_DIR;
    const savedPubs = process.env.TNF_PUBKEYS_DIR;
    process.env.TNF_KEYS_DIR = path.join(tmpDir, 'keys');
    process.env.TNF_PUBKEYS_DIR = path.join(tmpDir, 'pubkeys');
    delete require.cache[require.resolve('./tnf-identity.cjs')];
    const remoteIdentity = require('./tnf-identity.cjs');
    const kp = remoteIdentity.ensureAgentKeypair(peer);
    const pubPem = kp.publicKeyPem;
    process.env.TNF_KEYS_DIR = savedKeys;
    process.env.TNF_PUBKEYS_DIR = savedPubs;
    delete require.cache[require.resolve('./tnf-identity.cjs')];

    const localIdentity = require('./tnf-identity.cjs');
    localIdentity.importAgentPublicKey(peer, pubPem);
    assert.ok(localIdentity.loadAgentPublicKey(peer), 'imported key should load');
    // Without the private key locally, this node cannot sign as that peer.
    assert.equal(localIdentity.loadAgentPrivateKey(peer), null);
  });
});
