#!/usr/bin/env node
/**
 * validate-session-handoff.cjs — validate-on-read for the canonical handoff.
 *
 * Why this exists
 * ---------------
 * `SESSION_HANDOFF_LATEST.json` is the record the whole Turn Zero / Turn End
 * lifecycle reads. It is also a plain file in a shared checkout, so every agent
 * holding a file-write tool is a writer, whatever the emit path says. Writer
 * consolidation cannot reach those writers; validation on read can.
 *
 * On 2026-09-03 the canonical handoff was found replaced by an 88-line file
 * carrying a hand-shaped UUID (`a1b2c3d4-e5f6-...`), six keys the schema
 * forbids, and 14 of 18 required keys missing. No TNF script emits that shape
 * and `context_refs` had never appeared in the repository's history — a model
 * wrote a plausible-looking handoff from imagination over the real record, and
 * nothing detected it. `enforce-session-handoff.cjs` did not, because it is a
 * pre-push gate scoped to changed files and reports "no files to inspect" when
 * the handoff is merely sitting on disk, corrupt.
 *
 * Doctrine
 * --------
 * - TNF_BOOK_OF_AXIOMS Axiom 1 (Optimal Utility): never use an LLM for what a
 *   script can solve. Handoff validity is a script's job, not model discipline.
 * - TURN_END_MANDATE: "`na` is preferable to inventing a pass."
 * - HANDOFF_VALIDATION_PIPELINE.md [STATUS:PENDING] proposed exactly this and
 *   was never built.
 *
 * Deliberately self-contained: no ajv, no repo node_modules. The checks that
 * catch this failure class are required-keys, additionalProperties and enums,
 * and this must keep working when the workspace's dependencies do not.
 *
 * Usage
 * -----
 *   node scripts/protocols/validate-session-handoff.cjs           # advisory
 *   node scripts/protocols/validate-session-handoff.cjs --strict  # exit 1
 *   node scripts/protocols/validate-session-handoff.cjs --json
 *   node scripts/protocols/validate-session-handoff.cjs --file <path>
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_HANDOFF = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const SCHEMA = 'docs/protocols/schemas/tnf-session-handoff.schema.json';

function readJson(absPath) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(absPath, 'utf8')) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Minimal structural validation: the subset of JSON Schema that actually
 * catches a fabricated or truncated handoff. Walks `properties` recursively so
 * nested enums (notably `classification.work_domain`) are checked too.
 */
function validateNode(value, schema, pointer, findings) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.type === 'object' || schema.properties) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      findings.push({ severity: 'error', pointer: pointer.replace(/\.$/, ''), message: `expected an object, found ${Array.isArray(value) ? 'array' : typeof value}` });
      return;
    }
    for (const key of schema.required || []) {
      if (!(key in value)) {
        findings.push({ severity: 'error', pointer: `${pointer}${key}`, message: 'required property is missing' });
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          findings.push({ severity: 'error', pointer: `${pointer}${key}`, message: 'property is not permitted by the schema (additionalProperties: false)' });
        }
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (key in value) validateNode(value[key], childSchema, `${pointer}${key}.`, findings);
    }
    return;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      findings.push({ severity: 'error', pointer: pointer.replace(/\.$/, ''), message: `expected an array, found ${typeof value}` });
      return;
    }
    if (schema.items) value.forEach((item, i) => validateNode(item, schema.items, `${pointer.replace(/\.$/, '')}[${i}].`, findings));
    return;
  }

  const here = pointer.replace(/\.$/, '');
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    findings.push({ severity: 'error', pointer: here, message: `value ${JSON.stringify(value)} is not one of: ${schema.enum.join(', ')}` });
  }
  if (schema.const !== undefined && value !== schema.const) {
    findings.push({ severity: 'error', pointer: here, message: `value ${JSON.stringify(value)} must be ${JSON.stringify(schema.const)}` });
  }
  if (schema.type === 'string' && typeof value !== 'string') {
    findings.push({ severity: 'error', pointer: here, message: `expected a string, found ${typeof value}` });
  }
}

/** Heuristics for content that is schema-shaped but not actually observed. */
function fabricationSignals(handoff) {
  const signals = [];
  const id = String(handoff.handoff_id || '');
  if (/^(?:[0-9a-f])\1*-|^a1b2c3d4|0123456789ab/i.test(id) || /^(?:abcd|1234)/i.test(id)) {
    signals.push(`handoff_id "${id}" looks hand-shaped rather than generated`);
  }
  if (typeof handoff.head_sha === 'string' && handoff.head_sha && !/^[0-9a-f]{7,40}$/i.test(handoff.head_sha)) {
    signals.push(`head_sha "${handoff.head_sha}" is not a git object id`);
  }
  if (typeof handoff.created_at === 'string' && /T\d{2}:\d{2}:00\.000Z$/.test(handoff.created_at)) {
    signals.push(`created_at "${handoff.created_at}" is rounded to the minute; emitters record real clock time`);
  }
  return signals;
}

/**
 * Resolve the handoff path.
 *
 * The default is repo-relative — `validate-session-handoff.cjs` with no argument
 * means "this repository's canonical handoff", wherever it is invoked from.
 *
 * An explicit `--file` is resolved against the CALLER's working directory. It
 * used to resolve against this script's repo root, so running it from a shared
 * checkout against `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` silently
 * validated the *worktree's* copy and printed PASS while naming the caller's
 * path. A validator that reports a pass for a file it did not read is worse than
 * no validator; it was found doing exactly that on 2026-09-03.
 */
function resolveHandoffPath(handoffPath, explicit) {
  if (path.isAbsolute(handoffPath)) return handoffPath;
  return explicit ? path.resolve(process.cwd(), handoffPath) : path.join(ROOT, handoffPath);
}

function validateHandoff({ handoffPath = DEFAULT_HANDOFF, explicitPath = false } = {}) {
  const absHandoff = resolveHandoffPath(handoffPath, explicitPath);
  const absSchema = path.join(ROOT, SCHEMA);
  const findings = [];

  if (!fs.existsSync(absHandoff)) {
    return { ok: false, unreadable: true, findings: [{ severity: 'error', pointer: handoffPath, message: 'handoff file does not exist' }], signals: [] };
  }
  const schemaRead = readJson(absSchema);
  if (!schemaRead.ok) {
    return { ok: false, unreadable: true, findings: [{ severity: 'error', pointer: SCHEMA, message: `schema unreadable: ${schemaRead.error}` }], signals: [] };
  }
  const handoffRead = readJson(absHandoff);
  if (!handoffRead.ok) {
    return { ok: false, unreadable: true, findings: [{ severity: 'error', pointer: handoffPath, message: `handoff is not parseable JSON: ${handoffRead.error}` }], signals: [] };
  }

  validateNode(handoffRead.value, schemaRead.value, '', findings);
  const signals = fabricationSignals(handoffRead.value);

  return {
    ok: findings.length === 0,
    unreadable: false,
    handoffId: handoffRead.value.handoff_id || null,
    spec: handoffRead.value.spec || null,
    findings,
    signals,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const asJson = argv.includes('--json');
  const fileIdx = argv.indexOf('--file');
  const explicitPath = fileIdx !== -1;
  const handoffPath = explicitPath ? argv[fileIdx + 1] : DEFAULT_HANDOFF;

  const result = validateHandoff({ handoffPath, explicitPath });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('=== Session Handoff Validation ===');
    console.log(`- file: ${resolveHandoffPath(handoffPath, explicitPath)}`);
    console.log(`- handoff_id: ${result.handoffId || 'unknown'}`);
    console.log(`- spec: ${result.spec || 'unknown'}`);
    if (result.ok) {
      console.log('- schema: PASS');
    } else {
      console.log(`- schema: FAIL (${result.findings.length} finding(s))`);
      for (const f of result.findings.slice(0, 40)) console.log(`  ! ${f.pointer || '<root>'}: ${f.message}`);
      if (result.findings.length > 40) console.log(`  ... ${result.findings.length - 40} more`);
    }
    for (const s of result.signals) console.log(`  ▲ ${s}`);
    if (!result.ok) {
      console.log('');
      console.log('The canonical handoff is the record the Turn Zero / Turn End lifecycle reads.');
      console.log('Recover it rather than hand-editing: `git checkout -- ' + DEFAULT_HANDOFF + '`');
      console.log('then re-emit with `node scripts/turn-end-v2.cjs`.');
    }
  }

  if (strict && !result.ok) process.exit(1);
}

if (require.main === module) main();

module.exports = { validateHandoff, validateNode, fabricationSignals };
