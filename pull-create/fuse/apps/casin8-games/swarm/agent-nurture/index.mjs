import { assertInteger, assertString } from '../shared/contracts.mjs';

function nowIso() {
  return new Date().toISOString();
}

function toNum(value, field, min = null) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}`);
  if (min != null && n < min) throw new Error(`Invalid ${field}: expected >= ${min}`);
  return n;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const STAGES = Object.freeze({
  BOOTSTRAP: 'bootstrap',
  STABLE_SELF_PLAY: 'stable_self_play',
  EXPLOIT_TEST: 'exploit_test',
  LADDER_READY: 'ladder_ready',
});

export function createNurtureProgram({
  agentId,
  ownerId,
  objective = 'cash_nlhe_6max',
  targetBbps = 2.0,
  distributed = false,
  cluster = false,
}) {
  assertString(agentId, 'agentId');
  assertString(ownerId, 'ownerId');

  return {
    agentId,
    ownerId,
    objective,
    stage: STAGES.BOOTSTRAP,
    trainingProfile: {
      distributed: Boolean(distributed),
      cluster: Boolean(cluster),
      learnerActors: distributed ? 4 : 1,
      traversalsPerIteration: 1200,
      miniBatchSize: 2048,
      targetBbps,
      evalCadence: {
        exploitabilityProxyEvery: 3,
        lbrProbeEvery: 5,
        headToHeadEvery: 2,
      },
      opponentPool: {
        tags: ['self_play_bootstrap'],
        mixBps: { self: 7000, archived: 2000, scripted: 1000 },
      },
    },
    metrics: {
      episodes: 0,
      rollingWindow: 20,
      bb100: [],
      exploitabilityProxy: [],
      policyEntropy: [],
      showdownErrorRateBps: [],
      decisionLatencyMsP95: [],
      legalActionViolationBps: [],
      bankrollVolatilityBps: [],
    },
    recommendations: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function rollingAvg(list, n = 20) {
  const slice = list.slice(-n);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function recordEpisode(program, episode) {
  if (!program) throw new Error('program is required');

  const row = {
    bb100: toNum(episode.bb100, 'bb100'),
    exploitabilityProxy: toNum(episode.exploitabilityProxy ?? 100, 'exploitabilityProxy', 0),
    policyEntropy: clamp(toNum(episode.policyEntropy ?? 0.5, 'policyEntropy', 0), 0, 1),
    showdownErrorRateBps: clamp(toNum(episode.showdownErrorRateBps ?? 0, 'showdownErrorRateBps', 0), 0, 10000),
    decisionLatencyMsP95: toNum(episode.decisionLatencyMsP95 ?? 250, 'decisionLatencyMsP95', 0),
    legalActionViolationBps: clamp(toNum(episode.legalActionViolationBps ?? 0, 'legalActionViolationBps', 0), 0, 10000),
    bankrollVolatilityBps: clamp(toNum(episode.bankrollVolatilityBps ?? 1200, 'bankrollVolatilityBps', 0), 0, 10000),
    source: String(episode.source || 'self_play'),
    ts: nowIso(),
  };

  const m = program.metrics;
  m.episodes += 1;
  m.bb100.push(row.bb100);
  m.exploitabilityProxy.push(row.exploitabilityProxy);
  m.policyEntropy.push(row.policyEntropy);
  m.showdownErrorRateBps.push(row.showdownErrorRateBps);
  m.decisionLatencyMsP95.push(row.decisionLatencyMsP95);
  m.legalActionViolationBps.push(row.legalActionViolationBps);
  m.bankrollVolatilityBps.push(row.bankrollVolatilityBps);

  const cap = 200;
  for (const key of [
    'bb100',
    'exploitabilityProxy',
    'policyEntropy',
    'showdownErrorRateBps',
    'decisionLatencyMsP95',
    'legalActionViolationBps',
    'bankrollVolatilityBps',
  ]) {
    if (m[key].length > cap) m[key] = m[key].slice(-cap);
  }

  program.updatedAt = nowIso();
  return row;
}

export function evaluateProgram(program) {
  if (!program) throw new Error('program is required');
  const m = program.metrics;
  const n = m.rollingWindow;

  const score = {
    bb100: rollingAvg(m.bb100, n),
    exploitabilityProxy: rollingAvg(m.exploitabilityProxy, n),
    policyEntropy: rollingAvg(m.policyEntropy, n),
    showdownErrorRateBps: rollingAvg(m.showdownErrorRateBps, n),
    decisionLatencyMsP95: rollingAvg(m.decisionLatencyMsP95, n),
    legalActionViolationBps: rollingAvg(m.legalActionViolationBps, n),
    bankrollVolatilityBps: rollingAvg(m.bankrollVolatilityBps, n),
  };

  let nextStage = STAGES.BOOTSTRAP;
  if (
    score.legalActionViolationBps <= 5 &&
    score.showdownErrorRateBps <= 20 &&
    score.exploitabilityProxy <= 70
  ) {
    nextStage = STAGES.STABLE_SELF_PLAY;
  }
  if (
    nextStage === STAGES.STABLE_SELF_PLAY &&
    score.exploitabilityProxy <= 45 &&
    score.bb100 >= 0.5
  ) {
    nextStage = STAGES.EXPLOIT_TEST;
  }
  if (
    nextStage === STAGES.EXPLOIT_TEST &&
    score.exploitabilityProxy <= 28 &&
    score.bb100 >= program.trainingProfile.targetBbps &&
    score.legalActionViolationBps <= 1
  ) {
    nextStage = STAGES.LADDER_READY;
  }

  const recs = [];
  if (score.legalActionViolationBps > 10) {
    recs.push('Increase legal-action masking checks and penalize invalid move logits.');
  }
  if (score.policyEntropy < 0.15) {
    recs.push('Policy entropy too low; add opponent diversity and exploration temperature.');
  }
  if (score.exploitabilityProxy > 60) {
    recs.push('Run exploitability proxy evaluation more frequently and add BR-like probes.');
  }
  if (score.bb100 < 0) {
    recs.push('Negative winrate; shift opponent-pool mix toward weaker scripted opponents for recovery.');
  }
  if (score.decisionLatencyMsP95 > 500) {
    recs.push('Latency too high; shrink model depth or cache inference for acting seat.');
  }

  const opponentPool = clone(program.trainingProfile.opponentPool);
  if (nextStage === STAGES.STABLE_SELF_PLAY) {
    opponentPool.tags = ['self_play', 'archived_snapshots', 'scripted_baselines'];
    opponentPool.mixBps = { self: 6000, archived: 2500, scripted: 1500 };
  } else if (nextStage === STAGES.EXPLOIT_TEST) {
    opponentPool.tags = ['archived_hard', 'lbr_probe', 'self_play'];
    opponentPool.mixBps = { self: 4500, archived: 3500, scripted: 500, probe: 1500 };
  } else if (nextStage === STAGES.LADDER_READY) {
    opponentPool.tags = ['production_ladder_shadow', 'archived_hard', 'self_play'];
    opponentPool.mixBps = { self: 3500, archived: 3000, ladder_shadow: 3500 };
  }

  const evaluation = {
    stage: nextStage,
    score,
    recommendations: recs,
    profileAdjustments: {
      opponentPool,
      evalCadence: {
        exploitabilityProxyEvery: nextStage === STAGES.LADDER_READY ? 2 : 3,
        lbrProbeEvery: nextStage === STAGES.BOOTSTRAP ? 6 : 4,
        headToHeadEvery: 2,
      },
    },
    generatedAt: nowIso(),
  };

  program.stage = nextStage;
  program.recommendations.unshift(evaluation);
  if (program.recommendations.length > 50) program.recommendations = program.recommendations.slice(0, 50);
  program.trainingProfile.opponentPool = opponentPool;
  program.trainingProfile.evalCadence = evaluation.profileAdjustments.evalCadence;
  program.updatedAt = nowIso();

  return evaluation;
}

export function updateTrainingProfile(program, patch = {}) {
  if (!program) throw new Error('program is required');
  const next = { ...program.trainingProfile };

  if (patch.distributed != null) next.distributed = Boolean(patch.distributed);
  if (patch.cluster != null) next.cluster = Boolean(patch.cluster);
  if (patch.learnerActors != null) next.learnerActors = toNum(patch.learnerActors, 'learnerActors', 1);
  if (patch.traversalsPerIteration != null)
    next.traversalsPerIteration = toNum(patch.traversalsPerIteration, 'traversalsPerIteration', 1);
  if (patch.miniBatchSize != null) next.miniBatchSize = toNum(patch.miniBatchSize, 'miniBatchSize', 32);
  if (patch.targetBbps != null) next.targetBbps = toNum(patch.targetBbps, 'targetBbps');
  if (patch.evalCadence && typeof patch.evalCadence === 'object') {
    const cadence = { ...next.evalCadence };
    if (patch.evalCadence.exploitabilityProxyEvery != null)
      cadence.exploitabilityProxyEvery = toNum(patch.evalCadence.exploitabilityProxyEvery, 'exploitabilityProxyEvery', 1);
    if (patch.evalCadence.lbrProbeEvery != null)
      cadence.lbrProbeEvery = toNum(patch.evalCadence.lbrProbeEvery, 'lbrProbeEvery', 1);
    if (patch.evalCadence.headToHeadEvery != null)
      cadence.headToHeadEvery = toNum(patch.evalCadence.headToHeadEvery, 'headToHeadEvery', 1);
    next.evalCadence = cadence;
  }

  program.trainingProfile = next;
  program.updatedAt = nowIso();
  return clone(program.trainingProfile);
}

export function getProgramState(program) {
  if (!program) throw new Error('program is required');
  return clone(program);
}

export function buildCoachCard(program) {
  if (!program) throw new Error('program is required');
  const latest = program.recommendations[0] || null;
  const m = program.metrics;

  return {
    agentId: program.agentId,
    stage: program.stage,
    objective: program.objective,
    episodes: m.episodes,
    latestScore: latest?.score || null,
    topRecommendations: latest?.recommendations || [],
    trainingProfile: clone(program.trainingProfile),
    generatedAt: nowIso(),
  };
}
