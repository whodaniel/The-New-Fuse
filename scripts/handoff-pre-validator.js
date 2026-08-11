#!/usr/bin/env node
/**
 * Handoff pre-validator (ESM).
 *
 * 1) Updates ~/.tnf/handoff-current.json operational STATE markers.
 * 2) Validates docs/protocols/reports/SESSION_HANDOFF_LATEST.json against the
 *    canonical schema (when present) — restore path after audit claimed
 *    validators were "missing"; they exist but previously ignored SESSION_HANDOFF.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(__dirname, '..');
const HANDOFF_PACKET_PATH = path.join(process.env.HOME || '', '.tnf', 'handoff-current.json');
const SESSION_HANDOFF_JSON = path.join(
  repoRoot,
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'
);
const SESSION_HANDOFF_SCHEMA = path.join(
  repoRoot,
  'docs/protocols/schemas/tnf-session-handoff.schema.json'
);

function upsertState(packet, prefix, value) {
  if (!packet.STATE || !Array.isArray(packet.STATE)) packet.STATE = [];
  const idx = packet.STATE.findIndex((s) => typeof s === 'string' && s.startsWith(prefix));
  if (idx !== -1) packet.STATE[idx] = value;
  else packet.STATE.push(value);
}

function validateSessionHandoff() {
  const result = {
    present: fs.existsSync(SESSION_HANDOFF_JSON),
    schemaPresent: fs.existsSync(SESSION_HANDOFF_SCHEMA),
    valid: false,
    errors: [],
  };

  if (!result.present) {
    result.errors.push(`missing ${SESSION_HANDOFF_JSON}`);
    return result;
  }
  if (!result.schemaPresent) {
    result.errors.push(`missing schema ${SESSION_HANDOFF_SCHEMA}`);
    return result;
  }

  let handoff;
  let schema;
  try {
    handoff = JSON.parse(fs.readFileSync(SESSION_HANDOFF_JSON, 'utf8'));
    schema = JSON.parse(fs.readFileSync(SESSION_HANDOFF_SCHEMA, 'utf8'));
  } catch (err) {
    result.errors.push(`JSON parse failed: ${err.message}`);
    return result;
  }

  // Prefer Ajv when available (same stack as enforce-session-handoff).
  try {
    const Ajv2020 = require('ajv/dist/2020').default;
    const addFormats = require('ajv-formats');
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    result.valid = Boolean(validate(handoff));
    if (!result.valid) {
      result.errors = (validate.errors || []).map((e) =>
        `${e.instancePath || '/'} ${e.message || 'invalid'}`.trim()
      );
    }
    return result;
  } catch {
    // Lightweight required-field fallback (no Ajv in this environment).
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in handoff)) result.errors.push(`missing required field: ${key}`);
    }
    if (handoff.spec !== 'tnf/session-handoff/0.1') {
      result.errors.push(`spec must be tnf/session-handoff/0.1 (got ${handoff.spec})`);
    }
    if (handoff.protocol_ack !== 'TNF_PROTOCOL_ACK') {
      result.errors.push('protocol_ack must be TNF_PROTOCOL_ACK');
    }
    result.valid = result.errors.length === 0;
    return result;
  }
}

function markPacket(packet, sessionCheck) {
  const ok = sessionCheck.valid;
  upsertState(
    packet,
    'Handoff packet pre-validation',
    ok
      ? 'Handoff packet pre-validation: operational'
      : `Handoff packet pre-validation: failed (${sessionCheck.errors[0] || 'invalid'})`
  );
  upsertState(
    packet,
    'Handoff packet validation pipeline',
    ok
      ? 'Handoff packet validation pipeline: operational'
      : `Handoff packet validation pipeline: failed (${sessionCheck.errors[0] || 'invalid'})`
  );
  upsertState(
    packet,
    'Cycle completion enforcement',
    ok
      ? 'Cycle completion enforcement: operational'
      : `Cycle completion enforcement: failed (${sessionCheck.errors[0] || 'invalid'})`
  );
  upsertState(
    packet,
    'SESSION_HANDOFF schema',
    ok
      ? 'SESSION_HANDOFF schema: valid'
      : `SESSION_HANDOFF schema: invalid (${sessionCheck.errors.join('; ') || 'unknown'})`
  );
  packet.lastPreValidatedAt = new Date().toISOString();
  packet.sessionHandoffValidation = {
    path: SESSION_HANDOFF_JSON,
    valid: sessionCheck.valid,
    errors: sessionCheck.errors,
    checkedAt: packet.lastPreValidatedAt,
  };
}

try {
  const sessionCheck = validateSessionHandoff();
  console.log(
    sessionCheck.valid
      ? 'SESSION_HANDOFF_LATEST.json: schema valid'
      : `SESSION_HANDOFF_LATEST.json: INVALID — ${sessionCheck.errors.join('; ')}`
  );

  // Optional drift check (non-fatal if script missing).
  const driftScript = path.join(repoRoot, 'scripts/protocols/validate-handoff-source-drift.cjs');
  if (fs.existsSync(driftScript)) {
    const drift = spawnSync(process.execPath, [driftScript], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 30_000,
    });
    if (drift.status === 0) {
      console.log('Handoff source-drift check: ok');
    } else {
      console.warn(
        `Handoff source-drift check: exit ${drift.status}${drift.stderr ? ` — ${drift.stderr.trim()}` : ''}`
      );
    }
  }

  if (fs.existsSync(HANDOFF_PACKET_PATH)) {
    const packet = JSON.parse(fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8'));
    if (!packet || typeof packet !== 'object') {
      throw new Error('Handoff packet is not a valid JSON object.');
    }
    markPacket(packet, sessionCheck);
    fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
    console.log('Handoff pre-validator executed and updated status.');
  } else {
    console.log('No ~/.tnf/handoff-current.json — SESSION_HANDOFF check only.');
  }

  if (!sessionCheck.valid) process.exit(1);
} catch (error) {
  console.error(`Handoff pre-validator failed: ${error.message}`);
  try {
    if (fs.existsSync(HANDOFF_PACKET_PATH)) {
      const packet = JSON.parse(fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8'));
      markPacket(packet, {
        valid: false,
        errors: [error.message],
        present: false,
        schemaPresent: false,
      });
      fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
    }
  } catch (updateError) {
    console.error(`Failed to update handoff packet with error status: ${updateError.message}`);
  }
  process.exit(1);
}
