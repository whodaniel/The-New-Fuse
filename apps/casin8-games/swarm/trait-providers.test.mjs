import test from 'node:test';
import assert from 'node:assert/strict';

import { craftTraitsFromProvider, listTraitProviders } from './agent-strategy/trait-providers.mjs';

test('trait providers list includes expected adapters', () => {
  const providers = listTraitProviders();
  assert.deepEqual(providers, ['texassolver', 'cfr_profile', 'risk_profile']);
});

test('cfr_profile provider crafts actionable recommendation', () => {
  const out = craftTraitsFromProvider({
    provider: 'cfr_profile',
    agentId: 'agent-cfr-1',
    cfrProfile: {
      actionMix: {
        fold: 0.1,
        check: 0.12,
        call: 0.26,
        raise: 0.41,
        bet: 0.08,
        allin: 0.03,
      },
      exploitabilityBb100: 4.2,
      sampleHands: 24000,
    },
  });
  assert.equal(out.source, 'cfr_profile');
  assert.equal(typeof out.recommended.style, 'string');
  assert.equal(typeof out.recommended.temperament, 'string');
  assert.equal(typeof out.recommended.maxRiskBps, 'number');
  assert.equal(out.recommended.styleOverrides.pfrBps > 0, true);
});

test('risk_profile provider reduces risk for high-risk signals', () => {
  const out = craftTraitsFromProvider({
    provider: 'risk_profile',
    agentId: 'agent-risk-1',
    riskProfile: {
      riskScore: 86,
      collusionScore: 78,
      tiltIndexBps: 8200,
      abuseFlags: ['chip_dump_suspected', 'soft_play_cluster'],
    },
  });
  assert.equal(out.source, 'risk_profile');
  assert.equal(out.recommended.temperament, 'tight_passive');
  assert.equal(out.recommended.maxRiskBps < 1000, true);
  assert.equal(out.diagnostics.abuseFlags.length, 2);
});

test('phase context tightens risk on final table', () => {
  const out = craftTraitsFromProvider({
    provider: 'cfr_profile',
    agentId: 'agent-cfr-final',
    cfrProfile: {
      actionMix: {
        fold: 0.08,
        check: 0.1,
        call: 0.24,
        raise: 0.45,
        bet: 0.1,
        allin: 0.03,
      },
      exploitabilityBb100: 2.8,
      sampleHands: 40000,
    },
    context: {
      gameType: 'mtt',
      phase: 'final_table',
    },
  });
  assert.equal(out.phaseAdjustment?.applied, true);
  assert.equal(out.phaseAdjustment?.phase, 'final_table');
  assert.equal(out.phaseAdjustment?.adjustedRiskBps <= out.phaseAdjustment?.baseRiskBps, true);
});
