import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createHoldemTable,
  seatPlayer,
  startHand,
  applyAction,
  settleHand,
  exportReplayLog,
  replayEvents,
  tableSnapshot,
  recoverySnapshot,
  restoreFromRecovery,
} from '../core-logic/holdem-engine/index.mjs';

function fingerprint(snapshot) {
  return JSON.stringify({
    tableId: snapshot.tableId,
    buttonSeat: snapshot.buttonSeat,
    seats: snapshot.seats.map((s) => ({ seat: s.seat, stack: s.stack, playerId: s.playerId })),
    hand: snapshot.hand
      ? {
          handId: snapshot.hand.handId,
          status: snapshot.hand.status,
          street: snapshot.hand.street,
          pot: snapshot.hand.pot,
          payoutBySeat: snapshot.hand.payoutBySeat,
          sidePots: snapshot.hand.sidePots,
          actions: snapshot.hand.actionLog,
        }
      : null,
  });
}

test('deterministic replay reproduces terminal snapshot exactly', () => {
  const engine = createHoldemTable({
    tableId: 'replay-table',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
    ante: 10,
  });

  seatPlayer(engine, { playerId: 'p1', seat: 0, stack: 5000 });
  seatPlayer(engine, { playerId: 'p2', seat: 1, stack: 3200 });
  seatPlayer(engine, { playerId: 'p3', seat: 2, stack: 2700 });
  seatPlayer(engine, { playerId: 'p4', seat: 3, stack: 1500 });

  startHand(engine, { handId: 'h-replay-1', idempotencyKey: 'start-1' });

  for (let i = 0; i < 20 && !engine.hand.readyForSettlement; i += 1) {
    const acting = engine.hand.actingSeat;
    if (acting == null) break;
    const playerId = engine.seats[acting].playerId;
    const toCall = Math.max(0, engine.hand.currentBet - Number(engine.hand.streetCommitted[String(acting)] || 0));
    const action = toCall > 0 ? 'call' : 'check';
    applyAction(engine, {
      playerId,
      action,
      idempotencyKey: `step-${i}`,
    });
  }

  settleHand(engine, {
    rankingBySeat: { 0: 95, 1: 92, 2: 90, 3: 80 },
    settlementKey: 'settle-1',
  });

  const original = tableSnapshot(engine);
  const replay = replayEvents({
    tableId: 'replay-table',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
    ante: 10,
    events: exportReplayLog(engine),
  });

  const replaySnap = tableSnapshot(replay);
  assert.equal(fingerprint(replaySnap), fingerprint(original));

  const recovered = restoreFromRecovery(recoverySnapshot(engine));
  assert.equal(fingerprint(tableSnapshot(recovered)), fingerprint(original));
});
