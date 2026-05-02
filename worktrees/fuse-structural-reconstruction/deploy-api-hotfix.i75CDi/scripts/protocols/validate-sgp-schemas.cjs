#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..', '..');
const schemaDir = path.join(repoRoot, 'docs', 'protocols', 'schemas');
const fixturesDir = path.join(schemaDir, 'fixtures');

const envelopeSchemaPath = path.join(schemaDir, 'sgp-envelope.schema.json');
const payloadSchemaPath = path.join(schemaDir, 'sgp-payloads.schema.json');
const validFixturePath = path.join(fixturesDir, 'envelope.query-request.valid.json');
const invalidFixturePath = path.join(fixturesDir, 'envelope.query-request.invalid-mismatch.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

function formatErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return 'none';
  }
  return errors
    .slice(0, 5)
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function main() {
  const envelopeSchema = readJson(envelopeSchemaPath);
  const payloadSchema = readJson(payloadSchemaPath);
  const validFixture = readJson(validFixturePath);
  const invalidFixture = readJson(invalidFixturePath);

  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });
  addFormats(ajv);

  ajv.addSchema(payloadSchema);
  const validateEnvelope = ajv.compile(envelopeSchema);

  const validResult = validateEnvelope(validFixture);
  if (!validResult) {
    throw new Error(
      `Expected valid fixture to pass, but it failed: ${formatErrors(validateEnvelope.errors)}`
    );
  }

  const invalidResult = validateEnvelope(invalidFixture);
  if (invalidResult) {
    throw new Error('Expected invalid fixture to fail, but it passed validation.');
  }

  console.log('SGP schema validation passed.');
  console.log(`- Envelope schema: ${path.relative(repoRoot, envelopeSchemaPath)}`);
  console.log(`- Payload schema: ${path.relative(repoRoot, payloadSchemaPath)}`);
  console.log(`- Valid fixture: ${path.relative(repoRoot, validFixturePath)}`);
  console.log(`- Invalid fixture: ${path.relative(repoRoot, invalidFixturePath)}`);
  console.log(`- Invalid-case errors: ${formatErrors(validateEnvelope.errors)}`);
}

try {
  main();
} catch (error) {
  console.error(`SGP schema validation failed: ${error.message}`);
  process.exit(1);
}
