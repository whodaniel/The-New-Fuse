import { assertString } from '../shared/contracts.mjs';

const SUPPORTED_SCHEMA_VERSIONS = Object.freeze([1]);
const SUPPORTED_PROVIDERS = Object.freeze(['texassolver', 'cfr_profile', 'risk_profile']);

function toObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function normalizeTraitCraftPayload(input) {
  const body = toObject(input) || {};
  const payloadVersion = Number(body.payloadVersion ?? 1);
  if (!Number.isInteger(payloadVersion) || !SUPPORTED_SCHEMA_VERSIONS.includes(payloadVersion)) {
    throw new Error(`Unsupported payloadVersion: ${String(body.payloadVersion ?? '')}`);
  }

  const agentId = String(body.agentId || '').trim();
  assertString(agentId, 'agentId');
  const provider = String(body.provider || 'texassolver').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(`Unsupported trait provider: ${provider}`);
  }

  const out = {
    payloadVersion,
    provider,
    agentId,
    ownerId: String(body.ownerId || '').trim(),
    tier: String(body.tier || '').trim(),
    applyToAgent: body.applyToAgent === true,
    autoRegister: body.autoRegister === true,
    createProfile: body.createProfile !== false,
    maxRiskBps: body.maxRiskBps == null ? null : Number(body.maxRiskBps),
    nodePath: body.nodePath == null ? null : body.nodePath,
    comboWeights: toObject(body.comboWeights) || {},
    context: toObject(body.context) || null,
    provenance: toObject(body.provenance) || null,
    signature: toObject(body.signature) || null,
    solverDump: null,
    cfrProfile: null,
    riskProfile: null,
  };

  if (out.maxRiskBps != null) {
    if (!Number.isFinite(out.maxRiskBps) || out.maxRiskBps < 100 || out.maxRiskBps > 10000) {
      throw new Error('maxRiskBps must be between 100 and 10000');
    }
    out.maxRiskBps = Math.round(out.maxRiskBps);
  }

  if (provider === 'texassolver') {
    out.solverDump = toObject(body.solverDump);
    if (!out.solverDump) throw new Error('solverDump object is required');
  } else if (provider === 'cfr_profile') {
    out.cfrProfile = toObject(body.cfrProfile);
    if (!out.cfrProfile) throw new Error('cfrProfile object is required');
  } else {
    out.riskProfile = toObject(body.riskProfile);
    if (!out.riskProfile) throw new Error('riskProfile object is required');
  }

  return out;
}
