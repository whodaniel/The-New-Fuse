import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createNurtureProgram,
  recordEpisode,
  evaluateProgram,
  updateTrainingProfile,
  buildCoachCard,
  STAGES,
} from './agent-nurture/index.mjs';

test('agent-nurture lifecycle progresses stage and emits recommendations', () => {
  const program = createNurtureProgram({
    agentId: 'agent-nurture-1',
    ownerId: 'owner-1',
    distributed: true,
    cluster: true,
  });

  for (let i = 0; i < 25; i += 1) {
    recordEpisode(program, {
      bb100: i < 10 ? -1 + i * 0.1 : 2.5,
      exploitabilityProxy: i < 10 ? 80 - i : 24,
      policyEntropy: i < 10 ? 0.1 : 0.35,
      showdownErrorRateBps: i < 10 ? 40 : 5,
      decisionLatencyMsP95: i < 10 ? 540 : 210,
      legalActionViolationBps: i < 10 ? 15 : 0,
      bankrollVolatilityBps: 1100,
    });
  }

  const evalOut = evaluateProgram(program);
  assert.equal([
    STAGES.STABLE_SELF_PLAY,
    STAGES.EXPLOIT_TEST,
    STAGES.LADDER_READY,
  ].includes(evalOut.stage), true);
  assert.equal(typeof evalOut.score.bb100, 'number');

  const profile = updateTrainingProfile(program, {
    learnerActors: 8,
    miniBatchSize: 4096,
    evalCadence: { exploitabilityProxyEvery: 2 },
  });
  assert.equal(profile.learnerActors, 8);
  assert.equal(profile.miniBatchSize, 4096);
  assert.equal(profile.evalCadence.exploitabilityProxyEvery, 2);

  const card = buildCoachCard(program);
  assert.equal(card.agentId, 'agent-nurture-1');
  assert.equal(typeof card.episodes, 'number');
  assert.equal(Array.isArray(card.topRecommendations), true);
});
