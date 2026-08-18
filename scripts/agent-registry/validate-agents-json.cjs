#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });

const ROOT = path.resolve(__dirname, '../../');
const SCHEMA_PATH = path.join(ROOT, 'data/agent-registry/agent-card.schema.json');
const DATA_PATH = path.join(ROOT, 'data/agent-registry/agents.json');

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const arraySchema = {
  type: 'array',
  items: schema
};

const validate = ajv.compile(arraySchema);
const valid = validate(data);

if (valid) {
  console.log(`[validate-agents-json] SUCCESS: ${data.length} agents conform to TNF AgentCard schema.`);
  process.exit(0);
} else {
  console.error(`[validate-agents-json] ERROR: agents.json does not conform to the schema!`);
  console.error(validate.errors);
  process.exit(1);
}
