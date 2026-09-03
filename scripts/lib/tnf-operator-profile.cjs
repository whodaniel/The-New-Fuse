#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Operator profile — entitlements and preferences bound to the operator's
 * identity, not to remembered environment variables.
 *
 * WHY THIS EXISTS
 *   Operator-only capabilities were reached by typing an env var
 *   (TNF_OPERATOR_CATALOG=1, TNF_AUTHORITY_EDIT_CONFIRM=1) at the moment of
 *   use. That has two problems. The operator has to remember them, on every
 *   machine, forever. And an env var carries no identity: anything that can set
 *   it gets the capability, so "operator-only" meant "whoever exported the
 *   variable".
 *
 *   The profile moves the decision to where authority already lives:
 *   ~/.tnf/authority/, mode 0600, the same operator-owned directory as
 *   roles.json and the Ed25519 keys. Custody of that directory IS the login —
 *   which is the trust model scripts/lib/AUTHORITY_README.md already states
 *   ("security rests on key custody, not on secrecy of code").
 *
 * WHAT IT IS NOT
 *   Not a credential store. It grants nothing by itself; it records what this
 *   operator has decided this machine may do, and `apply` materialises that into
 *   the settings the runtime already reads. The runtime contract stays
 *   env-based, so a deployed multi-user service (Cloud Run, no operator home
 *   directory) is unaffected and defaults to withholding.
 *
 * AGENTS CANNOT USE THIS
 *   Every read path refuses when TNF_AGENT_ID is set, mirroring
 *   tnf-identity.cjs's refusal to write roles.json from agent context. An agent
 *   that could resolve the operator profile could grant itself the operator's
 *   entitlements, which is the whole thing this prevents.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const AUTHORITY_DIR = path.join(os.homedir(), '.tnf', 'authority');
const PROFILE_PATH = process.env.TNF_OPERATOR_PROFILE || path.join(AUTHORITY_DIR, 'operator-profile.json');

/** Capabilities a profile may grant. Unknown names are ignored, never honoured. */
const KNOWN_ENTITLEMENTS = Object.freeze([
  // Serve providers marked entitlement:"operator-dev-only" in
  // data/providers/catalog.json (currently NVIDIA NIM, which comes from the
  // operator's personal NVIDIA Developer Program membership).
  'operator-catalog',
  // Allow agents to commit changes to authority surfaces on this machine.
  'agent-authority-edits',
]);

function inAgentContext() {
  return Boolean((process.env.TNF_AGENT_ID || '').trim());
}

/**
 * Read the profile.
 *
 * Fails closed in every ambiguous case: agent context, missing file, bad JSON,
 * wrong owner, or group/world-readable mode all yield "no entitlements". A
 * loader that guesses on ambiguity can be argued into guessing "allow".
 */
function loadProfile() {
  if (inAgentContext()) {
    return { ok: false, reason: `refused: TNF_AGENT_ID=${process.env.TNF_AGENT_ID} (agent context)`, entitlements: [], settings: {} };
  }
  let st;
  try {
    st = fs.statSync(PROFILE_PATH);
  } catch {
    return { ok: false, reason: 'no operator profile on this machine', entitlements: [], settings: {}, path: PROFILE_PATH };
  }
  // Custody check: the profile must belong to the user reading it, and must not
  // be readable by anyone else. A profile someone else can write is not a
  // statement about this operator.
  if (typeof st.uid === 'number' && st.uid !== process.getuid?.()) {
    return { ok: false, reason: `profile owned by uid ${st.uid}, not ${process.getuid?.()}`, entitlements: [], settings: {}, path: PROFILE_PATH };
  }
  if ((st.mode & 0o077) !== 0) {
    return {
      ok: false,
      reason: `profile mode ${(st.mode & 0o777).toString(8)} is group/world accessible; expected 600`,
      entitlements: [],
      settings: {},
      path: PROFILE_PATH,
    };
  }

  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
  } catch (err) {
    return { ok: false, reason: `profile is not valid JSON: ${err.message}`, entitlements: [], settings: {}, path: PROFILE_PATH };
  }

  const granted = Array.isArray(cfg.entitlements) ? cfg.entitlements : [];
  const entitlements = granted.filter((e) => KNOWN_ENTITLEMENTS.includes(e));
  const unknown = granted.filter((e) => !KNOWN_ENTITLEMENTS.includes(e));

  return {
    ok: true,
    reason: 'ok',
    path: PROFILE_PATH,
    operator: cfg.operator || null,
    entitlements,
    unknown,
    settings: cfg.settings && typeof cfg.settings === 'object' ? cfg.settings : {},
  };
}

function has(entitlement) {
  return loadProfile().entitlements.includes(entitlement);
}

/**
 * Environment the profile implies. This is the bridge: the profile is the
 * operator-facing source of truth, and these are the variables the runtime
 * already reads, so nothing downstream needs to learn about profiles.
 */
function deriveEnv(profile = loadProfile()) {
  const env = {};
  if (!profile.ok) return env;
  if (profile.entitlements.includes('operator-catalog')) {
    env.TNF_OPERATOR_CATALOG = '1';
  }
  for (const [k, v] of Object.entries(profile.settings)) {
    if (/^[A-Z][A-Z0-9_]*$/.test(k) && (typeof v === 'string' || typeof v === 'number')) {
      env[k] = String(v);
    }
  }
  return env;
}

module.exports = {
  PROFILE_PATH,
  KNOWN_ENTITLEMENTS,
  loadProfile,
  has,
  deriveEnv,
  inAgentContext,
};

if (require.main === module) {
  const p = loadProfile();
  if (!p.ok) {
    console.log(`[operator-profile] not active — ${p.reason}`);
    console.log(`[operator-profile] expected at ${p.path || PROFILE_PATH}`);
    process.exit(0);
  }
  console.log(`[operator-profile] ${p.path}`);
  if (p.operator) console.log(`  operator      : ${p.operator}`);
  console.log(`  entitlements  : ${p.entitlements.join(', ') || '(none)'}`);
  if (p.unknown.length) console.log(`  ignored       : ${p.unknown.join(', ')} (not in KNOWN_ENTITLEMENTS)`);
  const env = deriveEnv(p);
  const keys = Object.keys(env);
  console.log(`  derived env   : ${keys.length ? keys.join(', ') : '(none)'}`);
}
