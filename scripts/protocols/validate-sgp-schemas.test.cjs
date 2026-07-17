/**
 * Tests for scripts/protocols/validate-sgp-schemas.cjs
 *
 * The script asserts that the canonical SGP (Smart-Graph-Payload) envelope and
 * payload schemas, plus a known-valid and known-invalid fixture pair, all
 * satisfy AJV 2020-12 validation. Trailing in scope: any schema drift that
 * loosens or tightens the contract must surface immediately.
 *
 * Usage:
 *   node --test scripts/protocols/validate-sgp-schemas.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'validate-sgp-schemas.cjs');
const REPO = path.resolve(__dirname, '..', '..');
const SCHEMAS = path.join(REPO, 'docs', 'protocols', 'schemas');
const ENVELOPE_SCHEMA = path.join(SCHEMAS, 'sgp-envelope.schema.json');
const PAYLOAD_SCHEMA = path.join(SCHEMAS, 'sgp-payloads.schema.json');
const FIXTURES = path.join(SCHEMAS, 'fixtures');
const VALID_FIXTURE = path.join(FIXTURES, 'envelope.query-request.valid.json');
const INVALID_FIXTURE = path.join(FIXTURES, 'envelope.query-request.invalid-mismatch.json');

function run() {
  return spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
}

// === Bin: the real schemas + fixtures must exist
test('real SGP schemas and fixtures are present', () => {
  for (const p of [ENVELOPE_SCHEMA, PAYLOAD_SCHEMA, VALID_FIXTURE, INVALID_FIXTURE]) {
    assert.ok(fs.existsSync(p), `expected schema/fixture at ${p}`);
  }
});

// === Happy-path: subprocess passes end-to-end
test('subprocess passes end-to-end against real files', () => {
  const r = run();
  assert.equal(r.status, 0, `script failed: ${r.stderr}`);
  assert.match(r.stdout, /SGP schema validation passed/);
  // Reporter should echo the relative paths of the artifacts it validated.
  assert.match(r.stdout, /sgp-envelope\.schema\.json/);
  assert.match(r.stdout, /sgp-payloads\.schema\.json/);
  assert.match(r.stdout, /query-request\.valid/);
  assert.match(r.stdout, /query-request\.invalid/);
});

// === Schema structural sanity
test('envelope schema is anchored on sgp/0.1 and shared envelope shape', () => {
  // Each anyOf branch has properties.type.const discriminator (message type)
  // plus properties.spec.const === 'sgp/0.1'. All branches share the envelope
  // shell (id/spec/tenant/actor/resource/payload/sent_at/sig/trace).
  const schema = JSON.parse(fs.readFileSync(ENVELOPE_SCHEMA, 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const envelopeShape = ['id', 'spec', 'type', 'tenant', 'actor', 'resource', 'payload'];
  for (const branch of schema.anyOf) {
    const props = Object.keys(branch.properties);
    for (const key of envelopeShape) {
      assert.ok(props.includes(key), `envelope branch missing ${key}`);
    }
    assert.equal(branch.properties.spec.const, 'sgp/0.1');
    assert.ok(typeof branch.properties.type.const === 'string', 'branch must have a type discriminator');
  }
});

test('payload schema dispatches payloads via anyOf branches (structural, not discriminator)', () => {
  const schema = JSON.parse(fs.readFileSync(PAYLOAD_SCHEMA, 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(Array.isArray(schema.anyOf), 'payload schema must dispatch payloads via anyOf');
  assert.ok(schema.anyOf.length >= 5, 'payload schema must declare at least 5 message variants');
});

test('QUERY.REQUEST branch requires `limit` to enforce bounded scans', () => {
  // The branches are structural; one of them is the QUERY.REQUEST shape with
  // `limit` required. Locate it by property shape rather than by a discriminator.
  const payloadSchema = JSON.parse(fs.readFileSync(PAYLOAD_SCHEMA, 'utf8'));
  const limitBranch = payloadSchema.anyOf.find(
    (b) => b.properties && 'limit' in b.properties
  );
  assert.ok(limitBranch, 'expected a payload branch that supports `limit`');
  assert.ok(
    Array.isArray(limitBranch.required) && limitBranch.required.includes('limit'),
    'limit-bearing branch must declare `limit` as required'
  );
});

test('invalid fixture intentionally lacks a bounded `limit`', () => {
  const fixture = JSON.parse(fs.readFileSync(INVALID_FIXTURE, 'utf8'));
  // Fixture is a manifest-style payload, not a QUERY.REQUEST. It must not
  // contain `limit` so AJV rejects it for missing required fields. This guards
  // against someone "fixing" the fixture by adding fields.
  assert.equal(typeof fixture.payload.limit, 'undefined');
});

// === Behavior of the schemas on the fixtures
test('valid fixture passes envelope validation', () => {
  const Ajv = require('ajv/dist/2020').default;
  const addFormats = require('ajv-formats');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(JSON.parse(fs.readFileSync(PAYLOAD_SCHEMA, 'utf8')));
  const validate = ajv.compile(JSON.parse(fs.readFileSync(ENVELOPE_SCHEMA, 'utf8')));
  const fixture = JSON.parse(fs.readFileSync(VALID_FIXTURE, 'utf8'));
  const ok = validate(fixture);
  assert.ok(ok, `errors: ${JSON.stringify(validate.errors)}`);
});

test('invalid fixture fails envelope validation', () => {
  const Ajv = require('ajv/dist/2020').default;
  const addFormats = require('ajv-formats');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(JSON.parse(fs.readFileSync(PAYLOAD_SCHEMA, 'utf8')));
  const validate = ajv.compile(JSON.parse(fs.readFileSync(ENVELOPE_SCHEMA, 'utf8')));
  const fixture = JSON.parse(fs.readFileSync(INVALID_FIXTURE, 'utf8'));
  const ok = validate(fixture);
  assert.equal(ok, false, 'invalid fixture must NOT validate');
  assert.ok(Array.isArray(validate.errors) && validate.errors.length > 0);
});
