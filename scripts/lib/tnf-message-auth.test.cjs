/**
 * Tests for scripts/lib/tnf-message-auth.cjs
 *
 * The central case is `forged role claim is rejected` — the direct regression
 * test for the gap found 2026-07-23, where an unverified signature plus
 * `role: msg.from.role || 'worker'` let any local process claim any role on the
 * agent bus. If that test ever goes green against an unpatched receive path,
 * the vulnerability is back.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Must be set before the module is required — the audit path is resolved once
// at load time so the hot path does not re-stat on every message.
const TMP_AUDIT = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-msg-auth-')),
  'audit.jsonl'
);
process.env.TNF_AUTH_AUDIT_PATH = TMP_AUDIT;

const test = require('node:test');
const assert = require('node:assert/strict');

const auth = require('./tnf-message-auth.cjs');

const GOOD_SECRET = 'test-secret-key-that-is-long-enough';

function withEnv(overrides, fn) {
  const saved = {};
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function freshEnvelope(payloadOverrides = {}, headerOverrides = {}) {
  auth._resetNonceCache();
  return auth.signEnvelope(
    { agent_id: 'agent-alpha', ...headerOverrides },
    { type: 'task', channel: 'tnf:agents', data: { hello: 'world' }, ...payloadOverrides }
  );
}

// ---------------------------------------------------------------------------
// Canonical serialization
// ---------------------------------------------------------------------------

test('canonicalize is independent of key insertion order', () => {
  const a = { b: 1, a: 2, c: { z: 1, y: 2 } };
  const b = { c: { y: 2, z: 1 }, a: 2, b: 1 };
  assert.equal(auth.canonicalize(a), auth.canonicalize(b));
});

test('canonicalize preserves array order', () => {
  assert.notEqual(auth.canonicalize([1, 2]), auth.canonicalize([2, 1]));
});

// ---------------------------------------------------------------------------
// Secret hygiene
// ---------------------------------------------------------------------------

test('the shared-secret path refuses the default-secret placeholder', () => {
  withEnv({ A2A_SECRET_KEY: 'default-secret', TNF_MESSAGE_AUTH_MODE: 'enforce' }, () => {
    assert.throws(() => auth.resolveSecretForSigning(), /placeholder value/);
  });
});

test('the shared-secret path refuses an unset A2A_SECRET_KEY', () => {
  withEnv({ A2A_SECRET_KEY: undefined, TNF_MESSAGE_AUTH_MODE: 'enforce' }, () => {
    assert.throws(() => auth.resolveSecretForSigning(), /not set/);
  });
});

test('enforce mode will not sign at all without a per-agent private key', () => {
  // Supersedes the secret checks above for the signing path: since identity
  // binding landed, enforce mode never reaches the shared secret.
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET, TNF_MESSAGE_AUTH_MODE: 'enforce' }, () => {
    assert.throws(
      () => auth.signEnvelope({ agent_id: 'agent-without-a-keypair' }, {}),
      /no Ed25519 private key/
    );
  });
});

test('warn mode still signs when unconfigured, so the live bus keeps working', () => {
  withEnv({ A2A_SECRET_KEY: undefined, TNF_MESSAGE_AUTH_MODE: 'warn' }, () => {
    const envelope = auth.signEnvelope({ agent_id: 'a' }, { type: 'x' });
    assert.equal(typeof envelope.signature, 'string');
    assert.equal(envelope.header.alg, 'HS256');
  });
});

test('a legacy-signed envelope does NOT verify, keeping the warn log honest', () => {
  // This is the property that makes `warn` a trustworthy rollout signal: while
  // the deployment is unconfigured, every message logs a failure. A quiet warn
  // log therefore means the secret really was provisioned — never that the
  // placeholder is working fine.
  const legacy = withEnv({ A2A_SECRET_KEY: undefined, TNF_MESSAGE_AUTH_MODE: 'warn' }, () =>
    auth.signEnvelope({ agent_id: 'a' }, { type: 'x' })
  );
  withEnv({ A2A_SECRET_KEY: undefined }, () => {
    const result = auth.verifyEnvelope(legacy);
    assert.equal(result.ok, false);
    assert.match(result.reason, /not set/);
  });
});

test('refuses short secrets', () => {
  withEnv({ A2A_SECRET_KEY: 'short' }, () => {
    const res = auth.resolveSecret();
    assert.equal(res.ok, false);
    assert.match(res.reason, /shorter than 16/);
  });
});

// ---------------------------------------------------------------------------
// Round trip
// ---------------------------------------------------------------------------

test('a freshly signed envelope verifies', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    const result = auth.verifyEnvelope(envelope);
    assert.equal(result.ok, true, result.reason);
    assert.equal(result.agentId, 'agent-alpha');
  });
});

// ---------------------------------------------------------------------------
// Tampering
// ---------------------------------------------------------------------------

test('tampered payload fails verification', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    envelope.payload.data.hello = 'tampered';
    const result = auth.verifyEnvelope(envelope);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'signature mismatch');
  });
});

test('tampered header agent_id fails verification', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    envelope.header.agent_id = 'agent-impostor';
    const result = auth.verifyEnvelope(envelope);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'signature mismatch');
  });
});

test('forged role claim is rejected (2026-07-23 regression)', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET, TNF_MESSAGE_AUTH_MODE: 'enforce' }, () => {
    auth._resetNonceCache();
    // Exactly what an attacker with a Redis socket could publish before the
    // fix: a well-formed envelope asserting the highest privileged role, with
    // a signature that was never computed from the real secret.
    const forged = {
      header: {
        agent_id: 'agent-attacker',
        alg: 'HS256',
        nonce: 'a'.repeat(32),
        timestamp: Date.now(),
      },
      payload: {
        type: 'task',
        channel: 'tnf:agents',
        data: { from: { agentId: 'agent-attacker', role: 'local-director' } },
      },
      signature: 'f'.repeat(64),
    };

    const result = auth.verifyAndAudit(forged, {
      claimedRole: 'local-director',
      channel: 'tnf:agents',
    });

    assert.equal(result.ok, false);
    assert.equal(result.reject, true, 'enforce mode must drop a forged envelope');
    // Since identity binding landed, an envelope with no `kid` is treated as
    // shared-secret and refused before the HMAC is even considered — a
    // strictly earlier rejection than the original 'signature mismatch'.
    assert.match(result.reason, /identity not individually provable/);

    const lines = fs.readFileSync(TMP_AUDIT, 'utf8').trim().split('\n');
    const last = JSON.parse(lines[lines.length - 1]);
    assert.equal(last.event, 'message_auth_failure');
    assert.equal(last.action, 'rejected');
    assert.equal(last.claimed_role, 'local-director', 'the forged claim must be recorded');
  });
});

// ---------------------------------------------------------------------------
// Replay and freshness
// ---------------------------------------------------------------------------

test('replaying a valid envelope is rejected on the second use', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    assert.equal(auth.verifyEnvelope(envelope).ok, true);
    const replay = auth.verifyEnvelope(envelope);
    assert.equal(replay.ok, false);
    assert.equal(replay.reason, 'nonce replay');
  });
});

test('a failed signature does not consume the nonce', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    const bad = { ...envelope, signature: 'f'.repeat(64) };
    assert.equal(auth.verifyEnvelope(bad).ok, false);
    // The genuine message with the same nonce must still get through, or an
    // attacker could invalidate real traffic by flooding forged nonces.
    assert.equal(auth.verifyEnvelope(envelope).ok, true);
  });
});

test('a stale timestamp is rejected', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    const future = Date.now() + auth.SKEW_WINDOW_MS + 5_000;
    const result = auth.verifyEnvelope(envelope, { now: future });
    assert.equal(result.ok, false);
    assert.match(result.reason, /outside/);
  });
});

// ---------------------------------------------------------------------------
// Malformed input — every path must fail closed
// ---------------------------------------------------------------------------

test('alg downgrade is rejected', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    envelope.header.alg = 'none';
    const result = auth.verifyEnvelope(envelope);
    assert.equal(result.ok, false);
    assert.match(result.reason, /unsupported alg/);
  });
});

test('malformed envelopes fail closed', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    for (const bad of [null, undefined, 42, 'string', {}, { header: {} }]) {
      assert.equal(auth.verifyEnvelope(bad).ok, false, `should reject: ${JSON.stringify(bad)}`);
    }
  });
});

test('a missing signature is rejected', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    const envelope = freshEnvelope();
    delete envelope.signature;
    assert.equal(auth.verifyEnvelope(envelope).ok, false);
  });
});

// ---------------------------------------------------------------------------
// Staged rollout
// ---------------------------------------------------------------------------

test('warn mode allows a bad message through but still reports failure', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET, TNF_MESSAGE_AUTH_MODE: 'warn' }, () => {
    const result = auth.verifyAndAudit({ header: {}, payload: {}, signature: 'x' });
    assert.equal(result.ok, false);
    assert.equal(result.reject, false, 'warn mode must not drop messages');
  });
});

test('enforce mode rejects', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET, TNF_MESSAGE_AUTH_MODE: 'enforce' }, () => {
    const result = auth.verifyAndAudit({ header: {}, payload: {}, signature: 'x' });
    assert.equal(result.reject, true);
  });
});

test('an unrecognized mode falls back to warn, not enforce', () => {
  withEnv({ TNF_MESSAGE_AUTH_MODE: 'banana' }, () => {
    assert.equal(auth.getMode(), 'warn');
  });
});

test('isSignedEnvelope discriminates', () => {
  withEnv({ A2A_SECRET_KEY: GOOD_SECRET }, () => {
    assert.equal(auth.isSignedEnvelope(freshEnvelope()), true);
    assert.equal(auth.isSignedEnvelope({ id: 'x', type: 'task' }), false);
    assert.equal(auth.isSignedEnvelope(null), false);
  });
});
