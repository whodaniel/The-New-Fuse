import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEMPERAMENTS,
  buildStrategyProfile,
  chooseAction,
  enforceRiskCap,
} from './agent-strategy/index.mjs';

test('agent-strategy chooses actions by temperament and enforces cap', () => {
  const profile = buildStrategyProfile({
    agentId: 'agent-9',
    temperament: TEMPERAMENTS.TIGHT_AGGRESSIVE,
    maxRiskBps: 700,
  });

  const action = chooseAction({
    profile,
    legalActions: ['fold', 'call', 'raise'],
    handStrength: 0.73,
    potUnits: 400,
    toCallUnits: 80,
  });

  assert.equal(action.action, 'raise');
  assert.equal(action.amountUnits > 0, true);

  const capped = enforceRiskCap({
    actionDecision: action,
    bankrollUnits: 1000n,
    maxRiskBps: profile.maxRiskBps,
  });

  assert.equal(capped.amountUnits <= 70, true);
  assert.equal(capped.riskCapped, true);
});
