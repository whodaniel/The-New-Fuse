import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createHoldemTable,
  seatPlayer,
  startHand,
  applyAction,
  settleHand,
  computeSidePots,
  legalActionsForSeat,
  agentState,
  markMissedBlind,
  configureRiskCap,
  requestStraddle,
} from '../core-logic/holdem-engine/index.mjs';

function sum(values) {
  return values.reduce((acc, n) => acc + Number(n || 0), 0);
}

test('holdem-engine handles missed/dead blinds, action order, risk caps, idempotent settlement', () => {
  const engine = createHoldemTable({
    tableId: 'cash-1',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
    ante: 10,
    buttonSeat: 0,
  });

  seatPlayer(engine, { playerId: 'p1', seat: 0, stack: 5000 });
  seatPlayer(engine, { playerId: 'p2', seat: 1, stack: 5000 });
  seatPlayer(engine, { playerId: 'p3', seat: 2, stack: 5000 });
  seatPlayer(engine, { playerId: 'p4', seat: 3, stack: 5000 });

  markMissedBlind(engine, { playerId: 'p4', bigBlind: true });
  configureRiskCap(engine, { playerId: 'p3', maxCommitPerHand: 800 });

  const started = startHand(engine, { handId: 'h-1', idempotencyKey: 'start-h1' });
  assert.equal(started.hand.handId, 'h-1');
  assert.equal(started.hand.forcedPosts.some((row) => row.kind === 'dead_blind'), true);

  const firstSeat = engine.hand.actingSeat;
  const firstLegal = legalActionsForSeat(engine, engine.hand, firstSeat);
  assert.equal(firstLegal.length > 0, true);

  const actor = engine.seats[firstSeat].playerId;
  applyAction(engine, {
    playerId: actor,
    action: 'call',
    idempotencyKey: 'a1',
  });

  const nextSeat = engine.hand.actingSeat;
  const nextActor = engine.seats[nextSeat].playerId;
  const state = agentState(engine, { seat: nextSeat });
  assert.equal(state.actingSeat, nextSeat);
  assert.equal(Array.isArray(state.legalActions), true);

  applyAction(engine, {
    playerId: nextActor,
    action: 'raise',
    amount: engine.hand.currentBet + engine.hand.lastAggressiveDelta,
    idempotencyKey: 'a2',
  });

  // Risk cap branch for p3
  const seatP3 = engine.seats.find((s) => s && s.playerId === 'p3').seat;
  if (engine.hand.actingSeat !== seatP3) {
    applyAction(engine, {
      playerId: engine.seats[engine.hand.actingSeat].playerId,
      action: 'fold',
      idempotencyKey: 'a2b',
    });
  }

  assert.throws(() => {
    applyAction(engine, {
      playerId: 'p3',
      action: 'allin',
      idempotencyKey: 'risk-fail',
    });
  }, /Risk cap exceeded/);

  applyAction(engine, {
    playerId: 'p3',
    action: 'fold',
    idempotencyKey: 'a3',
  });

  while (engine.hand && !engine.hand.readyForSettlement) {
    const actingSeat = engine.hand.actingSeat;
    if (actingSeat == null) break;
    const playerId = engine.seats[actingSeat].playerId;
    const legal = legalActionsForSeat(engine, engine.hand, actingSeat).map((row) => row.action);
    const action = legal.includes('check') ? 'check' : legal.includes('call') ? 'call' : 'fold';
    applyAction(engine, {
      playerId,
      action,
      idempotencyKey: `loop-${engine.hand.actionLog.length + 1}`,
    });
  }

  const settled = settleHand(engine, {
    rankingBySeat: { 0: 100, 1: 90, 2: 20, 3: 10 },
    settlementKey: 'settle-h1',
  });
  const settledAgain = settleHand(engine, {
    rankingBySeat: { 0: 100, 1: 90, 2: 20, 3: 10 },
    settlementKey: 'settle-h1',
  });

  assert.deepEqual(settled.hand.payoutBySeat, settledAgain.hand.payoutBySeat);
});

test('all-in side-pot matrix covers >30 scenarios', () => {
  const scenarios = [];
  const commitSets = [
    [100, 100, 100],
    [120, 80, 40],
    [500, 300, 300],
    [1000, 600, 250],
    [750, 750, 100],
    [900, 500, 500],
  ];
  const rankSets = [
    { 0: 10, 1: 9, 2: 8 },
    { 0: 9, 1: 10, 2: 8 },
    { 0: 8, 1: 9, 2: 10 },
    { 0: 10, 1: 10, 2: 8 },
    { 0: 7, 1: 10, 2: 10 },
    { 0: 10, 1: 7, 2: 10 },
  ];

  for (let i = 0; i < commitSets.length; i += 1) {
    for (let j = 0; j < rankSets.length; j += 1) {
      scenarios.push({
        committedBySeat: { 0: commitSets[i][0], 1: commitSets[i][1], 2: commitSets[i][2] },
        foldedSeats: [],
        rankingBySeat: rankSets[j],
      });
      scenarios.push({
        committedBySeat: { 0: commitSets[i][0], 1: commitSets[i][1], 2: commitSets[i][2] },
        foldedSeats: [2],
        rankingBySeat: rankSets[j],
      });
    }
  }

  assert.equal(scenarios.length > 30, true);

  for (const scenario of scenarios) {
    const out = computeSidePots(
      scenario.committedBySeat,
      scenario.foldedSeats,
      scenario.rankingBySeat
    );

    const invested = sum(Object.values(scenario.committedBySeat));
    const paid = sum(Object.values(out.payoutBySeat));
    assert.equal(paid, invested);

    for (const pot of out.sidePots) {
      assert.equal(pot.amount > 0, true);
      assert.equal(Array.isArray(pot.winners), true);
      assert.equal(pot.winners.length > 0, true);
      for (const seat of pot.winners) {
        assert.equal(scenario.foldedSeats.includes(seat), false);
      }
    }
  }
});

test('short all-in raise accepted and does not require full-reopen delta', () => {
  const engine = createHoldemTable({ tableId: 'cash-short', maxSeats: 4, smallBlind: 25, bigBlind: 50 });
  seatPlayer(engine, { playerId: 'a', seat: 0, stack: 1000 });
  seatPlayer(engine, { playerId: 'b', seat: 1, stack: 1000 });
  seatPlayer(engine, { playerId: 'c', seat: 2, stack: 70 });
  seatPlayer(engine, { playerId: 'd', seat: 3, stack: 1000 });

  startHand(engine, { handId: 'h-short', idempotencyKey: 'h-short' });

  while (engine.hand.actingSeat !== 2) {
    applyAction(engine, {
      playerId: engine.seats[engine.hand.actingSeat].playerId,
      action: 'call',
      idempotencyKey: `prep-${engine.hand.actionLog.length}`,
    });
  }

  const before = engine.hand.lastAggressiveDelta;
  const out = applyAction(engine, {
    playerId: 'c',
    action: 'allin',
    idempotencyKey: 'short-allin',
  });

  assert.equal(out.ok, true);
  assert.equal(engine.hand.lastAggressiveDelta >= before, true);
});

test('missed blind on upcoming blind seat is not double-charged as dead blind', () => {
  const engine = createHoldemTable({
    tableId: 'cash-dead-blind-accounting',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
    buttonSeat: 1, // SB=2, BB=3 for this hand
  });

  seatPlayer(engine, { playerId: 'p1', seat: 0, stack: 1000 });
  seatPlayer(engine, { playerId: 'p2', seat: 1, stack: 1000 });
  seatPlayer(engine, { playerId: 'p3', seat: 2, stack: 1000 });
  seatPlayer(engine, { playerId: 'p4', seat: 3, stack: 1000 });

  markMissedBlind(engine, { playerId: 'p4', bigBlind: true });
  startHand(engine, { handId: 'h-dead-accounting', idempotencyKey: 'h-dead-accounting' });

  const postsBySeat = engine.hand.forcedPosts.filter((r) => r.seat === 3);
  assert.equal(postsBySeat.some((r) => r.kind === 'dead_blind'), false);
  assert.equal(postsBySeat.filter((r) => r.kind === 'big_blind').length, 1);
  assert.equal(postsBySeat[0].amount, 100);
});

test('engine rejects stale replay cursor and allows exact cursor', () => {
  const engine = createHoldemTable({ tableId: 'cash-cursor-guard', maxSeats: 4, smallBlind: 25, bigBlind: 50 });
  seatPlayer(engine, { playerId: 'a', seat: 0, stack: 1000 });
  seatPlayer(engine, { playerId: 'b', seat: 1, stack: 1000 });
  seatPlayer(engine, { playerId: 'c', seat: 2, stack: 1000 });

  startHand(engine, { handId: 'h-cursor', idempotencyKey: 'h-cursor' });
  const exactCursor = Number(engine.seq || 0);
  const firstActor = engine.seats[engine.hand.actingSeat].playerId;

  applyAction(engine, {
    playerId: firstActor,
    action: 'call',
    idempotencyKey: 'cursor-ok',
    expectedReplayCursor: exactCursor,
  });

  const nextActor = engine.seats[engine.hand.actingSeat].playerId;
  assert.throws(() => {
    applyAction(engine, {
      playerId: nextActor,
      action: 'call',
      idempotencyKey: 'cursor-stale',
      expectedReplayCursor: exactCursor,
    });
  }, /Stale replay cursor/);
});

test('straddle is rejected in tournament mode', () => {
  const engine = createHoldemTable({
    tableId: 'mtt-no-straddle',
    mode: 'tournament',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
  });
  seatPlayer(engine, { playerId: 'p1', seat: 0, stack: 2000 });
  seatPlayer(engine, { playerId: 'p2', seat: 1, stack: 2000 });

  assert.throws(() => {
    requestStraddle(engine, { playerId: 'p1', amount: 200 });
  }, /only allowed in cash mode/);
});
