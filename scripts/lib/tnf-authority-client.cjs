#!/usr/bin/env node

/**
 * TNF Authority Client — the agent-side API for the authority stack.
 *
 * This is the piece a worker wrapper (gemini/jules/pi/claude-redis-wrapper) uses
 * to obtain and spend authority. It is the FIRST consumer of Phases 1–4a, and
 * exists to validate that the whole stack composes from an agent's point of view
 * (see docs/protocols/AUTHORITY_INTEGRATION_MAP.md — "wire one consumer first").
 *
 * It is deliberately a standalone library, NOT wired into any live wrapper yet:
 * adopting it is a one-line change in a wrapper, made deliberately by the
 * operator, not a silent behaviour change to the running fleet.
 *
 * The agent side can only ever REQUEST and SPEND. It cannot approve — approval
 * comes from the operator through a channel this client has no access to. Every
 * method here fails closed and never fabricates a grant.
 */

'use strict';

const broker = require('./tnf-elevation-broker.cjs');
const credBroker = require('./tnf-cred-broker.cjs');
const identity = require('./tnf-identity.cjs');
const trust = require('./tnf-trust-root.cjs');

/**
 * Resolve the DID and public-key resolver for grant verification.
 *
 * The operator root's public key IS the verification anchor. An agent verifies
 * a grant it received against the operator's public key (safe to distribute);
 * it never needs, and must never have, the private key.
 */
function operatorKeyResolver() {
  let rootDid = null;
  let rootPem = null;
  try {
    const fs = require('node:fs');
    if (fs.existsSync(trust.OPERATOR_PUB_PATH)) {
      rootPem = fs.readFileSync(trust.OPERATOR_PUB_PATH, 'utf8');
      rootDid = trust.didKeyFromPem(rootPem);
    }
  } catch {
    /* no operator key yet — verification will fail closed */
  }
  return {
    rootDid,
    resolvePublicKeyPem: (did) => (did && did === rootDid ? rootPem : null),
  };
}

/**
 * Request elevation. Returns a requestId; grants nothing on its own.
 *
 * @param {object} p
 * @param {string} p.agentId      this agent's id (its role is resolved from the registry)
 * @param {string} p.agentDid     this agent's DID (grant audience)
 * @param {Array}  p.capabilities requested capabilities
 * @param {string} [p.task]
 * @param {string} [p.justification]
 * @param {'tactical'|'operational'|'executive'} [p.tier]
 */
async function requestElevation(p) {
  return broker.submit({
    requesterDid: p.agentDid,
    agentId: p.agentId,
    requested: p.capabilities,
    boundTask: p.task,
    justification: p.justification || '',
    tier: p.tier || 'operational',
  });
}

/**
 * Wait for the operator's decision. Returns the signed grant on approval, or
 * null on denial/timeout — the caller must treat null as "not authorized" and
 * never proceed on it.
 */
async function awaitGrant(requestId, timeoutMs = 300_000) {
  const decision = await broker.awaitDecision(requestId, timeoutMs);
  if (!decision || decision.decision !== 'approved' || !decision.grant) return null;
  return decision.grant;
}

/**
 * Verify a grant this agent holds, against the operator root, before relying on
 * it. An agent should verify rather than trust the shape of what it received.
 */
function verifyHeldGrant(signedGrant, { task } = {}) {
  const { resolvePublicKeyPem } = operatorKeyResolver();
  const { verifyGrant } = require('./tnf-capability-grant.cjs');
  return verifyGrant(signedGrant, { resolvePublicKeyPem, task });
}

/**
 * Spend a grant against a broker action. The secret stays server-side; the
 * agent gets only the scrubbed result.
 */
async function useCredential(actionName, args, signedGrant, { task } = {}) {
  const { resolvePublicKeyPem } = operatorKeyResolver();
  return credBroker.invoke(actionName, args, signedGrant, { resolvePublicKeyPem, task });
}

/** What broker actions this grant may invoke — safe to log/show. */
async function listCredentialActions(signedGrant, { task } = {}) {
  const { resolvePublicKeyPem } = operatorKeyResolver();
  return credBroker.listAllowed(signedGrant, { resolvePublicKeyPem, task });
}

/**
 * Convenience: request → await → run `fn(grant)` if approved. Returns whatever
 * `fn` returns, or a typed failure if elevation was not granted. `fn` is only
 * ever called with a real, operator-approved grant.
 *
 * @returns {Promise<{ok:true, result:any} | {ok:false, reason:string}>}
 */
async function withElevation(p, fn) {
  if (!p.agentDid || !Array.isArray(p.capabilities) || !p.capabilities.length) {
    return { ok: false, reason: 'agentDid and non-empty capabilities are required' };
  }
  const { requestId } = await requestElevation(p);
  const grant = await awaitGrant(requestId, p.timeoutMs || 300_000);
  if (!grant) return { ok: false, reason: 'elevation denied or timed out', requestId };

  const verified = verifyHeldGrant(grant, { task: p.task });
  if (!verified.authorized) {
    return { ok: false, reason: `received grant failed verification: ${verified.reason}` };
  }
  const result = await fn(grant, verified);
  return { ok: true, result };
}

/**
 * Whether this agent is even allowed to request elevation. A worker that holds
 * no director role can request, but the operator will see it resolved as
 * `worker` — this is a convenience for a wrapper to decide whether to bother.
 */
function canRequestElevation(agentId) {
  const resolved = identity.resolveRole(agentId);
  return resolved.ok && identity.canRequestElevation(resolved.role);
}

module.exports = {
  requestElevation,
  awaitGrant,
  verifyHeldGrant,
  useCredential,
  listCredentialActions,
  withElevation,
  canRequestElevation,
  operatorKeyResolver,
};
