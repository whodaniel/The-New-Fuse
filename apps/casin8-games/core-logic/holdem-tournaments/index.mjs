import { assertInteger, assertString } from '../../shared/contracts.mjs';
import { createHash } from 'node:crypto';

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
  // Sum must equal 10000 (full prize pool). Previous sum was 9300 — 7% lost.
 // Added 700 to 1st place (most standard structures weight top heavy).
 return [3200, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200];
}

function normalizePolicy(input = {}) {
  const mode = String(input.mode || 'open').toLowerCase();
  const safeMode = ['open', 'bots-only', 'hybrid'].includes(mode) ? mode : 'open';
  const allowHumanJoin =
    typeof input.allowHumanJoin === 'boolean' ? input.allowHumanJoin : safeMode !== 'bots-only';
  const allowAgentJoin =
    typeof input.allowAgentJoin === 'boolean' ? input.allowAgentJoin : true;
  const allowHumanTakeover =
    typeof input.allowHumanTakeover === 'boolean'
      ? input.allowHumanTakeover
      : safeMode !== 'bots-only';
  return {
    mode: safeMode,
    allowHumanJoin,
    allowAgentJoin,
    allowHumanTakeover,
  };
}

function normalizeControlMode(value, fallback = 'human') {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'human' || mode === 'hybrid' || mode === 'agent') return mode;
  const safe = String(fallback || '').trim().toLowerCase();
  if (safe === 'human' || safe === 'hybrid' || safe === 'agent') return safe;
  return 'human';
}

function currentLevelRow(t) {
  return t.blindSchedule[Math.min(t.levelIndex, t.blindSchedule.length - 1)];
}

function assignSeatsToTables(t) {
 const active = [...t.players.values()].filter((p) => p.status === 'active');
 // Cryptographically deterministic seeded shuffle using SHA-256 PRNG
 // with rejection sampling to eliminate modulo bias.
 // Previous code used Math.floor(shuffleRng() * (i + 1)) which has modulo bias
 // when 2^32 is not evenly divisible by (i+1). For a 180-player tournament,
 // the bias is detectable and exploitable since the tournament ID (seed) is public.
 let shuffleCounter = 0;
 const shuffleInt = (max) => {
 const hex = createHash('sha256').update(`${t.tournamentId}:shuffle:${shuffleCounter}`).digest('hex');
 shuffleCounter += 1;
 const int = Number.parseInt(hex.slice(0, 8), 16);
 // Rejection sampling: eliminate modulo bias (same pattern as holdem-engine createRng)
 const limit = 0x100000000 - (0x100000000 % max);
 if (int < limit) return int % max;
 return shuffleInt(max); // redraw (extremely rare, ~1.2% for max=52)
 };
 for (let i = active.length - 1; i > 0; i -= 1) {
 const j = shuffleInt(i + 1);
 [active[i], active[j]] = [active[j], active[i]];
 }

 // TDA Rule 40: Tables must be balanced — no table should differ by more
 // than 1 player. The previous sequential fill created unbalanced tables
 // (e.g., 9+1 for 10 players on 9-max tables instead of 5+5).
 // Fix: calculate table count, then distribute round-robin for balance.
 const numTables = Math.ceil(active.length / t.tableSize);
 t.tables = new Map();
 t.tableCounter = numTables;
 for (let i = 1; i <= numTables; i += 1) {
 const tableId = `${t.tournamentId}-table-${i}`;
 t.tables.set(tableId, { tableId, seats: [] });
 }
 const tableIds = [...t.tables.keys()];
 for (let i = 0; i < active.length; i += 1) {
 const p = active[i];
 const targetTableId = tableIds[i % numTables];
 const target = t.tables.get(targetTableId);
 p.tableId = targetTableId;
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
 // Use SHA-256 PRNG with rejection sampling for fair seat assignment
 // (same pattern as assignSeatsToTables — eliminates modulo bias)
 let mergeCounter = 0;
 const mergeInt = (max) => {
 const hex = createHash('sha256').update(`${t.tournamentId}:merge:${mergeCounter}`).digest('hex');
 mergeCounter += 1;
 const int = Number.parseInt(hex.slice(0, 8), 16);
 const limit = 0x100000000 - (0x100000000 % max);
 if (int < limit) return int % max;
 return mergeInt(max); // rejection sampling
 };
 for (let i = active.length - 1; i > 0; i -= 1) {
 const j = mergeInt(i + 1);
 [active[i], active[j]] = [active[j], active[i]];
 }

  const tableId = `${t.tournamentId}-final-table`;
  const table = { tableId, seats: [] };
  t.tables = new Map([[tableId, table]]);
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
 // Close late reg when active player count drops below this threshold.
 // Prevents unfair late entry into a near-complete tournament (e.g., buying
 // into a 50-player tournament when only 2 players remain). Defaults to 2
 // (must be at least heads-up to meaningfully continue).
 minPlayers: toInt(config.lateReg?.minPlayers ?? 2, 'lateRegMinPlayers', 2),
 open: true,
 },
  rebuy: {
    enabled: Boolean(config.rebuy?.enabled),
    // When rebuy is enabled, default maxPerPlayer to 1 (not 0).
    // A default of 0 means p.rebuys >= 0 is always true on the first check,
    // which silently blocks ALL rebuys — making rebuy.enabled=true useless.
    maxPerPlayer: toInt(
      config.rebuy?.maxPerPlayer ?? (Boolean(config.rebuy?.enabled) ? 1 : 0),
      'rebuyMax', 0
    ),
 untilLevelInclusive: toInt(config.rebuy?.untilLevelInclusive ?? 6, 'rebuyUntilLevel', 0),
 chipsPerRebuy: toInt(config.rebuy?.chipsPerRebuy ?? startStack, 'chipsPerRebuy', 100),
 // Rebuy may have a different price than buy-in (e.g., $10 buy-in + $5 rebuy).
 // Defaults to buyInUnits if not specified (backward compatible).
 rebuyPriceUnits: toInt(config.rebuy?.rebuyPriceUnits ?? buyInUnits, 'rebuyPriceUnits', 1),
 },
 addon: {
 enabled: Boolean(config.addon?.enabled),
 level: toInt(config.addon?.level ?? 6, 'addonLevel', 1),
 chips: toInt(config.addon?.chips ?? Math.floor(startStack * 1.5), 'addonChips', 100),
 // Add-on may have a different price than the buy-in (e.g., $10 buy-in
 // with $15 add-on). If not specified, defaults to buyInUnits.
 addonPriceUnits: toUnits(config.addon?.addonPriceUnits ?? buyInUnits, 'addonPriceUnits'),
 },
    payoutBps: cloneJson(config.payoutBps || defaultPayoutBps(maxPlayers)),
    policy: normalizePolicy(config.policy),
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

export function registerPlayer(t, { playerId, controlMode }) {
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
    controlMode: normalizeControlMode(controlMode, 'human'),
    controlUpdatedAt: nowIso(),
  });
 t.prizePoolUnits += t.buyInUnits;
 t.eventLog.push({ type: 'player.registered', ts: nowIso(), payload: { playerId } });

 // Only rebalance tables when the tournament is running AND no hands are
 // currently in progress on any table. Rebalancing mid-hand corrupts the
 // hand-in-progress (changes seat assignments, breaks actingSeat tracking,
 // invalidates hole card mappings). This can happen with late registration
 // where registerPlayer is called while hands are being played.
 // The safe approach: defer rebalance until between hands.
 // Since we can't know hand state here, only rebalance for SNG auto-start.
 // For MTT late-reg, rebalance will occur at the next table break or when
 // the tournament clock advances.
 if (t.status === 'running' && t.type === 'sng') {
 // SNG auto-start check — only rebalance when the table is first set up
 // (no active hands). After this initial setup, rebalance happens via
 // eliminatePlayer and advanceTournamentClock.
 rebalanceTables(t);
 } else if (t.status === 'running' && t.type === 'mtt') {
 // MTT late registration: defer rebalance. Tables will be rebalanced
 // when eliminatePlayer is called (between hands) or when the clock
 // advances. Do NOT call rebalanceTables here — it would disrupt
 // active hands.
 t.eventLog.push({ type: 'player.late_registered', ts: nowIso(), payload: { playerId, rebalanceDeferred: true } });
 }

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

export function setControlMode(t, { playerId, controlMode, requestedBy } = {}) {
  assertString(playerId, 'playerId');
  const player = t.players.get(playerId);
  if (!player) throw new Error('Unknown player');
  const nextMode = normalizeControlMode(controlMode, player.controlMode || 'human');
  player.controlMode = nextMode;
  player.controlUpdatedAt = nowIso();
  t.eventLog.push({
    type: 'player.control_mode_changed',
    ts: nowIso(),
    payload: {
      playerId,
      controlMode: nextMode,
      requestedBy: requestedBy ? String(requestedBy) : '',
    },
  });
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
      // Breaks are scheduled after N completed levels (1-based).
      // `levelIndex` is 0-based and already incremented here, so a break
      // should trigger when `levelIndex % everyLevels === 0` (e.g., index 2
      // means level 3 completed when everyLevels=3).
      if (t.levelIndex >= 0 && (t.levelIndex + 1) % t.breakConfig.everyLevels === 0) {
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
  // Standard rule: rebuys only allowed when at or below starting stack
  if (p.chips > t.startStack) throw new Error('Not eligible for rebuy: chip count too high');

  p.rebuys += 1;
  p.entries += 1;
  p.chips += t.rebuy.chipsPerRebuy;
  p.status = 'active';
  // Reset finishPosition — player is back in the tournament.
  // Leaving the old finishPosition caused computePayouts to pay
  // a \"ghost\" finish position for an active player.
  p.finishPosition = null;
  // Remove from eliminationOrder — player is no longer eliminated.
  t.eliminationOrder = t.eliminationOrder.filter((e) => e.playerId !== playerId);
 // Reset finishPosition — player is back in the tournament.
 // Leaving the old finishPosition caused computePayouts to pay
 // a "ghost" finish position for an active player.
 p.finishPosition = null;
 // Remove from eliminationOrder — player is no longer eliminated.
 t.eliminationOrder = t.eliminationOrder.filter((e) => e.playerId !== playerId);
 // Rebuy may have a different price than buy-in (e.g., $10 buy-in + $5 rebuy).
 // Previously used t.buyInUnits which was incorrect when rebuy pricing differs.
 t.prizePoolUnits += t.rebuy.rebuyPriceUnits || t.buyInUnits;

  t.eventLog.push({ type: 'player.rebuy', ts: nowIso(), payload: { playerId, rebuys: p.rebuys } });
  if (t.status === 'running' && t.type === 'mtt') {
    // MTT rebuy: defer rebalance. Tables will be rebalanced
    // when eliminatePlayer is called (between hands) or when the clock
    // advances. Do NOT call rebalanceTables here — it would disrupt
    // active hands.
    t.eventLog.push({ type: 'player.rebuy_deferred_rebalance', ts: nowIso(), payload: { playerId, rebalanceDeferred: true } });
  } else {
    // For SNGs or non-running tournaments, rebalance immediately
    rebalanceTables(t);
  return snapshotTournament(t);
}

export function addOnPlayer(t, { playerId }) {
  const p = t.players.get(playerId);
  if (!p) throw new Error('Unknown player');
  if (!t.addon.enabled) throw new Error('Add-on disabled');
 if (p.addonTaken) throw new Error('Add-on already used');
 // Allow add-on at the configured level or any level before it (since the exact
 // level boundary may be missed if the clock advances multiple levels at once).
 // Previously used strict equality (`!==`) which made add-on impossible if the
 // level was skipped or the player missed the exact window.
    if (t.levelIndex < t.addon.level) throw new Error('Add-on not yet available');
    // Add-on window is from `addon.level` up to `addon.level + 1` if on break,
    // or `addon.level` itself if not on break (for single-level window).
    // Ensure that if the clock jumps, we still allow add-on if the player
    // was eligible at any skipped level.
    if (t.levelIndex > t.addon.level && !t.onBreak) {
      throw new Error('Add-on window closed');
    }
    // If on break at level + 1, it's the last chance for add-on.
    // If not on break at level + 1, it's already too late.
    if (t.onBreak && t.levelIndex > t.addon.level + 1) {
      throw new Error('Add-on window closed');
    }

 p.addonTaken = true;
 p.entries += 1;
 p.chips += t.addon.chips;
 // Add-on may have a different price than buy-in (e.g., $10 buy-in + $15 add-on).
 // Previously used t.buyInUnits which was incorrect when addon pricing differs.
 t.prizePoolUnits += t.addon.addonPriceUnits || t.buyInUnits;

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
 t.lateReg.open = false;
 t.tables = new Map();
 } else {
 // Close late registration if the active player count has dropped below
 // lateReg.minPlayers. A new player buying in when only 2 remain in a
 // 50-player tournament is at an unfair chip disadvantage and distorts
 // the prize pool. Previously, late reg only closed by level cutoff or
 // tournament completion — a small remaining field was not considered.
 if (t.lateReg.open && active.length < t.lateReg.minPlayers) {
 t.lateReg.open = false;
 t.eventLog.push({ type: 'latereg.closed_field_shrink', ts: nowIso(), payload: { activeCount: active.length, minPlayers: t.lateReg.minPlayers } });
 }
 // Also close late reg if we've gone past the level cutoff — this is a
 // safety net since advanceTournamentClock is the primary mechanism.
 if (t.lateReg.open && t.levelIndex > t.lateReg.byLevelInclusive) {
 t.lateReg.open = false;
 }
 rebalanceTables(t);
 }

  return snapshotTournament(t);
}

export function computePayouts(t) {
 if (t.status !== 'complete') throw new Error('Tournament not complete');
 // Only include players with a valid finishPosition for payout.
 // Players with finishPosition=null (e.g., registered but never eliminated)
 // should NOT receive payouts — they are sorted as 9999 and could silently
 // consume payout positions meant for actual finishers.
 const entries = [...t.players.values()]
 .filter((p) => p.finishPosition != null && Number(p.finishPosition) > 0)
 .sort((a, b) => {
 const fa = Number(a.finishPosition);
 const fb = Number(b.finishPosition);
 if (fa !== fb) return fa - fb;
 return a.playerId.localeCompare(b.playerId);
 });

 // Guard: no players with finishPosition — prize pool cannot be distributed.
 // Without this, the for-loop runs 0 times and the entire prize pool is silently
 // undistributed (chips vanish). This shouldn't happen in normal tournament flow
 // (eliminatePlayer always sets finishPosition), but a crash or data corruption
 // could create this state.
 if (entries.length === 0) {
 throw new Error('No players with finishPosition — cannot compute payouts');
 }

 // When fewer players finish in-the-money than payoutBps entries,
 // redistribute unused BPS proportionally to the paid positions.
 // e.g. 5 players with 7-position BPS → positions 4-6 BPS are lost
 // unless we reallocate them.
 const paidPositions = Math.min(entries.length, t.payoutBps.length);
 const rawBps = t.payoutBps.slice(0, paidPositions);
 const totalRawBps = rawBps.reduce((s, b) => s + b, 0);
 const unusedBps = t.payoutBps.slice(paidPositions).reduce((s, b) => s + b, 0);
 const effectiveBps = totalRawBps === 0
 ? rawBps.map(() => Math.floor(10000 / paidPositions))
 : rawBps.map((b) => Math.round((b / totalRawBps) * 10000));
 // Re-normalize to exactly 10000 after rounding
 // Per TDA convention, odd chip goes to worst finishing position (last paid position)
 const bpsSum = effectiveBps.reduce((s, b) => s + b, 0);
 if (bpsSum !== 10000 && effectiveBps.length > 0) {
 effectiveBps[effectiveBps.length - 1] += 10000 - bpsSum;
 }

 const payouts = [];
 let distributedTotal = 0;
 for (let i = 0; i < paidPositions; i += 1) {
 const p = entries[i];
 if (!p) break;
 const payout = Math.floor((t.prizePoolUnits * effectiveBps[i]) / 10000);
 distributedTotal += payout;
 payouts.push({
 playerId: p.playerId,
 finishPosition: p.finishPosition,
 payoutUnits: payout,
 });
 }

 // Distribute truncation remainder (1 unit each) starting from worst finishing position
 // Per TDA Rule 73 convention, odd chip goes to seat closest LEFT of button clockwise.
 // In payout context, this means the worst (last) paid position gets the odd chips.
 const remainder = t.prizePoolUnits - distributedTotal;
 for (let i = payouts.length - 1; i >= 0 && remainder > 0; i -= 1) {
 payouts[i].payoutUnits += 1;
 remainder -= 1;
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
    policy: cloneJson(t.policy || {}),
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
    policy: cloneJson(t.policy || {}),
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
    policy: snapshot.policy,
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
 t.lateReg.open = Boolean(snapshot.lateReg?.open ?? true);
 t.tables = new Map((snapshot.tables || []).map((row) => [row.tableId, { tableId: row.tableId, seats: [...(row.seats || [])] }]));
 t.eventLog = cloneJson(snapshot.eventLog || []);
  return t;
}
