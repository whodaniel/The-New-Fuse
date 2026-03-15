import { assertString } from '../../shared/contracts.mjs';

export const TEMPERAMENTS = Object.freeze({
  TIGHT_AGGRESSIVE: 'tight_aggressive',
  LOOSE_AGGRESSIVE: 'loose_aggressive',
  TIGHT_PASSIVE: 'tight_passive',
  BALANCED: 'balanced',
});

const RULES = Object.freeze({
  [TEMPERAMENTS.TIGHT_AGGRESSIVE]: { minRaiseStrength: 0.58, bluffFactor: 0.15 },
  [TEMPERAMENTS.LOOSE_AGGRESSIVE]: { minRaiseStrength: 0.43, bluffFactor: 0.35 },
  [TEMPERAMENTS.TIGHT_PASSIVE]: { minRaiseStrength: 0.72, bluffFactor: 0.05 },
  [TEMPERAMENTS.BALANCED]: { minRaiseStrength: 0.55, bluffFactor: 0.12 },
});

export function buildStrategyProfile({ agentId, temperament = TEMPERAMENTS.BALANCED, maxRiskBps = 800 }) {
  assertString(agentId, 'agentId');
  if (!RULES[temperament]) {
    throw new Error('unsupported temperament');
  }
  return {
    agentId,
    temperament,
    maxRiskBps,
    createdAt: new Date().toISOString(),
  };
}

function allowed(actions, target) {
  return Array.isArray(actions) && actions.includes(target);
}

export function chooseAction({ profile, legalActions, handStrength, potUnits, toCallUnits }) {
  if (!profile) throw new Error('profile is required');
  if (!Array.isArray(legalActions) || legalActions.length === 0) {
    throw new Error('legalActions must be non-empty array');
  }

  const rules = RULES[profile.temperament] || RULES[TEMPERAMENTS.BALANCED];
  const strength = Number(handStrength || 0);
  const pot = Number(potUnits || 0);
  const call = Number(toCallUnits || 0);
  const pressure = pot > 0 ? call / pot : 0;

  let action = 'fold';
  let amountUnits = 0;

  if (strength >= rules.minRaiseStrength && allowed(legalActions, 'raise')) {
    action = 'raise';
    amountUnits = Math.max(call * 2, Math.floor(pot * (0.35 + rules.bluffFactor)));
  } else if (strength >= 0.5 && allowed(legalActions, 'call')) {
    action = 'call';
    amountUnits = call;
  } else if (pressure < 0.08 && allowed(legalActions, 'check')) {
    action = 'check';
  } else if (allowed(legalActions, 'fold')) {
    action = 'fold';
  } else {
    action = legalActions[0];
  }

  return {
    agentId: profile.agentId,
    temperament: profile.temperament,
    action,
    amountUnits,
    rationale: {
      handStrength: strength,
      pressure: Number(pressure.toFixed(4)),
      minRaiseStrength: rules.minRaiseStrength,
    },
  };
}

export function enforceRiskCap({ actionDecision, bankrollUnits, maxRiskBps }) {
  if (!actionDecision) throw new Error('actionDecision is required');
  const bankroll = BigInt(bankrollUnits);
  const cap = (bankroll * BigInt(maxRiskBps)) / 10000n;
  const proposed = BigInt(actionDecision.amountUnits || 0);

  if (proposed <= cap) {
    return {
      ...actionDecision,
      riskCapped: false,
    };
  }

  return {
    ...actionDecision,
    amountUnits: Number(cap),
    riskCapped: true,
  };
}
