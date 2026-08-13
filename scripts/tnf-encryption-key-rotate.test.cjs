/**
 * Tests for the ENCRYPTION_KEY rotation migration.
 *
 * Two things must hold:
 *   1. Wire-format compatibility with packages/database/migrations/utils/
 *      encryption.util.ts — a value this migration writes must be readable by
 *      the app, and a value the app wrote must be readable here. Verified by
 *      reproducing the util's exact crypto inline and cross-decrypting.
 *   2. Safety: dry-run writes nothing, orphaned/foreign values are never
 *      overwritten, every migration is round-trip verified, and re-running is
 *      idempotent.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const rot = require('./tnf-encryption-key-rotate.cjs');

// --- Reproduce the util's crypto EXACTLY, to prove format compatibility. -----
function utilEncrypt(plaintext, password, keyId) {
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  return {
    ciphertext,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    algorithm: 'aes-256-gcm',
    keyId,
  };
}
function utilDecrypt(enc, password) {
  const salt = Buffer.from(enc.salt, 'base64');
  const iv = Buffer.from(enc.iv, 'base64');
  const key = crypto.scryptSync(password, salt, 32);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(Buffer.from(enc.authTag, 'base64'));
  return d.update(enc.ciphertext, 'base64', 'utf8') + d.final('utf8');
}

const OLD = 'old-encryption-key-value-aaaaaaaa';
const NEW = 'new-encryption-key-value-bbbbbbbb';
const OTHER = 'some-third-foreign-key-cccccccc';

// --- Format compatibility ---------------------------------------------------

test('this module can decrypt what the app util encrypted', () => {
  const fromApp = utilEncrypt('sk-provider-key-123', OLD, 'k1');
  assert.equal(rot.decryptWith(fromApp, OLD), 'sk-provider-key-123');
});

test('the app util can decrypt what this module encrypted', () => {
  const mine = rot.encryptWith('sk-provider-key-123', NEW, 'k2');
  assert.equal(utilDecrypt(mine, NEW), 'sk-provider-key-123');
});

test('wrong key throws (AES-GCM auth failure), never returns garbage', () => {
  const enc = rot.encryptWith('secret', NEW);
  assert.throws(() => rot.decryptWith(enc, OLD));
});

// --- reEncryptValue ---------------------------------------------------------

test('reEncrypt moves a value from old key to new key', () => {
  const oldEnc = JSON.stringify(utilEncrypt('token-abc', OLD));
  const migrated = rot.reEncryptValue(oldEnc, OLD, NEW);
  const obj = JSON.parse(migrated);
  assert.equal(rot.decryptWith(obj, NEW), 'token-abc', 'readable under new key');
  assert.throws(() => rot.decryptWith(obj, OLD), 'no longer readable under old key');
});

test('reEncrypt preserves keyId when not overridden', () => {
  const oldEnc = JSON.stringify(utilEncrypt('x', OLD, 'key-2024'));
  const obj = JSON.parse(rot.reEncryptValue(oldEnc, OLD, NEW));
  assert.equal(obj.keyId, 'key-2024');
});

test('reEncrypt throws on a value not encrypted under the old key', () => {
  const foreign = JSON.stringify(utilEncrypt('x', OTHER));
  assert.throws(() => rot.reEncryptValue(foreign, OLD, NEW));
});

// --- classify ---------------------------------------------------------------

test('classify distinguishes new / old / unknown / malformed', () => {
  assert.equal(rot.classify(JSON.stringify(utilEncrypt('a', NEW)), OLD, NEW), 'new');
  assert.equal(rot.classify(JSON.stringify(utilEncrypt('a', OLD)), OLD, NEW), 'old');
  assert.equal(rot.classify(JSON.stringify(utilEncrypt('a', OTHER)), OLD, NEW), 'unknown');
  assert.equal(rot.classify('not json at all', OLD, NEW), 'malformed');
  assert.equal(rot.classify('{"foo":1}', OLD, NEW), 'malformed');
});

// --- migrate (fake store) ---------------------------------------------------

function fakeStore(initial) {
  const data = structuredClone(initial);
  return {
    writes: [],
    async fetchRows(table, column) {
      return (data[`${table}.${column}`] || []).map((r) => ({ ...r }));
    },
    async updateRow(table, column, id, newValue) {
      this.writes.push({ table, column, id });
      const rows = data[`${table}.${column}`];
      rows.find((r) => r.id === id).value = newValue;
    },
    _data: data,
  };
}

const targets = [{ table: 'agent_api_keys', column: 'encrypted_key' }];

function seed() {
  return {
    'agent_api_keys.encrypted_key': [
      { id: 1, value: JSON.stringify(utilEncrypt('old-1', OLD)) },
      { id: 2, value: JSON.stringify(utilEncrypt('old-2', OLD)) },
      { id: 3, value: JSON.stringify(utilEncrypt('already-new', NEW)) },
      { id: 4, value: JSON.stringify(utilEncrypt('foreign', OTHER)) }, // orphan
      { id: 5, value: 'garbage-not-json' },
    ],
  };
}

test('dry-run reports correctly and writes NOTHING', async () => {
  const store = fakeStore(seed());
  const report = await rot.migrate({ store, targets, oldKey: OLD, newKey: NEW, apply: false });
  const r = report[0];
  assert.equal(r.total, 5);
  assert.equal(r.migrated, 2);
  assert.equal(r.alreadyNew, 1);
  assert.equal(r.unknown, 1);
  assert.equal(r.malformed, 1);
  assert.deepEqual(r.unknownIds, [4]);
  assert.equal(store.writes.length, 0, 'dry-run must not write');
});

test('apply writes only the old-key rows, and they become new-key readable', async () => {
  const store = fakeStore(seed());
  await rot.migrate({ store, targets, oldKey: OLD, newKey: NEW, apply: true });
  assert.deepEqual(store.writes.map((w) => w.id).sort(), [1, 2]);
  for (const id of [1, 2]) {
    const row = store._data['agent_api_keys.encrypted_key'].find((r) => r.id === id);
    assert.doesNotThrow(() => rot.decryptWith(JSON.parse(row.value), NEW));
  }
});

test('orphaned (unknown-key) value is NEVER overwritten', async () => {
  const store = fakeStore(seed());
  const before = store._data['agent_api_keys.encrypted_key'].find((r) => r.id === 4).value;
  await rot.migrate({ store, targets, oldKey: OLD, newKey: NEW, apply: true });
  const after = store._data['agent_api_keys.encrypted_key'].find((r) => r.id === 4).value;
  assert.equal(before, after, 'foreign-key data must be preserved untouched');
  assert.ok(!store.writes.find((w) => w.id === 4));
});

test('re-running after apply is idempotent (nothing left to migrate)', async () => {
  const store = fakeStore(seed());
  await rot.migrate({ store, targets, oldKey: OLD, newKey: NEW, apply: true });
  const second = await rot.migrate({ store, targets, oldKey: OLD, newKey: NEW, apply: true });
  assert.equal(second[0].migrated, 0);
  assert.equal(second[0].alreadyNew, 3, 'the 2 migrated + 1 originally-new all read as new now');
});

// --- key input guards -------------------------------------------------------

test('readKeysFromEnv requires both keys and rejects identical', () => {
  const save = { o: process.env.TNF_ENCRYPTION_KEY_OLD, n: process.env.TNF_ENCRYPTION_KEY_NEW };
  try {
    delete process.env.TNF_ENCRYPTION_KEY_OLD;
    delete process.env.TNF_ENCRYPTION_KEY_NEW;
    assert.throws(() => rot.readKeysFromEnv(), /required/);
    process.env.TNF_ENCRYPTION_KEY_OLD = 'same';
    process.env.TNF_ENCRYPTION_KEY_NEW = 'same';
    assert.throws(() => rot.readKeysFromEnv(), /identical/);
  } finally {
    if (save.o === undefined) delete process.env.TNF_ENCRYPTION_KEY_OLD; else process.env.TNF_ENCRYPTION_KEY_OLD = save.o;
    if (save.n === undefined) delete process.env.TNF_ENCRYPTION_KEY_NEW; else process.env.TNF_ENCRYPTION_KEY_NEW = save.n;
  }
});
