import { assertString } from '../../shared/contracts.mjs';

const STYLE_TO_TEMPERAMENT = Object.freeze({
  tight_aggressive: 'tight_aggressive',
  loose_aggressive: 'loose_aggressive',
  tight_passive: 'tight_passive',
  exploitative: 'balanced',
  icm_focused: 'tight_passive',
});

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x || 0)));
}

function clampBps(x) {
  return Math.max(0, Math.min(10000, Math.round(Number(x || 0))));
}

function toActionBucket(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('fold')) return 'fold';
  if (raw.includes('check')) return 'check';
  if (raw.includes('call')) return 'call';
  if (raw.includes('allin') || raw.includes('all-in') || raw === 'jam') return 'allin';
  if (raw.includes('raise')) return 'raise';
  if (raw.startsWith('bet')) return 'bet';
  return raw;
}

function nodeByPath(treeNode, path) {
  const base = treeNode?.root && typeof treeNode.root === 'object' ? treeNode.root : treeNode;
  if (!path) return base;
  const segments = Array.isArray(path)
    ? path.map((x) => String(x || '').trim()).filter(Boolean)
    : String(path)
        .split(/[>/]/g)
        .map((x) => x.trim())
        .filter(Boolean);
  let node = base;
  for (const seg of segments) {
    const children = node?.childrens;
    if (!children || typeof children !== 'object' || !(seg in children)) {
      throw new Error(`Could not resolve TexasSolver nodePath segment: ${seg}`);
    }
    node = children[seg];
  }
  return node;
}

function extractActionPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('TexasSolver payload must be an object');
  }

  const root = raw.root && typeof raw.root === 'object' ? raw.root : raw;
  const strategyNode = root.strategy && typeof root.strategy === 'object' ? root.strategy : root;
  const actions = Array.isArray(strategyNode.actions)
    ? strategyNode.actions
    : Array.isArray(root.actions)
      ? root.actions
      : null;
  const strategyMap = strategyNode.strategy && typeof strategyNode.strategy === 'object'
    ? strategyNode.strategy
    : strategyNode.strategyMap && typeof strategyNode.strategyMap === 'object'
      ? strategyNode.strategyMap
      : strategyNode;

  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error('TexasSolver actions array missing');
  }
  if (!strategyMap || typeof strategyMap !== 'object') {
    throw new Error('TexasSolver strategy map missing');
  }
  return { actions, strategyMap };
}

export function summarizeTexasSolverActionMix({ solverDump, nodePath = null, comboWeights = {} }) {
  const treeNode = nodeByPath(solverDump, nodePath);
  const { actions, strategyMap } = extractActionPayload(treeNode);
  const normalizedActions = actions.map(toActionBucket);
  const actionTotals = new Map();
  let totalWeight = 0;
  let combos = 0;

  for (const [combo, probs] of Object.entries(strategyMap)) {
    if (!Array.isArray(probs) || probs.length === 0) continue;
    let rowSum = 0;
    for (let i = 0; i < probs.length; i += 1) {
      rowSum += Math.max(0, Number(probs[i] || 0));
    }
    if (rowSum <= 0) continue;
    const comboWeight = Math.max(0, Number(comboWeights[combo] ?? 1));
    if (comboWeight <= 0) continue;
    combos += 1;
    totalWeight += comboWeight;
    for (let i = 0; i < probs.length; i += 1) {
      const bucket = normalizedActions[i];
      if (!bucket) continue;
      const p = Math.max(0, Number(probs[i] || 0)) / rowSum;
      actionTotals.set(bucket, (actionTotals.get(bucket) || 0) + p * comboWeight);
    }
  }

  if (totalWeight <= 0) {
    throw new Error('TexasSolver strategy map did not contain usable combo probabilities');
  }

  const foldFreq = clamp01((actionTotals.get('fold') || 0) / totalWeight);
  const checkFreq = clamp01((actionTotals.get('check') || 0) / totalWeight);
  const callFreq = clamp01((actionTotals.get('call') || 0) / totalWeight);
  const raiseFreq = clamp01((actionTotals.get('raise') || 0) / totalWeight);
  const betFreq = clamp01((actionTotals.get('bet') || 0) / totalWeight);
  const allInFreq = clamp01((actionTotals.get('allin') || 0) / totalWeight);
  const aggressionFreq = clamp01(raiseFreq + betFreq + allInFreq);
  const vpipFreq = clamp01(callFreq + aggressionFreq);

  return {
    combosProcessed: combos,
    actionMix: {
      fold: foldFreq,
      check: checkFreq,
      call: callFreq,
      raise: raiseFreq,
      bet: betFreq,
      allin: allInFreq,
      aggression: aggressionFreq,
      vpip: vpipFreq,
    },
  };
}

function deriveStyle(actionMix) {
  const vpip = actionMix.vpip;
  const pfr = actionMix.raise + actionMix.bet + actionMix.allin;
  const icmDisc = clamp01(0.45 + actionMix.fold * 0.5 + actionMix.check * 0.15 - actionMix.allin * 0.3);

  if (vpip >= 0.3 && pfr >= 0.24) return 'loose_aggressive';
  if (vpip <= 0.22 && pfr >= 0.13) return 'tight_aggressive';
  if (vpip <= 0.22 && pfr < 0.11) return 'tight_passive';
  if (icmDisc >= 0.86) return 'icm_focused';
  return 'exploitative';
}

export function craftTraitsFromTexasSolver({ agentId, solverDump, nodePath = null, comboWeights = {} }) {
  assertString(agentId, 'agentId');
  const summary = summarizeTexasSolverActionMix({ solverDump, nodePath, comboWeights });
  const mix = summary.actionMix;
  const style = deriveStyle(mix);
  const temperament = STYLE_TO_TEMPERAMENT[style] || 'balanced';

  const pfr = clamp01(mix.raise + mix.bet + mix.allin);
  const vpip = clamp01(mix.vpip);
  const bluffFreq = clamp01(Math.max(0, pfr - mix.call * 0.25 + mix.check * 0.08));
  const icmDiscipline = clamp01(0.45 + mix.fold * 0.5 + mix.check * 0.15 - mix.allin * 0.3);
  const maxRisk = Math.round(
    Math.max(300, Math.min(3000, 400 + mix.aggression * 1800 + mix.allin * 900 - mix.fold * 400))
  );
  const coverage = Math.min(1, summary.combosProcessed / 180);
  const confidence = clamp01(0.45 + coverage * 0.45 + Math.min(0.1, mix.aggression * 0.1));

  return {
    agentId,
    source: 'texassolver',
    nodePath: nodePath || null,
    diagnostics: {
      combosProcessed: summary.combosProcessed,
      actionMix: mix,
      confidence,
    },
    recommended: {
      style,
      temperament,
      maxRiskBps: maxRisk,
      styleOverrides: {
        vpipBps: clampBps(vpip * 10000),
        pfrBps: clampBps(pfr * 10000),
        bluffBps: clampBps(bluffFreq * 10000),
        icmDisciplineBps: clampBps(icmDiscipline * 10000),
      },
    },
  };
}
