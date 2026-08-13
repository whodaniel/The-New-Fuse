/**
 * Tests for scripts/lib/tnf-identity.cjs (Phase 1).
 *
 * Central cases:
 * - Wire-claimed elevated roles are ignored without a registry grant
 * - resolveRole is the only sanctioned privilege lookup
 * - Agents cannot rewrite roles.json when TNF_AGENT_ID is set
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-identity-'));
process.env.TNF_AUTHORITY_DIR = TMP;
process.env.TNF_ROLES_PATH = path.join(TMP, 'roles.json');
process.env.TNF_KEYS_DIR = path.join(TMP, 'keys');
delete process.env.TNF_AGENT_ID;

const identity = require('./tnf-identity.cjs');

test('unknown agent defaults to worker', () => {
  const resolved = identity.resolveRole('agent-never-seen');
  assert.equal(resolved.ok, true);
  assert.equal(resolved.role, 'worker');
  assert.equal(resolved.source, 'default');
});

test('operator grant elevates; revoke returns to worker', () => {
  identity.setAgentRole('director-1', 'sub-director', { note: 'test grant' });
  let resolved = identity.resolveRole('director-1');
  assert.equal(resolved.role, 'sub-director');
  assert.equal(resolved.source, 'registry');
  assert.equal(resolved.entry.granted_by, 'operator');

  identity.setAgentRole('director-1', null);
  resolved = identity.resolveRole('director-1');
  assert.equal(resolved.role, 'worker');
  assert.equal(resolved.source, 'default');
});

test('invalid role rejected at grant time', () => {
  assert.throws(() => identity.setAgentRole('x', 'superuser'), /invalid role/);
});

test('path-traversal agent ids rejected', () => {
  assert.equal(identity.normalizeAgentId('../etc/passwd'), null);
  assert.equal(identity.normalizeAgentId('a/b'), null);
  const resolved = identity.resolveRole('../etc/passwd');
  assert.equal(resolved.ok, false);
  assert.equal(resolved.role, 'worker');
});

test('unverified message forced to worker regardless of claim', () => {
  identity.setAgentRole('forger', 'sub-director');
  const resolved = identity.resolveRoleForMessage({
    verified: false,
    agentId: 'forger',
    claimedRole: 'sub-director',
  });
  assert.equal(resolved.role, 'worker');
  assert.equal(resolved.roleVerified, false);
  assert.equal(resolved.source, 'unverified');
  assert.equal(resolved.claimedRole, 'sub-director');
});

test('verified message uses registry; claim mismatch flagged', () => {
  // Registry grants sub-director; the message claims the higher super-director.
  // The registry must win and the over-claim must be visible to callers.
  identity.setAgentRole('honest', 'sub-director');
  const resolved = identity.resolveRoleForMessage({
    verified: true,
    agentId: 'honest',
    claimedRole: 'super-director',
  });
  assert.equal(resolved.role, 'sub-director', 'registry beats the wire claim');
  assert.equal(resolved.roleVerified, true);
  assert.equal(resolved.claimMismatch, true, 'over-claim must be flagged');
});

test('bootstrap ignores self-asserted elevation', () => {
  const boot = identity.bootstrapAgentIdentity('climber', 'sub-director');
  assert.equal(boot.role, 'worker');
  assert.equal(boot.elevatedRequestIgnored, true);
  assert.equal(identity.resolveRole('climber').source, 'default');
});

test('agent process cannot write roles.json', () => {
  process.env.TNF_AGENT_ID = 'evil-agent';
  try {
    assert.throws(
      () => identity.setAgentRole('victim', 'sub-director'),
      /TNF_AGENT_ID is set/
    );
  } finally {
    delete process.env.TNF_AGENT_ID;
  }
});

test('ensureAgentKey creates 0600 key and is stable', () => {
  const first = identity.ensureAgentKey('keyed-agent');
  const second = identity.ensureAgentKey('keyed-agent');
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(first.key, second.key);
  assert.ok(first.key.length >= 64);
  const mode = fs.statSync(first.keyPath).mode & 0o777;
  assert.equal(mode, 0o600);
});

test('roles.json written mode 0600', () => {
  identity.setAgentRole('mode-check', 'worker');
  const mode = fs.statSync(identity.rolesPath()).mode & 0o777;
  assert.equal(mode, 0o600);
});

test('canRequestElevation only for director strata', () => {
  assert.equal(identity.canRequestElevation('worker'), false);
  assert.equal(identity.canRequestElevation('sub-director'), true);
  assert.equal(identity.canRequestElevation('sub-director'), true);
});
