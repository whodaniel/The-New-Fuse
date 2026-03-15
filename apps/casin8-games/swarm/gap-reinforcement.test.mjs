import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTournament,
  registerPlayer,
  startIfReady,
  advanceBlinds,
  rebalanceTables,
  eliminatePlayer,
  currentBlinds,
} from './tournament/index.mjs';
import { CashierTokenLedger } from '../core-logic/cashier-token/index.mjs';
import {
  createCommit,
  fairReceipt,
  verifyReceipt,
  scoreCollusionSignals,
} from '../core-logic/fairness-security/index.mjs';

test('tournament module handles registration/start/rebalance/elimination', () => {
  const t = createTournament({
    tournamentId: 'mtt-1',
    kind: 'mtt',
    maxPlayers: 20,
    minPlayersToStart: 4,
    startingStackUnits: 10_000,
  });

  for (const p of ['p1', 'p2', 'p3', 'p4', 'p5']) {
    registerPlayer(t, p);
  }

  const started = startIfReady(t, 1000);
  assert.equal(started.started, true);
  assert.equal(t.state, 'running');
  assert.equal(currentBlinds(t).bigBlind, 20);

  const advanced = advanceBlinds(t, 1000 + 10 * 60 * 1000 + 1);
  assert.equal(advanced.advanced, true);

  const rebalanced = rebalanceTables(t, 3);
  assert.equal(rebalanced.rebalanced, true);
  assert.ok(rebalanced.tableCount >= 2);

  eliminatePlayer(t, 'p1');
  eliminatePlayer(t, 'p2');
  eliminatePlayer(t, 'p3');
  eliminatePlayer(t, 'p4');
  assert.equal(t.state, 'completed');
});

test('cashier ledger enforces idempotency and reconciles balances', () => {
  const ledger = new CashierTokenLedger();

  const dep = ledger.applyDeposit({
    playerId: 'agent-7',
    amountUnits: 5000n,
    idempotencyKey: 'dep-1',
  });
  assert.equal(dep.accepted, true);

  const reserve = ledger.reserveBuyIn({
    playerId: 'agent-7',
    amountUnits: 1200n,
    idempotencyKey: 'res-1',
  });
  assert.equal(reserve.accepted, true);

  const settle = ledger.settleResult({
    playerId: 'agent-7',
    reservedUsedUnits: 1200n,
    payoutUnits: 1600n,
    idempotencyKey: 'set-1',
  });
  assert.equal(settle.accepted, true);

  const wdReq = ledger.requestWithdrawal({
    playerId: 'agent-7',
    amountUnits: 1000n,
    idempotencyKey: 'wd-1',
  });
  assert.equal(wdReq.accepted, true);

  const wdDone = ledger.finalizeWithdrawal({
    playerId: 'agent-7',
    amountUnits: 1000n,
    idempotencyKey: 'wd-final-1',
    status: 'confirmed',
  });
  assert.equal(wdDone.accepted, true);

  const dup = ledger.applyDeposit({
    playerId: 'agent-7',
    amountUnits: 10n,
    idempotencyKey: 'dep-1',
  });
  assert.equal(dup.duplicate, true);

  const rec = ledger.reconcile();
  assert.equal(rec.entries >= 5, true);
  assert.equal(rec.wallets['agent-7'].reservedUnits, '0');
});

test('fairness/security module verifies receipts and scores risk', () => {
  const commit = createCommit({
    sessionId: 'sess-1',
    serverSeed: 'server-seed-xyz',
  });

  const receipt = fairReceipt({
    serverSeed: commit.serverSeed,
    clientSeed: 'client-seed-abc',
    nonce: 3,
    game: 'poker',
    bet: 50,
    options: { tableId: 'table-9', handId: 'hand-22' },
  });

  const ok = verifyReceipt({
    serverSeed: commit.serverSeed,
    clientSeed: receipt.clientSeed,
    nonce: receipt.nonce,
    game: receipt.game,
    bet: receipt.bet,
    options: receipt.options,
    receiptDigest: receipt.digest,
  });
  assert.equal(ok.verified, true);

  const bad = verifyReceipt({
    serverSeed: 'wrong-seed',
    clientSeed: receipt.clientSeed,
    nonce: receipt.nonce,
    game: receipt.game,
    bet: receipt.bet,
    options: receipt.options,
    receiptDigest: receipt.digest,
  });
  assert.equal(bad.verified, false);

  const risk = scoreCollusionSignals([
    { playerA: 'a', playerB: 'b', softPlay: true },
    { playerA: 'a', playerB: 'b', unusualTransferUnits: 200 },
    { playerA: 'a', playerB: 'b', softPlay: false },
    { playerA: 'a', playerB: 'b', softPlay: true },
  ]);
  assert.equal(risk.level === 'medium' || risk.level === 'high', true);
});
