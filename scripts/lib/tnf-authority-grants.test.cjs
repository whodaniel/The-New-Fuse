#!/usr/bin/env node
/**
 * The security claim of the server-side registry, as executable assertions:
 * **write access to authority_grants does not confer authority.**
 *
 * Every tampering case must fail closed to `worker`. If any of these ever
 * returns a role, the Postgres-plus-signature model has collapsed into the
 * plain-table model it was chosen over.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const identity = require('./tnf-identity.cjs');

const kp = crypto.generateKeyPairSync('ed25519');
const PUB = kp.publicKey.export({ type: 'spki', format: 'pem' });
const PRIV = kp.privateKey.export({ type: 'pkcs8', format: 'pem' });

function grant(over = {}) {
  const g = {
    subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:reviewer:001',
    role: 'sub-director',
    issuerDid: 'did:tnf:cloud:system:tnfcore:super_director:001',
    tenantId: 'acme',
    residency: 'cloud',
    nonce: crypto.randomBytes(12).toString('hex'),
    notBefore: new Date(Date.now() - 2000),
    expiresAt: new Date(Date.now() + 3600e3),
    proofChain: [],
    ...over,
  };
  return { ...g, signature: identity.signGrant(g, PRIV), signatureAlgorithm: 'Ed25519' };
}

test('an honest grant verifies and yields its role', () => {
  const r = identity.verifyGrant(grant(), PUB);
  assert.equal(r.verdict, 'valid');
  assert.equal(r.role, 'sub-director');
});

for (const [name, mutation] of [
  ['role escalated in the row', { role: 'super-admin' }],
  ['replayed into another tenant', { tenantId: 'evil-corp' }],
  ['subject swapped', { subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:attacker:001' }],
  ['issuer swapped', { issuerDid: 'did:tnf:cloud:user:tnf:attacker:001' }],
  ['expiry extended', { expiresAt: new Date(Date.now() + 9e9) }],
  ['nonce replaced', { nonce: 'reused' }],
]) {
  test(`row tampering fails closed: ${name}`, () => {
    const r = identity.verifyGrant({ ...grant(), ...mutation }, PUB);
    assert.equal(r.verdict, 'invalid', name);
    assert.equal(r.role, 'worker', name);
  });
}

test('a signature from a different key does not verify', () => {
  const other = crypto.generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
  assert.equal(identity.verifyGrant(grant(), other).role, 'worker');
});

test('an unsigned row is not authority', () => {
  const g = grant();
  assert.equal(identity.verifyGrant({ ...g, signature: '' }, PUB).verdict, 'invalid');
});

test('expiry and forgery are distinguishable verdicts', () => {
  const expired = grant({ notBefore: new Date(Date.now() - 7200e3), expiresAt: new Date(Date.now() - 3600e3) });
  assert.equal(identity.verifyGrant(expired, PUB).verdict, 'expired');
  const early = grant({ notBefore: new Date(Date.now() + 3600e3), expiresAt: new Date(Date.now() + 7200e3) });
  assert.equal(identity.verifyGrant(early, PUB).verdict, 'not-yet-valid');
});

test('revocation is honoured without invalidating the signature', () => {
  const r = identity.verifyGrant({ ...grant(), revokedAt: new Date(), revocationReason: 'operator revoked' }, PUB);
  assert.equal(r.verdict, 'revoked');
  assert.equal(r.role, 'worker');
});

test('a delegated grant may narrow but never widen', () => {
  const parent = { role: 'super-director', tenantId: null, expiresAt: new Date(Date.now() + 7200e3) };
  assert.equal(
    identity.attenuationHolds(parent, { role: 'sub-director', tenantId: 'acme', expiresAt: new Date(Date.now() + 3600e3) }).ok,
    true
  );
  assert.equal(
    identity.attenuationHolds(parent, { role: 'super-admin', tenantId: 'acme', expiresAt: new Date(Date.now() + 3600e3) }).ok,
    false
  );
  assert.equal(
    identity.attenuationHolds(parent, { role: 'sub-director', tenantId: 'acme', expiresAt: new Date(Date.now() + 9e9) }).ok,
    false
  );
});

test('a child may not escape its issuer tenant', () => {
  const parent = { role: 'super-director', tenantId: 'acme', expiresAt: new Date(Date.now() + 7200e3) };
  assert.equal(
    identity.attenuationHolds(parent, { role: 'sub-director', tenantId: 'other', expiresAt: new Date(Date.now() + 3600e3) }).ok,
    false
  );
});

test('signing refuses an incomplete grant rather than signing a partial claim', () => {
  assert.throws(() => identity.signGrant({ subjectDid: 'did:tnf:cloud:agent:x:y:001', role: 'worker' }, PRIV));
});

// ---------------------------------------------------------------------------
// The operator exception class: local -> cloud
// ---------------------------------------------------------------------------
// The developer/owner needs their own local harness to drive server-side agents.
// That genuinely weakens the residency boundary, so it is explicit, signed,
// expiring and enumerable rather than an implicit capability.

const OPERATOR = 'did:tnf:cloud:user:tnf:daniel_goldberg:001';
const LAPTOP = 'did:tnf:local:agent:tnfcli:mbp_2015:001';
const SUPERDIR = 'did:tnf:cloud:system:tnfcore:super_director:001';
const soon = () => new Date(Date.now() + 3600e3);
const later = () => new Date(Date.now() + 7200e3);

test('operator may bridge their own local harness into the cloud plane', () => {
  const operatorGrant = { role: 'super-admin', subjectDid: OPERATOR, residency: 'cloud', tenantId: null, expiresAt: later(), crossResidency: true };
  const r = identity.attenuationHolds(operatorGrant, {
    role: 'super-director', subjectDid: LAPTOP, residency: 'local', tenantId: null, expiresAt: soon(),
  });
  assert.equal(r.ok, true);
  assert.equal(r.crossedResidency, true);
});

test('a grant without crossResidency may not reach the other plane', () => {
  const directorGrant = { role: 'super-director', subjectDid: SUPERDIR, residency: 'cloud', tenantId: null, expiresAt: later(), crossResidency: false };
  const r = identity.attenuationHolds(directorGrant, {
    role: 'sub-director', subjectDid: LAPTOP, residency: 'local', tenantId: null, expiresAt: soon(),
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /crosses residency/);
});

test('a bridge may not mint further bridges', () => {
  const bridged = { role: 'super-director', subjectDid: LAPTOP, residency: 'local', tenantId: null, expiresAt: later(), crossResidency: true };
  const r = identity.attenuationHolds(bridged, {
    role: 'sub-director', subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:x:001', residency: 'cloud',
    tenantId: 'acme', expiresAt: soon(), crossResidency: true,
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /may not also carry the right to bridge onward/);
});

test('same-plane delegation is unaffected by the exception', () => {
  const directorGrant = { role: 'super-director', subjectDid: SUPERDIR, residency: 'cloud', tenantId: null, expiresAt: later(), crossResidency: false };
  assert.equal(
    identity.attenuationHolds(directorGrant, {
      role: 'sub-director', subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:rev:001',
      residency: 'cloud', tenantId: 'acme', expiresAt: soon(),
    }).ok,
    true
  );
});

test('crossResidency cannot be switched on by writing to the row', () => {
  const g = grant({ subjectDid: LAPTOP, residency: 'local', tenantId: null, crossResidency: false });
  assert.equal(identity.verifyGrant(g, PUB).verdict, 'valid');
  assert.equal(identity.verifyGrant({ ...g, crossResidency: true }, PUB).verdict, 'invalid');
});

test('cross-plane grants are enumerable for audit', () => {
  const rows = [
    { subjectDid: LAPTOP, crossResidency: true },
    { subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:rev:001', crossResidency: false },
  ];
  const bridges = identity.crossResidencyGrants(rows);
  assert.equal(bridges.length, 1);
  assert.equal(bridges[0].subjectDid, LAPTOP);
});

// ---------------------------------------------------------------------------
// Chain resolution — the cloud read path
// ---------------------------------------------------------------------------
// A signature proves a row was issued by a key. It does not prove the issuer was
// ENTITLED to issue it. Both are checked on every read.

const opKp = crypto.generateKeyPairSync('ed25519');
const dirKp = crypto.generateKeyPairSync('ed25519');
const asPub = (kp) => kp.publicKey.export({ type: 'spki', format: 'pem' });
const asPriv = (kp) => kp.privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEYRING = { 'did:key:operator': asPub(opKp), 'did:key:superdirector': asPub(dirKp) };
const resolvePublicKey = (d) => KEYRING[d] || null;

const OP_DID = 'did:tnf:cloud:user:tnf:daniel_goldberg:001';
const SD_DID = 'did:tnf:cloud:system:tnfcore:super_director:001';
const TENANT_AGENT = 'did:tnf:cloud_acme:agent:tnfcore:reviewer:001';

function chainGrant(over, signingKp, keyDid) {
  const g = {
    residency: 'cloud', tenantId: null, proofChain: [], crossResidency: false,
    nonce: crypto.randomBytes(10).toString('hex'),
    notBefore: new Date(Date.now() - 2000), expiresAt: new Date(Date.now() + 3600e3),
    signingKeyDid: keyDid, ...over,
  };
  return { ...g, signature: identity.signGrant(g, asPriv(signingKp)), signatureAlgorithm: 'Ed25519' };
}

const ROOT = chainGrant(
  { id: 'g-root', subjectDid: SD_DID, role: 'super-director', issuerDid: OP_DID, parentGrantId: null, expiresAt: new Date(Date.now() + 7200e3) },
  opKp, 'did:key:operator'
);
const LEAF = chainGrant(
  { id: 'g-leaf', subjectDid: TENANT_AGENT, role: 'sub-director', issuerDid: SD_DID, parentGrantId: 'g-root', tenantId: 'acme' },
  dirKp, 'did:key:superdirector'
);
const chainOpts = (extra = {}) => ({
  resolvePublicKey,
  lookupGrant: (id) => ({ 'g-root': ROOT, 'g-leaf': LEAF, ...extra }[id] || null),
});

test('a two-link delegation chain resolves the delegated role', () => {
  const r = identity.resolveRoleFromGrants(TENANT_AGENT, [ROOT, LEAF], chainOpts());
  assert.equal(r.role, 'sub-director');
  assert.equal(r.source, 'signed-grant');
});

test('a root grant signed by the operator resolves', () => {
  assert.equal(identity.resolveRoleFromGrants(SD_DID, [ROOT, LEAF], chainOpts()).role, 'super-director');
});

test('a validly signed leaf that widens authority still resolves to worker', () => {
  const forged = chainGrant(
    { id: 'g-bad', subjectDid: TENANT_AGENT, role: 'super-admin', issuerDid: SD_DID, parentGrantId: 'g-root', tenantId: 'acme' },
    dirKp, 'did:key:superdirector'
  );
  const r = identity.resolveRoleFromGrants(TENANT_AGENT, [ROOT, forged], chainOpts({ 'g-bad': forged }));
  assert.equal(r.role, 'worker');
});

test('a grant whose parent is missing does not resolve', () => {
  const orphan = chainGrant(
    { id: 'g-orph', subjectDid: TENANT_AGENT, role: 'sub-director', issuerDid: SD_DID, parentGrantId: 'g-missing', tenantId: 'acme' },
    dirKp, 'did:key:superdirector'
  );
  assert.equal(identity.resolveRoleFromGrants(TENANT_AGENT, [orphan], chainOpts()).role, 'worker');
});

test('the issuer must be the subject of its parent grant', () => {
  const mismatched = chainGrant(
    { id: 'g-mis', subjectDid: TENANT_AGENT, role: 'sub-director', issuerDid: 'did:tnf:cloud:system:tnfcore:impostor:001', parentGrantId: 'g-root', tenantId: 'acme' },
    dirKp, 'did:key:superdirector'
  );
  assert.equal(identity.resolveRoleFromGrants(TENANT_AGENT, [mismatched], chainOpts()).role, 'worker');
});

test('an unresolvable signing key fails closed', () => {
  const unknown = chainGrant(
    { id: 'g-uk', subjectDid: TENANT_AGENT, role: 'sub-director', issuerDid: SD_DID, parentGrantId: 'g-root', tenantId: 'acme' },
    dirKp, 'did:key:nobody'
  );
  assert.equal(identity.resolveRoleFromGrants(TENANT_AGENT, [unknown], chainOpts()).role, 'worker');
});

test('a forged row beside a valid one cannot deny service', () => {
  const forged = chainGrant(
    { id: 'g-bad2', subjectDid: TENANT_AGENT, role: 'super-admin', issuerDid: SD_DID, parentGrantId: 'g-root', tenantId: 'acme' },
    dirKp, 'did:key:superdirector'
  );
  const r = identity.resolveRoleFromGrants(TENANT_AGENT, [forged, LEAF], chainOpts({ 'g-bad2': forged }));
  assert.equal(r.role, 'sub-director');
  assert.ok(r.rejected && r.rejected.length >= 1, 'the forged row is reported as rejected');
});

test('an unknown subject falls back and yields worker', () => {
  const r = identity.resolveRoleFromGrants('did:tnf:cloud:agent:x:y:001', [ROOT, LEAF], chainOpts());
  assert.equal(r.role, 'worker');
});
