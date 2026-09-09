#!/usr/bin/env node

/**
 * TNF Identity + Operator-Owned Role Registry (Phase 1)
 *
 * Federation IDs and wire-claimed roles are not credentials. After Phase 0
 * (`tnf-message-auth.cjs`) verifies an envelope's `header.agent_id`, this
 * module is the only sanctioned way to learn that agent's role:
 *
 *   resolveRole(verifiedKeyId) -> { ok, role, source, ... }
 *
 * Roles live in `~/.tnf/authority/roles.json` (mode 0600), written only by
 * the operator. Agents must never write this file. Holding `sub-director` or
 * `super-director` conveys the right to *request* elevation (Phase 2+); it
 * never conveys standing elevated access.
 *
 * Per-agent HMAC keys live at `~/.tnf/authority/keys/<agent-id>` (mode 0600).
 * Phase 0 still verifies with the shared A2A_SECRET_KEY during rollout; this
 * module provisions and loads per-agent keys so Phase 2+ can bind grants to a
 * real identity rather than a shared bus secret.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let contracts;
try {
  contracts = require('@the-new-fuse/control-plane-contracts');
} catch {
  contracts = require(path.resolve(__dirname, '../../packages/control-plane-contracts'));
}

const {
  VALID_ROLES,
  RESIDENCIES,
  ROLE_RANK,
  MAX_CHAIN_DEPTH,
  isValidRole,
  buildAgentDid,
  parseAgentDid,
  didToCanonicalEntityId,
  residencyOf,
  canonicalGrantMaterial,
  signGrant,
  verifyGrant,
  attenuationHolds,
  verifyGrantChain,
  crossResidencyGrants,
  normalizeDidSegment,
} = contracts;

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');
const ROLES_PATH = process.env.TNF_ROLES_PATH || path.join(AUTHORITY_DIR, 'roles.json');
const KEYS_DIR = process.env.TNF_KEYS_DIR || path.join(AUTHORITY_DIR, 'keys');

/** Roles an agent may self-assert on first registration when the registry
 *  has no entry yet. Anything above worker must be operator-granted. */
const SELF_REGISTERABLE = new Set(['worker']);

function authorityDir() {
  return AUTHORITY_DIR;
}

function rolesPath() {
  return ROLES_PATH;
}

function keysDir() {
  return KEYS_DIR;
}

function ensureAuthorityLayout() {
  fs.mkdirSync(AUTHORITY_DIR, { recursive: true, mode: 0o700 });
  fs.mkdirSync(KEYS_DIR, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(AUTHORITY_DIR, 0o700);
  } catch {
    /* best-effort on platforms without chmod semantics */
  }
  try {
    fs.chmodSync(KEYS_DIR, 0o700);
  } catch {
    /* best-effort */
  }
}

function normalizeAgentId(agentId) {
  if (typeof agentId !== 'string') return null;
  const id = agentId.trim();
  if (!id || id.length > 255) return null;
  // Reject path traversal / separator abuse for key filenames.
  if (id.includes('/') || id.includes('\\') || id.includes('..') || id.includes('\0')) {
    return null;
  }
  return id;
}

/**
 * Load the operator-owned role registry.
 * Missing file → empty registry (every unknown agent is worker).
 *
 * @returns {{ version: number, updated_at: string|null, agents: Record<string, object> }}
 */
function loadRoleRegistry() {
  ensureAuthorityLayout();
  if (!fs.existsSync(ROLES_PATH)) {
    return { version: 1, updated_at: null, agents: {} };
  }
  let raw;
  try {
    raw = fs.readFileSync(ROLES_PATH, 'utf8');
  } catch (err) {
    throw new Error(`[tnf-identity] cannot read roles registry: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[tnf-identity] roles registry is not valid JSON: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('[tnf-identity] roles registry must be a JSON object');
  }
  const agents = parsed.agents && typeof parsed.agents === 'object' ? parsed.agents : {};
  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : null,
    agents,
  };
}

/**
 * Persist the role registry. Operator-facing only — refuses when TNF_AGENT_ID
 * is set so an agent process cannot rewrite its own role.
 */
function saveRoleRegistry(registry, { allowAgentProcess = false } = {}) {
  if (!allowAgentProcess && process.env.TNF_AGENT_ID) {
    throw new Error(
      '[tnf-identity] refusing to write roles.json: TNF_AGENT_ID is set. ' +
        'Role grants are operator-owned; run this from an operator shell.'
    );
  }
  ensureAuthorityLayout();
  const payload = {
    version: 1,
    updated_at: new Date().toISOString(),
    agents: registry.agents && typeof registry.agents === 'object' ? registry.agents : {},
  };
  const tmp = `${ROLES_PATH}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, ROLES_PATH);
  try {
    fs.chmodSync(ROLES_PATH, 0o600);
  } catch {
    /* best-effort */
  }
  return payload;
}

/**
 * Operator grant/revoke. Unknown roles throw. Revoke by passing role=null.
 */
function setAgentRole(agentId, role, { note } = {}) {
  const id = normalizeAgentId(agentId);
  if (!id) {
    throw new Error('[tnf-identity] invalid agent id');
  }
  const registry = loadRoleRegistry();
  if (role === null || role === undefined) {
    delete registry.agents[id];
  } else {
    if (!isValidRole(role)) {
      throw new Error(
        `[tnf-identity] invalid role ${JSON.stringify(role)}; allowed: ${VALID_ROLES.join(', ')}`
      );
    }
    registry.agents[id] = {
      role,
      granted_at: new Date().toISOString(),
      granted_by: 'operator',
      ...(typeof note === 'string' && note.trim() ? { note: note.trim() } : {}),
    };
  }
  return saveRoleRegistry(registry);
}

/**
 * The only sanctioned role lookup.
 *
 * @param {string} verifiedKeyId  agent_id from a *verified* envelope header
 * @returns {{
 *   ok: boolean,
 *   role: 'worker'|'sub-director'|'super-director',
 *   source: 'registry'|'default',
 *   agentId: string|null,
 *   entry: object|null,
 *   reason?: string
 * }}
 */
function resolveRole(verifiedKeyId) {
  const id = normalizeAgentId(verifiedKeyId);
  if (!id) {
    return {
      ok: false,
      role: 'worker',
      source: 'default',
      agentId: null,
      entry: null,
      reason: 'missing or invalid verified key id',
    };
  }

  let registry;
  try {
    registry = loadRoleRegistry();
  } catch (err) {
    return {
      ok: false,
      role: 'worker',
      source: 'default',
      agentId: id,
      entry: null,
      reason: err.message,
    };
  }

  const entry = registry.agents[id];
  if (!entry || typeof entry !== 'object') {
    return {
      ok: true,
      role: 'worker',
      source: 'default',
      agentId: id,
      entry: null,
    };
  }

  const role = entry.role;
  if (!isValidRole(role)) {
    return {
      ok: false,
      role: 'worker',
      source: 'default',
      agentId: id,
      entry,
      reason: `registry entry has invalid role ${JSON.stringify(role)}`,
    };
  }

  return {
    ok: true,
    role,
    source: 'registry',
    agentId: id,
    entry,
  };
}

/**
 * Resolve role for a verified inbound message. Wire-claimed roles are
 * recorded as claims only — never returned as the authoritative role.
 */
function resolveRoleForMessage({ verified, agentId, claimedRole } = {}) {
  const claimed =
    typeof claimedRole === 'string' && claimedRole.trim() ? claimedRole.trim() : null;

  if (!verified || !agentId) {
    return {
      ok: false,
      role: 'worker',
      source: 'unverified',
      agentId: normalizeAgentId(agentId),
      claimedRole: claimed,
      roleVerified: false,
      reason: 'identity not verified; role forced to worker',
    };
  }

  const resolved = resolveRole(agentId);
  return {
    ...resolved,
    claimedRole: claimed,
    roleVerified: resolved.ok && resolved.source === 'registry',
    claimMismatch:
      claimed !== null && isValidRole(claimed) ? claimed !== resolved.role : false,
  };
}

/**
 * Filesystem-safe form of an agent id, for key filenames.
 *
 * A `did:tnf` contains colons, which are illegal in Windows filenames and are
 * displayed as `/` by macOS Finder. `:` maps to `~`, which cannot appear in a
 * DID segment (`[a-z0-9_]`) and does not appear in legacy bare ids, so the
 * encoding is injective and leaves every existing key file untouched.
 */
function fsSafeAgentId(agentId) {
  const id = normalizeAgentId(agentId);
  if (!id) return null;
  return id.replace(/:/g, '~');
}

function keyPathFor(agentId) {
  const id = fsSafeAgentId(agentId);
  if (!id) {
    throw new Error('[tnf-identity] invalid agent id for key path');
  }
  return path.join(KEYS_DIR, id);
}

// ============================================================================
// PER-AGENT ED25519 KEYPAIRS
// ============================================================================
//
// Symmetric keys cannot solve impersonation on a multi-verifier bus. If agent B
// must verify a message from agent A, B needs A's key — and anything B can
// verify with, B can also sign with. Per-agent HMAC keys therefore just move the
// shared-secret problem around: every peer able to check a director's messages
// would also be able to forge them.
//
// Ed25519 splits those capabilities. A signs with a private key only A holds;
// everyone else verifies with A's public key, which is safe to distribute. Only
// A can produce a signature that validates as A.
//
// Private keys: ~/.tnf/authority/keys/<agent-id>.ed25519 (0600)
// Public keys:  ~/.tnf/authority/pubkeys/<agent-id>.pub  (0644, distributable)

const PUBKEYS_DIR = process.env.TNF_PUBKEYS_DIR || path.join(AUTHORITY_DIR, 'pubkeys');

function pubkeysDir() {
  return PUBKEYS_DIR;
}

function privateKeyPathFor(agentId) {
  const id = fsSafeAgentId(agentId);
  if (!id) throw new Error('[tnf-identity] invalid agent id for key path');
  return path.join(KEYS_DIR, `${id}.ed25519`);
}

function publicKeyPathFor(agentId) {
  const id = fsSafeAgentId(agentId);
  if (!id) throw new Error('[tnf-identity] invalid agent id for key path');
  return path.join(PUBKEYS_DIR, `${id}.pub`);
}

function ensurePubkeysDir() {
  fs.mkdirSync(PUBKEYS_DIR, { recursive: true, mode: 0o755 });
}

/**
 * Load or create an agent's Ed25519 keypair.
 *
 * Never replaces an existing private key unless `{ rotate: true }` — silently
 * regenerating would invalidate every signature that agent has produced and
 * strand peers holding the old public key.
 *
 * @returns {{ agentId, privateKeyPath, publicKeyPath, publicKeyPem, created }}
 */
function ensureAgentKeypair(agentId, { rotate = false } = {}) {
  const id = normalizeAgentId(agentId);
  if (!id) throw new Error('[tnf-identity] invalid agent id');
  ensureAuthorityLayout();
  ensurePubkeysDir();

  const privPath = privateKeyPathFor(id);
  const pubPath = publicKeyPathFor(id);

  if (!rotate && fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    return {
      agentId: id,
      privateKeyPath: privPath,
      publicKeyPath: pubPath,
      publicKeyPem: fs.readFileSync(pubPath, 'utf8'),
      created: false,
    };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });

  const privTmp = `${privPath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(privTmp, privPem, { mode: 0o600 });
  fs.renameSync(privTmp, privPath);
  try {
    fs.chmodSync(privPath, 0o600);
  } catch {
    /* best-effort */
  }

  const pubTmp = `${pubPath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(pubTmp, pubPem, { mode: 0o644 });
  fs.renameSync(pubTmp, pubPath);

  return {
    agentId: id,
    privateKeyPath: privPath,
    publicKeyPath: pubPath,
    publicKeyPem: pubPem,
    created: true,
  };
}

/** @returns {crypto.KeyObject|null} */
function loadAgentPrivateKey(agentId) {
  const id = normalizeAgentId(agentId);
  if (!id) return null;
  const p = privateKeyPathFor(id);
  if (!fs.existsSync(p)) return null;
  try {
    return crypto.createPrivateKey(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Load an agent's public key. This is the trust anchor for verification: a
 * missing public key means the agent is unknown to this node and its messages
 * cannot be authenticated — never a reason to fall back to a shared secret.
 *
 * @returns {crypto.KeyObject|null}
 */
function loadAgentPublicKey(agentId) {
  const id = normalizeAgentId(agentId);
  if (!id) return null;
  const p = publicKeyPathFor(id);
  if (!fs.existsSync(p)) return null;
  try {
    return crypto.createPublicKey(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Import a peer's public key so this node can verify that agent.
 *
 * Public keys are not secrets, but importing one is a trust decision: it tells
 * this node "signatures from this key ARE this agent id." Distribution and
 * authenticity of that mapping are out of band.
 */
function importAgentPublicKey(agentId, publicKeyPem) {
  const id = normalizeAgentId(agentId);
  if (!id) throw new Error('[tnf-identity] invalid agent id');
  if (typeof publicKeyPem !== 'string' || !publicKeyPem.includes('BEGIN PUBLIC KEY')) {
    throw new Error('[tnf-identity] expected a PEM-encoded SPKI public key');
  }
  try {
    crypto.createPublicKey(publicKeyPem);
  } catch (err) {
    throw new Error(`[tnf-identity] not a valid public key: ${err.message}`);
  }
  ensurePubkeysDir();
  const p = publicKeyPathFor(id);
  fs.writeFileSync(p, publicKeyPem, { mode: 0o644 });
  return { agentId: id, publicKeyPath: p };
}

/**
 * Load or create a per-agent HMAC key (32 bytes hex). Mode 0600.
 * Does not replace an existing key unless `{ rotate: true }`.
 */
function ensureAgentKey(agentId, { rotate = false } = {}) {
  const id = normalizeAgentId(agentId);
  if (!id) {
    throw new Error('[tnf-identity] invalid agent id');
  }
  ensureAuthorityLayout();
  const keyPath = keyPathFor(id);
  if (!rotate && fs.existsSync(keyPath)) {
    const existing = fs.readFileSync(keyPath, 'utf8').trim();
    if (existing.length >= 32) {
      return { agentId: id, keyPath, key: existing, created: false };
    }
  }
  const key = crypto.randomBytes(32).toString('hex');
  const tmp = `${keyPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${key}\n`, { mode: 0o600 });
  fs.renameSync(tmp, keyPath);
  try {
    fs.chmodSync(keyPath, 0o600);
  } catch {
    /* best-effort */
  }
  return { agentId: id, keyPath, key, created: true };
}

function loadAgentKey(agentId) {
  const id = normalizeAgentId(agentId);
  if (!id) return null;
  const keyPath = keyPathFor(id);
  if (!fs.existsSync(keyPath)) return null;
  const key = fs.readFileSync(keyPath, 'utf8').trim();
  if (key.length < 32) return null;
  return { agentId: id, keyPath, key };
}

/**
 * Bootstrap helper for local registration: ensure a key exists and, if the
 * registry has no entry, record worker (only). Elevated roles require
 * setAgentRole from an operator shell.
 */
function bootstrapAgentIdentity(agentId, requestedRole = 'worker') {
  const id = normalizeAgentId(agentId);
  if (!id) {
    throw new Error('[tnf-identity] invalid agent id');
  }
  const keyInfo = ensureAgentKey(id);
  // Provision the Ed25519 keypair too — this is what the auth path actually
  // signs and verifies with. Idempotent: existing keys are never replaced.
  const keypair = ensureAgentKeypair(id);
  const withKeys = { ...keyInfo, keypair };
  const resolved = resolveRole(id);
  if (resolved.source === 'registry') {
    return { ...withKeys, role: resolved.role, roleSource: 'registry' };
  }

  const selfRole = SELF_REGISTERABLE.has(requestedRole) ? requestedRole : 'worker';
  // First-seen agents default to worker without rewriting the operator file
  // when the requested role is already worker — keeps the registry sparse.
  // Elevated requests are ignored until the operator grants them.
  return {
    ...withKeys,
    role: selfRole,
    roleSource: 'default',
    elevatedRequestIgnored:
      typeof requestedRole === 'string' &&
      requestedRole !== 'worker' &&
      isValidRole(requestedRole),
  };
}

// ---------------------------------------------------------------------------
// Traceable authority identifiers (did:tnf)
// ---------------------------------------------------------------------------
/**
 * TNF had nine identifier systems and the only one that authorized anything —
 * the key of `roles.json` — was a bare ad-hoc string like
 * `"tnf-local-subdirector"`. It carried no tenant, no residency, no instance,
 * and matched none of the federated namespaces, so a grant could not be traced
 * to an entity.
 *
 * `did:tnf` closes that without inventing a tenth namespace. It is the
 * `canonicalEntityId` (`TNF:[SCOPE:]CATEGORY:PROVIDER:NAME:INSTANCE`, per
 * packages/relay-core/src/contracts/identity.ts) expressed as a DID, because a
 * DID is what the authority contracts already require:
 * `CapabilityGrant.iss`/`aud` are DIDs, and `tnf-elevation-broker.cjs` rejects a
 * `requesterDid` that does not start with `did:`.
 *
 *   did:tnf:<scope>:<category>:<provider>:<name>:<instance>
 *
 * The SCOPE segment — present in the canonical builder since inception and
 * populated by nothing — carries residency and tenancy:
 *
 *   local                       the installed harness on a user's machine
 *   cloud                       TNF's own control plane
 *   cloud_<tenantId>            a server-side agent belonging to one tenant
 *
 * Examples:
 *   did:tnf:cloud:user:tnf:daniel_goldberg:001        super-admin (the owner)
 *   did:tnf:cloud:system:tnfcore:super_director:001   the SaaS orchestrator
 *   did:tnf:cloud_acme:agent:tnfcore:reviewer:001     a tenant's cloud agent
 *   did:tnf:local:agent:tnfcli:mbp-2015:001           an installed harness
 *
 * Note what is deliberately NOT here: `idNumber` (`ID#:<Base58>`) is a
 * sequential reputation counter verified by a symmetric HMAC, so anyone able to
 * verify it can forge it. It must never key an authority grant. Nor may an NFT
 * id — that path was disabled fail-closed as a P0 on 2026-08-25 because
 * `nft-authorized:${nft_id}` was a template literal, not a signature.
 */
/**
 * The cloud read path: resolve a subject's role from signed grant rows, falling
 * back to the local `roles.json` registry via contracts.
 */
function resolveRoleFromGrants(subjectDid, grants, opts = {}) {
  return contracts.resolveRoleFromGrants(subjectDid, grants, {
    fallbackResolver: (id) => resolveRole(id),
    ...opts,
  });
}

function canRequestElevation(role) {
  return role === 'super-admin' || role === 'super-director' || role === 'sub-director';
}

module.exports = {
  VALID_ROLES,
  RESIDENCIES,
  // Traceable authority identifiers (did:tnf)
  buildAgentDid,
  canonicalGrantMaterial,
  signGrant,
  verifyGrant,
  attenuationHolds,
  crossResidencyGrants,
  verifyGrantChain,
  resolveRoleFromGrants,
  MAX_CHAIN_DEPTH,
  ROLE_RANK,
  parseAgentDid,
  didToCanonicalEntityId,
  residencyOf,
  fsSafeAgentId,
  authorityDir,
  rolesPath,
  keysDir,
  ensureAuthorityLayout,
  isValidRole,
  normalizeAgentId,
  loadRoleRegistry,
  saveRoleRegistry,
  setAgentRole,
  resolveRole,
  resolveRoleForMessage,
  ensureAgentKey,
  loadAgentKey,
  bootstrapAgentIdentity,
  canRequestElevation,
  keyPathFor,
  // Ed25519 per-agent identity
  pubkeysDir,
  privateKeyPathFor,
  publicKeyPathFor,
  ensureAgentKeypair,
  loadAgentPrivateKey,
  loadAgentPublicKey,
  importAgentPublicKey,
};
