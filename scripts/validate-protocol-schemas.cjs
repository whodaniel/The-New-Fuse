#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const schemaDir = path.join(repoRoot, 'docs', 'protocols', 'schemas');

const requiredFiles = [
  'twip-envelope.schema.json',
  'twip-identity.schema.json',
  'sgp-envelope.schema.json',
  'sgp-payloads.schema.json',
];

function fail(message) {
  console.error(`[protocol-schema-gate] ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${filePath}: ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function validateCommonSchema(fileName, schema) {
  if (!schema) return;
  assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', `${fileName}: must declare draft 2020-12`);
  assert(typeof schema.$id === 'string' && schema.$id.length > 0, `${fileName}: missing $id`);
  const hasObjectRoot = schema.type === 'object';
  const hasDefsCatalog = schema.$defs && typeof schema.$defs === 'object';
  assert(
    hasObjectRoot || hasDefsCatalog,
    `${fileName}: must define object root or $defs catalog`
  );
}

function validateTwipEnvelope(schema) {
  if (!schema) return;
  const required = new Set(schema.required || []);
  ['id', 'spec', 'type', 'sent_at', 'scope', 'trace', 'payload'].forEach((key) => {
    assert(required.has(key), `twip-envelope.schema.json: required must include ${key}`);
  });

  const typeEnum = schema?.properties?.type?.enum || [];
  ['IDENTITY.PUBLISH', 'IDENTITY.RESOLVE', 'IDENTITY.REVOKE', 'POLICY.DECISION', 'ERROR'].forEach((t) => {
    assert(typeEnum.includes(t), `twip-envelope.schema.json: type enum missing ${t}`);
  });

  assert(schema?.properties?.spec?.const === 'twip/0.1', 'twip-envelope.schema.json: spec const must be twip/0.1');
}

function validateTwipIdentity(schema) {
  if (!schema) return;
  const required = new Set(schema.required || []);
  ['twid', 'spec', 'created_at', 'scope', 'provenance'].forEach((key) => {
    assert(required.has(key), `twip-identity.schema.json: required must include ${key}`);
  });

  assert(schema?.properties?.spec?.const === 'twip/0.1', 'twip-identity.schema.json: spec const must be twip/0.1');

  const scopeRequired = new Set(schema?.properties?.scope?.required || []);
  ['tenant_id', 'host_id', 'emulator_id'].forEach((key) => {
    assert(scopeRequired.has(key), `twip-identity.schema.json: scope.required must include ${key}`);
  });
}

function main() {
  if (!fs.existsSync(schemaDir)) {
    fail(`Missing schema directory: ${schemaDir}`);
    process.exit(process.exitCode || 1);
  }

  for (const file of requiredFiles) {
    const fullPath = path.join(schemaDir, file);
    if (!fs.existsSync(fullPath)) {
      fail(`Missing required schema: docs/protocols/schemas/${file}`);
    }
  }

  const parsed = {};
  for (const file of requiredFiles) {
    const fullPath = path.join(schemaDir, file);
    if (fs.existsSync(fullPath)) {
      parsed[file] = readJson(fullPath);
      validateCommonSchema(file, parsed[file]);
    }
  }

  validateTwipEnvelope(parsed['twip-envelope.schema.json']);
  validateTwipIdentity(parsed['twip-identity.schema.json']);

  if (process.exitCode) {
    process.exit(process.exitCode);
  }

  console.log('[protocol-schema-gate] OK');
}

main();
