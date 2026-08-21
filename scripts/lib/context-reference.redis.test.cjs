const assert = require('node:assert/strict');
const test = require('node:test');
const Redis = require('ioredis');

const {
  ContextReferenceError,
  hydrateContextReference,
  keyFromUri,
  storeContextReference,
  updateContextReference,
} = require('./context-reference.cjs');

const redis = new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 1 });
const keys = new Set();

test.after(async () => {
  if (keys.size > 0) await redis.del(...keys);
  await redis.quit();
});

async function stored(content, options = {}) {
  const result = await storeContextReference(redis, content, {
    authorityScope: 'test:green-context',
    ttlSeconds: 30,
    ...options,
  });
  keys.add(keyFromUri(result.reference.uri));
  return result;
}

test('stores and hydrates a versioned context reference through real Redis', async () => {
  const { reference } = await stored('full execution context');
  const ttl = await redis.ttl(keyFromUri(reference.uri));
  assert.ok(ttl > 0 && ttl <= 30);

  const result = await hydrateContextReference(redis, reference, { executionRole: 'executor' });
  assert.equal(result.hydrated, true);
  assert.equal(result.content, 'full execution context');
  assert.equal(result.receipt.outcome, 'hydrated');
  assert.equal(result.receipt.hydratedBytes, reference.byteCount);
});

test('passive nodes forward references without hydration', async () => {
  const { reference } = await stored('do not load me');
  const result = await hydrateContextReference(redis, reference, { executionRole: 'observer' });
  assert.equal(result.hydrated, false);
  assert.equal(result.reason, 'passive-role');
  assert.equal(result.receipt.outcome, 'forwarded-passive');
});

test('reports missing and expired references explicitly', async () => {
  const { reference } = await stored('ephemeral');
  await redis.del(keyFromUri(reference.uri));
  await assert.rejects(
    hydrateContextReference(redis, reference, { executionRole: 'worker' }),
    (error) => error instanceof ContextReferenceError && error.code === 'CONTEXT_REFERENCE_MISSING'
  );

  const expired = await stored('expired by contract', { nowMs: Date.now() - 60000 });
  await assert.rejects(
    hydrateContextReference(redis, expired.reference, { executionRole: 'worker' }),
    (error) => error instanceof ContextReferenceError && error.code === 'CONTEXT_REFERENCE_EXPIRED'
  );
});

test('detects snapshot drift and digest tampering', async () => {
  const { reference } = await stored('trusted content');
  await assert.rejects(
    hydrateContextReference(redis, { ...reference, snapshotVersion: 2 }, { executionRole: 'worker' }),
    (error) => error instanceof ContextReferenceError && error.code === 'CONTEXT_SNAPSHOT_DRIFT'
  );

  const key = keyFromUri(reference.uri);
  const record = JSON.parse(await redis.get(key));
  record.content = 'tampered content';
  await redis.set(key, JSON.stringify(record), 'EX', 30);
  await assert.rejects(
    hydrateContextReference(redis, reference, { executionRole: 'worker' }),
    (error) => error instanceof ContextReferenceError && error.code === 'CONTEXT_DIGEST_MISMATCH'
  );
});

test('uses compare-and-set versions to produce deterministic merge collisions', async () => {
  const { reference } = await stored('version one');
  const versionTwo = await updateContextReference(redis, reference, 'version two', { ttlSeconds: 30 });
  assert.equal(versionTwo.snapshotVersion, 2);

  await assert.rejects(
    updateContextReference(redis, reference, 'conflicting version two', { ttlSeconds: 30 }),
    (error) => error instanceof ContextReferenceError && error.code === 'CONTEXT_MERGE_COLLISION'
  );
});

test('bounds hydration time and emits a timeout receipt', async () => {
  const { reference } = await stored('slow path');
  const delayedRedis = {
    get: async (key) => {
      const raw = await redis.get(key);
      await new Promise((resolve) => setTimeout(resolve, 30));
      return raw;
    },
  };
  await assert.rejects(
    hydrateContextReference(delayedRedis, reference, { executionRole: 'executor', timeoutMs: 5 }),
    (error) =>
      error instanceof ContextReferenceError &&
      error.code === 'CONTEXT_HYDRATION_TIMEOUT' &&
      error.receipt?.outcome === 'timeout'
  );
});
