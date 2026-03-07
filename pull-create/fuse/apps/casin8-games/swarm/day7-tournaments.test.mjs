import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTournament,
  registerPlayer,
  startTournament,
  pauseTournament,
  resumeTournament,
  advanceTournamentClock,
  rebuyPlayer,
  addOnPlayer,
  eliminatePlayer,
  computePayouts,
  snapshotTournament,
} from './holdem-tournaments/index.mjs';

test('MTT supports late reg, rebuy/add-on windows, balancing, final-table merge, payouts', () => {
  const t = createTournament({
    tournamentId: 'mtt-prod-1',
    type: 'mtt',
    maxPlayers: 18,
    tableSize: 6,
    buyInUnits: 1000,
    lateReg: { byLevelInclusive: 2 },
    rebuy: { enabled: true, maxPerPlayer: 2, untilLevelInclusive: 3, chipsPerRebuy: 10000 },
    addon: { enabled: true, level: 3, chips: 15000 },
  });

  for (let i = 0; i < 12; i += 1) {
    registerPlayer(t, { playerId: `p${i}` });
  }

  startTournament(t);
  let snap = snapshotTournament(t);
  assert.equal(snap.status, 'running');
  assert.equal(snap.tableCount >= 2, true);

  registerPlayer(t, { playerId: 'late-1' });
  snap = snapshotTournament(t);
  assert.equal(snap.players.some((p) => p.playerId === 'late-1'), true);

  pauseTournament(t, { reason: 'ops-check' });
  assert.throws(() => registerPlayer(t, { playerId: 'late-paused' }), /Registration closed/);
  resumeTournament(t, { reason: 'ops-check-done' });

  // Move clock until late reg closes.
  advanceTournamentClock(t, 600 * 4);
  assert.equal(snapshotTournament(t).lateRegOpen, false);
  assert.throws(() => registerPlayer(t, { playerId: 'late-2' }), /Registration closed/);

  rebuyPlayer(t, { playerId: 'p0' });
  rebuyPlayer(t, { playerId: 'p0' });
  assert.throws(() => rebuyPlayer(t, { playerId: 'p0' }), /Rebuy cap reached/);

  // Advance to add-on level and consume add-on.
  while (snapshotTournament(t).levelIndex < 3) {
    advanceTournamentClock(t, 600);
  }
  addOnPlayer(t, { playerId: 'p1' });
  assert.throws(() => addOnPlayer(t, { playerId: 'p1' }), /already used/);

  // Eliminate to force final table merge.
  const activePlayers = snapshotTournament(t).players.filter((p) => p.status === 'active');
  let finish = activePlayers.length;
  for (const p of activePlayers.slice(0, activePlayers.length - 6)) {
    eliminatePlayer(t, { playerId: p.playerId, finishPosition: finish });
    finish -= 1;
  }

  snap = snapshotTournament(t);
  assert.equal(snap.activePlayers <= 6, true);
  assert.equal(snap.tableCount, 1);

  const remaining = snap.players.filter((p) => p.status === 'active');
  let fp = remaining.length;
  for (const p of remaining.slice(0, remaining.length - 1)) {
    eliminatePlayer(t, { playerId: p.playerId, finishPosition: fp });
    fp -= 1;
  }

  const finalSnap = snapshotTournament(t);
  assert.equal(finalSnap.status, 'complete');

  const payouts = computePayouts(t);
  assert.equal(payouts.payouts.length > 0, true);
  const paid = payouts.payouts.reduce((acc, row) => acc + row.payoutUnits, 0);
  assert.equal(paid <= payouts.prizePoolUnits, true);
});

test('MTT elimination rejects duplicate finish positions', () => {
  const t = createTournament({
    tournamentId: 'mtt-prod-dup-fp',
    type: 'mtt',
    maxPlayers: 6,
    tableSize: 6,
    buyInUnits: 1000,
  });
  for (let i = 0; i < 6; i += 1) registerPlayer(t, { playerId: `d${i}` });
  startTournament(t);
  eliminatePlayer(t, { playerId: 'd0', finishPosition: 6 });
  eliminatePlayer(t, { playerId: 'd1', finishPosition: 4 });
  assert.throws(
    () => eliminatePlayer(t, { playerId: 'd2', finishPosition: 4 }),
    /finishPosition (already assigned|must be between)/
  );
});

test('SNG autostarts when full and supports break schedule progression', () => {
  const t = createTournament({
    tournamentId: 'sng-prod-1',
    type: 'sng',
    maxPlayers: 6,
    tableSize: 6,
    breakConfig: { everyLevels: 2, breakDurationSec: 120 },
  });

  for (let i = 0; i < 6; i += 1) {
    registerPlayer(t, { playerId: `s${i}` });
  }

  let snap = snapshotTournament(t);
  assert.equal(snap.status, 'running');

  // Hit break.
  advanceTournamentClock(t, 600 * 2);
  snap = snapshotTournament(t);
  assert.equal(snap.onBreak, true);

  advanceTournamentClock(t, 120);
  snap = snapshotTournament(t);
  assert.equal(snap.onBreak, false);
});
