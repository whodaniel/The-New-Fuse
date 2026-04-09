import { createHash } from 'node:crypto';

import { assertInteger, assertString } from '../../shared/contracts.mjs';

function hashHex(input) {
  return createHash('sha256').update(String(input)).digest('hex');
}

function hashInt(input) {
  const hex = hashHex(input).slice(0, 12);
  return Number.parseInt(hex, 16);
}

function scoreForSample({ seed, iteration, playerId, boardKey }) {
  const raw = hashInt(`${seed}:${iteration}:${playerId}:${boardKey}`);
  return raw % 100000;
}

export function evaluateBoardStrength({ holeCards = [], boardCards = [] }) {
  if (!Array.isArray(holeCards) || holeCards.length === 0) {
    throw new Error('holeCards must be a non-empty array');
  }
  if (!Array.isArray(boardCards)) {
    throw new Error('boardCards must be an array');
  }

  const merged = [...holeCards, ...boardCards].map((card) => String(card).toUpperCase());
  const rankWeight = merged.reduce((acc, card) => {
    const rank = card.slice(0, -1);
    const map = {
      A: 14,
      K: 13,
      Q: 12,
      J: 11,
      T: 10,
      '9': 9,
      '8': 8,
      '7': 7,
      '6': 6,
      '5': 5,
      '4': 4,
      '3': 3,
      '2': 2,
    };
    return acc + (map[rank] || 0);
  }, 0);

  // Heuristic-only scalar for fast policy routing.
  return Number((rankWeight / (merged.length * 14)).toFixed(4));
}

export function runMonteCarloEquity({
  seed,
  players,
  boardCards = [],
  iterations = 2000,
}) {
  assertString(seed, 'seed');
  assertInteger(iterations, 'iterations', 1);
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error('players must be an array with at least 2 players');
  }

  const boardKey = JSON.stringify(boardCards || []);
  const tallies = new Map(players.map((p) => [p.playerId, { wins: 0, ties: 0, scoreSum: 0 }]));

  for (let i = 0; i < iterations; i += 1) {
    let best = -1;
    let winners = [];

    for (const p of players) {
      assertString(p.playerId, 'players[].playerId');
      const sample = scoreForSample({ seed, iteration: i, playerId: p.playerId, boardKey });
      const current = tallies.get(p.playerId);
      current.scoreSum += sample;

      if (sample > best) {
        best = sample;
        winners = [p.playerId];
      } else if (sample === best) {
        winners.push(p.playerId);
      }
    }

    if (winners.length === 1) {
      tallies.get(winners[0]).wins += 1;
    } else {
      for (const id of winners) {
        tallies.get(id).ties += 1;
      }
    }
  }

  const playersOut = players.map((p) => {
    const row = tallies.get(p.playerId);
    const equity = (row.wins + row.ties / 2) / iterations;
    return {
      playerId: p.playerId,
      winRate: Number((row.wins / iterations).toFixed(6)),
      tieRate: Number((row.ties / iterations).toFixed(6)),
      equity: Number(equity.toFixed(6)),
      avgSampleScore: Number((row.scoreSum / iterations).toFixed(2)),
    };
  });

  return {
    seed,
    iterations,
    boardCards: [...boardCards],
    generatedAt: new Date().toISOString(),
    players: playersOut,
  };
}

export function compareAgents({ baseline, challenger, minEdgeBps = 250 }) {
  if (!baseline || !challenger) {
    throw new Error('baseline and challenger equity rows are required');
  }
  assertInteger(minEdgeBps, 'minEdgeBps', 1);

  const edge = challenger.equity - baseline.equity;
  const edgeBps = Math.round(edge * 10000);
  return {
    edgeBps,
    significant: edgeBps >= minEdgeBps,
  };
}
