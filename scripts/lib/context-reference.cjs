const crypto = require('node:crypto');

const CONTEXT_URI_PREFIX = 'redis://tnf:context:';
const CONTEXT_KEY_PREFIX = 'tnf:context:';
const CONTEXT_VERSION = 'dacc-context-ref/1.0';
const CER_VERSION = 'cer/1.0';
const EXECUTING_ROLES = new Set(['broker', 'coordinator', 'executor', 'worker']);

class ContextReferenceError extends Error {
  constructor(code, message, receipt) {
    super(message);
    this.name = 'ContextReferenceError';
    this.code = code;
    this.receipt = receipt;
  }
}

function byteCount(value) {
  return Buffer.byteLength(String(value || ''), 'utf8');
}

function digestContent(content) {
  return `sha256:${crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex')}`;
}

function keyFromUri(uri) {
  const value = String(uri || '');
  if (!value.startsWith(CONTEXT_URI_PREFIX)) {
    throw new ContextReferenceError('CONTEXT_REFERENCE_INVALID', `Unsupported context URI: ${value}`);
  }
  const id = value.slice(CONTEXT_URI_PREFIX.length);
  if (!/^[A-Za-z0-9._-]+$/.test(id)) {
    throw new ContextReferenceError('CONTEXT_REFERENCE_INVALID', `Invalid context reference id: ${id}`);
  }
  return `${CONTEXT_KEY_PREFIX}${id}`;
}

function createCerReceipt(reference, options = {}) {
  const originalBytes = options.originalBytes ?? reference.byteCount ?? 0;
  const inlineBytes = options.inlineBytes ?? 0;
  const hydratedBytes = options.hydratedBytes ?? 0;
  const savedTransportBytes = originalBytes - inlineBytes;
  const cer = originalBytes === 0 ? 1 : savedTransportBytes / originalBytes;
  return {
    version: CER_VERSION,
    contextUri: reference.uri,
    originalBytes,
    inlineBytes,
    hydratedBytes,
    savedTransportBytes,
    cer: Math.max(-1, Math.min(1, cer)),
    outcome: options.outcome || 'referenced',
    measuredAt: new Date().toISOString(),
  };
}

function buildContextReference(content, options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? 3600;
  const id = options.id || `ctx-${nowMs}-${crypto.randomBytes(4).toString('hex')}`;
  return {
    version: CONTEXT_VERSION,
    uri: `${CONTEXT_URI_PREFIX}${id}`,
    digest: digestContent(content),
    byteCount: byteCount(content),
    createdAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + ttlSeconds * 1000).toISOString(),
    snapshotVersion: options.snapshotVersion ?? 1,
    authorityScope: options.authorityScope || 'channel:unknown',
    ...(options.producerAgentId ? { producerAgentId: options.producerAgentId } : {}),
    contentType: options.contentType || 'text/plain; charset=utf-8',
  };
}

async function storeContextReference(redis, content, options = {}) {
  const ttlSeconds = options.ttlSeconds ?? 3600;
  const reference = buildContextReference(content, { ...options, ttlSeconds });
  const record = { reference, content: String(content || '') };
  await redis.set(keyFromUri(reference.uri), JSON.stringify(record), 'EX', ttlSeconds);
  return { reference, record };
}

function normalizeExpectedReference(referenceOrUri) {
  return typeof referenceOrUri === 'string' ? { uri: referenceOrUri } : referenceOrUri;
}

function timeoutAfter(timeoutMs, reference) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ContextReferenceError(
          'CONTEXT_HYDRATION_TIMEOUT',
          `Context hydration exceeded ${timeoutMs}ms`,
          createCerReceipt(reference, { outcome: 'timeout' })
        )
      );
    }, timeoutMs);
    timer.unref?.();
  });
}

async function hydrateContextReference(redis, referenceOrUri, options = {}) {
  const expected = normalizeExpectedReference(referenceOrUri);
  const executionRole = String(options.executionRole || 'passive').toLowerCase();
  if (!EXECUTING_ROLES.has(executionRole)) {
    return {
      hydrated: false,
      reason: 'passive-role',
      reference: expected,
      receipt: createCerReceipt(expected, { outcome: 'forwarded-passive' }),
    };
  }

  const timeoutMs = options.timeoutMs ?? 2000;
  const raw = await Promise.race([redis.get(keyFromUri(expected.uri)), timeoutAfter(timeoutMs, expected)]);
  if (!raw) {
    throw new ContextReferenceError(
      'CONTEXT_REFERENCE_MISSING',
      `Context reference is missing or expired: ${expected.uri}`,
      createCerReceipt(expected, { outcome: 'missing' })
    );
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    throw new ContextReferenceError('CONTEXT_REFERENCE_INVALID', 'Context record is not valid JSON');
  }

  const actual = record.reference || {};
  if (actual.version !== CONTEXT_VERSION || actual.uri !== expected.uri) {
    throw new ContextReferenceError('CONTEXT_REFERENCE_INVALID', 'Context record contract mismatch');
  }
  if (Date.parse(actual.expiresAt) <= Date.now()) {
    throw new ContextReferenceError(
      'CONTEXT_REFERENCE_EXPIRED',
      `Context reference expired: ${actual.uri}`,
      createCerReceipt(actual, { outcome: 'expired' })
    );
  }
  if (
    expected.snapshotVersion !== undefined &&
    actual.snapshotVersion !== expected.snapshotVersion
  ) {
    throw new ContextReferenceError(
      'CONTEXT_SNAPSHOT_DRIFT',
      `Expected snapshot ${expected.snapshotVersion}, found ${actual.snapshotVersion}`,
      createCerReceipt(actual, { outcome: 'snapshot-drift' })
    );
  }
  const content = String(record.content || '');
  if (digestContent(content) !== actual.digest || byteCount(content) !== actual.byteCount) {
    throw new ContextReferenceError(
      'CONTEXT_DIGEST_MISMATCH',
      `Context digest or byte count mismatch: ${actual.uri}`,
      createCerReceipt(actual, { outcome: 'digest-mismatch' })
    );
  }

  return {
    hydrated: true,
    content,
    reference: actual,
    receipt: createCerReceipt(actual, {
      inlineBytes: options.inlineBytes ?? 0,
      hydratedBytes: actual.byteCount,
      outcome: 'hydrated',
    }),
  };
}

async function updateContextReference(redis, reference, nextContent, options = {}) {
  const ttlSeconds = options.ttlSeconds ?? 3600;
  const nowMs = options.nowMs ?? Date.now();
  const nextReference = buildContextReference(nextContent, {
    ...reference,
    id: reference.uri.slice(CONTEXT_URI_PREFIX.length),
    nowMs,
    ttlSeconds,
    snapshotVersion: reference.snapshotVersion + 1,
  });
  const nextRecord = JSON.stringify({ reference: nextReference, content: String(nextContent || '') });
  const script = `
local raw = redis.call('GET', KEYS[1])
if not raw then return -1 end
local current = cjson.decode(raw)
if tonumber(current.reference.snapshotVersion) ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`;
  const result = await redis.eval(
    script,
    1,
    keyFromUri(reference.uri),
    String(reference.snapshotVersion),
    nextRecord,
    String(ttlSeconds)
  );
  if (result === -1) {
    throw new ContextReferenceError('CONTEXT_REFERENCE_MISSING', `Context is missing: ${reference.uri}`);
  }
  if (result !== 1) {
    throw new ContextReferenceError(
      'CONTEXT_MERGE_COLLISION',
      `Snapshot changed before update: ${reference.uri}`,
      createCerReceipt(reference, { outcome: 'merge-collision' })
    );
  }
  return nextReference;
}

module.exports = {
  ContextReferenceError,
  buildContextReference,
  createCerReceipt,
  digestContent,
  hydrateContextReference,
  keyFromUri,
  storeContextReference,
  updateContextReference,
};
