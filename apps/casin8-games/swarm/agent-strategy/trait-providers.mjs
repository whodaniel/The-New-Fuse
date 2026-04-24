import { assertString } from '../../shared/contracts.mjs';
import { craftTraitsFromTexasSolver } from './texassolver-traits.mjs';

const PROVIDERS = Object.freeze(['texassolver', 'cfr_profile', 'risk_profile']);

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x || 0)));
}

function clampBps(x) {
  return Math.max(0, Math.min(10000, Math.round(Number(x || 0))));
}

function asNonNegative(x) {
  return Math.max(0, Number(x || 0));
}

function normalizePhase(rawPhase) {
  const phase = String(rawPhase || '').trim().toLowerCase();
  if (!phase) return 'unknown';
  if (phase === 'early' || phase === 'middle' || phase === 'late' || phase === 'bubble' || phase === 'final_table') {
    return phase;
  }
  return 'unknown';
}

function applyTournamentPhaseAdjustment(recommendation, context = null) {
  if (!context || typeof context !== 'object') return recommendation;
  const gameType = String(context.gameType || '').trim().toLowerCase();
  if (gameType !== 'mtt' && gameType !== 'sng') return recommendation;

  const phase = normalizePhase(context.phase);
  const rr = recommendation.recommended || {};
  const baseRisk = Math.max(250, Number(rr.maxRiskBps || 800));
  const styleOverrides = rr.styleOverrides && typeof rr.styleOverrides === 'object' ? { ...rr.styleOverrides } : {};
  let style = String(rr.style || 'exploitative');
  let temperament = String(rr.temperament || 'balanced');
  let risk = baseRisk;

  if (phase === 'bubble') {
    risk = Math.round(baseRisk * 0.78);
    styleOverrides.icmDisciplineBps = clampBps((Number(styleOverrides.icmDisciplineBps || 7000) + 1000));
    styleOverrides.bluffBps = clampBps(Number(styleOverrides.bluffBps || 1400) * 0.8);
    if (temperament === 'loose_aggressive') {
      temperament = 'tight_aggressive';
      style = 'tight_aggressive';
    }
  } else if (phase === 'final_table') {
    risk = Math.round(baseRisk * 0.72);
    styleOverrides.icmDisciplineBps = clampBps((Number(styleOverrides.icmDisciplineBps || 7200) + 1200));
    styleOverrides.vpipBps = clampBps(Number(styleOverrides.vpipBps || 2600) * 0.88);
    styleOverrides.pfrBps = clampBps(Number(styleOverrides.pfrBps || 1800) * 0.9);
    if (temperament === 'loose_aggressive') {
      temperament = 'tight_aggressive';
      style = 'tight_aggressive';
    }
  } else if (phase === 'early') {
    risk = Math.round(baseRisk * 1.05);
    styleOverrides.vpipBps = clampBps(Number(styleOverrides.vpipBps || 2400) * 1.05);
  }

  return {
    ...recommendation,
    phaseAdjustment: {
      applied: phase !== 'unknown',
      gameType,
      phase,
      baseRiskBps: baseRisk,
      adjustedRiskBps: Math.max(250, Math.min(3000, risk)),
    },
    recommended: {
      ...rr,
      style,
      temperament,
      maxRiskBps: Math.max(250, Math.min(3000, risk)),
      styleOverrides,
    },
  };
}

function normalizeMix(mix) {
  const fold = asNonNegative(mix.fold);
  const check = asNonNegative(mix.check);
  const call = asNonNegative(mix.call);
  const raise = asNonNegative(mix.raise);
  const bet = asNonNegative(mix.bet);
  const allin = asNonNegative(mix.allin);
  const total = fold + check + call + raise + bet + allin;
  if (total <= 0) {
    throw new Error('actionMix must contain at least one positive frequency');
  }
  return {
    fold: fold / total,
    check: check / total,
    call: call / total,
    raise: raise / total,
    bet: bet / total,
    allin: allin / total,
  };
}

function styleFromMix(actionMix) {
  const vpip = clamp01(actionMix.call + actionMix.raise + actionMix.bet + actionMix.allin);
  const pfr = clamp01(actionMix.raise + actionMix.bet + actionMix.allin);
  if (vpip >= 0.31 && pfr >= 0.23) return { style: 'loose_aggressive', temperament: 'loose_aggressive' };
  if (vpip <= 0.22 && pfr >= 0.13) return { style: 'tight_aggressive', temperament: 'tight_aggressive' };
  if (vpip <= 0.22 && pfr < 0.11) return { style: 'tight_passive', temperament: 'tight_passive' };
  return { style: 'exploitative', temperament: 'balanced' };
}

function craftTraitsFromCfrProfile({ agentId, cfrProfile = {} }) {
  const actionMix = normalizeMix(cfrProfile.actionMix || {});
  const classification = styleFromMix(actionMix);
  const exploitabilityBb100 = asNonNegative(cfrProfile.exploitabilityBb100);
  const sampleHands = Math.max(1, Math.round(asNonNegative(cfrProfile.sampleHands || 1)));
  const pfr = clamp01(actionMix.raise + actionMix.bet + actionMix.allin);
  const vpip = clamp01(actionMix.call + pfr);
  const exploitPenalty = Math.min(0.24, exploitabilityBb100 / 100);
  const confidence = clamp01(
    0.45 + Math.min(0.38, Math.log10(sampleHands + 1) * 0.18) + Math.max(0, 0.12 - exploitPenalty)
  );
  const baseRisk = 650 + pfr * 1700 - actionMix.fold * 300;
  const riskAdjusted = Math.round(Math.max(300, Math.min(2800, baseRisk - exploitabilityBb100 * 8)));

  return {
    agentId,
    source: 'cfr_profile',
    diagnostics: {
      exploitabilityBb100,
      sampleHands,
      actionMix,
      confidence,
    },
    recommended: {
      style: classification.style,
      temperament: classification.temperament,
      maxRiskBps: riskAdjusted,
      styleOverrides: {
        vpipBps: clampBps(vpip * 10000),
        pfrBps: clampBps(pfr * 10000),
        bluffBps: clampBps(Math.max(0, pfr - actionMix.call * 0.2) * 10000),
        icmDisciplineBps: clampBps((0.5 + actionMix.fold * 0.35 - actionMix.allin * 0.2) * 10000),
      },
    },
  };
}

function craftTraitsFromRiskProfile({ agentId, riskProfile = {} }) {
  const riskScore = Math.max(0, Math.min(100, Number(riskProfile.riskScore ?? 50)));
  const collusionScore = Math.max(0, Math.min(100, Number(riskProfile.collusionScore ?? 0)));
  const tiltIndexBps = Math.max(0, Math.min(10000, Number(riskProfile.tiltIndexBps ?? 2500)));
  const abuseFlags = Array.isArray(riskProfile.abuseFlags)
    ? riskProfile.abuseFlags.map((x) => String(x || '').trim()).filter(Boolean)
    : [];
  const combined = Math.min(100, riskScore * 0.6 + collusionScore * 0.4 + abuseFlags.length * 5);

  let style = 'exploitative';
  let temperament = 'balanced';
  if (combined >= 70 || tiltIndexBps >= 7000) {
    style = 'tight_passive';
    temperament = 'tight_passive';
  } else if (combined >= 50) {
    style = 'tight_aggressive';
    temperament = 'tight_aggressive';
  }

  const maxRiskBps = Math.round(Math.max(250, Math.min(2200, 2400 - combined * 20 - tiltIndexBps * 0.05)));
  const confidence = clamp01(0.42 + Math.min(0.35, abuseFlags.length * 0.06) + Math.min(0.2, combined / 250));

  return {
    agentId,
    source: 'risk_profile',
    diagnostics: {
      riskScore,
      collusionScore,
      tiltIndexBps,
      abuseFlags,
      confidence,
    },
    recommended: {
      style,
      temperament,
      maxRiskBps,
      styleOverrides: {
        vpipBps: clampBps((0.42 - combined / 260) * 10000),
        pfrBps: clampBps((0.2 - combined / 500) * 10000),
        bluffBps: clampBps((0.12 - combined / 700) * 10000),
        icmDisciplineBps: clampBps((0.58 + combined / 240) * 10000),
      },
    },
  };
}

export function listTraitProviders() {
  return [...PROVIDERS];
}

export function craftTraitsFromProvider({
  provider = 'texassolver',
  agentId,
  solverDump = null,
  nodePath = null,
  comboWeights = {},
  cfrProfile = null,
  riskProfile = null,
  context = null,
}) {
  assertString(agentId, 'agentId');
  const selected = String(provider || 'texassolver').trim().toLowerCase();
  if (!PROVIDERS.includes(selected)) {
    throw new Error(`Unsupported trait provider: ${selected}`);
  }

  if (selected === 'texassolver') {
    if (!solverDump || typeof solverDump !== 'object') {
      throw new Error('solverDump object is required');
    }
    const recommendation = craftTraitsFromTexasSolver({
      agentId,
      solverDump,
      nodePath,
      comboWeights: comboWeights && typeof comboWeights === 'object' ? comboWeights : {},
    });
    return applyTournamentPhaseAdjustment(recommendation, context);
  }

  if (selected === 'cfr_profile') {
    if (!cfrProfile || typeof cfrProfile !== 'object') {
      throw new Error('cfrProfile object is required');
    }
    const recommendation = craftTraitsFromCfrProfile({ agentId, cfrProfile });
    return applyTournamentPhaseAdjustment(recommendation, context);
  }

  if (!riskProfile || typeof riskProfile !== 'object') {
    throw new Error('riskProfile object is required');
  }
  const recommendation = craftTraitsFromRiskProfile({ agentId, riskProfile });
  return applyTournamentPhaseAdjustment(recommendation, context);
}
