import { assertInteger, assertString } from '../../shared/contracts.mjs';

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function toInt(value, field, min = 0) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) {
    throw new Error(`Invalid ${field}`);
  }
  return n;
}

function toUnits(value, field) {
  return toInt(value, field, 0);
}

function buildDefaultSchedule() {
  return [
    { level: 1, durationSec: 600, sb: 50, bb: 100, ante: 0 },
    { level: 2, durationSec: 600, sb: 75, bb: 150, ante: 0 },
    { level: 3, durationSec: 600, sb: 100, bb: 200, ante: 25 },
    { level: 4, durationSec: 600, sb: 150, bb: 300, ante: 25 },
    { level: 5, durationSec: 600, sb: 200, bb: 400, ante: 50 },
    { level: 6, durationSec: 600, sb: 300, bb: 600, ante: 75 },
  ];
}

function defaultPayoutBps(fieldSize) {
  if (fieldSize <= 6) return [6500, 3500];
  if (fieldSize <= 9) return [5000, 3000, 2000];
  if (fieldSize <= 45) return [3500, 2200, 1500, 1100, 800, 500, 400];
  return [2500, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200];
}

function currentLevelRow(t) {
  return t.blindSchedule[Math.min(t.levelIndex, t.blindSchedule.length - 1)];
}

function assignSeatsToTables(t) {
  const active = [...t.players.values()].filter((p) => p.status === 'active');
  active.sort((a, b) => a.playerId.localeCompare(b.playerId));

  t.tables = new Map();
  t.tableCounter = 0;
  for (const p of active) {
    let target = [...t.tables.values()].find((row) => row.seats.length < t.tableSize);
    if (!target) {
      t.tableCounter += 1;
      const tableId = `${t.tournamentId}-table-${t.tableCounter}`;
      target = { tableId, seats: [] };
      t.tables.set(tableId, target);
    }
    p.tableId = target.tableId;
    p.seat = target.seats.length;
    target.seats.push(p.playerId);
  }
}

function rebalanceTables(t) {
  if (t.type !== 'mtt') return;
  const beforeCount = t.tables.size;
  assignSeatsToTables(t);
  const afterAssignCount = t.tables.size;
  if (afterAssignCount < beforeCount) {
    t.eventLog.push({
      type: 'tables.broken',
      ts: nowIso(),
      payload: { beforeCount, afterAssignCount },
    });
  } else if (afterAssignCount > beforeCount) {
    t.eventLog.push({
      type: 'tables.opened',
      ts: nowIso(),
      payload: { beforeCount, afterAssignCount },
    });
  }
  const active = [...t.players.values()].filter((p) => p.status === 'active').length;
  if (active <= t.tableSize) {
    const hadMulti = t.tables.size > 1;
    mergeFinalTable(t);
    if (hadMulti) {
      t.eventLog.push({
        type: 'tables.final_table_merged',
        ts: nowIso(),
        payload: { activePlayers: active, tableSize: t.tableSize },
      });
    }
  }
}

function mergeFinalTable(t) {
  const active = [...t.players.values()].filter((p) => p.status === 'active');
  if (active.length === 0) return;
  const tableId = `${t.tournamentId}-final-table`;
  const table = { tableId, seats: [] };
  t.tables = new Map([[tableId, table]]);
  active.sort((a, b) => a.playerId.localeCompare(b.playerId));
  for (const player of active) {
    player.tableId = tableId;
    player.seat = table.seats.length;
    table.seats.push(player.playerId);
  }
}

export function createTournament(config) {
  assertString(config.tournamentId, 'tournamentId');
  const type = String(config.type || 'mtt').toLowerCase();
  if (!['mtt', 'sng'].includes(type)) throw new Error('type must be mtt or sng');

  const maxPlayers = toInt(config.maxPlayers ?? (type === 'sng' ? 9 : 180), 'maxPlayers', 2);
  const tableSize = toInt(config.tableSize ?? 9, 'tableSize', 2);
  const buyInUnits = toUnits(config.buyInUnits ?? 1000, 'buyInUnits');
  const startStack = toInt(config.startStack ?? 20000, 'startStack', 100);

  const t = {
    version: 2,
    tournamentId: config.tournamentId,
    type,
    status: 'registration',
    pausedReason: '',
    maxPlayers,
    tableSize,
    buyInUnits,
    startStack,
    blindSchedule: cloneJson(config.blindSchedule || buildDefaultSchedule()),
    levelIndex: 0,
    levelElapsedSec: 0,
    elapsedSec: 0,
    breakConfig: {
      everyLevels: toInt(config.breakConfig?.everyLevels ?? 3, 'breakEveryLevels', 1),
      breakDurationSec: toInt(config.breakConfig?.breakDurationSec ?? 300, 'breakDurationSec', 30),
    },
    onBreak: false,
    breakRemainingSec: 0,
    lateReg: {
      byLevelInclusive: toInt(config.lateReg?.byLevelInclusive ?? 4, 'lateRegByLevel', 0),
      open: true,
    },
    rebuy: {
      enabled: Boolean(config.rebuy?.enabled),
      maxPerPlayer: toInt(config.rebuy?.maxPerPlayer ?? 0, 'rebuyMax', 0),
      untilLevelInclusive: toInt(config.rebuy?.untilLevelInclusive ?? 6, 'rebuyUntilLevel', 0),
      chipsPerRebuy: toInt(config.rebuy?.chipsPerRebuy ?? startStack, 'chipsPerRebuy', 100),
    },
    addon: {
      enabled: Boolean(config.addon?.enabled),
      level: toInt(config.addon?.level ?? 6, 'addonLevel', 1),
      chips: toInt(config.addon?.chips ?? Math.floor(startStack * 1.5), 'addonChips', 100),
    },
    payoutBps: cloneJson(config.payoutBps || defaultPayoutBps(maxPlayers)),
    players: new Map(),
    eliminationOrder: [],
    prizePoolUnits: 0,
    tables: new Map(),
    tableCounter: 0,
    startedAt: null,
    completedAt: null,
    eventLog: [],
  };

  t.eventLog.push({ type: 'tournament.created', ts: nowIso(), payload: { type, maxPlayers, tableSize } });
  return t;
}

export function registerPlayer(t, { playerId }) {
  assertString(playerId, 'playerId');
  const canRegister =
    t.status === 'registration' || (t.status === 'running' && t.lateReg.open);
  if (!canRegister) {
    throw new Error('Registration closed');
  }
  if (t.players.has(playerId)) throw new Error('Player already registered');
  if (t.players.size >= t.maxPlayers) throw new Error('Tournament full');

  t.players.set(playerId, {
    playerId,
    chips: t.startStack,
    status: 'active',
    entries: 1,
    rebuys: 0,
    addonTaken: false,
    tableId: null,
    seat: null,
    finishPosition: null,
  });
  t.prizePoolUnits += t.buyInUnits;
  t.eventLog.push({ type: 'player.registered', ts: nowIso(), payload: { playerId } });

  if (t.status === 'running') rebalanceTables(t);
  if (t.type === 'sng' && t.status === 'registration' && t.players.size === t.maxPlayers) {
    startTournament(t);
  }
  return snapshotTournament(t);
}

export function startTournament(t) {
  if (t.status !== 'registration') throw new Error('Tournament already started');
  if (t.players.size < 2) throw new Error('Need at least 2 players');

  t.status = 'running';
  t.startedAt = nowIso();
  assignSeatsToTables(t);
  t.eventLog.push({ type: 'tournament.started', ts: nowIso(), payload: { players: t.players.size } });
  return snapshotTournament(t);
}

export function pauseTournament(t, { reason = 'manual' } = {}) {
  if (t.status !== 'running') throw new Error('Tournament not running');
  t.status = 'paused';
  t.pausedReason = String(reason || 'manual').slice(0, 160);
  t.eventLog.push({ type: 'tournament.paused', ts: nowIso(), payload: { reason: t.pausedReason } });
  return snapshotTournament(t);
}

export function resumeTournament(t, { reason = 'manual' } = {}) {
  if (t.status !== 'paused') throw new Error('Tournament not paused');
  t.status = 'running';
  t.eventLog.push({ type: 'tournament.resumed', ts: nowIso(), payload: { reason: String(reason || 'manual') } });
  t.pausedReason = '';
  return snapshotTournament(t);
}

export function advanceTournamentClock(t, seconds) {
  const delta = toInt(seconds, 'seconds', 1);
  if (t.status !== 'running') throw new Error('Tournament not running');

  let remaining = delta;
  while (remaining > 0) {
    if (t.onBreak) {
      const step = Math.min(remaining, t.breakRemainingSec);
      t.breakRemainingSec -= step;
      t.elapsedSec += step;
      remaining -= step;
      if (t.breakRemainingSec === 0) t.onBreak = false;
      continue;
    }

    const level = currentLevelRow(t);
    const left = Math.max(0, level.durationSec - t.levelElapsedSec);
    const step = Math.min(remaining, left);
    t.levelElapsedSec += step;
    t.elapsedSec += step;
    remaining -= step;

    if (t.levelElapsedSec >= level.durationSec) {
      t.levelIndex = Math.min(t.levelIndex + 1, t.blindSchedule.length - 1);
      t.levelElapsedSec = 0;
      if (t.levelIndex > t.lateReg.byLevelInclusive) {
        t.lateReg.open = false;
      }
      if (t.levelIndex > 0 && t.levelIndex % t.breakConfig.everyLevels === 0) {
        t.onBreak = true;
        t.breakRemainingSec = t.breakConfig.breakDurationSec;
      }
    }
  }

  t.eventLog.push({
    type: 'clock.advanced',
    ts: nowIso(),
    payload: {
      seconds: delta,
      levelIndex: t.levelIndex,
      level: currentLevelRow(t),
      onBreak: t.onBreak,
      lateRegOpen: t.lateReg.open,
    },
  });

  return {
    levelIndex: t.levelIndex,
    level: cloneJson(currentLevelRow(t)),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateRegOpen: t.lateReg.open,
  };
}

export function rebuyPlayer(t, { playerId }) {
  const p = t.players.get(playerId);
  if (!p) throw new Error('Unknown player');
  if (!t.rebuy.enabled) throw new Error('Rebuy disabled');
  if (t.levelIndex > t.rebuy.untilLevelInclusive) throw new Error('Rebuy window closed');
  if (p.rebuys >= t.rebuy.maxPerPlayer) throw new Error('Rebuy cap reached');

  p.rebuys += 1;
  p.entries += 1;
  p.chips += t.rebuy.chipsPerRebuy;
  p.status = 'active';
  t.prizePoolUnits += t.buyInUnits;

  t.eventLog.push({ type: 'player.rebuy', ts: nowIso(), payload: { playerId, rebuys: p.rebuys } });
  rebalanceTables(t);
  return snapshotTournament(t);
}

export function addOnPlayer(t, { playerId }) {
  const p = t.players.get(playerId);
  if (!p) throw new Error('Unknown player');
  if (!t.addon.enabled) throw new Error('Add-on disabled');
  if (p.addonTaken) throw new Error('Add-on already used');
  if (t.levelIndex !== t.addon.level) throw new Error('Add-on level mismatch');

  p.addonTaken = true;
  p.entries += 1;
  p.chips += t.addon.chips;
  t.prizePoolUnits += t.buyInUnits;

  t.eventLog.push({ type: 'player.addon', ts: nowIso(), payload: { playerId } });
  return snapshotTournament(t);
}

export function eliminatePlayer(t, { playerId, finishPosition }) {
  const p = t.players.get(playerId);
  if (!p || p.status !== 'active') throw new Error('Player not active');
  const activeBefore = [...t.players.values()].filter((row) => row.status === 'active').length;
  const desiredFinish = toInt(finishPosition, 'finishPosition', 1);
  const minFinish = 2;
  const maxFinish = activeBefore;
  if (desiredFinish < minFinish || desiredFinish > maxFinish) {
    throw new Error(`finishPosition must be between ${minFinish} and ${maxFinish}`);
  }
  const duplicateFinish = [...t.players.values()].some(
    (row) => row.playerId !== playerId && Number(row.finishPosition || 0) === desiredFinish
  );
  if (duplicateFinish) {
    throw new Error('finishPosition already assigned');
  }

  p.status = 'eliminated';
  p.chips = 0;
  p.finishPosition = desiredFinish;

  t.eliminationOrder.push({ playerId, finishPosition: p.finishPosition, ts: nowIso() });
  t.eventLog.push({ type: 'player.eliminated', ts: nowIso(), payload: { playerId, finishPosition: p.finishPosition } });

  const active = [...t.players.values()].filter((row) => row.status === 'active');
  if (active.length <= 1) {
    if (active.length === 1) {
      active[0].finishPosition = 1;
      t.eliminationOrder.push({ playerId: active[0].playerId, finishPosition: 1, ts: nowIso() });
    }
    t.status = 'complete';
    t.completedAt = nowIso();
    t.tables = new Map();
  } else {
    rebalanceTables(t);
  }

  return snapshotTournament(t);
}

export function computePayouts(t) {
  if (t.status !== 'complete') throw new Error('Tournament not complete');
  const entries = [...t.players.values()].sort((a, b) => {
    const fa = Number(a.finishPosition || 9999);
    const fb = Number(b.finishPosition || 9999);
    if (fa !== fb) return fa - fb;
    return a.playerId.localeCompare(b.playerId);
  });

  const payouts = [];
  for (let i = 0; i < t.payoutBps.length; i += 1) {
    const p = entries[i];
    if (!p) break;
    const payout = Math.floor((t.prizePoolUnits * t.payoutBps[i]) / 10000);
    payouts.push({
      playerId: p.playerId,
      finishPosition: p.finishPosition,
      payoutUnits: payout,
    });
  }

  return {
    tournamentId: t.tournamentId,
    prizePoolUnits: t.prizePoolUnits,
    payouts,
  };
}

export function snapshotTournament(t) {
  return {
    version: t.version,
    tournamentId: t.tournamentId,
    type: t.type,
    status: t.status,
    pausedReason: t.pausedReason || '',
    maxPlayers: t.maxPlayers,
    tableSize: t.tableSize,
    buyInUnits: t.buyInUnits,
    startStack: t.startStack,
    levelIndex: t.levelIndex,
    level: cloneJson(currentLevelRow(t)),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateRegOpen: t.lateReg.open,
    prizePoolUnits: t.prizePoolUnits,
    activePlayers: [...t.players.values()].filter((p) => p.status === 'active').length,
    tableCount: t.tables.size,
    tables: [...t.tables.values()].map((row) => ({ tableId: row.tableId, seats: [...row.seats] })),
    players: [...t.players.values()].map((p) => ({ ...p })),
    startedAt: t.startedAt,
    completedAt: t.completedAt,
  };
}

export function recoverySnapshot(t) {
  return {
    version: t.version,
    tournamentId: t.tournamentId,
    type: t.type,
    status: t.status,
    pausedReason: t.pausedReason || '',
    maxPlayers: t.maxPlayers,
    tableSize: t.tableSize,
    buyInUnits: t.buyInUnits,
    startStack: t.startStack,
    blindSchedule: cloneJson(t.blindSchedule),
    levelIndex: t.levelIndex,
    levelElapsedSec: t.levelElapsedSec,
    elapsedSec: t.elapsedSec,
    breakConfig: cloneJson(t.breakConfig),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateReg: cloneJson(t.lateReg),
    rebuy: cloneJson(t.rebuy),
    addon: cloneJson(t.addon),
    payoutBps: cloneJson(t.payoutBps),
    prizePoolUnits: t.prizePoolUnits,
    tableCounter: t.tableCounter,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    players: [...t.players.values()].map((p) => ({ ...p })),
    eliminationOrder: cloneJson(t.eliminationOrder),
    tables: [...t.tables.values()].map((row) => ({ tableId: row.tableId, seats: [...row.seats] })),
    eventLog: cloneJson(t.eventLog),
  };
}

export function restoreTournament(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('snapshot is required');
  }
  const t = createTournament({
    tournamentId: snapshot.tournamentId,
    type: snapshot.type,
    maxPlayers: snapshot.maxPlayers,
    tableSize: snapshot.tableSize,
    buyInUnits: snapshot.buyInUnits,
    startStack: snapshot.startStack,
    blindSchedule: snapshot.blindSchedule,
    breakConfig: snapshot.breakConfig,
    lateReg: snapshot.lateReg,
    rebuy: snapshot.rebuy,
    addon: snapshot.addon,
    payoutBps: snapshot.payoutBps,
  });
  t.status = snapshot.status;
  t.pausedReason = String(snapshot.pausedReason || '');
  t.levelIndex = Number(snapshot.levelIndex || 0);
  t.levelElapsedSec = Number(snapshot.levelElapsedSec || 0);
  t.elapsedSec = Number(snapshot.elapsedSec || 0);
  t.onBreak = Boolean(snapshot.onBreak);
  t.breakRemainingSec = Number(snapshot.breakRemainingSec || 0);
  t.prizePoolUnits = Number(snapshot.prizePoolUnits || 0);
  t.tableCounter = Number(snapshot.tableCounter || 0);
  t.startedAt = snapshot.startedAt || null;
  t.completedAt = snapshot.completedAt || null;
  t.players = new Map((snapshot.players || []).map((p) => [p.playerId, { ...p }]));
  t.eliminationOrder = cloneJson(snapshot.eliminationOrder || []);
  t.tables = new Map((snapshot.tables || []).map((row) => [row.tableId, { tableId: row.tableId, seats: [...(row.seats || [])] }]));
  t.eventLog = cloneJson(snapshot.eventLog || []);
  return t;
}
