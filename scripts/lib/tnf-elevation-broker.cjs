#!/usr/bin/env node

/**
 * TNF Elevation Broker — the operator approval channel.
 *
 * Implements `ElevationBroker` from @the-new-fuse/control-plane-contracts for
 * the OPEN runtime (local operator + local trust root). The proprietary control
 * plane implements the same contract for hosted deployments.
 *
 * THE ONE PROPERTY THAT MATTERS
 * -----------------------------
 * The requesting agent must not be able to reach `decide()`. An agent that can
 * approve its own request is self-certifying, which is precisely the 2026-07-21
 * incident recorded in CHALLENGE_RATIONALE_LOG.md: an agent cited a "completed
 * operator handshake" that had never happened, then killed processes and
 * committed 78 files.
 *
 * So `decide()` refuses when it detects agent context. Those checks are listed
 * honestly below, because their strength depends entirely on the trust root:
 *
 *   - Under `separate-uid` or better, the boundary is the KERNEL: an agent
 *     cannot read the operator key, so it cannot forge an approval even if it
 *     bypasses every check in this file.
 *   - Under `file`, these checks are speed bumps. A same-uid agent can unset an
 *     env var and read the key directly. This module says so out loud rather
 *     than implying a protection it does not have.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const grants = require('./tnf-capability-grant.cjs');
const trust = require('./tnf-trust-root.cjs');
const identity = require('./tnf-identity.cjs');

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');
const PENDING_DIR = process.env.TNF_PENDING_DIR || path.join(AUTHORITY_DIR, 'pending');
const DECIDED_DIR = process.env.TNF_DECIDED_DIR || path.join(AUTHORITY_DIR, 'decided');
const AUDIT_PATH =
  process.env.TNF_ELEVATION_AUDIT_PATH || path.join(AUTHORITY_DIR, 'elevation.jsonl');

/** Risk tiers, per DIRECTIVES.md D8. `executive` needs a second signature. */
const TIERS = new Set(['tactical', 'operational', 'executive']);

function ensureDirs() {
  for (const d of [AUTHORITY_DIR, PENDING_DIR, DECIDED_DIR]) {
    fs.mkdirSync(d, { recursive: true, mode: 0o700 });
  }
}

function audit(event) {
  ensureDirs();
  const record = { ts: new Date().toISOString(), ...event };
  try {
    fs.appendFileSync(AUDIT_PATH, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  } catch (err) {
    console.error(`[tnf-elevation] audit write failed: ${err.message}`);
  }
}

// ============================================================================
// AGENT-CONTEXT DETECTION
// ============================================================================

/**
 * Is this process plausibly an agent rather than a human operator?
 *
 * Returns every reason found, so refusals can explain themselves. This is
 * defence-in-depth and is documented as such — see the module header for what
 * actually enforces the boundary.
 */
function detectAgentContext(opts = {}) {
  const reasons = [];

  for (const v of ['TNF_AGENT_ID', 'AGENT_ID', 'TNF_AGENT_USER_ACTIVE']) {
    if (process.env[v]) reasons.push(`${v} is set (${process.env[v]})`);
  }
  if (process.env.CI) reasons.push('CI is set');

  // A human approving sits at a terminal. Automation generally does not.
  if (!opts.skipTtyCheck && !process.stdin.isTTY) {
    reasons.push('stdin is not a TTY (no interactive operator present)');
  }

  // Running AS the agent account is decisive.
  const agentUser = process.env.TNF_AGENT_USER || 'tnf-agent';
  try {
    const { execFileSync } = require('node:child_process');
    const uid = execFileSync('id', ['-u', agentUser], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (typeof process.getuid === 'function' && Number.parseInt(uid, 10) === process.getuid()) {
      reasons.push(`running as the agent account "${agentUser}"`);
    }
  } catch {
    /* account does not exist — nothing to compare */
  }

  return { isAgent: reasons.length > 0, reasons };
}

// ============================================================================
// SUBMIT (agent-callable)
// ============================================================================

/**
 * Record an elevation request. Deliberately unprivileged — agents are meant to
 * call this. Nothing here grants anything.
 */
async function submit(request) {
  ensureDirs();

  const requesterDid = String(request?.requesterDid || '').trim();
  if (!requesterDid.startsWith('did:')) {
    throw new Error('[tnf-elevation] requesterDid must be a DID');
  }
  if (!Array.isArray(request?.requested) || request.requested.length === 0) {
    throw new Error('[tnf-elevation] a request must name at least one capability');
  }
  const tier = TIERS.has(request?.tier) ? request.tier : 'operational';

  // The requester's role comes from the operator-owned registry, never from
  // the request body — an agent does not get to state its own rank.
  const claimedRole = request?.requesterRole ?? null;
  const resolved = request?.agentId ? identity.resolveRole(request.agentId) : null;
  const requesterRole = resolved && resolved.ok ? resolved.role : 'worker';

  const record = {
    requestId: `req_${crypto.randomBytes(6).toString('hex')}`,
    requesterDid,
    agentId: request?.agentId ?? null,
    requesterRole,
    claimedRole,
    roleFromRegistry: Boolean(resolved && resolved.source === 'registry'),
    requested: request.requested,
    boundTask: request?.boundTask ?? null,
    // Untrusted free text. Displayed to the operator; never parsed for meaning.
    justification: String(request?.justification || '').slice(0, 2000),
    requestedAt: new Date().toISOString(),
    tier,
    status: 'pending',
  };

  fs.writeFileSync(
    path.join(PENDING_DIR, `${record.requestId}.json`),
    `${JSON.stringify(record, null, 2)}\n`,
    { mode: 0o600 }
  );

  audit({
    event: 'elevation_requested',
    requestId: record.requestId,
    requesterDid,
    requesterRole,
    claimedRole,
    roleMismatch: claimedRole !== null && claimedRole !== requesterRole,
    requested: record.requested,
    tier,
  });

  return { requestId: record.requestId };
}

function normalizeRecord(raw, fallbackId = null) {
  if (!raw || typeof raw !== 'object') return null;
  const requestId = raw.requestId || raw.id || fallbackId;
  let requested = raw.requested;
  if (!Array.isArray(requested) && Array.isArray(raw.capabilities)) {
    requested = [];
    for (const cap of raw.capabilities) {
      const actions = Array.isArray(cap.can) ? cap.can : [cap.can];
      const resource = typeof cap.with === 'object' && cap.with !== null ? cap.with.resource : cap.with;
      const conditions = typeof cap.with === 'object' && cap.with !== null ? { ...cap.with } : undefined;
      if (conditions) delete conditions.resource;
      for (const action of actions) {
        requested.push({
          can: action,
          with: resource,
          ...(conditions && Object.keys(conditions).length ? { conditions } : {})
        });
      }
    }
  }
  const requesterDid = raw.requesterDid || (typeof raw.requester === 'string' && raw.requester.startsWith('did:') ? raw.requester : 'did:tnf:local:agent:tnfcli:daniels_macbook_pro:001');
  const requesterRole = raw.requesterRole || 'sub-director';
  const tier = raw.tier || 'operational';
  return {
    ...raw,
    requestId,
    requested,
    requesterDid,
    requesterRole,
    tier,
  };
}

function pending() {
  ensureDirs();
  return fs
    .readdirSync(PENDING_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return normalizeRecord(JSON.parse(fs.readFileSync(path.join(PENDING_DIR, f), 'utf8')), f.replace(/\.json$/, ''));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
}

function getRequest(requestId) {
  const p = path.join(PENDING_DIR, `${requestId}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return normalizeRecord(JSON.parse(fs.readFileSync(p, 'utf8')), requestId);
  } catch {
    return null;
  }
}


// ============================================================================
// DECIDE (operator-only)
// ============================================================================

/**
 * Approve or deny. Refuses in agent context.
 *
 * @param {string} requestId
 * @param {object} opts
 * @param {'approved'|'denied'} opts.decision
 * @param {Array}  [opts.capabilities]  may grant LESS than requested, never more
 * @param {number} [opts.ttlSeconds]
 * @param {boolean} [opts.skipTtyCheck] for tests only; never set in production
 */
async function decide(requestId, opts) {
  ensureDirs();
  const { decision, capabilities, ttlSeconds, reason, skipTtyCheck = false } = opts || {};

  if (decision !== 'approved' && decision !== 'denied') {
    throw new Error('[tnf-elevation] decision must be "approved" or "denied"');
  }

  const ctx = detectAgentContext({ skipTtyCheck });
  if (ctx.isAgent) {
    audit({
      event: 'elevation_decide_refused',
      requestId,
      reasons: ctx.reasons,
      note: 'agent context detected',
    });
    throw new Error(
      '[tnf-elevation] refusing to decide from agent context: ' +
        `${ctx.reasons.join('; ')}. Approvals must come from an operator shell.`
    );
  }

  const request = getRequest(requestId);
  if (!request) throw new Error(`[tnf-elevation] no pending request ${requestId}`);

  const selection = await trust.selectTrustRoot();

  if (decision === 'denied') {
    const record = {
      requestId,
      decision: 'denied',
      decidedAt: new Date().toISOString(),
      rootKind: selection.descriptor.kind,
      reason: reason || null,
    };
    finalize(requestId, record);
    audit({ event: 'elevation_denied', requestId, rootKind: record.rootKind, reason: record.reason });
    return record;
  }

  // Approval may narrow what was asked for, never widen it.
  const granting = Array.isArray(capabilities) && capabilities.length ? capabilities : request.requested;
  const widened = granting.filter(
    (g) => !request.requested.some((r) => grants.covers(r, g))
  );
  if (widened.length) {
    throw new Error(
      `[tnf-elevation] approval would grant more than was requested: ${JSON.stringify(widened)}`
    );
  }

  const signed = await grants.issueGrant({
    trustRoot: selection.provider,
    audience: request.requesterDid,
    capabilities: granting,
    boundTask: request.boundTask || undefined,
    ttlSeconds,
    purpose: `elevation ${requestId} for ${request.requesterRole}`,
  });

  const record = {
    requestId,
    decision: 'approved',
    decidedAt: new Date().toISOString(),
    rootKind: selection.descriptor.kind,
    // Recorded so a weak root is visible in the audit trail forever, not just
    // at the moment of approval.
    rootDegraded: selection.degraded,
    grant: signed,
    reason: reason || null,
  };
  finalize(requestId, record);

  audit({
    event: 'elevation_approved',
    requestId,
    requesterDid: request.requesterDid,
    granted: granting,
    narrowed: granting.length !== request.requested.length,
    rootKind: record.rootKind,
    rootDegraded: selection.degraded,
    exp: signed.grant.exp,
  });

  return record;
}

function finalize(requestId, record) {
  fs.writeFileSync(
    path.join(DECIDED_DIR, `${requestId}.json`),
    `${JSON.stringify(record, null, 2)}\n`,
    { mode: 0o600 }
  );
  const p = path.join(PENDING_DIR, `${requestId}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/** Poll for a decision. Returns null on timeout — never assumes approval. */
async function awaitDecision(requestId, timeoutMs = 300_000, pollMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  const decidedPath = path.join(DECIDED_DIR, `${requestId}.json`);
  while (Date.now() < deadline) {
    if (fs.existsSync(decidedPath)) {
      try {
        return JSON.parse(fs.readFileSync(decidedPath, 'utf8'));
      } catch {
        return null;
      }
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  audit({ event: 'elevation_timeout', requestId, timeoutMs });
  return null;
}

module.exports = {
  submit,
  pending,
  decide,
  getRequest,
  awaitDecision,
  detectAgentContext,
  PENDING_DIR,
  DECIDED_DIR,
  AUDIT_PATH,
};
