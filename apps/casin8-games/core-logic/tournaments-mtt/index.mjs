import { assertInteger, assertString } from '../../shared/contracts.mjs';

export const MTT_STATUS = Object.freeze({
  REGISTRATION: 'registration',
  RUNNING: 'running',
  COMPLETE: 'complete',
});

export function createMtt({
  tournamentId,
  maxPlayers,
  tableMaxSeats = 6,
  buyInUnits = 100n,
  lateRegMinutes = 45,
}) {
  assertString(tournamentId, 'tournamentId');
  assertInteger(maxPlayers, 'maxPlayers', 4);
  assertInteger(tableMaxSeats, 'tableMaxSeats', 2);
  assertInteger(lateRegMinutes, 'lateRegMinutes', 0);

  return {
    tournamentId,
    status: MTT_STATUS.REGISTRATION,
    maxPlayers,
    tableMaxSeats,
    buyInUnits: toBigInt(buyInUnits, 'buyInUnits'),
    lateRegMinutes,
    players: new Map(),
    tables: new Map(),
    tableCounter: 0,
    startedAt: null,
    completedAt: null,
  };
}

export function registerMttPlayer(mtt, { playerId }) {
  assertString(playerId, 'playerId');
  if (mtt.status !== MTT_STATUS.REGISTRATION) {
    throw new Error('Registration is closed');
  }
  if (mtt.players.size >= mtt.maxPlayers) {
    throw new Error('MTT is full');
  }
  if (mtt.players.has(playerId)) {
    throw new Error('Player already registered');
  }

  mtt.players.set(playerId, {
    playerId,
    chips: 20000,
    status: 'active',
    tableId: null,
    seat: null,
  });

  return mtt.players.size;
}

export function startMtt(mtt) {
  if (mtt.status !== MTT_STATUS.REGISTRATION) {
    throw new Error('MTT already started');
  }
  if (mtt.players.size < 2) {
    throw new Error('Need at least 2 players');
  }

  mtt.status = MTT_STATUS.RUNNING;
  mtt.startedAt = new Date().toISOString();

  seedTables(mtt);
  return getMttSnapshot(mtt);
}

function seedTables(mtt) {
  const players = [...mtt.players.values()].filter((p) => p.status === 'active');
  let table = newTable(mtt);

  for (const player of players) {
    if (table.seats.length >= mtt.tableMaxSeats) {
      table = newTable(mtt);
    }
    const seat = table.seats.length;
    table.seats.push(player.playerId);
    player.tableId = table.tableId;
    player.seat = seat;
  }
}

function newTable(mtt) {
  mtt.tableCounter += 1;
  const tableId = `${mtt.tournamentId}-table-${mtt.tableCounter}`;
  const table = { tableId, seats: [] };
  mtt.tables.set(tableId, table);
  return table;
}

export function eliminateMttPlayer(mtt, playerId, finishPosition) {
  if (mtt.status !== MTT_STATUS.RUNNING) {
    throw new Error('MTT not running');
  }

  const player = mtt.players.get(playerId);
  if (!player || player.status !== 'active') {
    throw new Error('Player not active');
  }

  player.status = 'eliminated';
  player.finishPosition = finishPosition;
  player.chips = 0;

  const table = mtt.tables.get(player.tableId);
  if (table) {
    table.seats = table.seats.filter((id) => id !== playerId);
  }

  rebalanceTables(mtt);

  const active = [...mtt.players.values()].filter((p) => p.status === 'active');
  if (active.length <= 1) {
    if (active.length === 1) {
      active[0].finishPosition = 1;
    }
    mtt.status = MTT_STATUS.COMPLETE;
    mtt.completedAt = new Date().toISOString();
  }

  return getMttSnapshot(mtt);
}

export function rebalanceTables(mtt) {
  const active = [...mtt.players.values()].filter((p) => p.status === 'active');

  // Compact all active players to avoid underfilled sparse tables.
  for (const table of mtt.tables.values()) {
    table.seats = [];
  }

  let table = [...mtt.tables.values()][0] || newTable(mtt);
  for (const player of active) {
    if (table.seats.length >= mtt.tableMaxSeats) {
      table = newTable(mtt);
    }
    const seat = table.seats.length;
    table.seats.push(player.playerId);
    player.tableId = table.tableId;
    player.seat = seat;
  }

  // Remove empty tables.
  for (const [tableId, t] of mtt.tables.entries()) {
    if (t.seats.length === 0) {
      mtt.tables.delete(tableId);
    }
  }

  return getMttSnapshot(mtt);
}

export function getMttSnapshot(mtt) {
  return {
    tournamentId: mtt.tournamentId,
    status: mtt.status,
    playerCount: mtt.players.size,
    activePlayers: [...mtt.players.values()].filter((p) => p.status === 'active').length,
    tableCount: mtt.tables.size,
    tables: [...mtt.tables.values()].map((t) => ({ tableId: t.tableId, seats: [...t.seats] })),
  };
}

function toBigInt(value, field) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`Invalid ${field}: expected bigint-like integer`);
}
