import { assertInteger, assertString } from '../shared/contracts.mjs';

export function createTournament({
  tournamentId,
  kind = 'sng',
  maxPlayers,
  minPlayersToStart,
  startingStackUnits,
  blindSchedule = [],
}) {
  assertString(tournamentId, 'tournamentId');
  assertString(kind, 'kind');
  assertInteger(maxPlayers, 'maxPlayers', 2);
  assertInteger(minPlayersToStart, 'minPlayersToStart', 2);
  assertInteger(startingStackUnits, 'startingStackUnits', 1);

  if (minPlayersToStart > maxPlayers) {
    throw new Error('minPlayersToStart must be <= maxPlayers');
  }

  const normalizedSchedule = normalizeBlindSchedule(blindSchedule);

  return {
    tournamentId,
    kind,
    state: 'registration',
    maxPlayers,
    minPlayersToStart,
    startingStackUnits,
    players: [],
    tables: [],
    levelIndex: 0,
    blindSchedule: normalizedSchedule,
    levelStartedAtMs: null,
    history: [],
  };
}

export function registerPlayer(t, playerId) {
  assertString(playerId, 'playerId');
  if (t.state !== 'registration') throw new Error('Registration closed');
  if (t.players.length >= t.maxPlayers) throw new Error('Tournament full');
  if (t.players.some((p) => p.playerId === playerId)) throw new Error('Player already registered');

  t.players.push({
    playerId,
    stackUnits: t.startingStackUnits,
    eliminated: false,
    tableId: null,
    seat: null,
  });

  t.history.push({ type: 'register', playerId, at: new Date().toISOString() });
  return { registered: true, count: t.players.length };
}

export function startIfReady(t, nowMs = Date.now()) {
  if (t.state !== 'registration') return { started: false, reason: 'NOT_IN_REGISTRATION' };
  if (t.players.length < t.minPlayersToStart) return { started: false, reason: 'NOT_ENOUGH_PLAYERS' };

  t.state = 'running';
  t.levelStartedAtMs = nowMs;
  t.tables = seatPlayers(t.players.map((p) => p.playerId));
  bindSeats(t);
  t.history.push({ type: 'start', at: new Date(nowMs).toISOString(), tables: t.tables.length });

  return { started: true, tableCount: t.tables.length };
}

export function advanceBlinds(t, nowMs = Date.now()) {
  if (t.state !== 'running') return { advanced: false, reason: 'NOT_RUNNING' };
  if (!t.blindSchedule.length) return { advanced: false, reason: 'NO_SCHEDULE' };

  const current = t.blindSchedule[t.levelIndex];
  const elapsed = nowMs - (t.levelStartedAtMs || nowMs);
  if (elapsed < current.durationMs) {
    return { advanced: false, reason: 'LEVEL_ACTIVE', msRemaining: current.durationMs - elapsed };
  }

  if (t.levelIndex < t.blindSchedule.length - 1) {
    t.levelIndex += 1;
    t.levelStartedAtMs = nowMs;
    t.history.push({ type: 'blind-level', levelIndex: t.levelIndex, at: new Date(nowMs).toISOString() });
    return { advanced: true, levelIndex: t.levelIndex };
  }

  return { advanced: false, reason: 'LAST_LEVEL' };
}

export function rebalanceTables(t, maxSeats = 9) {
  assertInteger(maxSeats, 'maxSeats', 2);
  if (t.state !== 'running') return { rebalanced: false, reason: 'NOT_RUNNING' };

  const active = t.players.filter((p) => !p.eliminated).map((p) => p.playerId);
  const nextTables = seatPlayers(active, maxSeats);
  t.tables = nextTables;
  bindSeats(t);
  t.history.push({ type: 'rebalance', at: new Date().toISOString(), tables: nextTables.length });
  return { rebalanced: true, tableCount: nextTables.length };
}

export function eliminatePlayer(t, playerId) {
  const player = t.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error('Player not found');
  player.eliminated = true;
  player.stackUnits = 0;
  t.history.push({ type: 'eliminate', playerId, at: new Date().toISOString() });

  const remaining = t.players.filter((p) => !p.eliminated).length;
  if (remaining <= 1) {
    t.state = 'completed';
    t.history.push({ type: 'complete', at: new Date().toISOString() });
  }

  return { eliminated: true, remaining };
}

export function currentBlinds(t) {
  if (!t.blindSchedule.length) return { smallBlind: 10, bigBlind: 20, ante: 0 };
  return t.blindSchedule[t.levelIndex];
}

function seatPlayers(playerIds, maxSeats = 9) {
  const tables = [];
  let tableNo = 1;
  for (let i = 0; i < playerIds.length; i += maxSeats) {
    const group = playerIds.slice(i, i + maxSeats);
    tables.push({ tableId: `table-${tableNo}`, seats: group.map((playerId, idx) => ({ seat: idx, playerId })) });
    tableNo += 1;
  }
  return tables;
}

function bindSeats(t) {
  const map = new Map();
  for (const table of t.tables) {
    for (const s of table.seats) {
      map.set(s.playerId, { tableId: table.tableId, seat: s.seat });
    }
  }
  for (const p of t.players) {
    const seat = map.get(p.playerId) || null;
    p.tableId = seat?.tableId || null;
    p.seat = seat?.seat ?? null;
  }
}

function normalizeBlindSchedule(blindSchedule) {
  if (!Array.isArray(blindSchedule) || blindSchedule.length === 0) {
    return [
      { smallBlind: 10, bigBlind: 20, ante: 0, durationMs: 10 * 60 * 1000 },
      { smallBlind: 15, bigBlind: 30, ante: 0, durationMs: 10 * 60 * 1000 },
      { smallBlind: 25, bigBlind: 50, ante: 5, durationMs: 10 * 60 * 1000 },
    ];
  }

  return blindSchedule.map((b, i) => {
    assertInteger(b.smallBlind, `blindSchedule[${i}].smallBlind`, 1);
    assertInteger(b.bigBlind, `blindSchedule[${i}].bigBlind`, b.smallBlind + 1);
    assertInteger(b.ante ?? 0, `blindSchedule[${i}].ante`, 0);
    assertInteger(b.durationMs, `blindSchedule[${i}].durationMs`, 60_000);
    return {
      smallBlind: b.smallBlind,
      bigBlind: b.bigBlind,
      ante: b.ante ?? 0,
      durationMs: b.durationMs,
    };
  });
}
