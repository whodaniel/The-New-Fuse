#!/usr/bin/env node

/**
 * TNF A2A Message Authentication
 *
 * Closes a real gap found 2026-07-23: `signMessage()` in
 * `scripts/tnf-agent-cli.cjs` computed an HMAC and attached it to every
 * envelope, but nothing anywhere verified it. `normalizeIncomingMessage()`
 * unpacked `{ header, payload, signature }` and threw the signature away
 * unchecked, then read the sender's role straight off the wire
 * (`role: msg.from.role || 'worker'`). `A2ASignatureWrapper`
 * (packages/a2a-core/src/signature-wrapper.ts) had a sign path and no verify
 * counterpart. Combined with a `'default-secret'` fallback and an
 * unauthenticated `redis://localhost:6379`, any local process could publish a
 * message claiming any role and be believed.
 *
 * This module is the verify side. It is deliberately dependency-free and
 * synchronous so it can sit in the hot path of every Redis-driven wrapper
 * (pi/jules/gemini/...) without changing their control flow.
 *
 * Usage:
 *   const auth = require('./lib/tnf-message-auth.cjs');
 *   const envelope = auth.signEnvelope(header, payload);
 *   const result = auth.verifyEnvelope(envelope);
 *   if (!result.ok) { ...reject... }
 *
 * Rollout is staged via TNF_MESSAGE_AUTH_MODE:
 *   warn    (default) — verify, log failures, let the message through
 *   enforce           — verify, log failures, reject the message
 * Ship `warn` first, watch the audit log until it is clean, then flip to
 * `enforce`. Flipping is a one-line config change, not a code change.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const identity = require('./tnf-identity.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Messages older/newer than this are rejected outright (replay + clock skew). */
const SKEW_WINDOW_MS = 120_000;

/** Nonce retention. Must exceed SKEW_WINDOW_MS or the replay window reopens. */
const NONCE_TTL_MS = 300_000;

/** Hard cap on the nonce cache so a message flood cannot exhaust memory. */
const NONCE_CACHE_MAX = 10_000;

const AUTHORITY_DIR = path.join(os.homedir(), '.tnf', 'authority');
const AUDIT_PATH = process.env.TNF_AUTH_AUDIT_PATH || path.join(AUTHORITY_DIR, 'audit.jsonl');

/** Secrets we refuse to operate with, regardless of mode. */
const FORBIDDEN_SECRETS = new Set(['default-secret', 'changeme', 'secret', '']);

const MODES = new Set(['warn', 'enforce']);

function getMode() {
  const raw = String(process.env.TNF_MESSAGE_AUTH_MODE || 'warn').toLowerCase();
  return MODES.has(raw) ? raw : 'warn';
}

// ============================================================================
// CANONICAL SERIALIZATION
// ============================================================================

/**
 * Deterministic JSON. Plain `JSON.stringify` preserves insertion order, so two
 * structurally identical objects built in different orders serialize
 * differently and their HMACs disagree. That is survivable while nobody
 * verifies; it becomes a source of phantom auth failures the moment someone
 * does. Sorting keys recursively removes the whole class of bug.
 *
 * Arrays keep their order — order is semantic there.
 */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const parts = keys
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`);
  return `{${parts.join(',')}}`;
}

// ============================================================================
// SECRET RESOLUTION
// ============================================================================

/**
 * Strict resolution — used by verification, always.
 *
 * Never relaxed by mode. If this returns not-ok, verification fails, which is
 * what keeps the audit log honest during a `warn` rollout: as long as the
 * deployment is still on the placeholder secret, every message logs a failure
 * and the log visibly is not clean. A `warn` log that went quiet while the
 * secret was still 'default-secret' would be a false green light to flip to
 * `enforce`.
 *
 * @returns {{ ok: boolean, secret?: string, reason?: string }}
 */
function resolveSecret() {
  const secret = process.env.A2A_SECRET_KEY;
  if (secret === undefined || secret === null) {
    return { ok: false, reason: 'A2A_SECRET_KEY is not set' };
  }
  if (FORBIDDEN_SECRETS.has(secret)) {
    return { ok: false, reason: `A2A_SECRET_KEY is a placeholder value (${JSON.stringify(secret)})` };
  }
  if (secret.length < 16) {
    return { ok: false, reason: 'A2A_SECRET_KEY is shorter than 16 characters' };
  }
  return { ok: true, secret };
}

/**
 * The value the codebase signed with before 2026-07-23, when
 * `A2A_SECRET_KEY || 'default-secret'` appeared in four places and nothing
 * verified the result. It is a literal string in the source tree and provides
 * exactly zero security.
 *
 * It survives here for one reason: keeping the wire format unchanged during a
 * `warn` rollout. As of this writing A2A_SECRET_KEY is unset in this
 * deployment, so throwing at sign time would take the live fleet's send path
 * down instantly. In `warn` mode we therefore keep emitting the same
 * (worthless) envelopes as before and shout about it; in `enforce` mode
 * signing hard-fails without a real secret.
 *
 * Deleting this constant is the goal. Once A2A_SECRET_KEY is provisioned and
 * mode is `enforce`, nothing reaches this path.
 */
const LEGACY_INSECURE_SECRET = 'default-secret';

let warnedAboutLegacySecret = false;

/**
 * Signing-side resolution, staged by mode.
 *
 * `enforce` demands a real secret. `warn` falls back to the legacy value so an
 * unconfigured deployment keeps working while the operator provisions a key.
 * The fallback is announced once per process, loudly — a silent fallback is
 * how the original problem persisted unnoticed.
 */
function resolveSecretForSigning() {
  const strict = resolveSecret();
  if (strict.ok) return strict;

  if (getMode() === 'enforce') {
    throw new Error(
      `[tnf-message-auth] refusing to sign: ${strict.reason}. ` +
        'Generate one with: openssl rand -hex 32'
    );
  }

  if (!warnedAboutLegacySecret) {
    warnedAboutLegacySecret = true;
    console.error(
      '[tnf-message-auth] ############################################################\n' +
        `[tnf-message-auth] A2A signing is INSECURE: ${strict.reason}.\n` +
        '[tnf-message-auth] Falling back to the legacy placeholder secret so the bus\n' +
        '[tnf-message-auth] keeps working. Messages signed this way CANNOT be trusted\n' +
        '[tnf-message-auth] and will NOT verify. Provision A2A_SECRET_KEY, confirm the\n' +
        '[tnf-message-auth] audit log is clean, then set TNF_MESSAGE_AUTH_MODE=enforce.\n' +
        '[tnf-message-auth] ############################################################'
    );
    audit({
      event: 'message_auth_insecure_signing',
      mode: getMode(),
      action: 'legacy_placeholder_secret_in_use',
      reason: strict.reason,
    });
  }
  return { ok: true, secret: LEGACY_INSECURE_SECRET, legacy: true };
}

// ============================================================================
// NONCE REPLAY CACHE
// ============================================================================

/** @type {Map<string, number>} nonce -> first-seen epoch ms. Map keeps insertion order. */
const seenNonces = new Map();

function pruneNonces(now) {
  for (const [nonce, seenAt] of seenNonces) {
    // Insertion-ordered, so the first non-expired entry means we are done.
    if (now - seenAt <= NONCE_TTL_MS) break;
    seenNonces.delete(nonce);
  }
  while (seenNonces.size > NONCE_CACHE_MAX) {
    const oldest = seenNonces.keys().next().value;
    if (oldest === undefined) break;
    seenNonces.delete(oldest);
  }
}

/**
 * @returns {boolean} true if this nonce is fresh, false if it is a replay.
 */
function claimNonce(nonce, now) {
  pruneNonces(now);
  if (seenNonces.has(nonce)) return false;
  seenNonces.set(nonce, now);
  return true;
}

/** Test seam — lets the suite assert replay behaviour deterministically. */
function _resetNonceCache() {
  seenNonces.clear();
}

// ============================================================================
// AUDIT
// ============================================================================

/**
 * Append-only. Best-effort by design: an unwritable audit file must not take
 * down the message bus, but it must also never silently swallow the reason a
 * message was rejected, so we still emit to stderr.
 */
function audit(event) {
  const record = { ts: new Date().toISOString(), ...event };
  try {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true, mode: 0o700 });
    fs.appendFileSync(AUDIT_PATH, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  } catch (err) {
    console.error(`[tnf-message-auth] audit write failed: ${err.message}`);
  }
}

// ============================================================================
// SIGN / VERIFY
// ============================================================================

function computeSignature(header, payload, secret) {
  const message = canonicalize({ header, payload });
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// ============================================================================
// KEY MODES
// ============================================================================
//
// `header.kid` declares which key signed the envelope:
//
//   'ed25519' — signed with the sender's own private key. Only that agent can
//               produce it, so header.agent_id is a real identity claim and
//               resolveRole() may be trusted against it.
//   'shared'  — signed with the bus-wide A2A_SECRET_KEY (legacy). Every agent
//               holds that secret, so ANY holder can sign as ANY agent_id.
//               Authenticates membership of the bus, never an individual.
//
// enforce mode rejects 'shared' outright. Accepting it would leave the exact
// impersonation path this whole layer exists to close: an attacker would simply
// set kid:'shared' and sign as the local-director. This is the same downgrade
// reasoning that pins `alg`.

const KID_ED25519 = 'ed25519';
const KID_SHARED = 'shared';

/**
 * Sign with the agent's Ed25519 private key when one exists.
 * @returns {{ kid: string, sign: (msg: string) => string } | null}
 */
function ed25519Signer(agentId) {
  const priv = identity.loadAgentPrivateKey(agentId);
  if (!priv) return null;
  return {
    kid: KID_ED25519,
    sign: (message) => crypto.sign(null, Buffer.from(message, 'utf8'), priv).toString('base64'),
  };
}

function verifyEd25519(agentId, message, signature) {
  const pub = identity.loadAgentPublicKey(agentId);
  if (!pub) {
    return { ok: false, reason: `no public key registered for agent ${agentId}` };
  }
  let sigBuf;
  try {
    sigBuf = Buffer.from(signature, 'base64');
  } catch {
    return { ok: false, reason: 'signature is not valid base64' };
  }
  // Ed25519 signatures are a fixed 64 bytes; anything else is malformed.
  if (sigBuf.length !== 64) {
    return { ok: false, reason: 'signature is not a 64-byte Ed25519 signature' };
  }
  let ok = false;
  try {
    ok = crypto.verify(null, Buffer.from(message, 'utf8'), pub, sigBuf);
  } catch (err) {
    return { ok: false, reason: `verify failed: ${err.message}` };
  }
  return ok ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

/**
 * Constant-time hex comparison. `crypto.timingSafeEqual` throws on length
 * mismatch, which would itself leak length via the exception path, so length is
 * checked first and treated as a plain mismatch.
 */
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Build a signed envelope.
 *
 * @param {object} header  Must carry `agent_id`. `nonce`/`timestamp`/`alg` are
 *                         filled in when absent.
 * @param {object} payload Arbitrary message body.
 * @returns {{ header: object, payload: object, signature: string }}
 */
function signEnvelope(header, payload) {
  const agentId = header && typeof header.agent_id === 'string' ? header.agent_id : null;
  const signer = agentId ? ed25519Signer(agentId) : null;

  if (signer) {
    const fullHeader = {
      alg: 'Ed25519',
      kid: KID_ED25519,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      ...header,
    };
    return {
      header: fullHeader,
      payload,
      signature: signer.sign(canonicalize({ header: fullHeader, payload })),
    };
  }

  // No per-agent private key: fall back to the shared bus secret. This
  // authenticates bus membership only, so enforce mode will refuse to sign
  // this way rather than emit an envelope no peer is allowed to accept.
  if (getMode() === 'enforce') {
    throw new Error(
      `[tnf-message-auth] refusing to sign: no Ed25519 private key for agent ${JSON.stringify(agentId)}. ` +
        'Provision one with tnf-identity.ensureAgentKeypair(agentId).'
    );
  }
  const resolved = resolveSecretForSigning();
  const fullHeader = {
    alg: 'HS256',
    kid: KID_SHARED,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
    ...header,
  };
  return {
    header: fullHeader,
    payload,
    signature: computeSignature(fullHeader, payload, resolved.secret),
  };
}

/**
 * Verify a signed envelope.
 *
 * Fails closed on every path: a malformed envelope, a bad secret, a stale
 * timestamp, a replayed nonce, and a wrong signature all return `ok: false`.
 * The caller decides what to do with that based on `shouldReject()`.
 *
 * @param {unknown} envelope
 * @param {{ now?: number }} [opts]
 * @returns {{ ok: boolean, reason?: string, agentId?: string }}
 */
function verifyEnvelope(envelope, opts = {}) {
  const now = typeof opts.now === 'number' ? opts.now : Date.now();

  if (!envelope || typeof envelope !== 'object') {
    return { ok: false, reason: 'envelope is not an object' };
  }
  const { header, payload, signature } = envelope;
  if (!header || typeof header !== 'object') {
    return { ok: false, reason: 'missing header' };
  }
  if (payload === undefined) {
    return { ok: false, reason: 'missing payload' };
  }
  if (typeof signature !== 'string' || signature.length === 0) {
    return { ok: false, reason: 'missing signature' };
  }
  // Pinned. Without this, an attacker picks the algorithm — the classic
  // JWT `alg: none` downgrade.
  if (header.alg !== 'HS256' && header.alg !== 'Ed25519') {
    return { ok: false, reason: `unsupported alg: ${String(header.alg)}` };
  }
  const agentId = typeof header.agent_id === 'string' ? header.agent_id : undefined;
  if (!agentId) {
    return { ok: false, reason: 'missing header.agent_id' };
  }
  if (typeof header.timestamp !== 'number' || !Number.isFinite(header.timestamp)) {
    return { ok: false, reason: 'missing or invalid header.timestamp', agentId };
  }
  if (typeof header.nonce !== 'string' || header.nonce.length < 8) {
    return { ok: false, reason: 'missing or invalid header.nonce', agentId };
  }

  const drift = Math.abs(now - header.timestamp);
  if (drift > SKEW_WINDOW_MS) {
    return { ok: false, reason: `timestamp outside ±${SKEW_WINDOW_MS}ms window (drift ${drift}ms)`, agentId };
  }

  const kid = header.kid === KID_ED25519 ? KID_ED25519 : KID_SHARED;
  const message = canonicalize({ header, payload });

  if (kid === KID_ED25519) {
    if (header.alg !== 'Ed25519') {
      return { ok: false, reason: 'kid/alg mismatch', agentId, kid };
    }
    const res = verifyEd25519(agentId, message, signature);
    if (!res.ok) return { ok: false, reason: res.reason, agentId, kid };
  } else {
    // Shared-secret envelope. Proves the sender holds A2A_SECRET_KEY, which
    // every agent does — so it cannot establish WHICH agent sent it. Rejected
    // in enforce mode; in warn mode it is checked so the log stays useful, but
    // identityBound stays false and callers must not treat agentId as proven.
    if (getMode() === 'enforce') {
      return {
        ok: false,
        reason: 'shared-secret envelope rejected: identity not individually provable',
        agentId,
        kid,
      };
    }
    if (header.alg !== 'HS256') {
      return { ok: false, reason: 'kid/alg mismatch', agentId, kid };
    }
    const resolved = resolveSecret();
    if (!resolved.ok) {
      return { ok: false, reason: resolved.reason, agentId, kid };
    }
    if (!safeEqualHex(signature, computeSignature(header, payload, resolved.secret))) {
      return { ok: false, reason: 'signature mismatch', agentId, kid };
    }
  }

  // Nonce is claimed only after the signature checks out. Claiming earlier
  // would let an unauthenticated flood evict every legitimate nonce.
  if (!claimNonce(header.nonce, now)) {
    return { ok: false, reason: 'nonce replay', agentId, kid };
  }

  return { ok: true, agentId, kid, identityBound: kid === KID_ED25519 };
}

/**
 * Whether a failed verification should drop the message.
 *
 * Split from `verifyEnvelope` so the staged rollout lives in one place: in
 * `warn` mode every failure is logged and the message proceeds, which is what
 * makes it safe to deploy verification before every publisher has been
 * migrated.
 */
function shouldReject(result) {
  if (result.ok) return false;
  return getMode() === 'enforce';
}

/**
 * Verify, audit, and report the reject decision in one call — the shape the
 * receive path actually wants.
 *
 * @returns {{ ok: boolean, reject: boolean, reason?: string, agentId?: string }}
 */
function verifyAndAudit(envelope, context = {}) {
  const result = verifyEnvelope(envelope);
  if (result.ok) return { ...result, reject: false };

  const reject = shouldReject(result);
  audit({
    event: 'message_auth_failure',
    mode: getMode(),
    action: reject ? 'rejected' : 'allowed_warn_mode',
    reason: result.reason,
    agent_id: result.agentId || null,
    kid: result.kid ?? null,
    // Claimed values are recorded as claims, never trusted. This is what makes
    // a forged-role attempt visible in the log rather than merely blocked.
    claimed_role: context.claimedRole ?? null,
    channel: context.channel ?? null,
    message_id: context.messageId ?? null,
  });
  console.error(
    `[tnf-message-auth] ${reject ? 'REJECTED' : 'WARN'} (${getMode()}): ${result.reason}` +
      (result.agentId ? ` [agent=${result.agentId}]` : '')
  );
  return { ...result, reject };
}

/** True when `envelope` has the signed shape at all. */
function isSignedEnvelope(value) {
  return Boolean(
    value && typeof value === 'object' && value.header && value.payload !== undefined && value.signature
  );
}

module.exports = {
  signEnvelope,
  verifyEnvelope,
  verifyAndAudit,
  shouldReject,
  isSignedEnvelope,
  canonicalize,
  resolveSecret,
  resolveSecretForSigning,
  getMode,
  audit,
  SKEW_WINDOW_MS,
  NONCE_TTL_MS,
  KID_ED25519,
  KID_SHARED,
  _resetNonceCache,
};
