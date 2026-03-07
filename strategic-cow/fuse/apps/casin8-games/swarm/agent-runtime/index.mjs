import { assertBps, assertInteger, assertString } from '../shared/contracts.mjs';

export const AUTONOMY_TIERS = Object.freeze({
  ADVISORY: 'A',
  SEMI_AUTO: 'B',
  FULL_AUTO: 'C',
});

const STYLE_PRESETS = Object.freeze({
  tight_aggressive: { vpipBps: 1800, pfrBps: 1500, bluffBps: 900, icmDisciplineBps: 8200 },
  loose_aggressive: { vpipBps: 3400, pfrBps: 2800, bluffBps: 2100, icmDisciplineBps: 5400 },
  tight_passive: { vpipBps: 1600, pfrBps: 700, bluffBps: 300, icmDisciplineBps: 9000 },
  exploitative: { vpipBps: 2600, pfrBps: 2100, bluffBps: 1700, icmDisciplineBps: 6400 },
  icm_focused: { vpipBps: 1700, pfrBps: 1200, bluffBps: 500, icmDisciplineBps: 9600 },
});

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  registerAgent({ agentId, ownerId, tier = AUTONOMY_TIERS.SEMI_AUTO, style = 'tight_aggressive' }) {
    assertString(agentId, 'agentId');
    assertString(ownerId, 'ownerId');
    validateTier(tier);
    assertStyle(style);

    if (this.agents.has(agentId)) {
      throw new Error('Agent already exists');
    }

    const profile = {
      agentId,
      ownerId,
      tier,
      style,
      styleConfig: { ...STYLE_PRESETS[style] },
      risk: {
        maxBuyInUnits: 1_000n,
        maxLossPerSessionUnits: 2_000n,
        maxLossPerDayUnits: 5_000n,
        cooldownMinutes: 5,
      },
      runtime: {
        enabled: true,
        dailyLossUnits: 0n,
        sessionLossUnits: 0n,
        killSwitch: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(agentId, profile);
    return normalize(profile);
  }

  configureStyle(agentId, style, overrides = {}) {
    const profile = this.requireAgent(agentId);
    assertStyle(style);

    const next = {
      ...STYLE_PRESETS[style],
      ...sanitizeStyleOverrides(overrides),
    };

    profile.style = style;
    profile.styleConfig = next;
    profile.updatedAt = new Date().toISOString();
    return normalize(profile);
  }

  configureRisk(agentId, risk) {
    const profile = this.requireAgent(agentId);
    const next = sanitizeRisk(risk);
    profile.risk = { ...profile.risk, ...next };
    profile.updatedAt = new Date().toISOString();
    return normalize(profile);
  }

  evaluateActionPolicy(agentId, { action, amountUnits = 0n, bankrollUnits = 0n }) {
    const profile = this.requireAgent(agentId);
    assertString(action, 'action');

    if (profile.runtime.killSwitch || !profile.runtime.enabled) {
      return { allowed: false, code: 'AGENT_DISABLED' };
    }

    const amount = toBigInt(amountUnits, 'amountUnits');
    const bankroll = toBigInt(bankrollUnits, 'bankrollUnits');

    if (amount > profile.risk.maxBuyInUnits) {
      return { allowed: false, code: 'BUYIN_LIMIT_EXCEEDED' };
    }

    if (profile.runtime.sessionLossUnits >= profile.risk.maxLossPerSessionUnits) {
      return { allowed: false, code: 'SESSION_LOSS_LIMIT_EXCEEDED' };
    }

    if (profile.runtime.dailyLossUnits >= profile.risk.maxLossPerDayUnits) {
      return { allowed: false, code: 'DAILY_LOSS_LIMIT_EXCEEDED' };
    }

    if (amount > bankroll) {
      return { allowed: false, code: 'INSUFFICIENT_BANKROLL' };
    }

    if (profile.tier === AUTONOMY_TIERS.ADVISORY && action !== 'suggest') {
      return { allowed: false, code: 'HUMAN_CONFIRM_REQUIRED' };
    }

    return {
      allowed: true,
      code: 'OK',
      policy: {
        tier: profile.tier,
        style: profile.style,
        styleConfig: profile.styleConfig,
      },
    };
  }

  registerLoss(agentId, lossUnits) {
    const profile = this.requireAgent(agentId);
    const loss = toBigInt(lossUnits, 'lossUnits');
    if (loss <= 0n) return normalize(profile);
    profile.runtime.dailyLossUnits += loss;
    profile.runtime.sessionLossUnits += loss;
    profile.updatedAt = new Date().toISOString();
    return normalize(profile);
  }

  setKillSwitch(agentId, enabled) {
    const profile = this.requireAgent(agentId);
    profile.runtime.killSwitch = Boolean(enabled);
    profile.updatedAt = new Date().toISOString();
    return normalize(profile);
  }

  resetSession(agentId) {
    const profile = this.requireAgent(agentId);
    profile.runtime.sessionLossUnits = 0n;
    profile.updatedAt = new Date().toISOString();
    return normalize(profile);
  }

  requireAgent(agentId) {
    assertString(agentId, 'agentId');
    const profile = this.agents.get(agentId);
    if (!profile) {
      throw new Error('Agent not found');
    }
    return profile;
  }
}

function normalize(profile) {
  return JSON.parse(
    JSON.stringify(profile, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}

function sanitizeStyleOverrides(overrides) {
  const out = {};
  for (const [key, val] of Object.entries(overrides || {})) {
    assertBps(Number(val), `style.${key}`);
    out[key] = Number(val);
  }
  return out;
}

function sanitizeRisk(risk) {
  const out = {};
  if (risk.maxBuyInUnits != null) out.maxBuyInUnits = toBigInt(risk.maxBuyInUnits, 'maxBuyInUnits');
  if (risk.maxLossPerSessionUnits != null)
    out.maxLossPerSessionUnits = toBigInt(risk.maxLossPerSessionUnits, 'maxLossPerSessionUnits');
  if (risk.maxLossPerDayUnits != null)
    out.maxLossPerDayUnits = toBigInt(risk.maxLossPerDayUnits, 'maxLossPerDayUnits');
  if (risk.cooldownMinutes != null) {
    assertInteger(Number(risk.cooldownMinutes), 'cooldownMinutes', 0);
    out.cooldownMinutes = Number(risk.cooldownMinutes);
  }
  return out;
}

function validateTier(tier) {
  if (!Object.values(AUTONOMY_TIERS).includes(tier)) {
    throw new Error('Invalid autonomy tier');
  }
}

function assertStyle(style) {
  assertString(style, 'style');
  if (!STYLE_PRESETS[style]) {
    throw new Error(`Unknown style preset: ${style}`);
  }
}

function toBigInt(value, field) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`Invalid ${field}: expected bigint-like integer`);
}
