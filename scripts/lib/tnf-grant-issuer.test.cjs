#!/usr/bin/env node
/**
 * The issuer's contract: it never mints a grant the resolver would reject.
 *
 * A system that mints grants it later rejects produces rows that look like
 * authority, sit in the table, and silently resolve to `worker` — the operator
 * sees a grant and the runtime sees nothing. Every invariant below is checked
 * before signing so the failure is loud and at issue time.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const identity = require('./tnf-identity.cjs');
const issuer = require('./tnf-grant-issuer.cjs');

const opKp = crypto.generateKeyPairSync('ed25519');
const dirKp = crypto.generateKeyPairSync('ed25519');
const pub = (kp) => kp.publicKey.export({ type: 'spki', format: 'pem' });
const priv = (kp) => kp.privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEYRING = { 'did:key:operator': pub(opKp), 'did:key:superdirector': pub(dirKp) };
const resolvePublicKey = (d) => KEYRING[d] || null;

const OP = 'did:tnf:cloud:user:tnf:daniel_goldberg:001';
const SD = 'did:tnf:cloud:system:tnfcore:super_director:001';
const AGENT = 'did:tnf:cloud_acme:agent:tnfcore:reviewer:001';
const LAPTOP = 'did:tnf:local:agent:tnfcli:mbp_2015:001';

function fleet() {
  const root = issuer.issueOperatorRoot({ operatorDid: OP, signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator' });
  root.crossResidency = true; // the owner may reach either plane
  root.signature = identity.signGrant(root, priv(opKp));
  root.id = 'g-root';

  const sd = issuer.issueGrant({
    subjectDid: SD, role: 'super-director', issuerDid: OP,
    signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: root, ttlSeconds: 7200,
  });
  sd.id = 'g-sd';

  const agent = issuer.issueGrant({
    subjectDid: AGENT, role: 'sub-director', issuerDid: SD,
    signingKeyPem: priv(dirKp), signingKeyDid: 'did:key:superdirector', parentGrant: sd, ttlSeconds: 1800,
  });
  agent.id = 'g-agent';

  // No flag on the child: the crossing is permitted by the PARENT carrying it.
  const bridge = issuer.issueGrant({
    subjectDid: LAPTOP, role: 'super-director', issuerDid: OP,
    signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: root, ttlSeconds: 3600,
  });
  bridge.id = 'g-bridge';

  const rows = { 'g-root': root, 'g-sd': sd, 'g-agent': agent, 'g-bridge': bridge };
  return { root, sd, agent, bridge, rows, opts: { lookupGrant: (i) => rows[i] || null, resolvePublicKey } };
}

test('an issued chain resolves end to end', () => {
  const f = fleet();
  const all = Object.values(f.rows);
  assert.equal(identity.resolveRoleFromGrants(OP, all, f.opts).role, 'super-admin');
  assert.equal(identity.resolveRoleFromGrants(SD, all, f.opts).role, 'super-director');
  assert.equal(identity.resolveRoleFromGrants(AGENT, all, f.opts).role, 'sub-director');
});

test('the operator bridge resolves and is marked as having crossed', () => {
  const f = fleet();
  const r = identity.resolveRoleFromGrants(LAPTOP, Object.values(f.rows), f.opts);
  assert.equal(r.role, 'super-director');
  assert.equal(r.crossedResidency, true);
});

test('refuses to mint a widening grant', () => {
  const f = fleet();
  assert.throws(
    () => issuer.issueGrant({ subjectDid: AGENT, role: 'super-admin', issuerDid: SD, signingKeyPem: priv(dirKp), signingKeyDid: 'did:key:superdirector', parentGrant: f.sd }),
    /exceeds issuer role/
  );
});

test('refuses when the issuer is not the parent subject', () => {
  const f = fleet();
  assert.throws(
    () => issuer.issueGrant({ subjectDid: AGENT, role: 'worker', issuerDid: 'did:tnf:cloud:system:tnfcore:impostor:001', signingKeyPem: priv(dirKp), signingKeyDid: 'did:key:superdirector', parentGrant: f.sd }),
    /is not the subject of the parent grant/
  );
});

test('refuses a rootless grant that is not an operator root', () => {
  assert.throws(
    () => issuer.issueGrant({ subjectDid: SD, role: 'super-director', issuerDid: OP, signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: null }),
    /must cite a parent grant/
  );
});

test('refuses a long-lived bridge', () => {
  const f = fleet();
  assert.throws(
    () => issuer.issueGrant({ subjectDid: LAPTOP, role: 'super-director', issuerDid: OP, signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: f.root, ttlSeconds: 2592000 }),
    /may not exceed/
  );
});

test('refuses a bare agent id as subject', () => {
  const f = fleet();
  assert.throws(
    () => issuer.issueGrant({ subjectDid: 'tnf-cli-agent', role: 'worker', issuerDid: OP, signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: f.root }),
    /must be a did:tnf/
  );
});

test('refuses a tenant that disagrees with the DID', () => {
  const f = fleet();
  assert.throws(
    () => issuer.issueGrant({ subjectDid: AGENT, role: 'worker', issuerDid: SD, signingKeyPem: priv(dirKp), signingKeyDid: 'did:key:superdirector', parentGrant: f.sd, tenantId: 'evil' }),
    /tenant mismatch/
  );
});

test('a bridged subject cannot bridge onward', () => {
  const f = fleet();
  // Generous expiry so the refusal cannot be attributed to the lifetime rule.
  const bridged = { ...f.bridge, expiresAt: new Date(Date.now() + 36000e3) };
  assert.throws(
    () => issuer.issueGrant({ subjectDid: 'did:tnf:cloud_acme:agent:tnfcore:x:001', role: 'sub-director', issuerDid: LAPTOP, signingKeyPem: priv(opKp), signingKeyDid: 'did:key:operator', parentGrant: bridged, ttlSeconds: 600, mayBridgeOnward: true }),
    /crosses residency/
  );
});

test('renewal mints a new row rather than extending the old one', () => {
  const f = fleet();
  const renewed = issuer.renewGrant(f.agent, { signingKeyPem: priv(dirKp), parentGrant: f.sd, ttlSeconds: 900 });
  assert.notEqual(renewed.nonce, f.agent.nonce, 'a renewal gets a fresh nonce');
  assert.notEqual(renewed.signature, f.agent.signature);
  assert.equal(renewed.subjectDid, f.agent.subjectDid);
  assert.equal(identity.verifyGrant(renewed, pub(dirKp)).verdict, 'valid');
});

test('every issued grant verifies against its own signing key', () => {
  const f = fleet();
  assert.equal(identity.verifyGrant(f.root, pub(opKp)).verdict, 'valid');
  assert.equal(identity.verifyGrant(f.sd, pub(opKp)).verdict, 'valid');
  assert.equal(identity.verifyGrant(f.agent, pub(dirKp)).verdict, 'valid');
  assert.equal(identity.verifyGrant(f.bridge, pub(opKp)).verdict, 'valid');
});
