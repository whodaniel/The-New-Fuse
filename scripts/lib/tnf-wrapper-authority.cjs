#!/usr/bin/env node

/**
 * Wrapper ↔ authority glue — lets a worker wrapper (gemini/jules/pi/...) gate a
 * task on the authority stack with a ~3-line hook.
 *
 * This is the "wire one consumer" step (docs/protocols/AUTHORITY_INTEGRATION_MAP.md)
 * made adoptable. It is DEFAULT-OFF by construction: with the flag unset,
 * `gateTask` returns `{ allowed: true }` before doing anything, so a wrapper that
 * adopts it has ZERO behaviour change until an operator opts in with
 * `TNF_AUTHORITY_CONSUMER=1`.
 *
 * What it gates: only tasks that EXPLICITLY declare `requiredCapabilities`.
 * Running an LLM prompt does not need a grant; taking a privileged action does.
 * Nothing is inferred — a task states what it needs, or it is not gated. This
 * keeps the wrapper honest: it never invents an authority requirement, and it
 * never proceeds on a privileged task without an operator-approved grant.
 */

'use strict';

const client = require('./tnf-authority-client.cjs');
const identity = require('./tnf-identity.cjs');
const trust = require('./tnf-trust-root.cjs');

function isEnabled() {
  const v = String(process.env.TNF_AUTHORITY_CONSUMER || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

/**
 * A task declares its privileged needs explicitly, in one of a few conventional
 * places. Only well-formed `{ with, can }` entries count; anything else is
 * ignored (a task cannot smuggle a capability through a malformed field).
 */
function extractRequiredCapabilities(msg) {
  // Authority-shaped caps are `{ with, can }`. Broker also uses
  // `requiredCapabilities` as lowercase skill strings for routing — those are
  // ignored here. Prefer explicit payload/metadata, then nested task (broker
  // dispatch puts the queue task under payload.task).
  const candidates = [
    msg?.payload?.requiredCapabilities,
    msg?.metadata?.requiredCapabilities,
    msg?.requiredCapabilities,
    msg?.payload?.task?.requiredCapabilities,
    msg?.payload?.task?.metadata?.requiredCapabilities,
  ];
  let raw = null;
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      raw = c;
      break;
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c.with === 'string' && typeof c.can === 'string')
    .map((c) => ({ with: c.with, can: c.can, ...(c.conditions ? { conditions: c.conditions } : {}) }));
}

/** The agent's own DID, derived from its Ed25519 public key. Provisions the
 *  keypair if absent (same as registration bootstrap). */
function agentDidFor(agentId) {
  const kp = identity.ensureAgentKeypair(agentId);
  return trust.didKeyFromPem(kp.publicKeyPem);
}

function taskSummary(msg) {
  const s = String(msg?.content || msg?.payload?.message || '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 200);
}

/**
 * Gate a task.
 *
 * @returns {Promise<{allowed:boolean, gated:boolean, grant?:object, reason?:string}>}
 *   - flag off, or no declared capabilities → { allowed:true, gated:false }
 *   - declared capabilities, elevation approved → { allowed:true, gated:true, grant }
 *   - declared capabilities, denied/timeout    → { allowed:false, gated:true, reason }
 *
 * A wrapper does exactly: if (!gate.allowed) { refuse; return; }
 */
async function gateTask(msg, { agentId, timeoutMs } = {}) {
  if (!isEnabled()) return { allowed: true, gated: false };

  const required = extractRequiredCapabilities(msg);
  if (required.length === 0) return { allowed: true, gated: false };

  if (!agentId) {
    return { allowed: false, gated: true, reason: 'authority consumer enabled but agent has no id' };
  }

  let agentDid;
  try {
    agentDid = agentDidFor(agentId);
  } catch (err) {
    return { allowed: false, gated: true, reason: `cannot derive agent identity: ${err.message}` };
  }

  const outcome = await client.withElevation(
    {
      agentId,
      agentDid,
      capabilities: required,
      task: msg?.id,
      justification: taskSummary(msg),
      timeoutMs: timeoutMs ?? Number(process.env.TNF_AUTHORITY_TIMEOUT_MS || 300000),
    },
    // fn only runs with a verified, operator-approved grant — return it to the
    // wrapper so the task can spend it (e.g. via the credential broker).
    async (grant) => grant
  );

  if (!outcome.ok) return { allowed: false, gated: true, reason: outcome.reason };
  return { allowed: true, gated: true, grant: outcome.result };
}

module.exports = { gateTask, isEnabled, extractRequiredCapabilities, agentDidFor };
