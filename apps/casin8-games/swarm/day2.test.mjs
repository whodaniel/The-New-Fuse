import test from 'node:test';
import assert from 'node:assert/strict';

import { AgentRegistry, AUTONOMY_TIERS } from './agent-runtime/index.mjs';
import {
  createSng,
  registerPlayer,
  advanceBlindLevel,
  eliminatePlayer,
  computePayouts,
  SNG_STATUS,
} from './tournaments-sng/index.mjs';

test('agent-runtime enforces advisory tier and risk caps', () => {
  const registry = new AgentRegistry();
  registry.registerAgent({
    agentId: 'a-1',
    ownerId: 'owner-1',
    tier: AUTONOMY_TIERS.ADVISORY,
    style: 'tight_aggressive',
  });

  const denied = registry.evaluateActionPolicy('a-1', {
    action: 'raise',
    amountUnits: 100n,
    bankrollUnits: 1_000n,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.code, 'HUMAN_CONFIRM_REQUIRED');

  const suggested = registry.evaluateActionPolicy('a-1', {
    action: 'suggest',
    amountUnits: 0n,
    bankrollUnits: 1_000n,
  });
  assert.equal(suggested.allowed, true);

  registry.configureRisk('a-1', { maxLossPerSessionUnits: 200n });
  registry.registerLoss('a-1', 250n);

  const blocked = registry.evaluateActionPolicy('a-1', {
    action: 'suggest',
    amountUnits: 0n,
    bankrollUnits: 1_000n,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.code, 'SESSION_LOSS_LIMIT_EXCEEDED');
});

test('tournaments-sng starts when full and computes payouts', () => {
  const sng = createSng({
    tournamentId: 'sng-1',
    maxPlayers: 6,
    buyInUnits: 100n,
  });

  for (let i = 1; i <= 6; i += 1) {
    registerPlayer(sng, { playerId: `p-${i}` });
  }

  assert.equal(sng.status, SNG_STATUS.RUNNING);

  const before = sng.levelIndex;
  advanceBlindLevel(sng);
  assert.equal(sng.levelIndex, before + 1);

  eliminatePlayer(sng, 'p-6', 6);
  eliminatePlayer(sng, 'p-5', 5);
  eliminatePlayer(sng, 'p-4', 4);
  eliminatePlayer(sng, 'p-3', 3);
  eliminatePlayer(sng, 'p-2', 2);

  assert.equal(sng.status, SNG_STATUS.COMPLETE);

  const payouts = computePayouts(sng);
  assert.equal(payouts.length, 2);
  assert.equal(payouts[0].finishPosition, 1);
  assert.equal(payouts[0].payoutUnits > payouts[1].payoutUnits, true);
});
