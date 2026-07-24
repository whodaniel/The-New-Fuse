#!/usr/bin/env node

/**
 * TNF ENCRYPTION_KEY rotation — decrypt-with-old, re-encrypt-with-new.
 *
 * WHY THIS EXISTS
 * ---------------
 * `ENCRYPTION_KEY` encrypts data at rest (provider API keys, agent auth tokens,
 * provider secrets, the Jules key). The crypto in
 * `packages/database/migrations/utils/encryption.util.ts` derives its key from a
 * SINGLE `process.env.ENCRYPTION_KEY` via scrypt+AES-256-GCM, and its
 * `rotateEncryptionKeys()` only relabels `keyId` — it re-encrypts with the same
 * env key. So there is NO working way to change `ENCRYPTION_KEY` and keep the
 * data readable: a naive value swap makes every existing row undecryptable
 * (AES-GCM auth failure is unrecoverable).
 *
 * This script is the missing migration. It holds BOTH keys at once (impossible
 * for the single-env-var util), decrypts each affected value with the old key
 * and re-encrypts with the new one, in the exact wire format the util reads.
 *
 * SAFETY
 * ------
 *  - Keys are read ONLY from env vars you set out of band (never CLI args, never
 *    logged, never printed). This process never surfaces a key or a plaintext.
 *  - DRY-RUN by default. It reports what it WOULD do and verifies every
 *    round-trip in memory; it writes nothing unless you pass --apply.
 *  - Idempotent + safe to re-run: each value is classified as already-new
 *    (skip), old (migrate), or UNKNOWN (decrypts under neither key — reported,
 *    never overwritten, so orphaned/foreign data is surfaced not destroyed).
 *  - Every re-encryption is verified by decrypting the new ciphertext with the
 *    new key and comparing to the original plaintext BEFORE it is written.
 *
 * USAGE
 *   export TNF_ENCRYPTION_KEY_OLD='<old key>'   # the leaked one
 *   export TNF_ENCRYPTION_KEY_NEW='<new key>'   # the rotated one
 *   node scripts/tnf-encryption-key-rotate.cjs --plan            # dry-run report
 *   node scripts/tnf-encryption-key-rotate.cjs --apply           # write changes
 *   # DB wiring is operator-run; the core is a tested library (see exports).
 */

'use strict';

const crypto = require('node:crypto');

// Must match packages/database/migrations/utils/encryption.util.ts exactly.
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

/**
 * Decrypt an EncryptedData object with an EXPLICIT password. Throws on wrong
 * key (AES-GCM auth failure) — callers use that to classify.
 */
function decryptWith(encrypted, password) {
  const salt = Buffer.from(encrypted.salt, 'base64');
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

/** Encrypt plaintext with an EXPLICIT password, in the util's wire format. */
function encryptWith(plaintext, password, keyId) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return {
    ciphertext,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM,
    ...(keyId ? { keyId } : {}),
  };
}

function parseValue(stored) {
  if (stored && typeof stored === 'object') return stored;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Classify a stored value against both keys, without mutating anything.
 * @returns 'new' (already migrated), 'old' (needs migration), 'malformed'
 *          (not EncryptedData JSON), or 'unknown' (valid shape, decrypts under
 *          neither key — foreign/orphaned; must NOT be overwritten).
 */
function classify(stored, oldKey, newKey) {
  const obj = parseValue(stored);
  if (!obj || typeof obj.ciphertext !== 'string' || typeof obj.salt !== 'string') {
    return 'malformed';
  }
  try {
    decryptWith(obj, newKey);
    return 'new';
  } catch {
    /* not the new key */
  }
  try {
    decryptWith(obj, oldKey);
    return 'old';
  } catch {
    return 'unknown';
  }
}

/**
 * Re-encrypt one stored value from old key to new key, verifying the round-trip.
 * Returns the new JSON string, or throws with a non-secret message.
 */
function reEncryptValue(stored, oldKey, newKey, { keyId } = {}) {
  const obj = parseValue(stored);
  if (!obj) throw new Error('value is not parseable EncryptedData JSON');

  const plaintext = decryptWith(obj, oldKey); // throws if old key is wrong
  const reencrypted = encryptWith(plaintext, newKey, keyId ?? obj.keyId);

  // Verify BEFORE returning: decrypt the new ciphertext with the new key and
  // confirm it matches. Never trust an unverified re-encryption.
  const check = decryptWith(reencrypted, newKey);
  if (check !== plaintext) {
    throw new Error('round-trip verification failed; not writing');
  }
  return JSON.stringify(reencrypted);
}

/**
 * Migrate a set of rows via a pluggable store, so this is testable without a
 * live DB. The store shape:
 *   fetchRows(table, column) -> [{ id, value }]
 *   updateRow(table, column, id, newValue) -> void   (only called with --apply)
 *
 * @returns per-target counts and the ids of any UNKNOWN values (never touched).
 */
async function migrate({ store, targets, oldKey, newKey, apply = false, keyId }) {
  const report = [];
  for (const { table, column } of targets) {
    const rows = await store.fetchRows(table, column);
    const counts = { table, column, total: rows.length, migrated: 0, alreadyNew: 0, unknown: 0, malformed: 0, unknownIds: [] };
    for (const row of rows) {
      const kind = classify(row.value, oldKey, newKey);
      if (kind === 'new') { counts.alreadyNew++; continue; }
      if (kind === 'malformed') { counts.malformed++; continue; }
      if (kind === 'unknown') { counts.unknown++; counts.unknownIds.push(row.id); continue; }
      // kind === 'old' → migrate
      const newValue = reEncryptValue(row.value, oldKey, newKey, { keyId });
      if (apply) await store.updateRow(table, column, row.id, newValue);
      counts.migrated++;
    }
    report.push(counts);
  }
  return report;
}

/**
 * Columns that hold EncryptedData, verified against the live schema
 * (packages/database/src/drizzle/schema/*.ts) on 2026-07-24. Table names are
 * the SQL names, not the Drizzle const names.
 *   agent_registrations.encrypted_auth_token   (schema/agents.ts:273)
 *   provider_api_keys.encrypted_key             (schema/configuration.ts:43)
 *   agent_managed_accounts.encrypted_secret     (schema/configuration.ts:111)
 *   jules_configs.api_key_encrypted             (schema/jules.ts:36)
 * Verify against your DB before --apply; a column not in EncryptedData JSON
 * format is reported as `malformed` and never touched.
 */
const DEFAULT_TARGETS = [
  { table: 'agent_registrations', column: 'encrypted_auth_token' },
  { table: 'provider_api_keys', column: 'encrypted_key' },
  { table: 'agent_managed_accounts', column: 'encrypted_secret' },
  { table: 'jules_configs', column: 'api_key_encrypted' },
];

function readKeysFromEnv() {
  const oldKey = process.env.TNF_ENCRYPTION_KEY_OLD;
  const newKey = process.env.TNF_ENCRYPTION_KEY_NEW;
  if (!oldKey || !newKey) {
    throw new Error(
      'Set TNF_ENCRYPTION_KEY_OLD and TNF_ENCRYPTION_KEY_NEW in the environment ' +
        '(never pass keys as CLI args). Both are required.'
    );
  }
  if (oldKey === newKey) throw new Error('old and new keys are identical — nothing to rotate');
  return { oldKey, newKey };
}

// --------------------------------------------------------------------------
// CLI (DB adapter is operator-run; guarded behind --apply)
// --------------------------------------------------------------------------

async function main() {
  const apply = process.argv.includes('--apply');
  if (!apply && !process.argv.includes('--plan')) {
    console.log('Usage: TNF_ENCRYPTION_KEY_OLD=.. TNF_ENCRYPTION_KEY_NEW=.. node scripts/tnf-encryption-key-rotate.cjs [--plan|--apply]');
    console.log('  --plan   dry-run: report counts, verify round-trips, write nothing (default safe mode)');
    console.log('  --apply  write re-encrypted values back');
    return;
  }
  const { oldKey, newKey } = readKeysFromEnv();

  // The DB adapter is intentionally required lazily and only when running for
  // real, so the pure library (and its tests) never depend on a DB driver.
  let store;
  try {
    store = require('./lib/tnf-encryption-store.cjs').makePostgresStore();
  } catch (err) {
    console.error(
      'No DB store adapter available (scripts/lib/tnf-encryption-store.cjs).\n' +
        'The core rotation logic is a tested library; wire it to your DB to run.\n' +
        `Detail: ${err.message}`
    );
    process.exitCode = 1;
    return;
  }

  const report = await migrate({ store, targets: DEFAULT_TARGETS, oldKey, newKey, apply });
  console.log(apply ? '=== APPLIED ===' : '=== DRY RUN (no writes) ===');
  let orphans = 0;
  for (const r of report) {
    console.log(`${r.table}.${r.column}: total=${r.total} migrated=${r.migrated} alreadyNew=${r.alreadyNew} unknown=${r.unknown} malformed=${r.malformed}`);
    if (r.unknown > 0) {
      orphans += r.unknown;
      console.log(`  ⚠️  ${r.unknown} value(s) decrypt under NEITHER key (ids: ${r.unknownIds.slice(0, 10).join(', ')}${r.unknownIds.length > 10 ? '…' : ''}) — left untouched`);
    }
  }
  if (orphans > 0) {
    console.log(`\n⚠️  ${orphans} value(s) could not be decrypted with the old key either — they were encrypted under some OTHER key and must be re-entered, not migrated.`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exitCode = 1; });

module.exports = {
  decryptWith,
  encryptWith,
  reEncryptValue,
  classify,
  migrate,
  readKeysFromEnv,
  DEFAULT_TARGETS,
};
