import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createHoldemTable,
  seatPlayer,
  startHand,
  applyAction,
  settleHand,
  requestStraddle,
  requestSeatChange,
  setConnection,
  forceFoldDisconnected,
  exportReplayLog,
  verifyReplayLog,
  recoverySnapshot as holdemRecoverySnapshot,
  restoreFromRecovery,
} from '../core-logic/holdem-engine/index.mjs';
import {
  createTournament,
  registerPlayer,
  startTournament,
  advanceTournamentClock,
  pauseTournament,
  resumeTournament,
  recoverySnapshot,
  restoreTournament,
  snapshotTournament,
} from '../core-logic/holdem-tournaments/index.mjs';

test('cash edge-cases: straddle + queued seat change + disconnect fold path', () => {
  const e = createHoldemTable({
    tableId: 'prod-core-cash',
    mode: 'cash',
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100,
    buttonSeat: 3,
  });

  seatPlayer(e, { playerId: 'a', seat: 0, stack: 3000 });
  seatPlayer(e, { playerId: 'b', seat: 1, stack: 3000 });
  seatPlayer(e, { playerId: 'c', seat: 2, stack: 3000 });
  seatPlayer(e, { playerId: 'd', seat: 3, stack: 3000 });

  requestStraddle(e, { playerId: 'd', amount: 200 });
  startHand(e, { handId: 'h-prod-1', idempotencyKey: 'start-h1' });
  assert.equal(e.hand.forcedPosts.some((row) => row.kind === 'straddle'), true);

  const queued = requestSeatChange(e, { playerId: 'b', toSeat: 5, reason: 'mid_orbit' });
  assert.equal(queued.queued, true);

  while (e.hand && !e.hand.readyForSettlement) {
    const acting = e.hand.actingSeat;
    if (acting == null) break;
    const pid = e.seats[acting].playerId;
    if (pid === 'c') {
      setConnection(e, { playerId: 'c', connected: false });
      forceFoldDisconnected(e, { playerId: 'c' });
      continue;
    }
    const toCall = Math.max(
      0,
      Number(e.hand.currentBet || 0) - Number(e.hand.streetCommitted[String(acting)] || 0)
    );
    applyAction(e, {
      playerId: pid,
      action: toCall > 0 ? 'call' : 'check',
      idempotencyKey: `act-${e.hand.actionLog.length + 1}`,
    });
  }

  settleHand(e, {
    rankingBySeat: { 0: 10, 1: 9, 2: 8, 3: 7 },
    settlementKey: 'settle-h1',
  });
  assert.equal(e.seats[5]?.playerId, 'b');
});

test('tournament orchestration: pause/resume + recovery restore consistency', () => {
  const t = createTournament({
    tournamentId: 'prod-mtt-restore',
    type: 'mtt',
    maxPlayers: 24,
    tableSize: 6,
    buyInUnits: 1000,
  });

  for (let i = 1; i <= 12; i += 1) {
    registerPlayer(t, { playerId: `p-${i}` });
  }
  startTournament(t);
  const before = snapshotTournament(t);
  assert.equal(before.tableCount >= 2, true);

  pauseTournament(t, { reason: 'maintenance' });
  assert.equal(snapshotTournament(t).status, 'paused');
  assert.throws(() => advanceTournamentClock(t, 60), /not running/);
  resumeTournament(t, { reason: 'maintenance_done' });
  advanceTournamentClock(t, 120);

  const rec = recoverySnapshot(t);
  const restored = restoreTournament(rec);
  const after = snapshotTournament(restored);

  assert.equal(after.tournamentId, before.tournamentId);
  assert.equal(after.tableCount, snapshotTournament(t).tableCount);
  assert.equal(after.activePlayers, snapshotTournament(t).activePlayers);
  assert.equal(after.levelIndex, snapshotTournament(t).levelIndex);
});

test('replay audit hash-chain detects tampering', () => {
  const e = createHoldemTable({
    tableId: 'prod-replay-audit',
    maxSeats: 4,
    smallBlind: 25,
    bigBlind: 50,
  });
  seatPlayer(e, { playerId: 'x', seat: 0, stack: 1000 });
  seatPlayer(e, { playerId: 'y', seat: 1, stack: 1000 });
  seatPlayer(e, { playerId: 'z', seat: 2, stack: 1000 });
  startHand(e, { handId: 'h-audit-1', idempotencyKey: 'h-audit-start' });
  applyAction(e, { playerId: e.seats[e.hand.actingSeat].playerId, action: 'call', idempotencyKey: 'a1' });

  const log = exportReplayLog(e);
  const ok = verifyReplayLog(log);
  assert.equal(ok.ok, true);

  const tampered = JSON.parse(JSON.stringify(log));
  tampered[tampered.length - 1].payload.row.action = 'raise';
  const bad = verifyReplayLog(tampered);
  assert.equal(bad.ok, false);
  assert.equal(bad.code, 'HASH_MISMATCH');
});

test('holdem recovery restore preserves replay/audit integrity', () => {
  const e = createHoldemTable({
    tableId: 'prod-replay-restore',
    maxSeats: 4,
    smallBlind: 25,
    bigBlind: 50,
  });
  seatPlayer(e, { playerId: 'p1', seat: 0, stack: 1200 });
  seatPlayer(e, { playerId: 'p2', seat: 1, stack: 1200 });
  seatPlayer(e, { playerId: 'p3', seat: 2, stack: 1200 });
  startHand(e, { handId: 'h-restore-1', idempotencyKey: 'start-restore-1' });

  const acting = e.hand?.actingSeat;
  assert.notEqual(acting, null);
  applyAction(e, {
    playerId: e.seats[acting].playerId,
    action: 'call',
    idempotencyKey: 'restore-a1',
  });

  const beforeRecoveryLog = exportReplayLog(e);
  const beforeVerify = verifyReplayLog(beforeRecoveryLog);
  assert.equal(beforeVerify.ok, true);

  const restored = restoreFromRecovery(holdemRecoverySnapshot(e));
  const afterRecoveryLog = exportReplayLog(restored);
  const afterVerify = verifyReplayLog(afterRecoveryLog);
  assert.equal(afterVerify.ok, true);
  assert.equal(afterRecoveryLog.length, beforeRecoveryLog.length);
  assert.equal(restored.audit.lastEventHash, e.audit.lastEventHash);
  assert.equal(restored.hand.auditHash, e.hand.auditHash);
});
