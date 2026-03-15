import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateBoardStrength,
  runMonteCarloEquity,
  compareAgents,
} from '../core-logic/engine-sim/index.mjs';

test('engine-sim computes deterministic equity from seed', () => {
  const out1 = runMonteCarloEquity({
    seed: 'seed-1',
    iterations: 500,
    boardCards: ['Ah', 'Kd', '7c'],
    players: [{ playerId: 'a' }, { playerId: 'b' }],
  });

  const out2 = runMonteCarloEquity({
    seed: 'seed-1',
    iterations: 500,
    boardCards: ['Ah', 'Kd', '7c'],
    players: [{ playerId: 'a' }, { playerId: 'b' }],
  });

  assert.deepEqual(out1.players, out2.players);

  const strength = evaluateBoardStrength({ holeCards: ['As', 'Ad'], boardCards: ['Kh', '7h', '2c'] });
  assert.equal(strength > 0.6, true);

  const edge = compareAgents({ baseline: out1.players[0], challenger: out1.players[1], minEdgeBps: 1 });
  assert.equal(typeof edge.significant, 'boolean');
});
