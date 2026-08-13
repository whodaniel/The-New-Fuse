#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesDir = path.join(repoRoot, 'docs', 'protocols', 'schemas', 'fixtures', 'twip');
const unsignedFixturePath = path.join(fixturesDir, 'envelope.publish.valid.json');
const signedFixturePath = path.join(fixturesDir, 'envelope.publish.valid.signed.json');
const signingKey = process.env.TWIP_FIXTURE_SIGNING_KEY || 'twip-conformance-secret';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stableSortObject(value) {
  if (Array.isArray(value)) return value.map((item) => stableSortObject(item));
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonicalizeEnvelopeForSignature(envelope) {
  const clone = JSON.parse(JSON.stringify(envelope || {}));
  delete clone.sig;
  return JSON.stringify(stableSortObject(clone));
}

function computeSignature(envelope, key) {
  return crypto.createHmac('sha256', key).update(canonicalizeEnvelopeForSignature(envelope)).digest('hex');
}

function normalizeSignature(sig) {
  if (!sig || typeof sig !== 'string') return null;
  const trimmed = sig.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('hmac-sha256:')) return trimmed.slice('hmac-sha256:'.length);
  return trimmed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const unsignedFixture = readJson(unsignedFixturePath);
  const signedFixture = readJson(signedFixturePath);

  assert(unsignedFixture.spec === 'twip/0.1', 'Unsigned fixture has invalid spec.');
  assert(signedFixture.spec === 'twip/0.1', 'Signed fixture has invalid spec.');

  const signedSignature = normalizeSignature(signedFixture.sig);
  assert(Boolean(signedSignature), 'Signed fixture does not include a valid `sig` field.');

  const expectedSignature = computeSignature(unsignedFixture, signingKey);
  assert(
    signedSignature === expectedSignature,
    'Signed fixture signature mismatch. Regenerate with twip-sign-envelope utility.'
  );

  const expectedSignedFixture = { ...unsignedFixture, sig: `hmac-sha256:${expectedSignature}` };
  const actualSorted = JSON.stringify(stableSortObject(signedFixture));
  const expectedSorted = JSON.stringify(stableSortObject(expectedSignedFixture));
  assert(
    actualSorted === expectedSorted,
    'Signed fixture payload drift detected (fields differ from unsigned fixture + expected signature).'
  );

  console.log('TWIP signed fixture verification passed.');
  console.log(`- Unsigned fixture: ${path.relative(repoRoot, unsignedFixturePath)}`);
  console.log(`- Signed fixture: ${path.relative(repoRoot, signedFixturePath)}`);
  console.log('- Signature algorithm: hmac-sha256');
}

try {
  main();
} catch (error) {
  console.error(`TWIP signed fixture verification failed: ${error.message}`);
  process.exit(1);
}
