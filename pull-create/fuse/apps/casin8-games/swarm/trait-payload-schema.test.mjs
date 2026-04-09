import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTraitCraftPayload } from './agent-strategy/trait-payload-schema.mjs';

test('trait payload schema normalizes cfr provider payload', () => {
  const out = normalizeTraitCraftPayload({
    payloadVersion: 1,
    provider: 'cfr_profile',
    agentId: 'agent-cfr',
    cfrProfile: { actionMix: { fold: 1, call: 1, raise: 1 } },
    createProfile: true,
  });
  assert.equal(out.provider, 'cfr_profile');
  assert.equal(out.agentId, 'agent-cfr');
  assert.equal(typeof out.cfrProfile, 'object');
  assert.equal(out.createProfile, true);
});

test('trait payload schema rejects unsupported versions', () => {
  assert.throws(
    () =>
      normalizeTraitCraftPayload({
        payloadVersion: 99,
        provider: 'texassolver',
        agentId: 'agent-1',
        solverDump: { strategy: { actions: ['fold', 'call'], strategy: { AhKh: [0.5, 0.5] } } },
      }),
    /Unsupported payloadVersion/
  );
});
