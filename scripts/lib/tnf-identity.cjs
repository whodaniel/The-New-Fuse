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
 * the operator. Agents must never write this file. Holding `local-director`
 * conveys the right to *request* elevation (Phase 2+); it never conveys
 * standing elevated access.
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

const VALID_ROLES = Object.freeze(['worker', 'sub-director', 'local-director']);

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

function isValidRole(role) {
  return typeof role === 'string' && VALID_ROLES.includes(role);
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
 *   role: 'worker'|'sub-director'|'local-director',
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

function keyPathFor(agentId) {
  const id = normalizeAgentId(agentId);
  if (!id) {
    throw new Error('[tnf-identity] invalid agent id for key path');
  }
  return path.join(KEYS_DIR, id);
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
  const resolved = resolveRole(id);
  if (resolved.source === 'registry') {
    return { ...keyInfo, role: resolved.role, roleSource: 'registry' };
  }

  const role = SELF_REGISTERABLE.has(requestedRole) ? requestedRole : 'worker';
  // First-seen agents default to worker without rewriting the operator file
  // when the requested role is already worker — keeps the registry sparse.
  // Elevated requests are ignored until the operator grants them.
  return {
    ...keyInfo,
    role,
    roleSource: 'default',
    elevatedRequestIgnored:
      typeof requestedRole === 'string' &&
      requestedRole !== 'worker' &&
      isValidRole(requestedRole),
  };
}

function canRequestElevation(role) {
  return role === 'local-director' || role === 'sub-director';
}

module.exports = {
  VALID_ROLES,
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
};
