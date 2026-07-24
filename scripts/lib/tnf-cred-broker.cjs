#!/usr/bin/env node

/**
 * TNF Credential Broker — agents act on secrets without ever holding them.
 *
 * Implements `CredentialBroker` from @the-new-fuse/control-plane-contracts.
 *
 * THE CORE IDEA
 * -------------
 * An agent asks the broker to perform a NAMED, pre-declared action. The broker
 * pulls the secret from the OS keystore, runs the action with the secret
 * injected out of band, scrubs the output, and returns only the result. The
 * agent gets an answer, never a credential — so it cannot leak, log, or
 * exfiltrate one, because it never had one.
 *
 * FOUR GATES, IN ORDER, ALL FAILING CLOSED
 * ----------------------------------------
 *   1. The action must exist in the operator-declared registry. Agents invoke
 *      from a fixed reviewable list, never an arbitrary command.
 *   2. The caller's capability grant must be valid AND hold `account:<action>`.
 *      Verified through the same Phase 2 machinery as everything else.
 *   3. Phase 4a: mutating actions are refused. Only read-only actions run until
 *      per-action operator confirmation is wired and the root is a real
 *      boundary.
 *   4. TRUST-ROOT GATE. This is the honest part. A capability grant is only as
 *      trustworthy as the root that signed it. Under a `file` root — which any
 *      same-uid agent can read and therefore forge grants against — the broker
 *      runs read-only actions but REFUSES anything carrying real-world side
 *      effects or elevated secret classes, and says why. The broker does not
 *      pretend a weak root is a strong one; it changes its own behaviour.
 *
 * The broker never invents an action, never widens a grant, and never returns a
 * secret. If it cannot do something safely it refuses and audits the refusal.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const grants = require('./tnf-capability-grant.cjs');
const trust = require('./tnf-trust-root.cjs');

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');
const ACTIONS_PATH =
  process.env.TNF_BROKER_ACTIONS_PATH || path.join(AUTHORITY_DIR, 'broker-actions.json');
const AUDIT_PATH =
  process.env.TNF_BROKER_AUDIT_PATH || path.join(AUTHORITY_DIR, 'broker.jsonl');

/**
 * How each OS exposes a read-only secret fetch. The broker only ever READS a
 * secret to inject it; it never writes to the keystore.
 */
const KEYSTORE = {
  darwin: (ref) => ['security', ['find-generic-password', '-s', ref.service, ...(ref.account ? ['-a', ref.account] : []), '-w']],
  linux: (ref) => ['secret-tool', ['lookup', 'service', ref.service, ...(ref.account ? ['account', ref.account] : [])]],
};

function audit(event) {
  const record = { ts: new Date().toISOString(), ...event };
  try {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true, mode: 0o700 });
    fs.appendFileSync(AUDIT_PATH, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  } catch (err) {
    console.error(`[tnf-cred-broker] audit write failed: ${err.message}`);
  }
}

// ============================================================================
// ACTION REGISTRY (operator-owned)
// ============================================================================

/**
 * @returns {Array} declared actions. Missing file → no actions, which is the
 * correct default: a broker with no declared actions can do nothing.
 */
function loadActions() {
  if (!fs.existsSync(ACTIONS_PATH)) return [];
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(ACTIONS_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`[tnf-cred-broker] broker-actions.json is not valid JSON: ${err.message}`);
  }
  const actions = Array.isArray(parsed) ? parsed : parsed?.actions;
  if (!Array.isArray(actions)) return [];
  return actions.filter((a) => a && typeof a.name === 'string' && a.secretRef);
}

function findAction(name) {
  return loadActions().find((a) => a.name === name) || null;
}

// ============================================================================
// TRUST-ROOT POLICY
// ============================================================================

/**
 * What may run under the current root.
 *
 * The point of the broker is to guard real accounts, so it must be MORE
 * conservative than the rest of the stack when the root is weak, not equally
 * trusting. A degraded root can read (low-stakes) but cannot mutate and cannot
 * touch a secret marked `sensitive`.
 */
function rootPolicy(selection, action) {
  if (!selection.degraded) return { allow: true };

  if (!action.readOnly) {
    return {
      allow: false,
      refusal: 'trust-root-too-weak',
      reason:
        `trust root is "${selection.descriptor.kind}" (not a boundary); mutating action ` +
        `"${action.name}" refused. Create the agent account so grants are kernel-anchored.`,
    };
  }
  if (action.secretRef?.sensitive) {
    return {
      allow: false,
      refusal: 'trust-root-too-weak',
      reason:
        `trust root is "${selection.descriptor.kind}" (not a boundary); action "${action.name}" ` +
        `touches a secret marked sensitive and is refused until the root is enforced.`,
    };
  }
  return { allow: true, degradedNote: true };
}

// ============================================================================
// OUTPUT SCRUBBING
// ============================================================================

/**
 * Last line of defence: even a read-only action could echo its secret back
 * (e.g. an API that returns the token it was called with). Redact any exact
 * occurrence of the secret before the result leaves the broker.
 */
function scrub(output, secret) {
  if (!secret || typeof output !== 'string') return output;
  return output.split(secret).join('«redacted-secret»');
}

// ============================================================================
// INVOKE
// ============================================================================

/**
 * @param {string} actionName
 * @param {object} args
 * @param {object} signedGrant  from tnf-capability-grant.issueGrant
 * @param {object} [opts]
 * @param {(did:string)=>string|null} opts.resolvePublicKeyPem  required to verify the grant
 * @param {string} [opts.task]
 * @returns {Promise<object>} BrokerResult — never contains a secret
 */
async function invoke(actionName, args, signedGrant, opts = {}) {
  const { resolvePublicKeyPem, task } = opts;

  const refuse = (refusal, reason, extra = {}) => {
    audit({ event: 'broker_refused', action: actionName, refusal, reason, ...extra });
    return { ok: false, action: actionName, refusal, reason };
  };

  // Gate 1 — action must be declared.
  const action = findAction(actionName);
  if (!action) {
    return refuse('unknown-action', `no declared broker action "${actionName}"`);
  }

  // Gate 2 — grant must be valid and hold account:<action>.
  if (typeof resolvePublicKeyPem !== 'function') {
    return refuse('grant-invalid', 'no key resolver supplied to verify the grant');
  }
  const verified = grants.verifyGrant(signedGrant, { resolvePublicKeyPem, task, consume: false });
  if (!verified.authorized) {
    return refuse('grant-invalid', `capability grant is not valid: ${verified.reason}`, {
      verdict: verified.verdict,
    });
  }
  const cap = action.requiredCapability || `account:${action.name}`;
  const [, capAction] = cap.split(':');
  if (!grants.grantAuthorizes(verified, `account:${action.name}`, capAction || action.name)) {
    return refuse('capability-missing', `grant does not hold ${cap}`);
  }

  // Gate 3 & 4 — phase 4a and trust-root policy.
  const selection = await trust.selectTrustRoot();
  if (!action.readOnly) {
    // Even before the root check, mutating actions are off in phase 4a.
    return refuse(
      'mutating-action-disabled',
      `"${action.name}" is mutating; phase 4a runs read-only actions only`
    );
  }
  const policy = rootPolicy(selection, action);
  if (!policy.allow) {
    return refuse(policy.refusal, policy.reason, { rootKind: selection.descriptor.kind });
  }

  // Fetch the secret. It exists only in this function's scope and is never
  // returned, logged, or put in an error.
  let secret;
  try {
    secret = fetchSecret(action.secretRef);
  } catch (err) {
    return refuse('secret-unavailable', `could not read secret for "${action.name}": ${err.message}`);
  }

  // Run the action with the secret injected out of band (env), never as an arg
  // the agent chose. The command template is operator-declared.
  let output;
  try {
    output = runAction(action, args, secret);
  } catch (err) {
    // Scrub even the error path — a failing curl can echo its auth header.
    return refuse('secret-unavailable', scrub(`action failed: ${err.message}`, secret));
  }

  const scrubbed = scrub(output, secret);
  audit({
    event: 'broker_invoked',
    action: actionName,
    readOnly: action.readOnly,
    rootKind: selection.descriptor.kind,
    rootDegraded: selection.degraded,
    grantChain: verified.chain,
    outputBytes: scrubbed.length,
  });

  return {
    ok: true,
    action: actionName,
    output: scrubbed,
    rootKind: selection.descriptor.kind,
    ...(policy.degradedNote
      ? { reason: `ran under degraded root "${selection.descriptor.kind}" — read-only only` }
      : {}),
  };
}

function fetchSecret(ref) {
  const builder = KEYSTORE[process.platform];
  if (!builder) throw new Error(`no keystore integration for ${process.platform}`);
  // A file-backed override exists for testing and headless CI, gated behind an
  // explicit env var so it is never on by accident.
  if (process.env.TNF_BROKER_SECRET_FILE) {
    const p = path.join(process.env.TNF_BROKER_SECRET_FILE, `${ref.service}${ref.account ? `.${ref.account}` : ''}`);
    if (!fs.existsSync(p)) throw new Error('secret not present in override store');
    return fs.readFileSync(p, 'utf8').trim();
  }
  const [bin, argv] = builder(ref);
  return execFileSync(bin, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/**
 * Execute a declared action. The command and its fixed args come from the
 * operator's registry; agent-supplied `args` fill only named placeholders the
 * action allows, and the secret is injected as $TNF_BROKER_SECRET in the env.
 */
function runAction(action, args, secret) {
  if (!action.command || !Array.isArray(action.command.argv)) {
    throw new Error(`action "${action.name}" has no command.argv`);
  }
  const allowed = new Set(action.command.allowedArgs || []);
  const argv = action.command.argv.map((token) => {
    const m = /^\{\{(\w+)\}\}$/.exec(token);
    if (!m) return token;
    const key = m[1];
    if (!allowed.has(key)) throw new Error(`action does not permit arg "${key}"`);
    const v = args?.[key];
    if (v === undefined) throw new Error(`missing required arg "${key}"`);
    return String(v);
  });
  return execFileSync(argv[0], argv.slice(1), {
    encoding: 'utf8',
    timeout: action.command.timeoutMs || 15000,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, TNF_BROKER_SECRET: secret },
  });
}

// ============================================================================
// LIST (safe to expose to an agent)
// ============================================================================

/**
 * Actions the grant may invoke. Reveals names and descriptions only — never
 * secretRefs or command templates.
 */
async function listAllowed(signedGrant, opts = {}) {
  const { resolvePublicKeyPem, task } = opts;
  if (typeof resolvePublicKeyPem !== 'function') return [];
  const verified = grants.verifyGrant(signedGrant, { resolvePublicKeyPem, task, consume: false });
  if (!verified.authorized) return [];
  const selection = await trust.selectTrustRoot();
  return loadActions()
    .filter((a) => grantHoldsAction(verified, a))
    .filter((a) => rootPolicy(selection, a).allow)
    .map((a) => ({
      name: a.name,
      readOnly: Boolean(a.readOnly),
      requiredCapability: a.requiredCapability || `account:${a.name}`,
      description: a.description || null,
    }));
}

function grantHoldsAction(verified, action) {
  const cap = action.requiredCapability || `account:${action.name}`;
  const [, capAction] = cap.split(':');
  return grants.grantAuthorizes(verified, `account:${action.name}`, capAction || action.name);
}

module.exports = {
  invoke,
  listAllowed,
  loadActions,
  findAction,
  scrub,
  rootPolicy,
  ACTIONS_PATH,
  AUDIT_PATH,
};
