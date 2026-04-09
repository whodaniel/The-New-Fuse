import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCommit,
  rotateCommit,
  fairReceipt,
  verifyReceipt,
  scoreCollusionSignals,
} from './fairness-security/index.mjs';

test('fairness-security creates deterministic receipts and verification', () => {
  const commit = createCommit({ sessionId: 'sess-1', serverSeed: 'seed-abc' });
  assert.equal(commit.serverSeedHash.length, 64);

  const receipt = fairReceipt({
    serverSeed: commit.serverSeed,
    clientSeed: 'client-1',
    nonce: 1,
    game: 'poker',
    bet: 100,
    options: { tableId: 't-1' },
  });

  const verified = verifyReceipt({
    serverSeed: commit.serverSeed,
    clientSeed: 'client-1',
    nonce: 1,
    game: 'poker',
    bet: 100,
    options: { tableId: 't-1' },
    receiptDigest: receipt.digest,
  });

  assert.equal(verified.verified, true);

  const rotated = rotateCommit(commit);
  assert.equal(rotated.reveal.previousServerSeed, 'seed-abc');
  assert.equal(rotated.next.sessionId, 'sess-1');
  assert.notEqual(rotated.next.serverSeedHash, commit.serverSeedHash);
});

test('fairness-security scores collusion signals', () => {
  const rows = [
    { playerA: 'a', playerB: 'b', softPlay: true, unusualTransferUnits: 0 },
    { playerA: 'a', playerB: 'b', softPlay: true, unusualTransferUnits: 500 },
    { playerA: 'a', playerB: 'b', softPlay: false, unusualTransferUnits: 0 },
    { playerA: 'a', playerB: 'b', softPlay: false, unusualTransferUnits: 0 },
    { playerA: 'a', playerB: 'b', softPlay: false, unusualTransferUnits: 300 },
  ];

  const out = scoreCollusionSignals(rows);
  assert.equal(out.level === 'medium' || out.level === 'high', true);
  assert.equal(out.factors.softPlay, 2);
  assert.equal(out.factors.chipDump, 2);
  assert.equal(out.factors.repeatedHeadsUp, 1);
});
