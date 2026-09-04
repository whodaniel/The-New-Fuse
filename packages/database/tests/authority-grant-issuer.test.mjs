import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  AuthorityGrantIssuerService,
  ConfigurablePublicKeyResolver,
  DrizzleAuthorityGrantRepository,
  InMemoryTrustRootProvider,
} from '../dist/index.js';
import {
  buildAgentDid,
  verifyGrantChain,
  signGrant,
} from '@the-new-fuse/control-plane-contracts';

function genKey() {
  const kp = crypto.generateKeyPairSync('ed25519');
  return {
    publicKeyPem: kp.publicKey.export({ type: 'spki', format: 'pem' }),
    privateKeyPem: kp.privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

function createMockRepository(initialRows = [], keyResolver) {
  const rows = [...initialRows];
  const resolver = keyResolver ?? new ConfigurablePublicKeyResolver();

  const mockDb = {
    select() {
      return {
        from() {
          return {
            where(condition) {
              return {
                orderBy() {
                  return rows.filter((r) => !r.revokedAt);
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
              const inserted = {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
                ...val,
              };
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

  const repo = new DrizzleAuthorityGrantRepository(mockDb, resolver);

  // Direct array-backed overrides for accurate in-memory unit testing
  repo.findById = async (id) => rows.find((r) => r.id === id) ?? null;
  repo.findByIds = async (ids) => rows.filter((r) => ids.includes(r.id));
  repo.findLiveCandidatesBySubjectDid = async (did, now = new Date()) => {
    const t = now instanceof Date ? now : new Date(now);
    return rows.filter(
      (r) =>
        r.subjectDid.toLowerCase() === did.toLowerCase() &&
        !r.revokedAt &&
        new Date(r.notBefore) <= t &&
        new Date(r.expiresAt) > t
    );
  };
  repo.create = async (grant) => {
    const inserted = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...grant,
    };
    rows.push(inserted);
    return inserted;
  };
  repo.revoke = async (id, reason) => {
    const found = rows.find((r) => r.id === id);
    if (!found) return null;
    found.revokedAt = new Date();
    found.revocationReason = reason;
    return found;
  };
  repo._rows = rows;

  return { repo, rows, resolver };
}

test('AuthorityGrantIssuerService: refuses to mint when TrustRootProvider reports unavailable', async () => {
  const unavailableProvider = new InMemoryTrustRootProvider(
    undefined,
    'did:key:sd',
    false,
    'HSM custody key not present in slot 1'
  );

  const { repo } = createMockRepository();
  const service = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: unavailableProvider,
  });

  await assert.rejects(
    () =>
      service.issueGrant({
        callerDid: 'did:tnf:cloud:user:operator:root:001',
        subjectDid: 'did:tnf:cloud:agent:tnfcore:worker:001',
        role: 'worker',
      }),
    /signing key provider unavailable: HSM custody key not present in slot 1/
  );
});

test('AuthorityGrantIssuerService: gates issuance on resolved caller authority role (Task A)', async () => {
  const provider = new InMemoryTrustRootProvider();
  const { repo } = createMockRepository();
  const service = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: provider,
  });

  const workerDid = 'did:tnf:cloud:agent:tnfcli:worker:001';

  // Worker has no grants -> resolves to worker -> MUST be refused
  await assert.rejects(
    () =>
      service.issueGrant({
        callerDid: workerDid,
        subjectDid: 'did:tnf:cloud:agent:tnfcore:worker2:001',
        role: 'worker',
      }),
    /caller did:tnf:cloud:agent:tnfcli:worker:001 resolved to role 'worker'; issuance requires super-admin or super-director/
  );
});

test('AuthorityGrantIssuerService: operator issues super-director grant, which issues sub-director grant', async () => {
  const opKey = genKey();
  const dirKey = genKey();

  const keyResolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicKeyPem,
    'did:key:superdirector': dirKey.publicKeyPem,
  });

  const { repo } = createMockRepository([], keyResolver);

  const operatorDid = 'did:tnf:cloud:user:operator:root:001';
  const directorDid = 'did:tnf:cloud:system:tnfcore:superdirector:001';
  const agentDid = 'did:tnf:cloud:agent:tnfcore:agent1:001';

  // 1. Operator root grant exists in DB giving operator super-admin
  const rootGrant = {
    id: 'op-root-grant',
    subjectDid: operatorDid,
    role: 'super-admin',
    issuerDid: operatorDid,
    residency: 'cloud',
    tenantId: null,
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-op-root',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signatureAlgorithm: 'Ed25519',
  };
  rootGrant.signature = signGrant(rootGrant, opKey.privateKeyPem);
  repo._rows.push(rootGrant);

  // 2. Operator issues super-director grant to directorDid using operator provider
  const opProvider = new InMemoryTrustRootProvider(opKey, 'did:key:operator');
  const opService = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: opProvider,
  });

  const sdGrant = await opService.issueGrant({
    callerDid: operatorDid,
    subjectDid: directorDid,
    role: 'super-director',
    ttlSeconds: 7200,
    purpose: 'seat super-director',
  });

  assert.ok(sdGrant.id);
  assert.equal(sdGrant.role, 'super-director');
  assert.equal(sdGrant.subjectDid, directorDid);
  assert.equal(sdGrant.issuerDid, operatorDid);
  assert.equal(sdGrant.signingKeyDid, 'did:key:operator');

  // Verify director now resolves to super-director via Task A
  const directorVerdict = await repo.resolveAuthorityForSubject(directorDid);
  assert.equal(directorVerdict.ok, true);
  assert.equal(directorVerdict.role, 'super-director');

  // 3. Super Director issues sub-director grant to tenant agent
  const sdProvider = new InMemoryTrustRootProvider(dirKey, 'did:key:superdirector');
  const sdService = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: sdProvider,
  });

  const agentGrant = await sdService.issueGrant({
    callerDid: directorDid,
    subjectDid: agentDid,
    role: 'sub-director',
    parentGrantId: sdGrant.id,
    ttlSeconds: 1800,
    purpose: 'task delegation',
  });

  assert.ok(agentGrant.id);
  assert.equal(agentGrant.role, 'sub-director');
  assert.equal(agentGrant.issuerDid, directorDid);
  assert.equal(agentGrant.parentGrantId, sdGrant.id);

  // 4. Verify agent authority resolves end-to-end through the delegation chain
  const agentVerdict = await repo.resolveAuthorityForSubject(agentDid);
  assert.equal(agentVerdict.ok, true);
  assert.equal(agentVerdict.role, 'sub-director');
  assert.equal(agentVerdict.source, 'signed-grant');
});

test('AuthorityGrantIssuerService: rejects attenuation violation at issue time', async () => {
  const opKey = genKey();
  const dirKey = genKey();
  const keyResolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicKeyPem,
    'did:key:superdirector': dirKey.publicKeyPem,
  });

  const { repo } = createMockRepository([], keyResolver);

  const operatorDid = 'did:tnf:cloud:user:operator:root:001';
  const directorDid = 'did:tnf:cloud:system:tnfcore:superdirector:001';

  // Super Director grant
  const sdGrant = {
    id: 'sd-grant-1',
    subjectDid: directorDid,
    role: 'super-director',
    issuerDid: operatorDid,
    residency: 'cloud',
    tenantId: null,
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-sd',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 7200000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signatureAlgorithm: 'Ed25519',
  };
  sdGrant.signature = signGrant(sdGrant, opKey.privateKeyPem);
  repo._rows.push(sdGrant);

  const sdProvider = new InMemoryTrustRootProvider(dirKey, 'did:key:superdirector');
  const sdService = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: sdProvider,
  });

  // Attempt to mint super-admin (exceeding super-director)
  await assert.rejects(
    () =>
      sdService.issueGrant({
        callerDid: directorDid,
        subjectDid: 'did:tnf:cloud:agent:tnfcore:escalated:001',
        role: 'super-admin',
        parentGrantId: sdGrant.id,
      }),
    /refusing to mint a grant the resolver would reject: child role super-admin exceeds issuer role super-director/
  );
});

test('AuthorityGrantIssuerService: renewGrant mints a new row and preserves historical row', async () => {
  const opKey = genKey();
  const keyResolver = new ConfigurablePublicKeyResolver({
    'did:key:operator': opKey.publicKeyPem,
  });

  const { repo } = createMockRepository([], keyResolver);
  const operatorDid = 'did:tnf:cloud:user:operator:root:001';
  const agentDid = 'did:tnf:cloud:agent:tnfcore:worker1:001';

  // Root grant for operator
  const opRoot = {
    id: 'op-root',
    subjectDid: operatorDid,
    role: 'super-admin',
    issuerDid: operatorDid,
    residency: 'cloud',
    tenantId: null,
    signingKeyDid: 'did:key:operator',
    nonce: 'nonce-op',
    notBefore: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    crossResidency: false,
    parentGrantId: null,
    proofChain: [],
    signatureAlgorithm: 'Ed25519',
  };
  opRoot.signature = signGrant(opRoot, opKey.privateKeyPem);
  repo._rows.push(opRoot);

  const opProvider = new InMemoryTrustRootProvider(opKey, 'did:key:operator');
  const service = new AuthorityGrantIssuerService({
    repository: repo,
    trustRootProvider: opProvider,
  });

  // 1. Issue initial grant
  const initialGrant = await service.issueGrant({
    callerDid: operatorDid,
    subjectDid: agentDid,
    role: 'sub-director',
    ttlSeconds: 600,
    purpose: 'initial session',
  });

  // 2. Renew grant
  const renewedGrant = await service.renewGrant({
    callerDid: operatorDid,
    grantId: initialGrant.id,
    ttlSeconds: 1200,
  });

  // Verify new row was created rather than updating expiresAt
  assert.notEqual(renewedGrant.id, initialGrant.id);
  assert.notEqual(renewedGrant.nonce, initialGrant.nonce);
  assert.equal(renewedGrant.subjectDid, initialGrant.subjectDid);
  assert.equal(renewedGrant.role, initialGrant.role);
  assert.ok(new Date(renewedGrant.expiresAt) > new Date(initialGrant.expiresAt));

  // Both rows exist in repository
  const oldRow = await repo.findById(initialGrant.id);
  const newRow = await repo.findById(renewedGrant.id);
  assert.ok(oldRow);
  assert.ok(newRow);
  assert.equal(oldRow.nonce, initialGrant.nonce);
});
