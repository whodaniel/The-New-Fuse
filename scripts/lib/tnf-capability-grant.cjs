#!/usr/bin/env node

/**
 * TNF Capability Grants — UCAN-shaped, attenuating, offline-verifiable.
 *
 * Implements `CapabilityGrant` / `GrantVerificationResult` from
 * @the-new-fuse/control-plane-contracts.
 *
 * Why UCAN shape rather than a bespoke token:
 *
 *  - **Attenuation.** A holder may sub-delegate a strict SUBSET of what it
 *    holds. The verifier enforces this by walking the proof chain, so a chain
 *    can only ever narrow. Without it, "the sub-director may delegate to a
 *    worker" becomes an escalation path.
 *  - **Offline verification.** Any node validates a chain from the root DID with
 *    no server call — required for local agents and for cloud nodes that
 *    partition.
 *  - **No central authority.** The chain is the proof.
 *
 * Capabilities use TNF's existing plain-language vocabulary from agent
 * frontmatter (`lane_coordination`, `prompt_injection`, `master_clock_control`,
 * …), not a parallel taxonomy — a grant should read the way the staffing and
 * orchestration docs already do.
 *
 * The trust root that signs a grant is pluggable (see tnf-trust-root.cjs). This
 * module never assumes a particular one, so a stronger root is a drop-in.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');
const AUDIT_PATH =
  process.env.TNF_GRANT_AUDIT_PATH || path.join(AUTHORITY_DIR, 'grants.jsonl');
const CONSUMED_PATH =
  process.env.TNF_GRANT_CONSUMED_PATH || path.join(AUTHORITY_DIR, 'consumed-nonces.json');

/** Default lifetime. Grants are short-lived by policy, not by convention. */
const DEFAULT_TTL_SECONDS = 15 * 60;
/** Hard ceiling. A caller asking for longer gets clamped, and it is audited. */
const MAX_TTL_SECONDS = 60 * 60;

/** Max delegation-chain depth. Real chains are 1–2 links; this bounds a
 *  crafted deep chain from exhausting the stack. */
const MAX_CHAIN_DEPTH = 8;

// ============================================================================
// CANONICALIZATION
// ============================================================================

/** Deterministic JSON — same reasoning as tnf-message-auth.cjs. */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const parts = Object.keys(value)
    .sort()
    .filter((k) => value[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`);
  return `{${parts.join(',')}}`;
}

// ============================================================================
// ATTENUATION
// ============================================================================

/**
 * Does `parent` fully cover `child`?
 *
 * This is the heart of the security model: delegation must never widen. A
 * capability is covered when the resource and action match (with `*` as an
 * explicit wildcard) AND every condition on the parent is at least as strict on
 * the child.
 */
function covers(parent, child) {
  if (!resourceCovers(parent.with, child.with)) return false;
  if (parent.can !== '*' && parent.can !== child.can) return false;
  return conditionsCover(parent.conditions, child.conditions);
}

/**
 * Resource matching. `*` covers everything; a `prefix:*` form covers anything
 * sharing that prefix. Exact match otherwise.
 *
 * Deliberately conservative: an unrecognised shape does NOT match, so a new
 * resource syntax fails closed rather than silently granting.
 */
function resourceCovers(parentWith, childWith) {
  if (typeof parentWith !== 'string' || typeof childWith !== 'string') return false;
  if (parentWith === '*') return true;
  if (parentWith === childWith) return true;
  if (parentWith.endsWith(':*')) {
    const prefix = parentWith.slice(0, -1); // keep the trailing ':'
    return childWith.startsWith(prefix);
  }
  // Path-scoped resources: fs:/repo covers fs:/repo/sub
  if (parentWith.includes(':/') && childWith.startsWith(`${parentWith}/`)) return true;
  return false;
}

/**
 * Every condition the parent sets must be present on the child and no looser.
 * A child that drops a parent's condition is NOT covered — dropping a
 * restriction is widening.
 */
function conditionsCover(parentCond, childCond) {
  if (!parentCond || Object.keys(parentCond).length === 0) return true;
  if (!childCond) return false;
  for (const [key, pv] of Object.entries(parentCond)) {
    const cv = childCond[key];
    if (cv === undefined) return false;
    if (typeof pv === 'number' && typeof cv === 'number') {
      if (cv > pv) return false; // child may only lower a numeric cap
    } else if (Array.isArray(pv)) {
      if (!Array.isArray(cv) || !cv.every((v) => pv.includes(v))) return false;
    } else if (pv !== cv) {
      return false;
    }
  }
  return true;
}

/** Capabilities from `requested` that some entry in `held` covers. */
function attenuate(held, requested) {
  return requested.filter((r) => held.some((h) => covers(h, r)));
}

// ============================================================================
// ISSUE
// ============================================================================

/**
 * Issue a signed grant.
 *
 * @param {object} opts
 * @param {object} opts.trustRoot  provider from tnf-trust-root.cjs
 * @param {string} opts.audience   recipient DID
 * @param {Array}  opts.capabilities
 * @param {string} [opts.boundTask]
 * @param {number} [opts.ttlSeconds]
 * @param {Array}  [opts.proof]    parent grant JWS strings
 * @param {Array}  [opts.parentCapabilities] what the issuer holds, when sub-delegating
 */
async function issueGrant(opts) {
  const {
    trustRoot,
    audience,
    capabilities,
    boundTask,
    purpose,
    ttlSeconds = DEFAULT_TTL_SECONDS,
    proof = [],
    parentCapabilities = null,
  } = opts;

  if (!trustRoot || typeof trustRoot.sign !== 'function') {
    throw new Error('[tnf-grant] a trust root provider is required to issue a grant');
  }
  if (typeof audience !== 'string' || !audience.startsWith('did:')) {
    throw new Error('[tnf-grant] audience must be a DID');
  }
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    throw new Error('[tnf-grant] refusing to issue a grant with no capabilities');
  }

  // Sub-delegation may only narrow. Enforced at issue time as well as at
  // verify time — a malformed grant should never enter circulation.
  let effective = capabilities;
  if (parentCapabilities) {
    effective = attenuate(parentCapabilities, capabilities);
    if (effective.length !== capabilities.length) {
      const dropped = capabilities.filter((c) => !effective.includes(c));
      throw new Error(
        `[tnf-grant] sub-delegation would widen authority; not covered by parent: ${JSON.stringify(dropped)}`
      );
    }
  }

  const clamped = Math.min(Math.max(1, ttlSeconds), MAX_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  const rootKey = await trustRoot.getPublicKey();

  const grant = {
    iss: rootKey.did,
    aud: audience,
    att: effective,
    nbf: now,
    exp: now + clamped,
    nnc: crypto.randomBytes(16).toString('hex'),
    ...(proof.length ? { prf: proof } : {}),
    ...(boundTask ? { boundTask } : {}),
    ...(purpose ? { purpose } : {}),
  };

  const signature = await trustRoot.sign(Buffer.from(canonicalize(grant), 'utf8'), {
    purpose: purpose || `grant ${effective.map((c) => c.can).join(', ')} to ${audience}`,
  });

  const signed = { grant, signature: signature.signature, algorithm: signature.algorithm };

  audit({
    event: 'grant_issued',
    iss: grant.iss,
    aud: grant.aud,
    att: grant.att,
    exp: grant.exp,
    nnc: grant.nnc,
    boundTask: grant.boundTask ?? null,
    ttlRequested: ttlSeconds,
    ttlGranted: clamped,
    ttlClamped: clamped !== ttlSeconds,
    rootKind: trustRoot.kind,
  });

  return signed;
}

// ============================================================================
// VERIFY
// ============================================================================

/**
 * Verify a signed grant.
 *
 * Fails closed on every path. `authorized` is true only for verdict 'valid';
 * callers must never infer authority from anything else.
 *
 * @param {object} signed
 * @param {object} opts
 * @param {(did: string) => (string|null)} opts.resolvePublicKeyPem  DID -> SPKI PEM
 * @param {string} [opts.task]      required when the grant is task-bound
 * @param {string} [opts.audience]  expected recipient
 * @param {number} [opts.now]       epoch seconds, for tests
 * @param {boolean} [opts.consume]  mark the nonce used (single-use enforcement)
 */
function verifyGrant(signed, opts) {
  const { resolvePublicKeyPem, task, audience, now = Math.floor(Date.now() / 1000), consume = false, _depth = 0 } =
    opts || {};

  // A crafted grant could carry a deeply-nested `prf` chain and exhaust the
  // stack — a denial of service. Real delegation chains are short; cap the
  // depth and fail closed well before recursion becomes a problem.
  if (_depth > MAX_CHAIN_DEPTH) {
    return {
      verdict: 'chain-broken',
      authorized: false,
      effective: [],
      chain: [],
      reason: `delegation chain exceeds max depth ${MAX_CHAIN_DEPTH}`,
    };
  }

  const fail = (verdict, reason) => ({
    verdict,
    authorized: false,
    effective: [],
    chain: [],
    reason,
  });

  if (!signed || typeof signed !== 'object') return fail('malformed', 'not an object');
  const { grant, signature, algorithm } = signed;
  if (!grant || typeof grant !== 'object') return fail('malformed', 'missing grant');
  if (typeof signature !== 'string' || !signature) return fail('malformed', 'missing signature');
  if (algorithm !== 'Ed25519' && algorithm !== 'ES256') {
    return fail('malformed', `unsupported algorithm: ${String(algorithm)}`);
  }
  if (!Array.isArray(grant.att)) return fail('malformed', 'att must be an array');
  if (typeof grant.iss !== 'string' || typeof grant.aud !== 'string') {
    return fail('malformed', 'iss and aud are required');
  }
  if (typeof grant.exp !== 'number') return fail('malformed', 'exp is required');

  if (typeof grant.nbf === 'number' && now < grant.nbf) {
    return fail('not-yet-valid', `grant is not valid until ${grant.nbf}`);
  }
  if (now >= grant.exp) {
    return fail('expired', `grant expired at ${grant.exp}`);
  }
  if (audience && grant.aud !== audience) {
    return fail('malformed', `grant is addressed to ${grant.aud}, not ${audience}`);
  }
  // A task-bound grant used against a different task is exactly the reuse this
  // binding exists to prevent.
  if (grant.boundTask && grant.boundTask !== task) {
    return fail('task-mismatch', `grant is bound to task ${grant.boundTask}, presented for ${task ?? 'none'}`);
  }

  const pem = typeof resolvePublicKeyPem === 'function' ? resolvePublicKeyPem(grant.iss) : null;
  if (!pem) return fail('unknown-issuer', `no public key for issuer ${grant.iss}`);

  let sigOk = false;
  try {
    sigOk = crypto.verify(
      null,
      Buffer.from(canonicalize(grant), 'utf8'),
      crypto.createPublicKey(pem),
      Buffer.from(signature, 'base64')
    );
  } catch (err) {
    return fail('signature-invalid', `verify threw: ${err.message}`);
  }
  if (!sigOk) return fail('signature-invalid', 'signature does not match');

  // Walk the proof chain. Each link must be valid on its own AND must cover
  // what the child claims — the check that keeps delegation narrowing.
  const chain = [grant.iss];
  let effective = grant.att;
  if (Array.isArray(grant.prf) && grant.prf.length > 0) {
    for (const parentRaw of grant.prf) {
      let parent;
      try {
        parent = typeof parentRaw === 'string' ? JSON.parse(parentRaw) : parentRaw;
      } catch {
        return fail('chain-broken', 'proof entry is not valid JSON');
      }
      const parentResult = verifyGrant(parent, {
        resolvePublicKeyPem,
        task,
        now,
        consume: false,
        _depth: _depth + 1,
      });
      if (!parentResult.authorized) {
        return fail('chain-broken', `parent grant invalid: ${parentResult.reason}`);
      }
      if (parent.grant.aud !== grant.iss) {
        return fail('chain-broken', `parent audience ${parent.grant.aud} is not this issuer ${grant.iss}`);
      }
      const narrowed = attenuate(parentResult.effective, effective);
      if (narrowed.length !== effective.length) {
        return fail('exceeds-parent', 'child claims capabilities the parent does not hold');
      }
      effective = narrowed;
      chain.unshift(parent.grant.iss);
    }
  }

  // HONEST LIMIT: check-then-consume is not atomic. Two concurrent
  // verifications of the same single-use grant could both observe it unconsumed
  // and both pass before either writes. For a single-operator local tool this
  // race is low-risk, but it is a real gap: single-use is enforced against
  // sequential reuse, not a deliberate concurrent double-spend. Closing it fully
  // needs an atomic claim (file lock or O_EXCL marker per nonce); tracked rather
  // than papered over.
  if (isNonceConsumed(grant.nnc)) {
    return fail('replayed', `grant nonce ${grant.nnc} was already used`);
  }
  if (consume) consumeNonce(grant.nnc, grant.exp);

  return { verdict: 'valid', authorized: true, effective, chain };
}

/** Does a verified grant authorize this specific action? */
function grantAuthorizes(result, resource, action) {
  if (!result || !result.authorized) return false;
  return result.effective.some((c) => covers(c, { with: resource, can: action }));
}

// ============================================================================
// SINGLE-USE NONCES
// ============================================================================

function readConsumed() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONSUMED_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function isNonceConsumed(nonce) {
  return Object.prototype.hasOwnProperty.call(readConsumed(), nonce);
}

/** Records the nonce and prunes entries whose grants have expired. */
function consumeNonce(nonce, expSeconds) {
  const store = readConsumed();
  const now = Math.floor(Date.now() / 1000);
  for (const [k, exp] of Object.entries(store)) {
    if (typeof exp === 'number' && exp < now) delete store[k];
  }
  store[nonce] = expSeconds;
  fs.mkdirSync(path.dirname(CONSUMED_PATH), { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONSUMED_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
}

// ============================================================================
// AUDIT
// ============================================================================

function audit(event) {
  const record = { ts: new Date().toISOString(), ...event };
  try {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true, mode: 0o700 });
    fs.appendFileSync(AUDIT_PATH, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  } catch (err) {
    console.error(`[tnf-grant] audit write failed: ${err.message}`);
  }
}

module.exports = {
  issueGrant,
  verifyGrant,
  grantAuthorizes,
  attenuate,
  covers,
  resourceCovers,
  conditionsCover,
  canonicalize,
  audit,
  DEFAULT_TTL_SECONDS,
  MAX_TTL_SECONDS,
  AUDIT_PATH,
  _isNonceConsumed: isNonceConsumed,
  _consumeNonce: consumeNonce,
};
