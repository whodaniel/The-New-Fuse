import { assertInteger, assertString } from '../../shared/contracts.mjs';

export const SNG_STATUS = Object.freeze({
  REGISTRATION: 'registration',
  RUNNING: 'running',
  COMPLETE: 'complete',
});

const DEFAULT_PAYOUTS = {
  6: [6500, 3500],
  9: [5000, 3000, 2000],
};

export function createSng({
  tournamentId,
  maxPlayers = 6,
  buyInUnits = 100n,
  startChips = 1500,
  blindLevels = defaultBlindLevels(),
}) {
  assertString(tournamentId, 'tournamentId');
  assertInteger(maxPlayers, 'maxPlayers', 2);
  if (![6, 9].includes(maxPlayers)) {
    throw new Error('SNG supports 6-max or 9-max in v1 scaffold');
  }
  const buyIn = toBigInt(buyInUnits, 'buyInUnits');

  return {
    tournamentId,
    status: SNG_STATUS.REGISTRATION,
    maxPlayers,
    buyInUnits: buyIn,
    startChips,
    blindLevels,
    levelIndex: 0,
    seats: [],
    eliminated: [],
    payoutBps: [...DEFAULT_PAYOUTS[maxPlayers]],
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
}

export function registerPlayer(sng, player) {
  if (sng.status !== SNG_STATUS.REGISTRATION) {
    throw new Error('Registration closed');
  }
  assertString(player.playerId, 'playerId');
  const isDuplicate = sng.seats.some((p) => p.playerId === player.playerId);
  if (isDuplicate) {
    throw new Error('Player already registered');
  }
  if (sng.seats.length >= sng.maxPlayers) {
    throw new Error('SNG is full');
  }

  sng.seats.push({
    playerId: player.playerId,
    stack: sng.startChips,
    seat: sng.seats.length,
    status: 'active',
  });

  if (sng.seats.length === sng.maxPlayers) {
    startSng(sng);
  }

  return snapshot(sng);
}

export function startSng(sng) {
  if (sng.status !== SNG_STATUS.REGISTRATION) {
    throw new Error('SNG already started');
  }
  if (sng.seats.length < 2) {
    throw new Error('Need at least 2 players');
  }
  sng.status = SNG_STATUS.RUNNING;
  sng.startedAt = new Date().toISOString();
  return snapshot(sng);
}

export function advanceBlindLevel(sng) {
  if (sng.status !== SNG_STATUS.RUNNING) {
    throw new Error('SNG not running');
  }
  sng.levelIndex = Math.min(sng.levelIndex + 1, sng.blindLevels.length - 1);
  return currentLevel(sng);
}

export function eliminatePlayer(sng, playerId, finishPosition) {
  if (sng.status !== SNG_STATUS.RUNNING) {
    throw new Error('SNG not running');
  }

  const seat = sng.seats.find((p) => p.playerId === playerId);
  if (!seat || seat.status !== 'active') {
    throw new Error('Player not active');
  }

  seat.status = 'eliminated';
  seat.stack = 0;
  sng.eliminated.push({ playerId, finishPosition, ts: new Date().toISOString() });

  const active = sng.seats.filter((p) => p.status === 'active');
  if (active.length <= 1) {
    sng.status = SNG_STATUS.COMPLETE;
    sng.completedAt = new Date().toISOString();
    if (active.length === 1) {
      sng.eliminated.push({
        playerId: active[0].playerId,
        finishPosition: 1,
        ts: new Date().toISOString(),
      });
    }
  }

  return snapshot(sng);
}

export function computePayouts(sng) {
  if (sng.status !== SNG_STATUS.COMPLETE) {
    throw new Error('SNG must be complete');
  }

  const totalPool = sng.buyInUnits * BigInt(sng.seats.length);
  const sorted = [...sng.eliminated].sort((a, b) => a.finishPosition - b.finishPosition);
  const payouts = [];

  for (let i = 0; i < sng.payoutBps.length; i += 1) {
    const row = sorted[i];
    if (!row) continue;
    const payoutUnits = (totalPool * BigInt(sng.payoutBps[i])) / 10000n;
    payouts.push({
      playerId: row.playerId,
      finishPosition: row.finishPosition,
      payoutUnits,
    });
  }

  return payouts;
}

export function currentLevel(sng) {
  return sng.blindLevels[sng.levelIndex];
}

function defaultBlindLevels() {
  return [
    { level: 1, sb: 10, bb: 20, ante: 0 },
    { level: 2, sb: 15, bb: 30, ante: 0 },
    { level: 3, sb: 25, bb: 50, ante: 5 },
    { level: 4, sb: 40, bb: 80, ante: 10 },
    { level: 5, sb: 60, bb: 120, ante: 15 },
    { level: 6, sb: 100, bb: 200, ante: 25 },
  ];
}

function toBigInt(value, field) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`Invalid ${field}: expected bigint-like integer`);
}

function snapshot(sng) {
  return JSON.parse(
    JSON.stringify(sng, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}
