import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  ConfigurablePublicKeyResolver,
  DrizzleAuthorityGrantRepository,
} from '../dist/index.js';
import {
  buildAgentDid,
  signGrant,
} from '@the-new-fuse/control-plane-contracts';

function genKey() {
  const kp = crypto.generateKeyPairSync('ed25519');
  return {
    publicPem: kp.publicKey.export({ type: 'spki', format: 'pem' }),
    privatePem: kp.privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

test('ConfigurablePublicKeyResolver: resolves keys and fails closed', () => {
  const opKey = genKey();
  const dirKey = genKey();

  const resolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicPem,
  });

  // Returns registered key
  assert.equal(resolver.resolvePublicKey('did:key:operator'), opKey.publicPem.trim());
  assert.equal(resolver.hasKey('did:key:operator'), true);

  // Unknown key returns null, NEVER a default
  assert.equal(resolver.resolvePublicKey('did:key:unknown'), null);
  assert.equal(resolver.resolvePublicKey(''), null);
  assert.equal(resolver.hasKey('did:key:unknown'), false);

  // Runtime registration
  resolver.registerKey('did:key:director', dirKey.publicPem);
  assert.equal(resolver.resolvePublicKey('did:key:director'), dirKey.publicPem.trim());
  assert.deepEqual(resolver.getRegisteredKeyDids().sort(), ['did:key:director', 'did:key:operator']);
});

test('ConfigurablePublicKeyResolver: loads from TNF_AUTHORITY_PUBLIC_KEYS env var', () => {
  const k = genKey();
  const originalEnv = process.env.TNF_AUTHORITY_PUBLIC_KEYS;

  try {
    process.env.TNF_AUTHORITY_PUBLIC_KEYS = JSON.stringify({
      'did:key:env-test': k.publicPem,
    });

    const resolver = new ConfigurablePublicKeyResolver();
    assert.equal(resolver.resolvePublicKey('did:key:env-test'), k.publicPem.trim());

    // Malformed JSON should fail closed and not throw
    process.env.TNF_AUTHORITY_PUBLIC_KEYS = '{ invalid json';
    const fallbackResolver = new ConfigurablePublicKeyResolver();
    assert.equal(fallbackResolver.resolvePublicKey('did:key:env-test'), null);
  } finally {
    if (originalEnv === undefined) {
      delete process.env.TNF_AUTHORITY_PUBLIC_KEYS;
    } else {
      process.env.TNF_AUTHORITY_PUBLIC_KEYS = originalEnv;
    }
  }
});

// In-memory fake database simulating Drizzle client query responses
function createMockDatabase(initialRows = []) {
  const rows = [...initialRows];

  return {
    _rows: rows,
    select() {
      return {
        from() {
          return {
            where(condition) {
              return {
                orderBy() {
                  return rows;
                },
                then(resolve) {
                  resolve(rows);
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values(val) {
          return {
            returning() {
              const inserted = { id: crypto.randomUUID(), ...val };
              rows.push(inserted);
              return [inserted];
            },
          };
        },
      };
    },
    update() {
      return {
        set(changes) {
          return {
            where() {
              return {
                returning() {
                  return [{ ...changes }];
                },
              };
            },
          };
        },
      };
    },
  };
}

test('DrizzleAuthorityGrantRepository: resolveAuthorityForSubject with valid root grant', async () => {
  const opKey = genKey();
  const resolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicPem,
  });

  const subjectDid = buildAgentDid({
    scope: 'cloud',
    category: 'agent',
    provider: 'tnfcore',
    name: 'superdirector',
    instance: '001',
  });

  const grantData = {
    id: 'grant-root-1',
    subjectDid,
    role: 'super-director',
    issuerDid: 'did:tnf:cloud:user:operator:root:001',
    tenantId: null,
    residency: 'cloud',
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-001',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 3600000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signatureAlgorithm: 'Ed25519',
  };
  grantData.signature = signGrant(grantData, opKey.privatePem);

  // Mock DB where findLiveCandidates returns grantData and findByIds returns empty
  const mockDb = {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return [grantData];
                },
                then(res) {
                  res([grantData]);
                },
              };
            },
          };
        },
      };
    },
  };

  const repo = new DrizzleAuthorityGrantRepository(mockDb, resolver);
  const result = await repo.resolveAuthorityForSubject(subjectDid);

  assert.equal(result.ok, true);
  assert.equal(result.role, 'super-director');
  assert.equal(result.source, 'signed-grant');
  assert.equal(result.grantId, 'grant-root-1');
});

test('DrizzleAuthorityGrantRepository: recursive parent prefetching and chain verification', async () => {
  const opKey = genKey();
  const dirKey = genKey();

  const resolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicPem,
    'did:key:superdirector': dirKey.publicPem,
  });

  const operatorDid = 'did:tnf:cloud:user:operator:admin:001';
  const directorDid = 'did:tnf:cloud:system:tnfcore:superdirector:001';
  const workerDid = 'did:tnf:cloud:agent:tnfcli:worker:001';

  // 1. Root grant to Super Director signed by Operator
  const rootGrant = {
    id: 'grant-root-id',
    subjectDid: directorDid,
    role: 'super-director',
    issuerDid: operatorDid,
    tenantId: null,
    residency: 'cloud',
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-root',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 7200000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signatureAlgorithm: 'Ed25519',
  };
  rootGrant.signature = signGrant(rootGrant, opKey.privatePem);

  // 2. Delegated child grant to Worker signed by Super Director
  const childGrant = {
    id: 'grant-child-id',
    subjectDid: workerDid,
    role: 'sub-director',
    issuerDid: directorDid,
    tenantId: null,
    residency: 'cloud',
    signingKeyDid: 'did:key:superdirector',
    nonce: 'nonce-child',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 1800000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: 'grant-root-id',
    proofChain: ['grant-root-id'],
    signatureAlgorithm: 'Ed25519',
  };
  childGrant.signature = signGrant(childGrant, dirKey.privatePem);

  // Mock DB tracking candidate query vs parent lookup
  const mockDb = {
    select() {
      return {
        from() {
          return {
            where(condition) {
              return {
                orderBy() {
                  // findLiveCandidatesBySubjectDid called
                  return [childGrant];
                },
                then(resolve) {
                  // For findByIds([grant-root-id]), returns rootGrant
                  resolve([rootGrant]);
                },
              };
            },
          };
        },
      };
    },
  };

  const repo = new DrizzleAuthorityGrantRepository(mockDb, resolver);
  const result = await repo.resolveAuthorityForSubject(workerDid);

  assert.equal(result.ok, true);
  assert.equal(result.role, 'sub-director');
  assert.equal(result.source, 'signed-grant');
  assert.equal(result.grantId, 'grant-child-id');
});

test('DrizzleAuthorityGrantRepository: tampering fails closed to worker', async () => {
  const opKey = genKey();
  const resolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicPem,
  });

  const subjectDid = 'did:tnf:cloud:agent:tnfcore:attacker:001';

  const grantData = {
    id: 'grant-tampered',
    subjectDid,
    role: 'super-admin', // Attacker claims super-admin
    issuerDid: 'did:tnf:cloud:user:operator:root:001',
    tenantId: null,
    residency: 'cloud',
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-evil',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 3600000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signature: 'bad-signature',
    signatureAlgorithm: 'Ed25519',
  };

  const mockDb = {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return [grantData];
                },
                then(res) {
                  res([grantData]);
                },
              };
            },
          };
        },
      };
    },
  };

  const repo = new DrizzleAuthorityGrantRepository(mockDb, resolver);
  const result = await repo.resolveAuthorityForSubject(subjectDid);

  // Must fail closed to worker
  assert.equal(result.ok, true);
  assert.equal(result.role, 'worker');
  assert.equal(result.source, 'default');
  assert.ok(result.rejected && result.rejected.length > 0);
  assert.equal(result.rejected[0].verdict, 'invalid');
});

test('DrizzleAuthorityGrantRepository: database error fails closed to worker', async () => {
  const brokenDb = {
    select() {
      throw new Error('Connection refused');
    },
  };

  const repo = new DrizzleAuthorityGrantRepository(brokenDb);
  const result = await repo.resolveAuthorityForSubject('did:tnf:cloud:agent:x:y:001');

  assert.equal(result.ok, false);
  assert.equal(result.role, 'worker');
  assert.equal(result.source, 'error-fallback');
  assert.match(result.reason, /Connection refused/);
});
