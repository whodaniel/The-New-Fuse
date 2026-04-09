import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMtt,
  registerMttPlayer,
  startMtt,
  eliminateMttPlayer,
  getMttSnapshot,
  MTT_STATUS,
} from './tournaments-mtt/index.mjs';
import { CashierTokenLedger } from './cashier-token/index.mjs';

test('tournaments-mtt registers players, starts, rebalances, completes', () => {
  const mtt = createMtt({
    tournamentId: 'mtt-1',
    maxPlayers: 12,
    tableMaxSeats: 6,
    buyInUnits: 500n,
  });

  for (let i = 1; i <= 12; i += 1) {
    registerMttPlayer(mtt, { playerId: `p-${i}` });
  }

  const started = startMtt(mtt);
  assert.equal(started.status, MTT_STATUS.RUNNING);
  assert.equal(started.tableCount, 2);

  for (let i = 12; i >= 2; i -= 1) {
    eliminateMttPlayer(mtt, `p-${i}`, i);
  }

  const done = getMttSnapshot(mtt);
  assert.equal(done.status, MTT_STATUS.COMPLETE);
  assert.equal(done.activePlayers, 1);
});

test('cashier-token enforces idempotency and reconciliation', () => {
  const ledger = new CashierTokenLedger();

  const c1 = ledger.applyDeposit({
    playerId: 'agent-1',
    amountUnits: 1000n,
    idempotencyKey: 'k1',
    source: 'fiat-bridge',
  });
  assert.equal(c1.accepted, true);
  assert.equal(c1.balance.availableUnits, '1000');

  const c1dup = ledger.applyDeposit({
    playerId: 'agent-1',
    amountUnits: 1000n,
    idempotencyKey: 'k1',
    source: 'fiat-bridge',
  });
  assert.equal(c1dup.accepted, false);
  assert.equal(c1dup.duplicate, true);

  const d1 = ledger.reserveBuyIn({
    playerId: 'agent-1',
    amountUnits: 250n,
    idempotencyKey: 'k2',
    context: 'table-buyin',
  });
  assert.equal(d1.accepted, true);
  assert.equal(d1.balance.availableUnits, '750');
  assert.equal(d1.balance.reservedUnits, '250');

  const s1 = ledger.settleResult({
    playerId: 'agent-1',
    reservedUsedUnits: 250n,
    payoutUnits: 400n,
    idempotencyKey: 'k3',
    context: 'hand-settlement',
  });
  assert.equal(s1.accepted, true);
  assert.equal(s1.balance.availableUnits, '1150');
  assert.equal(s1.balance.reservedUnits, '0');

  const rec = ledger.reconcile();
  assert.equal(rec.entries, 3);
  assert.equal(rec.totals.availableUnits, '1150');
  assert.equal(rec.totals.reservedUnits, '0');
});
