/**
 * Delegation records: does a real grant chain reconstruct as one tree?
 *
 * The point of these tests is the question TNF previously could not answer —
 * "given a root task, who is working on it and under whom" — so they build
 * genuine signed grants rather than hand-written record literals. A test over
 * fabricated rows would pass even if the grant join were broken.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const grants = require('./tnf-capability-grant.cjs');
const {
  buildDelegationRecord,
  appendDelegationRecord,
  readDelegationLedger,
  buildDelegationTree,
} = require('./tnf-delegation-record.cjs');

const keyring = new Map();
function makeIdentity(did) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  keyring.set(did, publicKey.export({ type: 'spki', format: 'pem' }));
  return {
    kind: 'file',
    async getPublicKey() {
      return { did, publicKeyPem: keyring.get(did), algorithm: 'Ed25519' };
    },
    async sign(payload) {
      return {
        signature: crypto.sign(null, Buffer.from(payload), privateKey).toString('base64'),
        algorithm: 'Ed25519',
        signedAt: new Date().toISOString(),
        rootDid: did,
      };
    },
  };
}
const resolvePublicKeyPem = (did) => keyring.get(did) || null;

const OP = 'did:key:zLedgerOp';
const SUB = 'did:key:zLedgerSub';
const W1 = 'did:key:zLedgerWorkerOne';
const W2 = 'did:key:zLedgerWorkerTwo';
const opRoot = makeIdentity(OP);
const subRoot = makeIdentity(SUB);

const CAPS = [{ with: 'repo:*', can: 'read' }];

function tempLedger() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-deleg-')), 'ledger.jsonl');
}

test('a signed 3-level chain reconstructs as one tree with correct parents and depth', async () => {
  const ledger = tempLedger();

  // operator -> sub-director -> two workers, all under one root task.
  const g1 = await grants.issueGrant({
    trustRoot: opRoot,
    audience: SUB,
    capabilities: CAPS,
    rootTaskId: 'root-1',
    reportOn: 'completion',
  });
  const g2 = await grants.issueGrant({
    trustRoot: subRoot,
    audience: W1,
    capabilities: CAPS,
    proof: [g1],
    parentCapabilities: CAPS,
  });
  const g3 = await grants.issueGrant({
    trustRoot: subRoot,
    audience: W2,
    capabilities: CAPS,
    proof: [g1],
    parentCapabilities: CAPS,
  });

  for (const g of [g1, g2, g3]) {
    const verified = grants.verifyGrant(g, { resolvePublicKeyPem });
    assert.equal(verified.authorized, true);
    appendDelegationRecord(buildDelegationRecord(verified), ledger);
  }

  const tree = buildDelegationTree('root-1', ledger);
  assert.equal(tree.count, 3, 'sub-director plus two workers');
  assert.equal(tree.maxDepth, 1);
  assert.deepEqual(tree.roots, [SUB], 'the sub-director is the only node with no parent in-tree');

  const sub = tree.nodes.get(SUB);
  assert.equal(sub.depth, 0);
  assert.deepEqual(sub.children.sort(), [W1, W2].sort(), 'both workers hang off the sub-director');

  // Every worker reports to the sub-director, not to the operator. This is the
  // property that replaces the single global handoff slot.
  assert.equal(tree.nodes.get(W1).returnTo, SUB);
  assert.equal(tree.nodes.get(W2).returnTo, SUB);
  assert.equal(sub.returnTo, OP);
});

test('a second root task does not bleed into the first tree', async () => {
  const ledger = tempLedger();

  const a = await grants.issueGrant({
    trustRoot: opRoot,
    audience: SUB,
    capabilities: CAPS,
    rootTaskId: 'root-A',
  });
  const b = await grants.issueGrant({
    trustRoot: opRoot,
    audience: W1,
    capabilities: CAPS,
    rootTaskId: 'root-B',
  });

  for (const g of [a, b]) {
    appendDelegationRecord(
      buildDelegationRecord(grants.verifyGrant(g, { resolvePublicKeyPem })),
      ledger
    );
  }

  assert.equal(buildDelegationTree('root-A', ledger).count, 1);
  assert.equal(buildDelegationTree('root-B', ledger).count, 1);
  assert.equal(readDelegationLedger(ledger).length, 2, 'both rows share one ledger');
});

test('an unverified grant is never recorded', () => {
  assert.throws(
    () => buildDelegationRecord({ authorized: false, verdict: 'expired' }),
    /refusing to record a delegation from an unverified grant/
  );
  assert.throws(() => buildDelegationRecord(null), /unverified grant/);
});

test('a truncated final line does not blind the ledger', () => {
  const ledger = tempLedger();
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.writeFileSync(
    ledger,
    `${JSON.stringify({ spec: 'tnf/delegation-record/0.1', rootTaskId: 'r', child: 'did:key:zA', parent: null, depth: 0 })}\n{"partial":`,
    'utf8'
  );
  // A crash mid-append must not discard the records written before it.
  assert.equal(readDelegationLedger(ledger).length, 1);
  assert.equal(buildDelegationTree('r', ledger).count, 1);
});
