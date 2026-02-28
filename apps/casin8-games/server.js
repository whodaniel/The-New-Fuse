const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { createRiskDb } = require('./risk-db');

const PORT = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = process.env.CASIN8_DATA_DIR
  ? path.resolve(process.env.CASIN8_DATA_DIR)
  : path.join(root, '.data');
const statePath = path.join(dataDir, 'state.json');
const riskDbPath = path.join(dataDir, 'riskdb.json');
const holdemResumeSecretPath = path.join(dataDir, 'holdem_resume_secret.txt');
const treasuryPolicyPath = path.join(dataDir, 'treasury_policy.json');
const reserveAttestationPath = path.join(dataDir, 'reserve_attestations.json');
const maxTableEvents = 200;
const maxLedgerEntries = 200;
const rateLimitWindowMs = 60_000;
const rateLimitMax = 240;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function createMissingModuleStub(modulePath, err) {
  const reason = err instanceof Error ? err.message : String(err || 'unknown import error');
  const message = `Module unavailable: ${modulePath} (${reason})`;
  const throwMissing = () => {
    throw new Error(message);
  };
  let stub = null;
  stub = new Proxy(throwMissing, {
    get(_target, prop) {
      if (prop === '__missingModule') return true;
      if (prop === '__modulePath') return modulePath;
      return stub;
    },
    apply() {
      throwMissing();
    },
  });
  return stub;
}

async function importOptionalModule(modulePath) {
  try {
    return await import(pathToFileURL(path.join(root, modulePath)).href);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err || 'unknown import error');
    console.warn(`[casin8] optional module unavailable: ${modulePath} (${reason})`);
    return createMissingModuleStub(modulePath, err);
  }
}

const enginePromise = import(pathToFileURL(path.join(root, 'engine.mjs')).href);
const engineCorePromise = importOptionalModule('swarm/engine-core/index.mjs');
const sponsorshipPromise = importOptionalModule('swarm/sponsorship-ledger/index.mjs');
const realtimePromise = importOptionalModule('swarm/realtime-platform/index.mjs');
const agentRuntimePromise = importOptionalModule('swarm/agent-runtime/index.mjs');
const sngPromise = importOptionalModule('swarm/tournaments-sng/index.mjs');
const mttPromise = importOptionalModule('swarm/tournaments-mtt/index.mjs');
const cashierPromise = importOptionalModule('swarm/cashier-token/index.mjs');
const fairnessPromise = importOptionalModule('swarm/fairness-security/index.mjs');
const engineSimPromise = importOptionalModule('swarm/engine-sim/index.mjs');
const agentStrategyPromise = importOptionalModule('swarm/agent-strategy/index.mjs');
const agentNurturePromise = importOptionalModule('swarm/agent-nurture/index.mjs');
const traitProvidersPromise = importOptionalModule('swarm/agent-strategy/trait-providers.mjs');
const traitPayloadSchemaPromise = importOptionalModule(
  'swarm/agent-strategy/trait-payload-schema.mjs'
);
const holdemEnginePromise = importOptionalModule('swarm/holdem-engine/index.mjs');
const holdemTournamentsPromise = importOptionalModule('swarm/holdem-tournaments/index.mjs');
const fraudCollusionPromise = importOptionalModule('swarm/fraud-collusion/index.mjs');

const sseClients = new Map();
const rateLimits = new Map();

const state = loadState();
const metrics = {
  startedAt: nowIso(),
  requestsTotal: 0,
  apiRequestsTotal: 0,
  playRequestsTotal: 0,
  playFailuresTotal: 0,
  onchainVerifyAttempts: 0,
  onchainVerifyPass: 0,
  onchainVerifyFail: 0,
  traitCraftAttempts: 0,
  traitCraftSuccess: 0,
  traitCraftFail: 0,
  traitCraftLatencyMsTotal: 0,
};
const routeLatency = new Map();
const swarmState = {
  agentRegistry: null,
  agentStrategies: new Map(),
  sponsorshipPositions: new Map(),
  sngs: new Map(),
  mtts: new Map(),
  cashiers: new Map(),
  fairnessCommits: new Map(),
  realtimeBuses: new Map(),
  tableSnapshots: new Map(),
  complianceProfiles: new Map(),
  paymentOrders: new Map(),
  webhookEvents: new Map(),
  velocityWindows: new Map(),
  fundingAttempts: new Map(),
  riskAlerts: [],
  holdemTables: new Map(),
  holdemTournaments: new Map(),
  nurturePrograms: new Map(),
  traitLastRecommendation: new Map(),
  traitObservations: new Map(),
  traitRollouts: new Map(),
  traitRateLimit: new Map(),
  treasuryPolicies: new Map(),
  reserveAttestations: new Map(),
  traitPolicyEvents: [],
  traitPolicy: {
    freeze: false,
    revokedArtifactIds: new Set(),
  },
};
const riskDb = createRiskDb(riskDbPath);
hydrateFromRiskDb();
hydrateTreasuryPolicies();
hydrateReserveAttestations();
restorePersistedTableSnapshots();
const holdemResumeTokenSecret = loadOrCreateHoldemResumeSecret();
const holdemResumeTokenTtlMs = Math.max(
  15_000,
  Number(process.env.CASIN8_HOLDEM_RESUME_TOKEN_TTL_MS || 180_000)
);
const apiTokenRoles = parseApiTokens();
const allowInsecureDevBypass = String(process.env.CASIN8_ALLOW_INSECURE_DEV_BYPASS || '') === '1';
const traitArtifactSecret = String(process.env.CASIN8_TRAIT_ARTIFACT_SECRET || '').trim();
const reserveAttestationSecret = String(process.env.CASIN8_RESERVE_ATTESTATION_SECRET || '').trim();
const requireTraitSignature = String(process.env.CASIN8_REQUIRE_TRAIT_SIGNATURE || '') === '1';

const authRoutePrefixes = [
  '/api/v2/',
  '/api/table/',
  '/api/sng/',
  '/api/mtt/',
  '/api/cashier/',
  '/api/risk/',
  '/api/sponsorships/',
  '/api/agents/',
  '/api/strategy/',
  '/api/realtime/',
  '/api/swarm/',
];

const authRouteExact = new Set([
  '/api/play',
  '/api/sim/equity',
  '/api/fair/commit',
  '/api/fair/rotate',
]);

function parseCsvUpperSet(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean)
  );
}

function complianceConfig() {
  const blockedFallback = 'KP,IR,SY,CU,RU,BY';
  return {
    blockedCountries: parseCsvUpperSet(process.env.CASIN8_BLOCKED_COUNTRIES || blockedFallback),
    allowedCountries: parseCsvUpperSet(process.env.CASIN8_ALLOWED_COUNTRIES || ''),
    amlSingleTxUnits: BigInt(String(process.env.CASIN8_AML_SINGLE_TX_UNITS || '500000')),
    amlDailyUnits: BigInt(String(process.env.CASIN8_AML_DAILY_UNITS || '2000000')),
    velocityWindowMs: Math.max(60_000, Number(process.env.CASIN8_VELOCITY_WINDOW_MS || '3600000')),
    velocityMaxTx: Math.max(1, Number(process.env.CASIN8_VELOCITY_MAX_TX || '20')),
    velocityMaxUnits: BigInt(String(process.env.CASIN8_VELOCITY_MAX_UNITS || '1000000')),
  };
}

function normalizeTreasuryPolicy(input = {}) {
  const toBigIntField = (value, fallback) => {
    if (value == null || value === '') return fallback;
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
    throw new Error('Invalid bigint-like treasury policy value');
  };
  const toIntField = (value, fallback, min, max) => {
    if (value == null || value === '') return fallback;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max)
      throw new Error('Invalid integer treasury policy value');
    return n;
  };

  return {
    enabled: input.enabled == null ? true : Boolean(input.enabled),
    liabilityCapUnits: toBigIntField(
      input.liabilityCapUnits,
      BigInt(String(process.env.CASIN8_TREASURY_LIABILITY_CAP_UNITS || '1000000000000'))
    ),
    pendingWithdrawalCapUnits: toBigIntField(
      input.pendingWithdrawalCapUnits,
      BigInt(String(process.env.CASIN8_TREASURY_PENDING_WITHDRAWAL_CAP_UNITS || '250000000000'))
    ),
    maxPayoutPerSettlementUnits: toBigIntField(
      input.maxPayoutPerSettlementUnits,
      BigInt(String(process.env.CASIN8_TREASURY_MAX_PAYOUT_PER_SETTLEMENT_UNITS || '10000000000'))
    ),
    maxWithdrawalPerRequestUnits: toBigIntField(
      input.maxWithdrawalPerRequestUnits,
      BigInt(String(process.env.CASIN8_TREASURY_MAX_WITHDRAWAL_PER_REQUEST_UNITS || '5000000000'))
    ),
    maxUtilizationBps: toIntField(
      input.maxUtilizationBps,
      Number(process.env.CASIN8_TREASURY_MAX_UTILIZATION_BPS || '9000'),
      1,
      10000
    ),
    autoTripMs: toIntField(
      input.autoTripMs,
      Number(process.env.CASIN8_TREASURY_AUTO_TRIP_MS || '300000'),
      1_000,
      24 * 60 * 60 * 1000
    ),
    manualTrip: input.manualTrip == null ? false : Boolean(input.manualTrip),
    tripReason: String(input.tripReason || ''),
    trippedAtMs: toIntField(input.trippedAtMs, 0, 0, Number.MAX_SAFE_INTEGER),
    trippedUntilMs: toIntField(input.trippedUntilMs, 0, 0, Number.MAX_SAFE_INTEGER),
    updatedAt: String(input.updatedAt || nowIso()),
  };
}

function serializeTreasuryPolicyMap() {
  const out = {};
  for (const [ledgerId, policy] of swarmState.treasuryPolicies.entries()) {
    out[ledgerId] = {
      ...policy,
      liabilityCapUnits: String(policy.liabilityCapUnits || 0n),
      pendingWithdrawalCapUnits: String(policy.pendingWithdrawalCapUnits || 0n),
      maxPayoutPerSettlementUnits: String(policy.maxPayoutPerSettlementUnits || 0n),
      maxWithdrawalPerRequestUnits: String(policy.maxWithdrawalPerRequestUnits || 0n),
    };
  }
  return out;
}

function persistTreasuryPolicies() {
  const tmp = `${treasuryPolicyPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(serializeTreasuryPolicyMap(), null, 2), 'utf8');
  fs.renameSync(tmp, treasuryPolicyPath);
}

function hydrateTreasuryPolicies() {
  if (!fs.existsSync(treasuryPolicyPath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(treasuryPolicyPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return;
    for (const [ledgerId, raw] of Object.entries(parsed)) {
      const normalized = normalizeTreasuryPolicy(raw && typeof raw === 'object' ? raw : {});
      swarmState.treasuryPolicies.set(String(ledgerId || 'default') || 'default', normalized);
    }
  } catch {
    // best effort load; defaults will apply on first use
  }
}

function serializeReserveAttestations() {
  const out = {};
  for (const [ledgerId, rows] of swarmState.reserveAttestations.entries()) {
    out[ledgerId] = Array.isArray(rows) ? rows : [];
  }
  return out;
}

function persistReserveAttestations() {
  const tmp = `${reserveAttestationPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(serializeReserveAttestations(), null, 2), 'utf8');
  fs.renameSync(tmp, reserveAttestationPath);
}

function hydrateReserveAttestations() {
  if (!fs.existsSync(reserveAttestationPath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(reserveAttestationPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return;
    for (const [ledgerId, rows] of Object.entries(parsed)) {
      const safe = Array.isArray(rows)
        ? rows.filter((x) => x && typeof x === 'object').slice(-500)
        : [];
      swarmState.reserveAttestations.set(String(ledgerId || 'default') || 'default', safe);
    }
  } catch {
    // best effort
  }
}

function signReserveAttestationPayload(payload) {
  const canonical = jsonStringifySafe(payload);
  if (!reserveAttestationSecret) {
    return {
      algorithm: 'none',
      value: '',
      signed: false,
      reason: 'CASIN8_RESERVE_ATTESTATION_SECRET not configured',
    };
  }
  return {
    algorithm: 'hmac-sha256',
    value: crypto.createHmac('sha256', reserveAttestationSecret).update(canonical).digest('hex'),
    signed: true,
  };
}

function verifyReserveAttestationArtifact(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    return { ok: false, reason: 'artifact is required' };
  }
  const payload =
    artifact.payload && typeof artifact.payload === 'object' ? artifact.payload : null;
  const signature =
    artifact.signature && typeof artifact.signature === 'object' ? artifact.signature : null;
  if (!payload || !signature) return { ok: false, reason: 'artifact payload/signature missing' };
  if (!signature.signed)
    return { ok: false, reason: String(signature.reason || 'unsigned artifact') };
  const expected = signReserveAttestationPayload(payload);
  if (!expected.signed)
    return { ok: false, reason: String(expected.reason || 'verification unavailable') };
  const ok =
    signature.algorithm === expected.algorithm &&
    String(signature.value || '') === String(expected.value || '');
  return { ok, reason: ok ? '' : 'signature mismatch', expectedAlgorithm: expected.algorithm };
}

function getReserveAttestationHistory(ledgerId) {
  const key = String(ledgerId || 'default').trim() || 'default';
  if (!swarmState.reserveAttestations.has(key)) {
    swarmState.reserveAttestations.set(key, []);
  }
  return swarmState.reserveAttestations.get(key);
}

function getTreasuryPolicy(ledgerId = 'default') {
  const key = String(ledgerId || 'default').trim() || 'default';
  if (swarmState.treasuryPolicies.has(key)) {
    return swarmState.treasuryPolicies.get(key);
  }
  const policy = normalizeTreasuryPolicy({});
  swarmState.treasuryPolicies.set(key, policy);
  persistTreasuryPolicies();
  return policy;
}

function toBigIntSafe(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  return 0n;
}

function upsertTreasuryPolicy(ledgerId, updates) {
  const current = getTreasuryPolicy(ledgerId);
  const next = normalizeTreasuryPolicy({
    ...current,
    ...(updates && typeof updates === 'object' ? updates : {}),
    updatedAt: nowIso(),
  });
  swarmState.treasuryPolicies.set(String(ledgerId || 'default').trim() || 'default', next);
  persistTreasuryPolicies();
  return next;
}

function isTreasuryPolicyTripped(policy) {
  if (!policy || !policy.enabled) return false;
  if (policy.manualTrip) return true;
  const until = Number(policy.trippedUntilMs || 0);
  return until > Date.now();
}

function tripTreasuryPolicy(ledgerId, policy, reasons) {
  const nowMs = Date.now();
  const next = {
    ...policy,
    trippedAtMs: nowMs,
    trippedUntilMs: Math.max(
      Number(policy.trippedUntilMs || 0),
      nowMs + Number(policy.autoTripMs || 300000)
    ),
    tripReason: String(
      Array.isArray(reasons) && reasons.length > 0
        ? reasons.join(',')
        : policy.tripReason || 'policy'
    ),
    updatedAt: nowIso(),
  };
  swarmState.treasuryPolicies.set(String(ledgerId || 'default').trim() || 'default', next);
  persistTreasuryPolicies();
  return next;
}

function evaluateTreasuryCircuitBreaker(
  req,
  { ledgerId, ledger, action, amountUnits = 0n, payoutUnits = 0n }
) {
  const policy = getTreasuryPolicy(ledgerId);
  if (!policy.enabled) {
    return { allowed: true, reasons: [], policy, metrics: null };
  }
  const reconciliation = ledger.reconcile();
  const totals = reconciliation && reconciliation.totals ? reconciliation.totals : {};
  const availableUnits = toBigIntSafe(totals.availableUnits);
  const reservedUnits = toBigIntSafe(totals.reservedUnits);
  const pendingWithdrawalUnits = toBigIntSafe(totals.pendingWithdrawalUnits);
  let projectedAvailableUnits = availableUnits;
  let projectedReservedUnits = reservedUnits;
  let projectedPendingWithdrawalUnits = pendingWithdrawalUnits;
  const reasons = [];
  const amount = toBigIntSafe(amountUnits);
  const payout = toBigIntSafe(payoutUnits);
  if (action === 'reserve') {
    projectedAvailableUnits = availableUnits - amount;
    projectedReservedUnits = reservedUnits + amount;
  } else if (action === 'withdraw-request') {
    projectedAvailableUnits = availableUnits - amount;
    projectedPendingWithdrawalUnits = pendingWithdrawalUnits + amount;
  } else if (action === 'withdraw-finalize') {
    projectedPendingWithdrawalUnits = pendingWithdrawalUnits - amount;
  } else if (action === 'settle') {
    projectedAvailableUnits = availableUnits + payout;
  }
  if (projectedAvailableUnits < 0n) projectedAvailableUnits = 0n;
  if (projectedReservedUnits < 0n) projectedReservedUnits = 0n;
  if (projectedPendingWithdrawalUnits < 0n) projectedPendingWithdrawalUnits = 0n;
  const projectedLiabilityUnits = projectedReservedUnits + projectedPendingWithdrawalUnits;
  const denominator = projectedAvailableUnits + projectedLiabilityUnits;
  const utilizationBps =
    denominator > 0n ? Number((projectedLiabilityUnits * 10000n) / denominator) : 0;

  if (isTreasuryPolicyTripped(policy)) reasons.push('TREASURY_CIRCUIT_OPEN');
  if (projectedLiabilityUnits > policy.liabilityCapUnits)
    reasons.push('TREASURY_LIABILITY_CAP_EXCEEDED');
  if (projectedPendingWithdrawalUnits > policy.pendingWithdrawalCapUnits)
    reasons.push('TREASURY_PENDING_WITHDRAWAL_CAP_EXCEEDED');
  if (utilizationBps > Number(policy.maxUtilizationBps || 0))
    reasons.push('TREASURY_UTILIZATION_CAP_EXCEEDED');
  if (action === 'withdraw-request' && amount > policy.maxWithdrawalPerRequestUnits) {
    reasons.push('TREASURY_WITHDRAWAL_PER_REQUEST_CAP_EXCEEDED');
  }
  if (action === 'settle' && payout > policy.maxPayoutPerSettlementUnits) {
    reasons.push('TREASURY_PAYOUT_PER_SETTLEMENT_CAP_EXCEEDED');
  }

  const allowed = reasons.length === 0;
  let effectivePolicy = policy;
  if (!allowed && !reasons.includes('TREASURY_CIRCUIT_OPEN')) {
    effectivePolicy = tripTreasuryPolicy(ledgerId, policy, reasons);
  }
  if (!allowed) {
    addRiskAlert({
      type: 'treasury-circuit-breaker',
      ledgerId,
      action,
      reasons,
      amountUnits: amount.toString(),
      payoutUnits: payout.toString(),
      availableUnits: availableUnits.toString(),
      reservedUnits: reservedUnits.toString(),
      pendingWithdrawalUnits: pendingWithdrawalUnits.toString(),
      projectedAvailableUnits: projectedAvailableUnits.toString(),
      projectedReservedUnits: projectedReservedUnits.toString(),
      projectedPendingWithdrawalUnits: projectedPendingWithdrawalUnits.toString(),
      utilizationBps,
      ip: getIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
    });
  }
  return {
    allowed,
    reasons,
    policy: effectivePolicy,
    metrics: {
      availableUnits,
      reservedUnits,
      pendingWithdrawalUnits,
      liabilityUnits: reservedUnits + pendingWithdrawalUnits,
      projectedAvailableUnits,
      projectedReservedUnits,
      projectedPendingWithdrawalUnits,
      projectedLiabilityUnits,
      utilizationBps,
    },
  };
}

function hashObjectSha256(obj) {
  return crypto.createHash('sha256').update(jsonStringifySafe(obj)).digest('hex');
}

function computeCashierAttestation(ledgerId, ledger, policy = null) {
  const reconciliation = ledger.reconcile();
  const totals = reconciliation && reconciliation.totals ? reconciliation.totals : {};
  const availableUnits = toBigIntSafe(totals.availableUnits);
  const reservedUnits = toBigIntSafe(totals.reservedUnits);
  const pendingWithdrawalUnits = toBigIntSafe(totals.pendingWithdrawalUnits);
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];

  let derivedAvailableUnits = 0n;
  let derivedReservedUnits = 0n;
  let derivedPendingWithdrawalUnits = 0n;
  let malformedEntryCount = 0;

  for (const row of entries) {
    const type = String(row?.type || '');
    if (type === 'deposit') {
      const amount = toBigIntSafe(row.amountUnits);
      if (amount <= 0n) malformedEntryCount += 1;
      derivedAvailableUnits += amount;
    } else if (type === 'reserve') {
      const amount = toBigIntSafe(row.amountUnits);
      if (amount <= 0n) malformedEntryCount += 1;
      derivedAvailableUnits -= amount;
      derivedReservedUnits += amount;
    } else if (type === 'settle') {
      const reservedUsed = toBigIntSafe(row.reservedUsedUnits);
      const payout = toBigIntSafe(row.payoutUnits);
      if (reservedUsed < 0n || payout < 0n) malformedEntryCount += 1;
      derivedReservedUnits -= reservedUsed;
      derivedAvailableUnits += payout;
    } else if (type === 'withdraw-request') {
      const amount = toBigIntSafe(row.amountUnits);
      if (amount <= 0n) malformedEntryCount += 1;
      derivedAvailableUnits -= amount;
      derivedPendingWithdrawalUnits += amount;
    } else if (type === 'withdraw-finalize') {
      const amount = toBigIntSafe(row.amountUnits);
      const status = String(row.status || 'confirmed');
      if (amount <= 0n) malformedEntryCount += 1;
      derivedPendingWithdrawalUnits -= amount;
      if (status !== 'confirmed') derivedAvailableUnits += amount;
    }
  }

  const walletRows =
    reconciliation && reconciliation.wallets && typeof reconciliation.wallets === 'object'
      ? Object.entries(reconciliation.wallets)
      : [];
  const walletInvariantFailures = [];
  for (const [playerId, wallet] of walletRows) {
    const avail = toBigIntSafe(wallet?.availableUnits);
    const reserved = toBigIntSafe(wallet?.reservedUnits);
    const pending = toBigIntSafe(wallet?.pendingWithdrawalUnits);
    if (avail < 0n || reserved < 0n || pending < 0n) {
      walletInvariantFailures.push({
        playerId: String(playerId || ''),
        availableUnits: avail.toString(),
        reservedUnits: reserved.toString(),
        pendingWithdrawalUnits: pending.toString(),
      });
    }
  }

  const invariants = {
    nonNegativeWallets: walletInvariantFailures.length === 0,
    totalsMatchDerived:
      availableUnits === derivedAvailableUnits &&
      reservedUnits === derivedReservedUnits &&
      pendingWithdrawalUnits === derivedPendingWithdrawalUnits,
    nonNegativeLedgerTotals:
      availableUnits >= 0n && reservedUnits >= 0n && pendingWithdrawalUnits >= 0n,
    noMalformedEntries: malformedEntryCount === 0,
  };
  const ok = Object.values(invariants).every(Boolean);

  const policyView = policy
    ? {
        enabled: Boolean(policy.enabled),
        manualTrip: Boolean(policy.manualTrip),
        trippedUntilMs: Number(policy.trippedUntilMs || 0),
        liabilityCapUnits: String(policy.liabilityCapUnits || 0n),
        pendingWithdrawalCapUnits: String(policy.pendingWithdrawalCapUnits || 0n),
        maxPayoutPerSettlementUnits: String(policy.maxPayoutPerSettlementUnits || 0n),
        maxWithdrawalPerRequestUnits: String(policy.maxWithdrawalPerRequestUnits || 0n),
        maxUtilizationBps: Number(policy.maxUtilizationBps || 0),
      }
    : null;
  const entriesDigest = hashObjectSha256(
    entries.map((row) => ({
      type: String(row?.type || ''),
      playerId: String(row?.playerId || ''),
      amountUnits: String(row?.amountUnits ?? ''),
      reservedUsedUnits: String(row?.reservedUsedUnits ?? ''),
      payoutUnits: String(row?.payoutUnits ?? ''),
      status: String(row?.status ?? ''),
      idempotencyKey: String(row?.idempotencyKey || ''),
      ts: String(row?.ts || ''),
    }))
  );
  const attestationMaterial = {
    ledgerId: String(ledgerId || 'default'),
    entriesCount: entries.length,
    totals: {
      availableUnits: availableUnits.toString(),
      reservedUnits: reservedUnits.toString(),
      pendingWithdrawalUnits: pendingWithdrawalUnits.toString(),
    },
    derived: {
      availableUnits: derivedAvailableUnits.toString(),
      reservedUnits: derivedReservedUnits.toString(),
      pendingWithdrawalUnits: derivedPendingWithdrawalUnits.toString(),
    },
    invariants,
    malformedEntryCount,
    walletInvariantFailureCount: walletInvariantFailures.length,
    policy: policyView,
    entriesDigest,
  };
  return {
    ok,
    attestedAt: nowIso(),
    digest: hashObjectSha256(attestationMaterial),
    attestation: attestationMaterial,
    walletInvariantFailures,
  };
}

function publishReserveAttestationArtifact({
  ledgerId,
  ledger,
  policy,
  periodStartIso = '',
  periodEndIso = '',
  reportLabel = '',
  actor = 'system',
}) {
  const history = getReserveAttestationHistory(ledgerId);
  const base = computeCashierAttestation(ledgerId, ledger, policy);
  const previous = history.length > 0 ? history[history.length - 1] : null;
  const payload = {
    artifactId: crypto.randomUUID(),
    ledgerId: String(ledgerId || 'default'),
    sequence: history.length + 1,
    publishedAt: nowIso(),
    actor: String(actor || 'system'),
    periodStartIso: String(periodStartIso || ''),
    periodEndIso: String(periodEndIso || ''),
    reportLabel: String(reportLabel || ''),
    previousArtifactDigest: previous && previous.digest ? String(previous.digest) : '',
    attestationDigest: String(base.digest || ''),
    attestation: base.attestation,
  };
  const signature = signReserveAttestationPayload(payload);
  const artifact = {
    version: 1,
    payload,
    signature,
    digest: hashObjectSha256({ payload, signature }),
  };
  history.push(artifact);
  if (history.length > 500) history.splice(0, history.length - 500);
  persistReserveAttestations();
  return artifact;
}

function addRiskAlert(alert) {
  const row = {
    id: crypto.randomUUID(),
    ts: nowIso(),
    ...alert,
  };
  swarmState.riskAlerts.unshift(row);
  if (swarmState.riskAlerts.length > 500) swarmState.riskAlerts.length = 500;
  riskDb.addRiskAlert(row);
}

function hydrateFromRiskDb() {
  for (const profile of riskDb.listComplianceProfiles()) {
    if (profile?.playerId) swarmState.complianceProfiles.set(String(profile.playerId), profile);
  }
  for (const order of riskDb.listPaymentOrders()) {
    if (order?.orderId) swarmState.paymentOrders.set(String(order.orderId), order);
  }
  for (const event of riskDb.listWebhookEvents()) {
    if (event?.eventId) swarmState.webhookEvents.set(String(event.eventId), event);
  }
  const attempts = riskDb.listFundingAttempts();
  for (const row of attempts) {
    if (!row?.id) continue;
    swarmState.fundingAttempts.set(String(row.id), row);
  }
  for (const position of riskDb.listSponsorshipPositions()) {
    if (!position?.positionId) continue;
    swarmState.sponsorshipPositions.set(String(position.positionId), position);
  }
  swarmState.riskAlerts = riskDb.listRiskAlerts(500);
  for (const row of riskDb.listTraitRollouts()) {
    if (row?.rolloutId) swarmState.traitRollouts.set(String(row.rolloutId), row);
  }
  for (const row of riskDb.listTraitObservations()) {
    if (row?.agentId) swarmState.traitObservations.set(String(row.agentId), row);
  }
  for (const row of riskDb.listTraitRecommendations()) {
    if (row?.agentId) swarmState.traitLastRecommendation.set(String(row.agentId), row);
  }
  swarmState.traitPolicyEvents = riskDb.listTraitPolicyEvents(500);
  for (const ev of swarmState.traitPolicyEvents) {
    const type = String(ev?.type || '');
    if (type === 'artifact.revoked' && ev?.artifactId) {
      swarmState.traitPolicy.revokedArtifactIds.add(String(ev.artifactId));
    } else if (type === 'policy.freeze') {
      swarmState.traitPolicy.freeze = true;
    } else if (type === 'policy.unfreeze') {
      swarmState.traitPolicy.freeze = false;
    }
  }
}

function parseApiTokens() {
  const raw = String(process.env.CASIN8_API_TOKENS || '').trim();
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const out = new Map();
      for (const [token, roles] of Object.entries(parsed)) {
        if (!token) continue;
        if (Array.isArray(roles)) out.set(token, new Set(roles.map((x) => String(x))));
        else out.set(token, new Set([String(roles || 'admin')]));
      }
      return out;
    }
  } catch {
    // allow compact fallback format
  }
  const out = new Map();
  for (const row of raw.split(';')) {
    const [tokenRaw, roleRaw] = row.split(':');
    const token = String(tokenRaw || '').trim();
    if (!token) continue;
    const roles = String(roleRaw || 'admin')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    out.set(token, new Set(roles.length > 0 ? roles : ['admin']));
  }
  return out;
}

function extractApiToken(req) {
  const auth = String(req.headers.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return String(req.headers['x-api-key'] || '').trim();
}

function requireRoles(req, res, requiredRoles) {
  const configured = apiTokenRoles;
  if (configured.size === 0) {
    if (allowInsecureDevBypass) {
      return { ok: true, devBypass: true, roles: new Set(['admin']) };
    }
    writeJson(res, 503, { ok: false, error: 'Auth not configured' });
    return { ok: false };
  }
  const token = extractApiToken(req);
  const roles = configured.get(token);
  if (!token || !roles) {
    writeJson(res, 401, { ok: false, error: 'Unauthorized' });
    return { ok: false };
  }
  const allowed = requiredRoles.every((role) => roles.has(role) || roles.has('admin'));
  if (!allowed) {
    writeJson(res, 403, { ok: false, error: 'Forbidden' });
    return { ok: false };
  }
  return { ok: true, devBypass: false, roles };
}

function requireAnyRole(req, res, allowedRoles) {
  const configured = apiTokenRoles;
  if (configured.size === 0) {
    if (allowInsecureDevBypass) {
      return { ok: true, devBypass: true, roles: new Set(['admin']) };
    }
    writeJson(res, 503, { ok: false, error: 'Auth not configured' });
    return { ok: false };
  }
  const token = extractApiToken(req);
  const roles = configured.get(token);
  if (!token || !roles) {
    writeJson(res, 401, { ok: false, error: 'Unauthorized' });
    return { ok: false };
  }
  const allowed = allowedRoles.some((role) => roles.has(role) || roles.has('admin'));
  if (!allowed) {
    writeJson(res, 403, { ok: false, error: 'Forbidden' });
    return { ok: false };
  }
  return { ok: true, devBypass: false, roles };
}

function requiresPokerAuth(method, pathname) {
  const m = String(method || 'GET').toUpperCase();
  const p = String(pathname || '');
  if (p.startsWith('/api/payments/webhook/')) return false;
  if (authRouteExact.has(p)) return true;
  if (m !== 'GET') {
    return authRoutePrefixes.some((prefix) => p.startsWith(prefix));
  }
  if (p.startsWith('/api/v2/')) return true;
  if (p.startsWith('/api/cashier/')) return true;
  if (p.startsWith('/api/sponsorships/')) return true;
  if (p.startsWith('/api/agents/')) return true;
  if (p.startsWith('/api/swarm/')) return true;
  return false;
}

function nowIso() {
  return new Date().toISOString();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function canonicalJson(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => canonicalJson(x)).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function verifyTraitSignature(normalized) {
  const signature =
    normalized.signature && typeof normalized.signature === 'object' ? normalized.signature : null;
  if (!signature) {
    if (requireTraitSignature) throw new Error('Trait signature is required');
    return { verified: false, reason: 'missing' };
  }
  if (!traitArtifactSecret) {
    if (requireTraitSignature) throw new Error('Trait signature verification unavailable');
    return { verified: false, reason: 'no_secret' };
  }
  const payload = {
    payloadVersion: normalized.payloadVersion,
    provider: normalized.provider,
    agentId: normalized.agentId,
    context: normalized.context || null,
    solverDump: normalized.solverDump || null,
    cfrProfile: normalized.cfrProfile || null,
    riskProfile: normalized.riskProfile || null,
    provenance: normalized.provenance || null,
  };
  const expected = crypto
    .createHmac('sha256', traitArtifactSecret)
    .update(canonicalJson(payload))
    .digest('hex');
  const given = String(signature.value || '')
    .trim()
    .toLowerCase();
  const verified =
    Boolean(given) &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!verified) throw new Error('Invalid trait signature');
  return { verified: true, reason: 'ok' };
}

function enforceTraitRateLimit(agentId) {
  const nowMs = Date.now();
  const key = String(agentId || '').trim() || 'unknown';
  const bucket = swarmState.traitRateLimit.get(key) || { count: 0, resetAt: nowMs + 60_000 };
  if (nowMs >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = nowMs + 60_000;
  }
  bucket.count += 1;
  swarmState.traitRateLimit.set(key, bucket);
  return bucket.count <= 30;
}

function applyComplianceTraitRiskCaps(agentId, ownerId, maxRiskBps) {
  const refId = String(ownerId || '').trim() || String(agentId || '').trim();
  if (!refId) return { maxRiskBps, capped: false, reasons: [] };
  const profile = getComplianceProfile(refId);
  let next = Number(maxRiskBps || 800);
  const reasons = [];
  if (profile?.amlRiskLevel === 'high') {
    next = Math.min(next, 500);
    reasons.push('AML_HIGH_CAP');
  } else if (profile?.amlRiskLevel === 'medium') {
    next = Math.min(next, 900);
    reasons.push('AML_MEDIUM_CAP');
  }
  if (
    profile?.countryCode &&
    complianceConfig().blockedCountries.has(String(profile.countryCode).toUpperCase())
  ) {
    next = Math.min(next, 300);
    reasons.push('GEO_BLOCK_CAP');
  }
  if (profile?.banned === true) {
    next = Math.min(next, 250);
    reasons.push('BANNED_CAP');
  }
  return {
    maxRiskBps: Math.max(250, Math.round(next)),
    capped: reasons.length > 0,
    reasons,
    complianceProfileRef: refId,
  };
}

function trackTraitObservation(agentId, action) {
  const key = String(agentId || '').trim();
  if (!key) return;
  const row = swarmState.traitObservations.get(key) || {
    fold: 0,
    check: 0,
    call: 0,
    raise: 0,
    updatedAt: nowIso(),
  };
  const a = String(action || '')
    .trim()
    .toLowerCase();
  if (a in row) row[a] += 1;
  row.updatedAt = nowIso();
  swarmState.traitObservations.set(key, row);
  riskDb.upsertTraitObservation({ ...row, agentId: key });
}

function computeTraitDrift(agentId) {
  const rec = swarmState.traitLastRecommendation.get(String(agentId || '').trim());
  const obs = swarmState.traitObservations.get(String(agentId || '').trim());
  if (!rec || !obs) return null;
  const total = obs.fold + obs.check + obs.call + obs.raise;
  if (total <= 0) return null;
  const observed = {
    vpipBps: Math.round(((obs.call + obs.raise) / total) * 10000),
    pfrBps: Math.round((obs.raise / total) * 10000),
  };
  const target = rec?.recommended?.styleOverrides || {};
  const vpipDelta = Math.abs(Number(target.vpipBps || 0) - observed.vpipBps);
  const pfrDelta = Math.abs(Number(target.pfrBps || 0) - observed.pfrBps);
  return {
    agentId: String(agentId || '').trim(),
    observed,
    target: {
      vpipBps: Number(target.vpipBps || 0),
      pfrBps: Number(target.pfrBps || 0),
    },
    driftBps: Math.round((vpipDelta + pfrDelta) / 2),
    updatedAt: obs.updatedAt,
  };
}

function pushTraitPolicyEvent(event) {
  const row = {
    id: crypto.randomUUID(),
    ts: nowIso(),
    ...event,
  };
  swarmState.traitPolicyEvents.unshift(row);
  if (swarmState.traitPolicyEvents.length > 500) swarmState.traitPolicyEvents.length = 500;
  riskDb.addTraitPolicyEvent(row);
  return row;
}

function randomSeedHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function loadOrCreateHoldemResumeSecret() {
  try {
    if (fs.existsSync(holdemResumeSecretPath)) {
      const existing = String(fs.readFileSync(holdemResumeSecretPath, 'utf8') || '').trim();
      if (/^[a-f0-9]{32,}$/i.test(existing)) {
        return existing;
      }
    }
  } catch {
    // fall through and rotate
  }
  const secret = randomSeedHex(32);
  try {
    fs.writeFileSync(holdemResumeSecretPath, `${secret}\n`, { mode: 0o600 });
  } catch {
    // best effort persistence
  }
  return secret;
}

function loadState() {
  try {
    if (!fs.existsSync(statePath)) {
      return { sessions: {}, tables: {}, v2: { holdemTables: {}, holdemTournaments: {} } };
    }
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      tables: parsed.tables && typeof parsed.tables === 'object' ? parsed.tables : {},
      v2:
        parsed.v2 && typeof parsed.v2 === 'object'
          ? {
              holdemTables:
                parsed.v2.holdemTables && typeof parsed.v2.holdemTables === 'object'
                  ? parsed.v2.holdemTables
                  : {},
              holdemTournaments:
                parsed.v2.holdemTournaments && typeof parsed.v2.holdemTournaments === 'object'
                  ? parsed.v2.holdemTournaments
                  : {},
            }
          : { holdemTables: {}, holdemTournaments: {} },
    };
  } catch {
    return { sessions: {}, tables: {}, v2: { holdemTables: {}, holdemTournaments: {} } };
  }
}

function persistState() {
  const tmp = `${statePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state), 'utf8');
  fs.renameSync(tmp, statePath);
}

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const ip = getIp(req);
  const current = Date.now();
  const bucket = rateLimits.get(ip) || { count: 0, resetAt: current + rateLimitWindowMs };
  if (current > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = current + rateLimitWindowMs;
  }
  bucket.count += 1;
  rateLimits.set(ip, bucket);
  return bucket.count > rateLimitMax;
}

function jsonStringifySafe(payload) {
  return JSON.stringify(payload, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

function writeJson(res, statusCode, payload) {
  const body = jsonStringifySafe(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function recordRouteLatency(routeKey, ms) {
  const key = String(routeKey || 'unknown');
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return;
  if (!routeLatency.has(key)) {
    routeLatency.set(key, { count: 0, totalMs: 0, maxMs: 0, samples: [] });
  }
  const row = routeLatency.get(key);
  row.count += 1;
  row.totalMs += value;
  row.maxMs = Math.max(row.maxMs, value);
  row.samples.push(value);
  if (row.samples.length > 400) {
    row.samples.splice(0, row.samples.length - 400);
  }
}

function percentile(values, p) {
  const rows = Array.isArray(values) ? values.slice().sort((a, b) => a - b) : [];
  if (rows.length === 0) return 0;
  const idx = Math.min(rows.length - 1, Math.max(0, Math.ceil((p / 100) * rows.length) - 1));
  return rows[idx];
}

function buildLatencyReport() {
  const out = [];
  for (const [route, row] of routeLatency.entries()) {
    const p50 = percentile(row.samples, 50);
    const p95 = percentile(row.samples, 95);
    const avg = row.count > 0 ? row.totalMs / row.count : 0;
    out.push({
      route,
      count: row.count,
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      maxMs: Number(row.maxMs.toFixed(2)),
    });
  }
  out.sort((a, b) => b.p95Ms - a.p95Ms || b.count - a.count);
  return out;
}

function parseBigIntInput(value, field, min = null) {
  let out;
  if (typeof value === 'bigint') out = value;
  else if (typeof value === 'number' && Number.isInteger(value)) out = BigInt(value);
  else if (typeof value === 'string' && /^-?\d+$/.test(value)) out = BigInt(value);
  else throw new Error(`Invalid ${field}`);
  if (min != null && out < min) {
    throw new Error(`Invalid ${field}: expected >= ${min.toString()}`);
  }
  return out;
}

async function getAgentRegistry() {
  if (swarmState.agentRegistry) return swarmState.agentRegistry;
  const mod = await agentRuntimePromise;
  swarmState.agentRegistry = new mod.AgentRegistry();
  return swarmState.agentRegistry;
}

async function getOrCreateCashier(ledgerId = 'default') {
  if (swarmState.cashiers.has(ledgerId)) return swarmState.cashiers.get(ledgerId);
  const mod = await cashierPromise;
  const ledger = new mod.CashierTokenLedger();
  swarmState.cashiers.set(ledgerId, ledger);
  return ledger;
}

async function getOrCreateRealtimeBus(tableId) {
  const key = String(tableId || 'lobby-1');
  if (swarmState.realtimeBuses.has(key)) return swarmState.realtimeBuses.get(key);
  const mod = await realtimePromise;
  const bus = new mod.RealtimeTableBus({ tableId: key });
  swarmState.realtimeBuses.set(key, bus);
  return bus;
}

async function getOrCreateHoldemTable(tableId, config = {}) {
  const key = String(tableId || '').trim();
  if (!key) throw new Error('tableId is required');
  if (swarmState.holdemTables.has(key)) return swarmState.holdemTables.get(key);
  const mod = await holdemEnginePromise;
  ensureV2StateBuckets();
  const persisted = state.v2.holdemTables[key];
  const table =
    persisted && typeof persisted === 'object'
      ? mod.restoreFromRecovery(persisted)
      : mod.createHoldemTable({ tableId: key, ...config });
  swarmState.holdemTables.set(key, table);
  return table;
}

function ensureV2StateBuckets() {
  if (!state.v2 || typeof state.v2 !== 'object') state.v2 = {};
  if (!state.v2.holdemTables || typeof state.v2.holdemTables !== 'object') {
    state.v2.holdemTables = {};
  }
  if (!state.v2.holdemTournaments || typeof state.v2.holdemTournaments !== 'object') {
    state.v2.holdemTournaments = {};
  }
}

async function persistV2HoldemTable(table) {
  if (!table || !table.tableId) return;
  const mod = await holdemEnginePromise;
  ensureV2StateBuckets();
  state.v2.holdemTables[String(table.tableId)] = cloneJsonSafe(mod.recoverySnapshot(table));
  persistState();
}

async function getHoldemTournamentOrRestore(tournamentId) {
  const key = String(tournamentId || '').trim();
  if (!key) return null;
  if (swarmState.holdemTournaments.has(key)) return swarmState.holdemTournaments.get(key);
  ensureV2StateBuckets();
  const persisted = state.v2.holdemTournaments[key];
  if (!persisted || typeof persisted !== 'object') return null;
  const mod = await holdemTournamentsPromise;
  const restored = mod.restoreTournament(persisted);
  swarmState.holdemTournaments.set(key, restored);
  return restored;
}

async function persistV2Tournament(tournament) {
  if (!tournament || !tournament.tournamentId) return;
  const mod = await holdemTournamentsPromise;
  ensureV2StateBuckets();
  state.v2.holdemTournaments[String(tournament.tournamentId)] = cloneJsonSafe(
    mod.recoverySnapshot(tournament)
  );
  persistState();
}

function badRequest(res, message) {
  writeJson(res, 400, { ok: false, error: message });
}

function conflict(res, message) {
  writeJson(res, 409, { ok: false, error: message });
}

function notFound(res) {
  writeJson(res, 404, { ok: false, error: 'Not found' });
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function chainConfig() {
  return {
    enabled:
      !!process.env.CASIN8_CONTRACT_TOKEN &&
      !!process.env.CASIN8_CONTRACT_MERKABA &&
      !!process.env.CASIN8_CHAIN_RPC_URL,
    chainId: Number(process.env.CASIN8_CHAIN_ID || 8453),
    network: process.env.CASIN8_CHAIN_NETWORK || 'base',
    rpcUrl: process.env.CASIN8_CHAIN_RPC_URL || 'https://mainnet.base.org',
    address: {
      token: process.env.CASIN8_CONTRACT_TOKEN || '',
      merkaba: process.env.CASIN8_CONTRACT_MERKABA || '',
    },
  };
}

function toBase64Url(input) {
  return Buffer.from(String(input), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const base = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = base.length % 4 === 0 ? '' : '='.repeat(4 - (base.length % 4));
  return Buffer.from(base + pad, 'base64').toString('utf8');
}

function signHoldemResumePayload(payload) {
  return crypto.createHash('sha256').update(`${payload}.${holdemResumeTokenSecret}`).digest('hex');
}

function createHoldemResumeToken({ tableId, handId, playerId, seat, replayCursor }) {
  const payloadObj = {
    tableId: String(tableId || '').trim(),
    handId: String(handId || '').trim(),
    playerId: String(playerId || '').trim(),
    seat: Number.isInteger(Number(seat)) ? Number(seat) : null,
    replayCursor: Number(replayCursor || 0),
    issuedAt: nowIso(),
  };
  const payload = toBase64Url(JSON.stringify(payloadObj));
  const sig = signHoldemResumePayload(payload);
  return `${payload}.${sig}`;
}

function parseAndVerifyHoldemResumeToken(token) {
  const text = String(token || '').trim();
  if (!text.includes('.')) throw new Error('Invalid resume token format');
  const [payload, sig] = text.split('.');
  const expected = signHoldemResumePayload(payload);
  if (String(sig || '') !== expected) throw new Error('Invalid resume token signature');
  const parsed = JSON.parse(fromBase64Url(payload));
  const issuedMs = Date.parse(String(parsed.issuedAt || ''));
  if (!Number.isFinite(issuedMs)) throw new Error('Invalid resume token issuedAt');
  if (Date.now() - issuedMs > holdemResumeTokenTtlMs) {
    throw new Error('Resume token expired');
  }
  return {
    tableId: String(parsed.tableId || '').trim(),
    handId: String(parsed.handId || '').trim(),
    playerId: String(parsed.playerId || '').trim(),
    seat: Number.isInteger(parsed.seat) ? parsed.seat : null,
    replayCursor: Number(parsed.replayCursor || 0),
    issuedAt: String(parsed.issuedAt || ''),
  };
}

async function rpcCall(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} error: ${json.error.message || 'unknown'}`);
  }
  return json.result;
}

function normalizeHexAddress(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function hexToBigInt(hex) {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
}

function decodeLastUint256FromInput(inputHex) {
  const input = String(inputHex || '').toLowerCase();
  if (!input.startsWith('0x') || input.length < 10 + 64) {
    throw new Error('Invalid tx input data');
  }
  const payload = input.slice(2);
  const tail64 = payload.slice(-64);
  return BigInt(`0x${tail64}`);
}

async function verifyOnchainSettlement(onchain, cfg) {
  metrics.onchainVerifyAttempts += 1;
  if (!cfg.enabled) {
    throw new Error('On-chain settlement not enabled on server');
  }

  const expectedTo = normalizeHexAddress(cfg.address.merkaba);
  const expectedFrom = normalizeHexAddress(onchain.account);
  const expectedAmount = BigInt(String(onchain.tokenAmountRaw || '0'));
  const txHash = String(onchain.txHash || '');

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error('Invalid on-chain tx hash format');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedFrom)) {
    throw new Error('Invalid on-chain account format');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedTo)) {
    throw new Error('Server merkaba contract address is invalid');
  }
  if (expectedAmount <= 0n) {
    throw new Error('Invalid on-chain token amount');
  }

  const [tx, receipt, chainHex] = await Promise.all([
    rpcCall(cfg.rpcUrl, 'eth_getTransactionByHash', [txHash]),
    rpcCall(cfg.rpcUrl, 'eth_getTransactionReceipt', [txHash]),
    rpcCall(cfg.rpcUrl, 'eth_chainId', []),
  ]);

  if (!tx) {
    throw new Error('On-chain transaction not found');
  }
  if (!receipt) {
    throw new Error('On-chain transaction receipt not found yet');
  }

  const receiptStatus = String(receipt.status || '').toLowerCase();
  if (receiptStatus !== '0x1') {
    throw new Error('On-chain transaction failed');
  }

  const txTo = normalizeHexAddress(tx.to);
  const txFrom = normalizeHexAddress(tx.from);
  if (txTo !== expectedTo) {
    throw new Error('On-chain tx destination does not match merkaba contract');
  }
  if (txFrom !== expectedFrom) {
    throw new Error('On-chain tx sender does not match submitted account');
  }

  const decodedAmount = decodeLastUint256FromInput(tx.input);
  if (decodedAmount !== expectedAmount) {
    throw new Error('On-chain tx amount does not match submitted token amount');
  }

  // Enforce presence of ERC20 Transfer(from -> merkaba, amount) log on configured token.
  const expectedToken = normalizeHexAddress(cfg.address.token);
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedToken)) {
    throw new Error('Server token contract address is invalid');
  }
  const transferTopicPrefix = '0xddf252ad';
  const fromTopic = `0x${expectedFrom.replace(/^0x/, '').padStart(64, '0')}`;
  const toTopic = `0x${expectedTo.replace(/^0x/, '').padStart(64, '0')}`;

  const matchingTransfer = Array.isArray(receipt.logs)
    ? receipt.logs.find((log) => {
        const logAddress = normalizeHexAddress(log?.address);
        const topics = Array.isArray(log?.topics)
          ? log.topics.map((t) => String(t).toLowerCase())
          : [];
        if (logAddress !== expectedToken) return false;
        if (topics.length < 3) return false;
        if (!topics[0].startsWith(transferTopicPrefix)) return false;
        if (topics[1] !== fromTopic) return false;
        if (topics[2] !== toTopic) return false;
        const value = hexToBigInt(String(log?.data || '0x0'));
        return value === expectedAmount;
      })
    : null;

  if (!matchingTransfer) {
    throw new Error('On-chain transfer log verification failed');
  }

  const submittedChainId = Number(onchain.chainId || 0);
  const rpcChainId = Number(hexToBigInt(chainHex));
  if (submittedChainId > 0 && submittedChainId !== rpcChainId) {
    throw new Error('Submitted chainId does not match RPC chainId');
  }

  const out = {
    verified: true,
    chainId: rpcChainId,
    blockNumber: Number(hexToBigInt(receipt.blockNumber || '0x0')),
    txHash,
    from: txFrom,
    to: txTo,
    token: expectedToken,
    amountRaw: decodedAmount.toString(),
  };
  metrics.onchainVerifyPass += 1;
  return out;
}

function sanitizeName(input) {
  const raw = String(input || '').trim();
  if (!raw) return 'Player';
  return raw.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 32) || 'Player';
}

function sanitizeTable(input) {
  const raw = String(input || '')
    .trim()
    .toLowerCase();
  return raw.replace(/[^a-z0-9_-]/g, '').slice(0, 48) || 'lobby-1';
}

function getSessionOrNull(sessionId) {
  if (!sessionId) return null;
  return state.sessions[String(sessionId)] || null;
}

function sessionSummary(session) {
  return {
    sessionId: session.id,
    playerName: session.playerName,
    bankroll: session.bankroll,
    rounds: session.rounds,
    wins: session.wins,
    losses: session.losses,
    clientSeed: session.clientSeed,
    serverSeedHash: session.serverSeedHash,
    nonce: session.nonce,
    tableId: session.tableId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function ensureTable(tableId) {
  if (!state.tables[tableId]) {
    state.tables[tableId] = { id: tableId, events: [] };
  }
  return state.tables[tableId];
}

function cloneJsonSafe(value) {
  return JSON.parse(jsonStringifySafe(value));
}

function persistTableSnapshot(tableId, snapshot) {
  const table = ensureTable(tableId);
  table.snapshot = cloneJsonSafe(snapshot);
  table.snapshotUpdatedAt = nowIso();
  persistState();
}

function restorePersistedTableSnapshots() {
  for (const [tableId, table] of Object.entries(state.tables || {})) {
    if (
      table &&
      typeof table === 'object' &&
      table.snapshot &&
      typeof table.snapshot === 'object'
    ) {
      swarmState.tableSnapshots.set(tableId, table.snapshot);
    }
  }
}

function publishTableEvent(tableId, event) {
  const table = ensureTable(tableId);
  table.events.unshift(event);
  if (table.events.length > maxTableEvents) {
    table.events.length = maxTableEvents;
  }

  const clients = sseClients.get(tableId);
  if (clients && clients.size > 0) {
    const line = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) {
      res.write(line);
    }
  }
}

function pushLedger(session, entry) {
  session.ledger.unshift(entry);
  if (session.ledger.length > maxLedgerEntries) {
    session.ledger.length = maxLedgerEntries;
  }
}

function parseCardCode(code) {
  const text = String(code || '');
  if (text.length < 2) return null;
  return { rank: text.slice(0, -1), suit: text.slice(-1) };
}

function rankValue(rank) {
  const map = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return map[String(rank)] || 0;
}

function compareScoreTuple(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const av = Number(a[i] || 0);
    const bv = Number(b[i] || 0);
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function evaluateFiveScore(cards) {
  const values = cards.map((c) => rankValue(c.rank)).sort((x, y) => x - y);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);

  let straight = false;
  let straightHigh = values[4];
  if (new Set(values).size === 5) {
    if (values[4] - values[0] === 4) {
      straight = true;
    } else if (values.join(',') === '2,3,4,5,14') {
      straight = true;
      straightHigh = 5;
    }
  }

  const countByVal = new Map();
  for (const v of values) countByVal.set(v, (countByVal.get(v) || 0) + 1);
  const groups = [...countByVal.entries()].map(([v, c]) => ({ v, c }));
  groups.sort((a, b) => b.c - a.c || b.v - a.v);
  const desc = [...values].sort((a, b) => b - a);

  if (straight && flush) return [8, straightHigh];
  if (groups[0].c === 4) {
    const kicker = groups.find((g) => g.c === 1)?.v || 0;
    return [7, groups[0].v, kicker];
  }
  if (groups[0].c === 3 && groups[1]?.c === 2) return [6, groups[0].v, groups[1].v];
  if (flush) return [5, ...desc];
  if (straight) return [4, straightHigh];
  if (groups[0].c === 3) {
    const kickers = groups
      .filter((g) => g.c === 1)
      .map((g) => g.v)
      .sort((a, b) => b - a);
    return [3, groups[0].v, ...kickers];
  }
  if (groups[0].c === 2 && groups[1]?.c === 2) {
    const highPair = Math.max(groups[0].v, groups[1].v);
    const lowPair = Math.min(groups[0].v, groups[1].v);
    const kicker = groups.find((g) => g.c === 1)?.v || 0;
    return [2, highPair, lowPair, kicker];
  }
  if (groups[0].c === 2) {
    const kickers = groups
      .filter((g) => g.c === 1)
      .map((g) => g.v)
      .sort((a, b) => b - a);
    return [1, groups[0].v, ...kickers];
  }
  return [0, ...desc];
}

function activeSeats(snapshot) {
  return (Array.isArray(snapshot?.seats) ? snapshot.seats : [])
    .map((seat, idx) => ({
      ...seat,
      seat: Number.isInteger(seat?.seat) ? seat.seat : idx,
    }))
    .filter((seat) => !seat.folded);
}

function firstActiveSeat(snapshot) {
  const rows = activeSeats(snapshot);
  return rows.length > 0 ? rows[0].seat : 0;
}

function nextActiveSeat(snapshot, startSeat) {
  const rows = (Array.isArray(snapshot?.seats) ? snapshot.seats : [])
    .map((seat, idx) => ({
      ...seat,
      seat: Number.isInteger(seat?.seat) ? seat.seat : idx,
    }))
    .sort((a, b) => a.seat - b.seat);
  if (rows.length === 0) return 0;
  const active = rows.filter((r) => !r.folded);
  if (active.length === 0) return rows[0].seat;
  for (const row of active) {
    if (row.seat > startSeat) return row.seat;
  }
  return active[0].seat;
}

function dealFromDeck(snapshot, count) {
  const out = [];
  const deck = Array.isArray(snapshot?.deckCards) ? snapshot.deckCards : [];
  for (let i = 0; i < count && deck.length > 0; i += 1) {
    out.push(deck.shift());
  }
  snapshot.deckCards = deck;
  return out;
}

function bestFiveRank(cards7, evaluatePokerHand) {
  let best = -1;
  const n = cards7.length;
  for (let a = 0; a < n - 4; a += 1) {
    for (let b = a + 1; b < n - 3; b += 1) {
      for (let c = b + 1; c < n - 2; c += 1) {
        for (let d = c + 1; d < n - 1; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            const rank = evaluatePokerHand([cards7[a], cards7[b], cards7[c], cards7[d], cards7[e]]);
            if (rank > best) best = rank;
          }
        }
      }
    }
  }
  return best;
}

function bestSevenScore(cards7) {
  let best = null;
  const n = cards7.length;
  for (let a = 0; a < n - 4; a += 1) {
    for (let b = a + 1; b < n - 3; b += 1) {
      for (let c = b + 1; c < n - 2; c += 1) {
        for (let d = c + 1; d < n - 1; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            const score = evaluateFiveScore([
              cards7[a],
              cards7[b],
              cards7[c],
              cards7[d],
              cards7[e],
            ]);
            if (!best || compareScoreTuple(score, best) > 0) best = score;
          }
        }
      }
    }
  }
  return best || [0];
}

function isStreetRoundComplete(snapshot) {
  const active = activeSeats(snapshot);
  if (active.length <= 1) return true;
  const acted = new Set(Array.isArray(snapshot?.actedSeats) ? snapshot.actedSeats : []);
  const streetBets =
    snapshot?.streetBets && typeof snapshot.streetBets === 'object' ? snapshot.streetBets : {};
  const currentBet = Number(snapshot.currentBet || 0);
  for (const seat of active) {
    const seatNo = seat.seat;
    if (!acted.has(seatNo)) return false;
    const stack = Math.max(0, Number(seat?.stack || 0));
    if (stack <= 0) continue; // all-in seats do not need to match future raises
    const bet = Number(streetBets[String(seatNo)] || 0);
    if (bet !== currentBet) return false;
  }
  return true;
}

function settleSessionsFromSnapshot(snapshot) {
  if (!snapshot || snapshot.sessionSettledAt) return null;
  const map =
    snapshot.sessionBySeat && typeof snapshot.sessionBySeat === 'object'
      ? snapshot.sessionBySeat
      : null;
  if (!map) return null;

  const rows = [];
  const seats = Array.isArray(snapshot.seats) ? snapshot.seats : [];
  const payoutBySeat =
    snapshot.payoutBySeat && typeof snapshot.payoutBySeat === 'object' ? snapshot.payoutBySeat : {};
  for (const seat of seats) {
    const seatNo = Number.isInteger(seat?.seat) ? seat.seat : -1;
    const sid = String(map[String(seatNo)] || '').trim();
    if (!sid) continue;
    const session = state.sessions[sid];
    if (!session) continue;
    const invested = Math.max(0, Number(seat?.invested || 0));
    session.bankroll = Math.max(0, Number(session.bankroll || 0) - invested);
    session.rounds = Number(session.rounds || 0) + 1;
    const payout = Math.max(
      0,
      Number(
        payoutBySeat[String(seatNo)] ||
          (seatNo === snapshot.winnerSeat ? snapshot.payoutUnits : 0) ||
          0
      )
    );
    if (payout > 0) {
      session.bankroll += payout;
      session.wins = Number(session.wins || 0) + 1;
    } else {
      session.losses = Number(session.losses || 0) + 1;
    }
    session.updatedAt = nowIso();
    rows.push({
      seat: seatNo,
      sessionId: sid,
      invested,
      payout,
      winner: payout > 0,
    });
  }
  snapshot.sessionSettledAt = nowIso();
  snapshot.sessionSettlement = rows;
  if (rows.length > 0) {
    persistState();
  }
  return rows;
}

function computePayoutBySeat(snapshot, scored) {
  const investedBySeat = {};
  const seats = Array.isArray(snapshot?.seats) ? snapshot.seats : [];
  for (const seat of seats) {
    const seatNo = Number.isInteger(seat?.seat) ? seat.seat : -1;
    if (seatNo < 0) continue;
    investedBySeat[seatNo] = Math.max(0, Number(seat?.invested || 0));
  }

  const tiers = [...new Set(Object.values(investedBySeat).filter((v) => v > 0))].sort(
    (a, b) => a - b
  );
  const payouts = {};
  const scoredBySeat = new Map(
    (Array.isArray(scored) ? scored : []).map((r) => [r.seat, r.scoreTuple])
  );
  let prev = 0;
  const pots = [];

  for (const tier of tiers) {
    const contributors = Object.entries(investedBySeat)
      .filter(([, v]) => v >= tier)
      .map(([k]) => Number(k));
    const amount = (tier - prev) * contributors.length;
    prev = tier;
    if (amount <= 0) continue;

    const contenders = contributors.filter((seat) => scoredBySeat.has(seat));
    if (contenders.length === 0) continue;

    let bestScore = null;
    let winners = [];
    for (const seat of contenders) {
      const score = scoredBySeat.get(seat);
      if (!bestScore || compareScoreTuple(score, bestScore) > 0) {
        bestScore = score;
        winners = [seat];
      } else if (compareScoreTuple(score, bestScore) === 0) {
        winners.push(seat);
      }
    }

    const split = Math.floor(amount / winners.length);
    let remainder = amount - split * winners.length;
    const winnersSorted = winners.slice().sort((a, b) => a - b);
    for (const seat of winnersSorted) {
      payouts[String(seat)] = Number(payouts[String(seat)] || 0) + split + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    }
    pots.push({ tier, amount, winners: winnersSorted });
  }

  return { payouts, pots };
}

function advanceStreet(snapshot, engine) {
  if (snapshot.street === 'preflop') {
    dealFromDeck(snapshot, 1);
    snapshot.communityCards.push(...dealFromDeck(snapshot, 3));
    snapshot.street = 'flop';
    snapshot.currentBet = 0;
    snapshot.streetBets = {};
    snapshot.actedSeats = [];
    snapshot.minRaise = Math.max(1, Number(snapshot.blinds?.bigBlind || snapshot.minRaise || 1));
    return;
  }
  if (snapshot.street === 'flop') {
    dealFromDeck(snapshot, 1);
    snapshot.communityCards.push(...dealFromDeck(snapshot, 1));
    snapshot.street = 'turn';
    snapshot.currentBet = 0;
    snapshot.streetBets = {};
    snapshot.actedSeats = [];
    snapshot.minRaise = Math.max(1, Number(snapshot.blinds?.bigBlind || snapshot.minRaise || 1));
    return;
  }
  if (snapshot.street === 'turn') {
    dealFromDeck(snapshot, 1);
    snapshot.communityCards.push(...dealFromDeck(snapshot, 1));
    snapshot.street = 'river';
    snapshot.currentBet = 0;
    snapshot.streetBets = {};
    snapshot.actedSeats = [];
    snapshot.minRaise = Math.max(1, Number(snapshot.blinds?.bigBlind || snapshot.minRaise || 1));
    return;
  }
  if (snapshot.street === 'river') {
    const contenders = activeSeats(snapshot);
    const scored = contenders.map((seat) => {
      const holeCodes = (snapshot.holeCards && snapshot.holeCards[String(seat.seat)]) || [];
      const allCodes = [...holeCodes, ...(snapshot.communityCards || [])];
      const allCards = allCodes.map(parseCardCode).filter(Boolean);
      const scoreTuple = allCards.length >= 5 ? bestSevenScore(allCards) : [0];
      return { seat: seat.seat, scoreTuple };
    });
    scored.sort((a, b) => compareScoreTuple(b.scoreTuple, a.scoreTuple) || a.seat - b.seat);
    const payout = computePayoutBySeat(snapshot, scored);
    const topPayoutSeat = Object.entries(payout.payouts).sort(
      (a, b) => Number(b[1]) - Number(a[1]) || Number(a[0]) - Number(b[0])
    )[0];
    snapshot.street = 'showdown';
    snapshot.terminal = true;
    snapshot.settled = true;
    snapshot.winnerSeat = topPayoutSeat
      ? Number(topPayoutSeat[0])
      : scored.length > 0
        ? scored[0].seat
        : firstActiveSeat(snapshot);
    snapshot.payoutUnits = Math.max(
      0,
      Number(topPayoutSeat ? topPayoutSeat[1] : snapshot.pot || 0)
    );
    snapshot.payoutBySeat = payout.payouts;
    snapshot.sidePots = payout.pots;
    snapshot.showdown = scored;
  }
}

function readBodyRaw(req, maxBytes = 1024 * 64) {
  return new Promise((resolve, reject) => {
    let total = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (tooLarge) return;
      total += chunk.length;
      if (total > maxBytes) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new Error('Payload too large'));
        return;
      }
      resolve(chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0));
    });
    req.on('error', reject);
  });
}

async function readBodyJson(req) {
  const raw = await readBodyRaw(req);
  if (raw.length === 0) return {};
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function getComplianceProfile(playerId) {
  const key = String(playerId || '').trim();
  if (!key) throw new Error('playerId is required');
  if (swarmState.complianceProfiles.has(key)) return swarmState.complianceProfiles.get(key);
  const persisted = riskDb.getComplianceProfile(key);
  if (persisted) {
    swarmState.complianceProfiles.set(key, persisted);
    return persisted;
  }
  const profile = {
    playerId: key,
    kycStatus: 'pending',
    countryCode: 'UNSPECIFIED',
    amlRiskLevel: 'low',
    banned: false,
    notes: '',
    updatedAt: nowIso(),
  };
  swarmState.complianceProfiles.set(key, profile);
  riskDb.upsertComplianceProfile(profile);
  return profile;
}

function sanitizeComplianceUpdate(input) {
  const out = {};
  if (input.kycStatus != null) {
    const status = String(input.kycStatus).toLowerCase();
    if (!['pending', 'approved', 'rejected', 'review'].includes(status)) {
      throw new Error('Invalid kycStatus');
    }
    out.kycStatus = status;
  }
  if (input.countryCode != null) {
    const country = String(input.countryCode).trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(country)) throw new Error('Invalid countryCode');
    out.countryCode = country;
  }
  if (input.amlRiskLevel != null) {
    const level = String(input.amlRiskLevel).toLowerCase();
    if (!['low', 'medium', 'high'].includes(level)) throw new Error('Invalid amlRiskLevel');
    out.amlRiskLevel = level;
  }
  if (input.banned != null) out.banned = Boolean(input.banned);
  if (input.notes != null) out.notes = String(input.notes).slice(0, 500);
  return out;
}

function trackVelocity(playerId, amountUnits, action) {
  const cfg = complianceConfig();
  const nowMs = Date.now();
  const key = String(playerId || '').trim();
  riskDb.addVelocityEvent({
    id: `${key}:${nowMs}:${crypto.randomUUID().slice(0, 8)}`,
    playerId: key,
    tsMs: nowMs,
    amountUnits,
    action,
  });
  const windowStart = nowMs - cfg.velocityWindowMs;
  const period = riskDb.velocitySummary(key, windowStart);
  const dayWindowStart = nowMs - 24 * 60 * 60 * 1000;
  const daily = riskDb.velocitySummary(key, dayWindowStart);
  return {
    txCount: period.txCount,
    totalUnits: period.totalUnits,
    dailyTxCount: daily.txCount,
    dailyTotalUnits: daily.totalUnits,
    exceeded: period.txCount > cfg.velocityMaxTx || period.totalUnits > cfg.velocityMaxUnits,
  };
}

function evaluateCashierRisk(req, { playerId, amountUnits, action, source }) {
  const profile = getComplianceProfile(playerId);
  const cfg = complianceConfig();
  const amount = BigInt(amountUnits);
  const reasons = [];
  const blocked = profile.banned === true;
  if (blocked) reasons.push('ACCOUNT_BANNED');
  if (profile.kycStatus !== 'approved' && source === 'fiat-bridge') reasons.push('KYC_REQUIRED');
  if (cfg.blockedCountries.has(String(profile.countryCode || '').toUpperCase()))
    reasons.push('GEO_BLOCKED');
  if (
    cfg.allowedCountries.size > 0 &&
    !cfg.allowedCountries.has(String(profile.countryCode || '').toUpperCase())
  ) {
    reasons.push('GEO_NOT_ALLOWED');
  }
  if (amount >= cfg.amlSingleTxUnits) reasons.push('AML_SINGLE_TX_REVIEW');
  const velocity = trackVelocity(playerId, amount, action);
  if (velocity.exceeded) reasons.push('VELOCITY_EXCEEDED');
  if (velocity.dailyTotalUnits >= cfg.amlDailyUnits) reasons.push('AML_DAILY_REVIEW');
  if (profile.amlRiskLevel === 'high') reasons.push('AML_HIGH_RISK_REVIEW');
  const allowed = reasons.every(
    (r) =>
      ![
        'ACCOUNT_BANNED',
        'KYC_REQUIRED',
        'GEO_BLOCKED',
        'GEO_NOT_ALLOWED',
        'VELOCITY_EXCEEDED',
      ].includes(r)
  );
  if (reasons.length > 0) {
    addRiskAlert({
      type: 'cashier-risk',
      playerId,
      action,
      source,
      amountUnits: amount.toString(),
      reasons,
      ip: getIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
    });
  }
  return { allowed, reasons, velocity, profile };
}

async function handleCreateSession(req, res) {
  const body = await readBodyJson(req);
  const playerName = sanitizeName(body.playerName);
  const clientSeed = String(body.clientSeed || randomSeedHex(16)).slice(0, 64);
  const tableId = sanitizeTable(body.tableId || 'lobby-1');

  const id = crypto.randomUUID();
  const serverSeed = randomSeedHex(32);
  const createdAt = nowIso();
  const session = {
    id,
    playerName,
    bankroll: 1000,
    rounds: 0,
    wins: 0,
    losses: 0,
    clientSeed,
    serverSeed,
    serverSeedHash: sha256Hex(serverSeed),
    nonce: 1,
    tableId,
    ledger: [],
    createdAt,
    updatedAt: createdAt,
  };

  state.sessions[id] = session;
  publishTableEvent(tableId, {
    type: 'join',
    tableId,
    playerName,
    ts: createdAt,
  });
  persistState();

  writeJson(res, 201, { ok: true, session: sessionSummary(session) });
}

async function handleSetProfile(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  session.playerName = sanitizeName(body.playerName || session.playerName);
  if (body.tableId) {
    session.tableId = sanitizeTable(body.tableId);
  }
  session.updatedAt = nowIso();
  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

async function handleSetClientSeed(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');
  const clientSeed = String(body.clientSeed || '').trim();
  if (clientSeed.length < 4 || clientSeed.length > 64) {
    return badRequest(res, 'clientSeed must be 4-64 chars');
  }

  session.clientSeed = clientSeed;
  session.nonce = 1;
  session.updatedAt = nowIso();
  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

async function handleResetSession(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  session.bankroll = 1000;
  session.rounds = 0;
  session.wins = 0;
  session.losses = 0;
  session.nonce = 1;
  session.serverSeed = randomSeedHex(32);
  session.serverSeedHash = sha256Hex(session.serverSeed);
  session.ledger = [];
  session.updatedAt = nowIso();

  publishTableEvent(session.tableId, {
    type: 'reset',
    tableId: session.tableId,
    playerName: session.playerName,
    ts: session.updatedAt,
  });

  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

function parsePlayOptions(game, options) {
  // Poker-only mode: roulette options parser intentionally disabled.
  // if (game !== 'roulette') return {};
  // ...
  return {};
}

async function handlePlay(req, res) {
  metrics.playRequestsTotal += 1;
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  const game = String(body.game || '').toLowerCase();
  if (!['poker'].includes(game)) {
    return badRequest(res, 'Invalid game');
  }

  let bet = Number(body.bet);
  if (!Number.isFinite(bet)) return badRequest(res, 'Invalid bet');
  bet = Math.floor(bet);
  if (bet < 1) return badRequest(res, 'Bet must be >= 1');
  if (bet > session.bankroll) return badRequest(res, 'Insufficient bankroll');

  const engine = await enginePromise;
  const options = parsePlayOptions(game, body.options || {});
  const seedText = `${session.serverSeed}:${session.clientSeed}:${session.nonce}:${game}`;
  const rng = engine.createRng(seedText);

  let round;
  if (game === 'poker') round = engine.playPokerRound(rng, bet);
  // Poker-only mode: non-poker round engines intentionally disabled.
  // else if (game === 'blackjack') round = engine.playBlackjackRound(rng, bet);
  // else if (game === 'roulette') round = engine.playRouletteRound(rng, bet, options.type, options.number);
  // else round = engine.playSlotsRound(rng, bet);

  const receipt = await engine.fairReceipt({
    serverSeed: session.serverSeed,
    clientSeed: session.clientSeed,
    nonce: session.nonce,
    game,
    bet,
    options,
  });

  const delta = round.payout - bet;
  session.rounds += 1;
  if (round.win) session.wins += 1;
  else session.losses += 1;
  session.bankroll = session.bankroll - bet + round.payout;
  session.nonce += 1;
  session.updatedAt = nowIso();

  const cfg = chainConfig();
  let onchain = null;
  let onchainVerification = null;
  if (body.onchain && typeof body.onchain === 'object') {
    const txHash = String(body.onchain.txHash || '');
    const account = String(body.onchain.account || '');
    if (/^0x[a-fA-F0-9]{64}$/.test(txHash) && /^0x[a-fA-F0-9]{40}$/.test(account)) {
      onchain = {
        txHash,
        account,
        chainId: Number(body.onchain.chainId || 0),
        tokenAmountRaw: String(body.onchain.tokenAmountRaw || ''),
        submittedAt: String(body.onchain.submittedAt || nowIso()),
      };

      onchainVerification = await verifyOnchainSettlement(onchain, cfg);
    } else {
      metrics.onchainVerifyFail += 1;
      metrics.playFailuresTotal += 1;
      return badRequest(res, 'Invalid onchain payload');
    }
  }

  const ledgerRow = {
    id: crypto.randomUUID(),
    ts: session.updatedAt,
    game,
    bet,
    payout: round.payout,
    delta,
    bankroll: session.bankroll,
    receipt,
    detail: round.detail,
    onchain,
    onchainVerification,
  };
  pushLedger(session, ledgerRow);

  publishTableEvent(session.tableId, {
    type: 'round',
    ts: session.updatedAt,
    tableId: session.tableId,
    playerName: session.playerName,
    game,
    bet,
    payout: round.payout,
    delta,
    bankroll: session.bankroll,
  });

  persistState();
  writeJson(res, 200, {
    ok: true,
    session: sessionSummary(session),
    round: {
      game,
      bet,
      payout: round.payout,
      delta,
      win: round.win,
      detail: round.detail,
      receipt,
      onchain,
      onchainVerification,
    },
  });
}

async function handleRevealRotate(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  const previousSeed = session.serverSeed;
  const previousHash = session.serverSeedHash;
  session.serverSeed = randomSeedHex(32);
  session.serverSeedHash = sha256Hex(session.serverSeed);
  session.nonce = 1;
  session.updatedAt = nowIso();
  persistState();

  writeJson(res, 200, {
    ok: true,
    reveal: {
      previousServerSeed: previousSeed,
      previousServerSeedHash: previousHash,
      nextServerSeedHash: session.serverSeedHash,
    },
    session: sessionSummary(session),
  });
}

async function handleFairVerify(req, res) {
  const body = await readBodyJson(req);
  const serverSeed = String(body.serverSeed || '').trim();
  const clientSeed = String(body.clientSeed || '').trim();
  const game = String(body.game || '')
    .trim()
    .toLowerCase();
  const nonce = Number(body.nonce);
  const bet = Number(body.bet);
  const options = body.options && typeof body.options === 'object' ? body.options : {};
  const expectedDigest = String(body.receiptDigest || '')
    .trim()
    .toLowerCase();

  if (!serverSeed) return badRequest(res, 'serverSeed is required');
  if (!clientSeed) return badRequest(res, 'clientSeed is required');
  if (!['poker'].includes(game)) return badRequest(res, 'Invalid game');
  if (!Number.isFinite(nonce) || nonce < 1) return badRequest(res, 'Invalid nonce');
  if (!Number.isFinite(bet) || bet < 1) return badRequest(res, 'Invalid bet');

  const fairness = await fairnessPromise;
  const out = fairness.verifyReceipt({
    serverSeed,
    clientSeed,
    nonce: Math.floor(nonce),
    game,
    bet: Math.floor(bet),
    options,
    receiptDigest: expectedDigest || undefined,
  });
  writeJson(res, 200, { ok: true, verified: out.verified, receipt: out.receipt });
}

async function handleFairCommit(req, res) {
  const body = await readBodyJson(req);
  const sessionId = String(body.sessionId || '').trim();
  if (!sessionId) return badRequest(res, 'sessionId is required');
  const fairness = await fairnessPromise;
  const commit = fairness.createCommit({ sessionId });
  swarmState.fairnessCommits.set(sessionId, commit);
  writeJson(res, 201, {
    ok: true,
    commit: {
      sessionId: commit.sessionId,
      serverSeedHash: commit.serverSeedHash,
      nonce: commit.nonce,
      createdAt: commit.createdAt,
    },
  });
}

async function handleFairRotate(req, res) {
  const body = await readBodyJson(req);
  const sessionId = String(body.sessionId || '').trim();
  if (!sessionId) return badRequest(res, 'sessionId is required');
  const current = swarmState.fairnessCommits.get(sessionId);
  if (!current) return badRequest(res, 'No fairness commit found for sessionId');
  const fairness = await fairnessPromise;
  const rotated = fairness.rotateCommit(current);
  swarmState.fairnessCommits.set(sessionId, rotated.next);
  writeJson(res, 200, {
    ok: true,
    reveal: rotated.reveal,
    next: {
      sessionId: rotated.next.sessionId,
      serverSeedHash: rotated.next.serverSeedHash,
      nonce: rotated.next.nonce,
      createdAt: rotated.next.createdAt,
    },
  });
}

async function handleAgentRegister(req, res) {
  const body = await readBodyJson(req);
  const registry = await getAgentRegistry();
  const out = registry.registerAgent({
    agentId: String(body.agentId || '').trim(),
    ownerId: String(body.ownerId || '').trim(),
    tier: body.tier,
    style: body.style,
  });
  writeJson(res, 201, { ok: true, agent: out });
}

async function handleAgentConfigureStyle(req, res) {
  const body = await readBodyJson(req);
  const registry = await getAgentRegistry();
  const out = registry.configureStyle(
    String(body.agentId || '').trim(),
    String(body.style || '').trim(),
    body.overrides && typeof body.overrides === 'object' ? body.overrides : {}
  );
  writeJson(res, 200, { ok: true, agent: out });
}

async function handleAgentConfigureRisk(req, res) {
  const body = await readBodyJson(req);
  const registry = await getAgentRegistry();
  const out = registry.configureRisk(
    String(body.agentId || '').trim(),
    body.risk && typeof body.risk === 'object' ? body.risk : {}
  );
  writeJson(res, 200, { ok: true, agent: out });
}

async function handleAgentPolicyCheck(req, res) {
  const body = await readBodyJson(req);
  const registry = await getAgentRegistry();
  const out = registry.evaluateActionPolicy(String(body.agentId || '').trim(), {
    action: String(body.action || '').trim(),
    amountUnits: body.amountUnits ?? 0,
    bankrollUnits: body.bankrollUnits ?? 0,
  });
  writeJson(res, 200, { ok: true, policy: out });
}

async function handleStrategyProfile(req, res) {
  const body = await readBodyJson(req);
  const mod = await agentStrategyPromise;
  const profile = mod.buildStrategyProfile({
    agentId: String(body.agentId || '').trim(),
    temperament: body.temperament,
    maxRiskBps: Number(body.maxRiskBps ?? 800),
  });
  swarmState.agentStrategies.set(profile.agentId, profile);
  writeJson(res, 201, { ok: true, profile });
}

async function handleStrategyDecide(req, res) {
  const body = await readBodyJson(req);
  const mod = await agentStrategyPromise;
  const registry = await getAgentRegistry();
  const agentId = String(body.agentId || '').trim();
  let profile = swarmState.agentStrategies.get(agentId);
  if (!profile) {
    profile = mod.buildStrategyProfile({
      agentId,
      temperament: body.temperament || mod.TEMPERAMENTS.BALANCED,
      maxRiskBps: Number(body.maxRiskBps ?? 800),
    });
    swarmState.agentStrategies.set(agentId, profile);
  }

  const legalActions = Array.isArray(body.legalActions)
    ? body.legalActions
    : ['fold', 'check', 'call', 'raise'];
  const decision = mod.chooseAction({
    profile,
    legalActions,
    handStrength: Number(body.handStrength ?? 0.5),
    potUnits: Number(body.potUnits ?? 0),
    toCallUnits: Number(body.toCallUnits ?? 0),
  });
  const capped = mod.enforceRiskCap({
    actionDecision: decision,
    bankrollUnits: BigInt(String(body.bankrollUnits ?? 0)),
    maxRiskBps: Number(body.maxRiskBps ?? profile.maxRiskBps ?? 800),
  });

  const policy = registry.evaluateActionPolicy(agentId, {
    action: capped.action,
    amountUnits: BigInt(capped.amountUnits || 0),
    bankrollUnits: BigInt(String(body.bankrollUnits ?? 0)),
  });
  trackTraitObservation(agentId, capped.action);

  writeJson(res, 200, {
    ok: true,
    profile,
    decision: capped,
    policy,
    executable: policy.allowed === true,
  });
}

async function applyStrategyTraitRecommendation(body, forcedProvider = null) {
  const startMs = Date.now();
  metrics.traitCraftAttempts += 1;
  const schema = await traitPayloadSchemaPromise;
  const normalized = schema.normalizeTraitCraftPayload({
    ...body,
    provider: forcedProvider || body.provider || 'texassolver',
  });
  if (swarmState.traitPolicy.freeze) {
    throw new Error('Trait policy is frozen');
  }
  if (!enforceTraitRateLimit(normalized.agentId)) {
    throw new Error('Trait craft rate limit exceeded');
  }
  const signature = verifyTraitSignature(normalized);
  const artifactId = String(
    normalized.provenance?.artifactId ||
      `${normalized.provider}:${normalized.provenance?.commitSha || 'local'}:${normalized.agentId}`
  );
  if (swarmState.traitPolicy.revokedArtifactIds.has(artifactId)) {
    throw new Error('Trait artifact has been revoked');
  }
  const agentId = normalized.agentId;
  const provider = normalized.provider;

  const traits = await traitProvidersPromise;
  const strategy = await agentStrategyPromise;
  const recommendation = traits.craftTraitsFromProvider({
    provider,
    agentId,
    solverDump: normalized.solverDump,
    nodePath: normalized.nodePath,
    comboWeights: normalized.comboWeights,
    cfrProfile: normalized.cfrProfile,
    riskProfile: normalized.riskProfile,
    context: normalized.context,
  });

  let profile = null;
  if (normalized.createProfile !== false) {
    const complianceCap = applyComplianceTraitRiskCaps(
      agentId,
      normalized.ownerId || agentId,
      Number(
        normalized.maxRiskBps == null
          ? recommendation.recommended.maxRiskBps
          : normalized.maxRiskBps
      )
    );
    profile = strategy.buildStrategyProfile({
      agentId,
      temperament: recommendation.recommended.temperament,
      maxRiskBps: complianceCap.maxRiskBps,
    });
    recommendation.complianceCap = complianceCap;
    recommendation.recommended.maxRiskBps = complianceCap.maxRiskBps;
    swarmState.agentStrategies.set(agentId, profile);
  }

  let agent = null;
  if (normalized.applyToAgent === true) {
    const registry = await getAgentRegistry();
    const hasAgent = registry.agents.has(agentId);
    if (!hasAgent && normalized.autoRegister !== true) {
      throw new Error('Agent not found; set autoRegister=true or register first');
    }
    if (!hasAgent) {
      registry.registerAgent({
        agentId,
        ownerId: normalized.ownerId || 'solver-owned',
        tier: normalized.tier || 'B',
        style: recommendation.recommended.style,
      });
    }
    agent = registry.configureStyle(
      agentId,
      recommendation.recommended.style,
      recommendation.recommended.styleOverrides
    );
  }

  const lineage = {
    traitVersion: `v${normalized.payloadVersion}`,
    provider,
    generatedAt: nowIso(),
    sourceProvenance: normalized.provenance || null,
    signature,
    serverBuildRef: process.env.GITHUB_SHA || 'local',
    seed: String(normalized.provenance?.seed || ''),
    artifactId,
  };
  recommendation.lineage = lineage;
  swarmState.traitLastRecommendation.set(agentId, recommendation);
  riskDb.upsertTraitRecommendation({ agentId, ...recommendation });
  pushTraitPolicyEvent({
    type: 'trait.applied',
    agentId,
    provider,
    artifactId,
    signatureVerified: signature.verified === true,
  });
  metrics.traitCraftSuccess += 1;
  metrics.traitCraftLatencyMsTotal += Math.max(0, Date.now() - startMs);
  return { provider, recommendation, profile, agent };
}

async function handleStrategyTraitsCraft(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  try {
    const out = await applyStrategyTraitRecommendation(body, null);
    writeJson(res, 200, {
      ok: true,
      provider: out.provider,
      recommendation: out.recommendation,
      profile: out.profile,
      agent: out.agent,
    });
  } catch (err) {
    metrics.traitCraftFail += 1;
    badRequest(res, String(err?.message || 'Unable to craft strategy traits'));
  }
}

async function handleStrategyTraitsTexasSolver(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  try {
    const out = await applyStrategyTraitRecommendation(body, 'texassolver');
    writeJson(res, 200, {
      ok: true,
      recommendation: out.recommendation,
      profile: out.profile,
      agent: out.agent,
    });
  } catch (err) {
    metrics.traitCraftFail += 1;
    badRequest(res, String(err?.message || 'Unable to craft TexasSolver traits'));
  }
}

async function handleStrategyTraitsRollout(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const rolloutId = String(body.rolloutId || crypto.randomUUID()).trim();
  const agentIds = Array.isArray(body.agentIds)
    ? body.agentIds.map((x) => String(x || '').trim()).filter(Boolean)
    : [];
  if (agentIds.length === 0) return badRequest(res, 'agentIds is required');
  const canaryPercent = Math.max(1, Math.min(100, Number(body.canaryPercent ?? 10)));
  const canarySize = Math.max(1, Math.ceil((agentIds.length * canaryPercent) / 100));
  const canaryAgents = agentIds.slice(0, canarySize);
  const rollout = {
    rolloutId,
    createdAt: nowIso(),
    status: 'canary',
    canaryPercent,
    canaryAgents,
    allAgents: agentIds,
    rollback:
      body.rollback && typeof body.rollback === 'object'
        ? {
            maxLossBps: Number(body.rollback.maxLossBps ?? 500),
            maxVolatilityBps: Number(body.rollback.maxVolatilityBps ?? 2200),
            maxFairnessAlerts: Number(body.rollback.maxFairnessAlerts ?? 3),
          }
        : { maxLossBps: 500, maxVolatilityBps: 2200, maxFairnessAlerts: 3 },
    telemetry: [],
  };
  swarmState.traitRollouts.set(rolloutId, rollout);
  riskDb.upsertTraitRollout(rollout);
  pushTraitPolicyEvent({ type: 'rollout.created', rolloutId, canaryPercent, canarySize });
  writeJson(res, 201, { ok: true, rollout });
}

async function handleStrategyTraitsRolloutEvaluate(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const rolloutId = String(body.rolloutId || '').trim();
  const rollout = swarmState.traitRollouts.get(rolloutId);
  if (!rollout) return badRequest(res, 'Unknown rolloutId');
  const telemetry = body.telemetry && typeof body.telemetry === 'object' ? body.telemetry : {};
  const point = {
    ts: nowIso(),
    lossBps: Number(telemetry.lossBps ?? 0),
    volatilityBps: Number(telemetry.volatilityBps ?? 0),
    fairnessAlerts: Number(telemetry.fairnessAlerts ?? 0),
  };
  rollout.telemetry.push(point);
  let rollback = false;
  if (point.lossBps > rollout.rollback.maxLossBps) rollback = true;
  if (point.volatilityBps > rollout.rollback.maxVolatilityBps) rollback = true;
  if (point.fairnessAlerts > rollout.rollback.maxFairnessAlerts) rollback = true;
  rollout.status = rollback ? 'rolled_back' : 'canary_passed';
  rollout.lastEvaluationAt = nowIso();
  riskDb.upsertTraitRollout(rollout);
  pushTraitPolicyEvent({
    type: rollback ? 'rollout.rolled_back' : 'rollout.canary_passed',
    rolloutId,
  });
  writeJson(res, 200, { ok: true, rollout, rollback });
}

async function handleStrategyTraitsRolloutState(req, res, urlObj) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const rolloutId = String(urlObj.searchParams.get('rolloutId') || '').trim();
  if (!rolloutId) return badRequest(res, 'rolloutId is required');
  const rollout = swarmState.traitRollouts.get(rolloutId) || riskDb.getTraitRollout(rolloutId);
  if (!rollout) return badRequest(res, 'Unknown rolloutId');
  writeJson(res, 200, { ok: true, rollout });
}

async function handleStrategyTraitsRolloutEvaluateLive(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const rolloutId = String(body.rolloutId || '').trim();
  const rollout = swarmState.traitRollouts.get(rolloutId) || riskDb.getTraitRollout(rolloutId);
  if (!rollout) return badRequest(res, 'Unknown rolloutId');
  const windowMinutes = Math.max(1, Number(body.windowMinutes ?? 60));
  const sinceTs = Date.now() - windowMinutes * 60_000;
  const alerts = riskDb
    .listRiskAlerts(2000)
    .filter((x) => new Date(String(x?.ts || 0)).getTime() >= sinceTs)
    .filter((x) => rollout.canaryAgents.includes(String(x?.playerId || x?.subjectId || '')));
  const fairnessAlerts = alerts.filter((x) => String(x?.type || '').includes('fair')).length;
  const telemetry = {
    lossBps: Number(body.lossBps ?? 0),
    volatilityBps: Number(body.volatilityBps ?? 0),
    fairnessAlerts,
  };
  const point = {
    ts: nowIso(),
    lossBps: Number(telemetry.lossBps ?? 0),
    volatilityBps: Number(telemetry.volatilityBps ?? 0),
    fairnessAlerts: Number(telemetry.fairnessAlerts ?? 0),
  };
  rollout.telemetry.push(point);
  let rollback = false;
  if (point.lossBps > rollout.rollback.maxLossBps) rollback = true;
  if (point.volatilityBps > rollout.rollback.maxVolatilityBps) rollback = true;
  if (point.fairnessAlerts > rollout.rollback.maxFairnessAlerts) rollback = true;
  rollout.status = rollback ? 'rolled_back' : 'canary_passed';
  rollout.lastEvaluationAt = nowIso();
  riskDb.upsertTraitRollout(rollout);
  pushTraitPolicyEvent({
    type: rollback ? 'rollout.rolled_back.live' : 'rollout.canary_passed.live',
    rolloutId,
    windowMinutes,
  });
  writeJson(res, 200, { ok: true, rollout, rollback, live: { windowMinutes, fairnessAlerts } });
}

async function handleStrategyTraitsDrift(req, res, urlObj) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const agentId = String(urlObj.searchParams.get('agentId') || '').trim();
  if (!agentId) return badRequest(res, 'agentId is required');
  const drift = computeTraitDrift(agentId);
  if (!drift) return badRequest(res, 'No drift signal available for agent');
  writeJson(res, 200, { ok: true, drift });
}

async function handleStrategyTraitsDashboard(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const rollouts = [...swarmState.traitRollouts.values()]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 30);
  const drifts = [...swarmState.traitLastRecommendation.keys()]
    .map((agentId) => computeTraitDrift(agentId))
    .filter(Boolean)
    .sort((a, b) => Number(b.driftBps || 0) - Number(a.driftBps || 0))
    .slice(0, 20);
  writeJson(res, 200, {
    ok: true,
    freeze: swarmState.traitPolicy.freeze,
    revokedArtifacts: swarmState.traitPolicy.revokedArtifactIds.size,
    rollouts,
    topDrifts: drifts,
    slo: {
      attempts: metrics.traitCraftAttempts,
      failures: metrics.traitCraftFail,
      successRate:
        metrics.traitCraftAttempts > 0
          ? Number((metrics.traitCraftSuccess / metrics.traitCraftAttempts).toFixed(4))
          : 1,
    },
  });
}

async function handleStrategyTraitsFreeze(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const freeze = body.freeze !== false;
  swarmState.traitPolicy.freeze = freeze;
  pushTraitPolicyEvent({ type: freeze ? 'policy.freeze' : 'policy.unfreeze' });
  writeJson(res, 200, { ok: true, freeze });
}

async function handleStrategyTraitsArtifactRevoke(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const artifactId = String(body.artifactId || '').trim();
  if (!artifactId) return badRequest(res, 'artifactId is required');
  swarmState.traitPolicy.revokedArtifactIds.add(artifactId);
  pushTraitPolicyEvent({ type: 'artifact.revoked', artifactId });
  writeJson(res, 200, { ok: true, artifactId, revoked: true });
}

async function handleStrategyTraitsSlo(req, res) {
  const auth = requireRoles(req, res, ['poker']);
  if (!auth.ok) return;
  const successRate =
    metrics.traitCraftAttempts > 0 ? metrics.traitCraftSuccess / metrics.traitCraftAttempts : 1;
  const p50LatencyApprox =
    metrics.traitCraftSuccess > 0
      ? metrics.traitCraftLatencyMsTotal / metrics.traitCraftSuccess
      : 0;
  const status =
    successRate >= 0.99 && p50LatencyApprox <= 400
      ? 'healthy'
      : successRate >= 0.95
        ? 'degraded'
        : 'unhealthy';
  writeJson(res, 200, {
    ok: true,
    status,
    slo: {
      successRate: Number(successRate.toFixed(4)),
      latencyMsAvg: Number(p50LatencyApprox.toFixed(2)),
      attempts: metrics.traitCraftAttempts,
      failures: metrics.traitCraftFail,
    },
  });
}

async function handleSimEquity(req, res) {
  const body = await readBodyJson(req);
  const sim = await engineSimPromise;
  const players = Array.isArray(body.players) ? body.players : [];
  if (players.length < 2) return badRequest(res, 'players must contain at least 2 entries');
  const out = sim.runMonteCarloEquity({
    seed: String(body.seed || randomSeedHex(12)),
    players: players.map((p) => ({ playerId: String(p.playerId || '').trim() })),
    boardCards: Array.isArray(body.boardCards) ? body.boardCards : [],
    iterations: Number(body.iterations ?? 2000),
  });
  writeJson(res, 200, { ok: true, simulation: out });
}

async function handleAgentNurtureInit(req, res) {
  const body = await readBodyJson(req);
  const mod = await agentNurturePromise;
  const agentId = String(body.agentId || '').trim();
  if (!agentId) return badRequest(res, 'agentId is required');
  const ownerId = String(body.ownerId || '').trim() || 'owner-main';

  const current = swarmState.nurturePrograms.get(agentId);
  if (current) {
    return writeJson(res, 200, { ok: true, existed: true, program: mod.getProgramState(current) });
  }

  const program = mod.createNurtureProgram({
    agentId,
    ownerId,
    objective: String(body.objective || 'cash_nlhe_6max'),
    targetBbps: Number(body.targetBbps ?? 2.0),
    distributed: body.distributed === true,
    cluster: body.cluster === true,
  });
  swarmState.nurturePrograms.set(agentId, program);
  writeJson(res, 201, { ok: true, existed: false, program: mod.getProgramState(program) });
}

async function handleAgentNurtureEpisode(req, res) {
  const body = await readBodyJson(req);
  const mod = await agentNurturePromise;
  const agentId = String(body.agentId || '').trim();
  const program = swarmState.nurturePrograms.get(agentId);
  if (!program) return badRequest(res, 'Unknown agent nurture program');

  const episode = mod.recordEpisode(program, {
    bb100: Number(body.bb100),
    exploitabilityProxy: Number(body.exploitabilityProxy ?? 100),
    policyEntropy: Number(body.policyEntropy ?? 0.5),
    showdownErrorRateBps: Number(body.showdownErrorRateBps ?? 0),
    decisionLatencyMsP95: Number(body.decisionLatencyMsP95 ?? 250),
    legalActionViolationBps: Number(body.legalActionViolationBps ?? 0),
    bankrollVolatilityBps: Number(body.bankrollVolatilityBps ?? 1200),
    source: String(body.source || 'self_play'),
  });

  let evaluation = null;
  if (body.autoEvaluate !== false) {
    evaluation = mod.evaluateProgram(program);
  }

  writeJson(res, 200, {
    ok: true,
    episode,
    evaluation,
    coachCard: mod.buildCoachCard(program),
  });
}

async function handleAgentNurtureEvaluate(req, res) {
  const body = await readBodyJson(req);
  const mod = await agentNurturePromise;
  const agentId = String(body.agentId || '').trim();
  const program = swarmState.nurturePrograms.get(agentId);
  if (!program) return badRequest(res, 'Unknown agent nurture program');

  if (body.trainingProfilePatch && typeof body.trainingProfilePatch === 'object') {
    mod.updateTrainingProfile(program, body.trainingProfilePatch);
  }

  const evaluation = mod.evaluateProgram(program);
  writeJson(res, 200, { ok: true, evaluation, coachCard: mod.buildCoachCard(program) });
}

async function handleAgentNurtureState(req, res, urlObj) {
  const mod = await agentNurturePromise;
  const agentId = String(urlObj.searchParams.get('agentId') || '').trim();
  const program = swarmState.nurturePrograms.get(agentId);
  if (!program) return badRequest(res, 'Unknown agent nurture program');
  writeJson(res, 200, {
    ok: true,
    program: mod.getProgramState(program),
    coachCard: mod.buildCoachCard(program),
  });
}

function loadSponsorshipPosition(positionId) {
  const key = String(positionId || '').trim();
  if (!key) return null;
  if (swarmState.sponsorshipPositions.has(key)) return swarmState.sponsorshipPositions.get(key);
  const persisted = riskDb.getSponsorshipPosition(key);
  if (persisted) {
    swarmState.sponsorshipPositions.set(key, persisted);
    return persisted;
  }
  return null;
}

function persistSponsorshipPosition(position) {
  if (!position || !position.positionId) return;
  if (!position.createdAt) position.createdAt = nowIso();
  position.updatedAt = nowIso();
  swarmState.sponsorshipPositions.set(String(position.positionId), position);
  riskDb.upsertSponsorshipPosition(position);
}

async function evaluateFundingAbuse(req, { position, sponsorId, principalUnits }) {
  const nowMs = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const key = `${String(position.positionId)}::${String(sponsorId)}`;
  const existing = swarmState.fundingAttempts.get(key) ||
    riskDb.getFundingAttempt(key) || {
      id: key,
      positionId: String(position.positionId),
      sponsorId: String(sponsorId),
      lastAttemptMs: 0,
      dayStartMs: nowMs,
      dayCount: 0,
      dayTotalPrincipalUnits: '0',
    };
  if (nowMs - Number(existing.dayStartMs || 0) > oneDayMs) {
    existing.dayStartMs = nowMs;
    existing.dayCount = 0;
    existing.dayTotalPrincipalUnits = '0';
  }
  const dayTotal = BigInt(String(existing.dayTotalPrincipalUnits || '0')) + BigInt(principalUnits);
  const nextCount = Number(existing.dayCount || 0) + 1;
  const reasons = [];
  if (nowMs - Number(existing.lastAttemptMs || 0) < 4000) reasons.push('FUNDING_SPAM_COOLDOWN');
  if (nextCount > 25) reasons.push('FUNDING_DAILY_COUNT_LIMIT');
  if (dayTotal > 2_000_000n) reasons.push('FUNDING_DAILY_VOLUME_LIMIT');

  const registry = await getAgentRegistry();
  const ownerId = registry.agents?.get?.(String(position.agentId || ''))?.ownerId || '';
  if (ownerId && String(ownerId) === String(sponsorId)) reasons.push('WASH_SPONSORING_BLOCKED');

  existing.lastAttemptMs = nowMs;
  existing.dayCount = nextCount;
  existing.dayTotalPrincipalUnits = dayTotal.toString();
  swarmState.fundingAttempts.set(key, existing);
  riskDb.upsertFundingAttempt(existing);

  if (reasons.length > 0) {
    addRiskAlert({
      type: 'sponsorship-funding-abuse',
      positionId: String(position.positionId),
      sponsorId: String(sponsorId),
      principalUnits: String(principalUnits),
      reasons,
      ip: getIp(req),
    });
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    counters: {
      dayCount: nextCount,
      dayTotalPrincipalUnits: dayTotal.toString(),
    },
  };
}

async function handleSponsorshipOpen(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const positionId = String(body.positionId || crypto.randomUUID()).trim();
  const position = mod.openPosition({
    positionId,
    agentId: String(body.agentId || '').trim(),
    stakeForSaleBps: Number(body.stakeForSaleBps ?? 7000),
    markupBps: Number(body.markupBps ?? 10000),
    maxExposureUnits: parseBigIntInput(body.maxExposureUnits ?? '0', 'maxExposureUnits', 0n),
  });
  persistSponsorshipPosition(position);
  writeJson(res, 201, { ok: true, position: mod.getPositionView(position) });
}

async function handleSponsorshipFund(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const positionId = String(body.positionId || '').trim();
  const position = loadSponsorshipPosition(positionId);
  if (!position) return badRequest(res, 'Unknown positionId');
  const sponsorId = String(body.sponsorId || '').trim();
  const principalUnits = parseBigIntInput(body.principalUnits, 'principalUnits', 1n);
  const abuse = await evaluateFundingAbuse(req, { position, sponsorId, principalUnits });
  if (!abuse.allowed) {
    return writeJson(res, 429, {
      ok: false,
      error: 'Funding blocked by abuse controls',
      reasons: abuse.reasons,
      abuse,
    });
  }
  const out = mod.fundPosition(position, {
    sponsorId,
    principalUnits,
  });
  persistSponsorshipPosition(position);
  writeJson(res, 200, { ok: true, funding: out, position: mod.getPositionView(position), abuse });
}

async function handleSponsorshipClose(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const position = loadSponsorshipPosition(String(body.positionId || '').trim());
  if (!position) return badRequest(res, 'Unknown positionId');
  const out = mod.closeFunding(position);
  persistSponsorshipPosition(position);
  writeJson(res, 200, { ok: true, close: out, position: mod.getPositionView(position) });
}

async function handleSponsorshipSettle(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const position = loadSponsorshipPosition(String(body.positionId || '').trim());
  if (!position) return badRequest(res, 'Unknown positionId');
  const out = mod.settleEvent(position, {
    eventId: String(body.eventId || crypto.randomUUID()),
    buyInUnits: parseBigIntInput(body.buyInUnits, 'buyInUnits', 0n),
    prizeUnits: parseBigIntInput(body.prizeUnits, 'prizeUnits', 0n),
    rakeUnits: parseBigIntInput(body.rakeUnits ?? '0', 'rakeUnits', 0n),
  });
  persistSponsorshipPosition(position);
  writeJson(res, 200, { ok: true, settlement: out, position: mod.getPositionView(position) });
}

async function handleSponsorshipClaim(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const position = loadSponsorshipPosition(String(body.positionId || '').trim());
  if (!position) return badRequest(res, 'Unknown positionId');

  const sponsorId = String(body.sponsorId || '').trim();
  if (!sponsorId) return badRequest(res, 'sponsorId is required');

  const claim = mod.claimSponsor(position, {
    sponsorId,
    amountUnits:
      body.amountUnits != null ? parseBigIntInput(body.amountUnits, 'amountUnits', 1n) : null,
  });

  let cashierCredit = null;
  if (body.creditToCashier === true) {
    const ledger = await getOrCreateCashier(String(body.ledgerId || 'default'));
    const playerId = String(body.playerId || sponsorId).trim();
    cashierCredit = ledger.applyDeposit({
      playerId,
      amountUnits: claim.claimedUnits,
      idempotencyKey: String(body.idempotencyKey || crypto.randomUUID()),
      source: 'sponsorship-claim',
    });
  }
  persistSponsorshipPosition(position);

  writeJson(res, 200, {
    ok: true,
    claim,
    cashierCredit,
    position: mod.getPositionView(position),
  });
}

async function handleSponsorshipView(req, res, urlObj) {
  const mod = await sponsorshipPromise;
  const position = loadSponsorshipPosition(
    String(urlObj.searchParams.get('positionId') || '').trim()
  );
  if (!position) return badRequest(res, 'Unknown positionId');
  writeJson(res, 200, { ok: true, position: mod.getPositionView(position), raw: position });
}

async function handleSponsorshipHistory(req, res, urlObj) {
  const mod = await sponsorshipPromise;
  const position = loadSponsorshipPosition(
    String(urlObj.searchParams.get('positionId') || '').trim()
  );
  if (!position) return badRequest(res, 'Unknown positionId');
  writeJson(res, 200, {
    ok: true,
    position: mod.getPositionView(position),
    settlements: position.settlements || [],
    sponsors: Object.values(position.sponsors || {}),
  });
}

async function handleSponsorshipMarketplace(req, res, urlObj) {
  const mod = await sponsorshipPromise;
  const status = String(urlObj.searchParams.get('status') || '')
    .trim()
    .toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(urlObj.searchParams.get('limit') || 50)));
  const all = riskDb.listSponsorshipPositions();
  for (const row of all) {
    if (row?.positionId && !swarmState.sponsorshipPositions.has(String(row.positionId))) {
      swarmState.sponsorshipPositions.set(String(row.positionId), row);
    }
  }
  let rows = Array.from(swarmState.sponsorshipPositions.values());
  if (status) rows = rows.filter((p) => String(p?.status || '').toLowerCase() === status);
  rows = rows
    .map((p) => ({
      ...mod.getPositionView(p),
      sponsorRows: Object.values(p?.sponsors || {}).length,
      updatedAt: p?.updatedAt || p?.createdAt || null,
    }))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, limit);
  writeJson(res, 200, { ok: true, positions: rows });
}

async function handleSponsorshipOneClickFund(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const positionId = String(body.positionId || '').trim();
  const sponsorId = String(body.sponsorId || '').trim();
  const principalUnits = parseBigIntInput(body.principalUnits, 'principalUnits', 1n);
  const position = loadSponsorshipPosition(positionId);
  if (!position) return badRequest(res, 'Unknown positionId');
  if (!sponsorId) return badRequest(res, 'sponsorId is required');

  const abuse = await evaluateFundingAbuse(req, { position, sponsorId, principalUnits });
  if (!abuse.allowed) {
    return writeJson(res, 429, {
      ok: false,
      error: 'Funding blocked by abuse controls',
      reasons: abuse.reasons,
      abuse,
    });
  }

  const ledger = await getOrCreateCashier(String(body.ledgerId || 'default'));
  const playerId = String(body.playerId || sponsorId).trim();
  const reserve = ledger.reserveBuyIn({
    playerId,
    amountUnits: principalUnits,
    idempotencyKey: String(
      body.idempotencyKey || `one-click:${positionId}:${sponsorId}:${Date.now()}`
    ),
    context: 'sponsorship-one-click-fund',
  });
  if (reserve.accepted !== true) {
    return writeJson(res, 409, {
      ok: false,
      error: 'Insufficient balance or duplicate reserve',
      reserve,
    });
  }
  const funding = mod.fundPosition(position, {
    sponsorId,
    principalUnits,
  });
  persistSponsorshipPosition(position);
  writeJson(res, 200, {
    ok: true,
    reserve,
    funding,
    abuse,
    position: mod.getPositionView(position),
  });
}

async function handleSponsorshipSponsorAnalytics(req, res, urlObj) {
  const sponsorId = String(urlObj.searchParams.get('sponsorId') || '').trim();
  if (!sponsorId) return badRequest(res, 'sponsorId is required');
  const all = riskDb.listSponsorshipPositions();
  for (const row of all) {
    if (row?.positionId && !swarmState.sponsorshipPositions.has(String(row.positionId))) {
      swarmState.sponsorshipPositions.set(String(row.positionId), row);
    }
  }
  const matched = [];
  let principal = 0n;
  let buyCost = 0n;
  let claimsAvailable = 0n;
  let claimsTotal = 0n;
  for (const position of swarmState.sponsorshipPositions.values()) {
    const sponsor = position?.sponsors?.[sponsorId];
    if (!sponsor) continue;
    principal += BigInt(String(sponsor.principalUnits || 0));
    buyCost += BigInt(String(sponsor.buyCostUnits || 0));
    claimsAvailable += BigInt(String(sponsor.claimsUnits || 0));
    claimsTotal += BigInt(String(sponsor.claimedTotalUnits || 0));
    matched.push({
      positionId: position.positionId,
      agentId: position.agentId,
      status: position.status,
      principalUnits: String(sponsor.principalUnits || 0),
      buyCostUnits: String(sponsor.buyCostUnits || 0),
      claimsUnits: String(sponsor.claimsUnits || 0),
      claimedTotalUnits: String(sponsor.claimedTotalUnits || 0),
      settlements: Array.isArray(position.settlements) ? position.settlements.length : 0,
    });
  }
  const grossReturn = claimsAvailable + claimsTotal;
  const pnl = grossReturn - buyCost;
  const roiBps = buyCost > 0n ? Number((pnl * 10000n) / buyCost) : 0;
  writeJson(res, 200, {
    ok: true,
    sponsorId,
    positions: matched,
    totals: {
      principalUnits: principal.toString(),
      buyCostUnits: buyCost.toString(),
      claimableUnits: claimsAvailable.toString(),
      claimedUnits: claimsTotal.toString(),
      grossReturnUnits: grossReturn.toString(),
      pnlUnits: pnl.toString(),
      roiBps,
    },
  });
}

async function handleSngCreate(req, res) {
  const body = await readBodyJson(req);
  const mod = await sngPromise;
  const sng = mod.createSng({
    tournamentId: String(body.tournamentId || crypto.randomUUID()).trim(),
    maxPlayers: Number(body.maxPlayers ?? 6),
    buyInUnits: parseBigIntInput(body.buyInUnits ?? '100', 'buyInUnits', 1n),
    startChips: Number(body.startChips ?? 1500),
  });
  swarmState.sngs.set(sng.tournamentId, sng);
  writeJson(res, 201, { ok: true, sng });
}

async function handleSngRegister(req, res) {
  const body = await readBodyJson(req);
  const mod = await sngPromise;
  const sng = swarmState.sngs.get(String(body.tournamentId || '').trim());
  if (!sng) return badRequest(res, 'Unknown tournamentId');
  const out = mod.registerPlayer(sng, { playerId: String(body.playerId || '').trim() });
  writeJson(res, 200, { ok: true, sng: out });
}

async function handleSngAdvance(req, res) {
  const body = await readBodyJson(req);
  const mod = await sngPromise;
  const sng = swarmState.sngs.get(String(body.tournamentId || '').trim());
  if (!sng) return badRequest(res, 'Unknown tournamentId');
  const level = mod.advanceBlindLevel(sng);
  writeJson(res, 200, { ok: true, level, sng });
}

async function handleSngEliminate(req, res) {
  const body = await readBodyJson(req);
  const mod = await sngPromise;
  const sng = swarmState.sngs.get(String(body.tournamentId || '').trim());
  if (!sng) return badRequest(res, 'Unknown tournamentId');
  const out = mod.eliminatePlayer(
    sng,
    String(body.playerId || '').trim(),
    Number(body.finishPosition || 0)
  );
  writeJson(res, 200, { ok: true, sng: out });
}

async function handleSngPayouts(req, res, urlObj) {
  const mod = await sngPromise;
  const sng = swarmState.sngs.get(String(urlObj.searchParams.get('tournamentId') || '').trim());
  if (!sng) return badRequest(res, 'Unknown tournamentId');
  const payouts = mod.computePayouts(sng);
  writeJson(res, 200, { ok: true, payouts, sng });
}

async function handleSngState(req, res, urlObj) {
  const sng = swarmState.sngs.get(String(urlObj.searchParams.get('tournamentId') || '').trim());
  if (!sng) return badRequest(res, 'Unknown tournamentId');
  writeJson(res, 200, { ok: true, sng });
}

async function handleMttCreate(req, res) {
  const body = await readBodyJson(req);
  const mod = await mttPromise;
  const mtt = mod.createMtt({
    tournamentId: String(body.tournamentId || crypto.randomUUID()).trim(),
    maxPlayers: Number(body.maxPlayers ?? 120),
    tableMaxSeats: Number(body.tableMaxSeats ?? 6),
    buyInUnits: parseBigIntInput(body.buyInUnits ?? '100', 'buyInUnits', 1n),
    lateRegMinutes: Number(body.lateRegMinutes ?? 45),
  });
  swarmState.mtts.set(mtt.tournamentId, mtt);
  writeJson(res, 201, { ok: true, mtt: mod.getMttSnapshot(mtt) });
}

async function handleMttRegister(req, res) {
  const body = await readBodyJson(req);
  const mod = await mttPromise;
  const mtt = swarmState.mtts.get(String(body.tournamentId || '').trim());
  if (!mtt) return badRequest(res, 'Unknown tournamentId');
  const out = mod.registerMttPlayer(mtt, { playerId: String(body.playerId || '').trim() });
  writeJson(res, 200, { ok: true, registeredCount: out, mtt: mod.getMttSnapshot(mtt) });
}

async function handleMttStart(req, res) {
  const body = await readBodyJson(req);
  const mod = await mttPromise;
  const mtt = swarmState.mtts.get(String(body.tournamentId || '').trim());
  if (!mtt) return badRequest(res, 'Unknown tournamentId');
  const out = mod.startMtt(mtt);
  writeJson(res, 200, { ok: true, mtt: out });
}

async function handleMttEliminate(req, res) {
  const body = await readBodyJson(req);
  const mod = await mttPromise;
  const mtt = swarmState.mtts.get(String(body.tournamentId || '').trim());
  if (!mtt) return badRequest(res, 'Unknown tournamentId');
  const out = mod.eliminateMttPlayer(
    mtt,
    String(body.playerId || '').trim(),
    Number(body.finishPosition || 0)
  );
  writeJson(res, 200, { ok: true, mtt: out });
}

async function handleMttState(req, res, urlObj) {
  const mod = await mttPromise;
  const mtt = swarmState.mtts.get(String(urlObj.searchParams.get('tournamentId') || '').trim());
  if (!mtt) return badRequest(res, 'Unknown tournamentId');
  writeJson(res, 200, { ok: true, mtt: mod.getMttSnapshot(mtt) });
}

async function handleV2HoldemTableCreate(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const tableId = String(body.tableId || crypto.randomUUID()).trim();
  const table = await getOrCreateHoldemTable(tableId, {
    mode: String(body.mode || 'cash'),
    maxSeats: Number(body.maxSeats ?? 9),
    smallBlind: Number(body.smallBlind ?? 50),
    bigBlind: Number(body.bigBlind ?? 100),
    ante: Number(body.ante ?? 0),
    buttonSeat: Number(body.buttonSeat ?? 0),
  });

  if (Array.isArray(body.seats)) {
    for (const row of body.seats) {
      if (!row) continue;
      try {
        mod.seatPlayer(table, {
          playerId: String(row.playerId || '').trim(),
          seat: Number(row.seat ?? 0),
          stack: Number(row.stack ?? 0),
          autoPostBlinds: row.autoPostBlinds !== false,
        });
      } catch {
        // Keep endpoint idempotent for repeated seat bootstrap calls.
      }
    }
  }

  await persistV2HoldemTable(table);
  writeJson(res, 201, { ok: true, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemSeat(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const out = mod.seatPlayer(table, {
    playerId: String(body.playerId || '').trim(),
    seat: Number(body.seat ?? 0),
    stack: Number(body.stack ?? 0),
    autoPostBlinds: body.autoPostBlinds !== false,
  });
  await persistV2HoldemTable(table);
  writeJson(res, 201, { ok: true, seat: out, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemStart(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const out = mod.startHand(table, {
    handId: String(body.handId || `h-${Date.now()}`),
    idempotencyKey: String(body.idempotencyKey || crypto.randomUUID()),
  });
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, table: out });
}

async function handleV2HoldemAction(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const playerId = String(body.playerId || '').trim();
  const resumeToken = String(body.resumeToken || '').trim();
  if (!resumeToken) {
    return conflict(res, 'RESUME_TOKEN_REQUIRED');
  }
  if (resumeToken) {
    let parsed;
    try {
      parsed = parseAndVerifyHoldemResumeToken(resumeToken);
    } catch (err) {
      const msg = String(err?.message || '');
      if (msg.includes('expired')) return conflict(res, 'RESUME_TOKEN_EXPIRED');
      return conflict(res, 'RESUME_TOKEN_INVALID');
    }
    if (parsed.tableId !== table.tableId) {
      return conflict(res, 'RESUME_TOKEN_TABLE_MISMATCH');
    }
    if (parsed.playerId && parsed.playerId !== playerId) {
      return conflict(res, 'RESUME_TOKEN_PLAYER_MISMATCH');
    }
    const liveSeat = Array.isArray(table.seats)
      ? table.seats.find((s) => s && s.playerId === playerId)
      : null;
    if (parsed.seat != null && liveSeat && Number(parsed.seat) !== Number(liveSeat.seat)) {
      return conflict(res, 'RESUME_TOKEN_SEAT_MISMATCH');
    }
    if (table.hand && parsed.handId && parsed.handId !== String(table.hand.handId || '')) {
      return conflict(res, 'RESUME_TOKEN_HAND_MISMATCH');
    }
  }
  let out;
  try {
    out = mod.applyAction(table, {
      playerId,
      action: String(body.action || '').trim(),
      amount: body.amount == null ? 0 : Number(body.amount),
      idempotencyKey: String(body.idempotencyKey || crypto.randomUUID()),
      expectedReplayCursor:
        body.expectedReplayCursor == null ? undefined : Number(body.expectedReplayCursor),
    });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('Stale replay cursor')) return conflict(res, 'STALE_REPLAY_CURSOR');
    if (msg.includes('Not your turn')) return conflict(res, 'NOT_YOUR_TURN');
    return badRequest(res, msg || 'Invalid action');
  }
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, result: out, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemResume(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const playerId = String(body.playerId || '').trim();
  if (!playerId) return badRequest(res, 'playerId is required');
  const seat = Array.isArray(table.seats)
    ? table.seats.find((s) => s && s.playerId === playerId)
    : null;
  if (!seat) return badRequest(res, 'Unknown playerId');
  const handId = table.hand?.handId || '';
  const token = createHoldemResumeToken({
    tableId: table.tableId,
    handId,
    playerId,
    seat: seat.seat,
    replayCursor: Number(table.seq || 0),
  });
  const agent = table.hand ? mod.agentState(table, { seat: seat.seat }) : null;
  writeJson(res, 200, {
    ok: true,
    resume: {
      token,
      tableId: table.tableId,
      handId,
      playerId,
      seat: seat.seat,
      replayCursor: Number(table.seq || 0),
    },
    state: mod.tableSnapshot(table),
    agent,
  });
}

async function handleV2HoldemSetConnection(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const out = mod.setConnection(table, {
    playerId: String(body.playerId || '').trim(),
    connected: body.connected !== false,
  });
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, seat: out, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemSeatChange(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const out = mod.requestSeatChange(table, {
    playerId: String(body.playerId || '').trim(),
    toSeat: Number(body.toSeat ?? 0),
    reason: String(body.reason || 'manual').trim(),
  });
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, seatChange: out, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemStraddle(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  let amount = 0;
  try {
    amount = mod.requestStraddle(table, {
      playerId: String(body.playerId || '').trim(),
      amount: body.amount == null ? null : Number(body.amount),
    });
  } catch (err) {
    return badRequest(res, String(err?.message || 'Invalid straddle request'));
  }
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, straddleAmount: amount, table: mod.tableSnapshot(table) });
}

async function handleV2HoldemSettle(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(String(body.tableId || '').trim());
  const out = mod.settleHand(table, {
    rankingBySeat:
      body.rankingBySeat && typeof body.rankingBySeat === 'object' ? body.rankingBySeat : {},
    settlementKey: String(body.settlementKey || crypto.randomUUID()),
  });
  await persistV2HoldemTable(table);
  writeJson(res, 200, { ok: true, table: out });
}

async function handleV2HoldemState(req, res, urlObj) {
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(
    String(urlObj.searchParams.get('tableId') || '').trim()
  );
  if (!table) return badRequest(res, 'Unknown tableId');
  writeJson(res, 200, {
    ok: true,
    table: mod.tableSnapshot(table),
    recovery: mod.recoverySnapshot(table),
  });
}

async function handleV2HoldemReplay(req, res, urlObj) {
  const mod = await holdemEnginePromise;
  const table = await getOrCreateHoldemTable(
    String(urlObj.searchParams.get('tableId') || '').trim()
  );
  if (!table) return badRequest(res, 'Unknown tableId');
  const events = mod.exportReplayLog(table);
  const verification = mod.verifyReplayLog(events);
  writeJson(res, 200, {
    ok: true,
    tableId: table.tableId,
    replayCursor: table.seq,
    verification,
    events,
  });
}

async function handleV2TournamentCreate(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const tournament = mod.createTournament({
    tournamentId: String(body.tournamentId || crypto.randomUUID()).trim(),
    type: String(body.type || 'mtt'),
    maxPlayers: Number(body.maxPlayers ?? 180),
    tableSize: Number(body.tableSize ?? 9),
    buyInUnits: Number(body.buyInUnits ?? 1000),
    startStack: Number(body.startStack ?? 20000),
    blindSchedule: Array.isArray(body.blindSchedule) ? body.blindSchedule : undefined,
    breakConfig:
      body.breakConfig && typeof body.breakConfig === 'object' ? body.breakConfig : undefined,
    lateReg: body.lateReg && typeof body.lateReg === 'object' ? body.lateReg : undefined,
    rebuy: body.rebuy && typeof body.rebuy === 'object' ? body.rebuy : undefined,
    addon: body.addon && typeof body.addon === 'object' ? body.addon : undefined,
    payoutBps: Array.isArray(body.payoutBps) ? body.payoutBps : undefined,
  });
  swarmState.holdemTournaments.set(tournament.tournamentId, tournament);
  await persistV2Tournament(tournament);
  writeJson(res, 201, { ok: true, tournament: mod.snapshotTournament(tournament) });
}

async function handleV2TournamentRegister(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.registerPlayer(t, { playerId: String(body.playerId || '').trim() });
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentStart(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.startTournament(t);
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentClock(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const clock = mod.advanceTournamentClock(t, Number(body.seconds ?? 60));
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, clock, tournament: mod.snapshotTournament(t) });
}

async function handleV2TournamentPause(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.pauseTournament(t, { reason: String(body.reason || 'manual') });
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentResume(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.resumeTournament(t, { reason: String(body.reason || 'manual') });
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentRecoveryExport(req, res, urlObj) {
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(
    String(urlObj.searchParams.get('tournamentId') || '').trim()
  );
  if (!t) return badRequest(res, 'Unknown tournamentId');
  writeJson(res, 200, {
    ok: true,
    recovery: mod.recoverySnapshot(t),
    tournament: mod.snapshotTournament(t),
  });
}

async function handleV2TournamentRecoveryImport(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const snapshot = body.recovery && typeof body.recovery === 'object' ? body.recovery : null;
  if (!snapshot) return badRequest(res, 'recovery object is required');
  const restored = mod.restoreTournament(snapshot);
  swarmState.holdemTournaments.set(restored.tournamentId, restored);
  await persistV2Tournament(restored);
  writeJson(res, 201, { ok: true, tournament: mod.snapshotTournament(restored) });
}

async function handleV2TournamentRebuy(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.rebuyPlayer(t, { playerId: String(body.playerId || '').trim() });
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentAddon(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  const out = mod.addOnPlayer(t, { playerId: String(body.playerId || '').trim() });
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentEliminate(req, res) {
  const body = await readBodyJson(req);
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(String(body.tournamentId || '').trim());
  if (!t) return badRequest(res, 'Unknown tournamentId');
  let out;
  try {
    out = mod.eliminatePlayer(t, {
      playerId: String(body.playerId || '').trim(),
      finishPosition: Number(body.finishPosition ?? 0),
    });
  } catch (err) {
    return badRequest(res, String(err?.message || 'Invalid elimination'));
  }
  await persistV2Tournament(t);
  writeJson(res, 200, { ok: true, tournament: out });
}

async function handleV2TournamentPayouts(req, res, urlObj) {
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(
    String(urlObj.searchParams.get('tournamentId') || '').trim()
  );
  if (!t) return badRequest(res, 'Unknown tournamentId');
  writeJson(res, 200, {
    ok: true,
    payouts: mod.computePayouts(t),
    tournament: mod.snapshotTournament(t),
  });
}

async function handleV2TournamentState(req, res, urlObj) {
  const mod = await holdemTournamentsPromise;
  const t = await getHoldemTournamentOrRestore(
    String(urlObj.searchParams.get('tournamentId') || '').trim()
  );
  if (!t) return badRequest(res, 'Unknown tournamentId');
  writeJson(res, 200, {
    ok: true,
    tournament: mod.snapshotTournament(t),
    eventLog: t.eventLog || [],
  });
}

async function handleCashierDeposit(req, res) {
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const playerId = String(body.playerId || '').trim();
  const amountUnits = parseBigIntInput(body.amountUnits, 'amountUnits', 1n);
  const source = String(body.source || 'fiat-bridge');
  const risk = evaluateCashierRisk(req, {
    playerId,
    amountUnits,
    action: 'deposit',
    source,
  });
  if (!risk.allowed) {
    return writeJson(res, 403, {
      ok: false,
      error: 'Risk controls rejected deposit',
      reasons: risk.reasons,
    });
  }
  // Deposits are still allowed even when breaker is tripped to let treasury recapitalize.
  const out = ledger.applyDeposit({
    playerId,
    amountUnits,
    idempotencyKey: String(body.idempotencyKey || '').trim(),
    source,
  });
  writeJson(res, 200, {
    ok: true,
    result: out,
    risk: { reasons: risk.reasons, velocity: risk.velocity },
  });
}

async function handleCashierReserve(req, res) {
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const playerId = String(body.playerId || '').trim();
  const amountUnits = parseBigIntInput(body.amountUnits, 'amountUnits', 1n);
  const risk = evaluateCashierRisk(req, {
    playerId,
    amountUnits,
    action: 'reserve',
    source: 'table-buyin',
  });
  if (!risk.allowed) {
    return writeJson(res, 403, {
      ok: false,
      error: 'Risk controls rejected reserve',
      reasons: risk.reasons,
    });
  }
  const breaker = evaluateTreasuryCircuitBreaker(req, {
    ledgerId,
    ledger,
    action: 'reserve',
    amountUnits,
  });
  if (!breaker.allowed) {
    return writeJson(res, 423, {
      ok: false,
      error: 'Treasury circuit breaker rejected reserve',
      reasons: breaker.reasons,
      policy: breaker.policy,
      metrics: breaker.metrics,
    });
  }
  const out = ledger.reserveBuyIn({
    playerId,
    amountUnits,
    idempotencyKey: String(body.idempotencyKey || '').trim(),
    context: String(body.context || 'table-buyin'),
  });
  writeJson(res, 200, {
    ok: true,
    result: out,
    risk: { reasons: risk.reasons, velocity: risk.velocity },
  });
}

async function handleCashierSettle(req, res) {
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const payoutUnits = parseBigIntInput(body.payoutUnits ?? '0', 'payoutUnits', 0n);
  const breaker = evaluateTreasuryCircuitBreaker(req, {
    ledgerId,
    ledger,
    action: 'settle',
    payoutUnits,
  });
  if (!breaker.allowed) {
    return writeJson(res, 423, {
      ok: false,
      error: 'Treasury circuit breaker rejected settlement',
      reasons: breaker.reasons,
      policy: breaker.policy,
      metrics: breaker.metrics,
    });
  }
  const out = ledger.settleResult({
    playerId: String(body.playerId || '').trim(),
    reservedUsedUnits: parseBigIntInput(body.reservedUsedUnits ?? '0', 'reservedUsedUnits', 0n),
    payoutUnits,
    idempotencyKey: String(body.idempotencyKey || '').trim(),
    context: String(body.context || 'hand-settlement'),
  });
  writeJson(res, 200, { ok: true, result: out });
}

async function handleCashierWithdrawRequest(req, res) {
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const playerId = String(body.playerId || '').trim();
  const amountUnits = parseBigIntInput(body.amountUnits, 'amountUnits', 1n);
  const risk = evaluateCashierRisk(req, {
    playerId,
    amountUnits,
    action: 'withdraw-request',
    source: 'withdrawal',
  });
  if (!risk.allowed) {
    return writeJson(res, 403, {
      ok: false,
      error: 'Risk controls rejected withdrawal',
      reasons: risk.reasons,
    });
  }
  const breaker = evaluateTreasuryCircuitBreaker(req, {
    ledgerId,
    ledger,
    action: 'withdraw-request',
    amountUnits,
  });
  if (!breaker.allowed) {
    return writeJson(res, 423, {
      ok: false,
      error: 'Treasury circuit breaker rejected withdrawal',
      reasons: breaker.reasons,
      policy: breaker.policy,
      metrics: breaker.metrics,
    });
  }
  const out = ledger.requestWithdrawal({
    playerId,
    amountUnits,
    idempotencyKey: String(body.idempotencyKey || '').trim(),
  });
  writeJson(res, 200, {
    ok: true,
    result: out,
    risk: { reasons: risk.reasons, velocity: risk.velocity },
  });
}

async function handleCashierWithdrawFinalize(req, res) {
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const amountUnits = parseBigIntInput(body.amountUnits, 'amountUnits', 1n);
  const breaker = evaluateTreasuryCircuitBreaker(req, {
    ledgerId,
    ledger,
    action: 'withdraw-finalize',
    amountUnits,
  });
  if (!breaker.allowed) {
    return writeJson(res, 423, {
      ok: false,
      error: 'Treasury circuit breaker rejected withdrawal finalize',
      reasons: breaker.reasons,
      policy: breaker.policy,
      metrics: breaker.metrics,
    });
  }
  const out = ledger.finalizeWithdrawal({
    playerId: String(body.playerId || '').trim(),
    amountUnits,
    idempotencyKey: String(body.idempotencyKey || '').trim(),
    status: String(body.status || 'confirmed'),
  });
  writeJson(res, 200, { ok: true, result: out });
}

async function handleRiskTreasuryPolicyGet(req, res, urlObj) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const ledgerId = String(urlObj.searchParams.get('ledgerId') || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const policy = getTreasuryPolicy(ledgerId);
  const probe = evaluateTreasuryCircuitBreaker(req, {
    ledgerId,
    ledger,
    action: 'status',
  });
  writeJson(res, 200, {
    ok: true,
    ledgerId,
    policy,
    state: {
      tripped: isTreasuryPolicyTripped(policy),
      reasons: probe.reasons,
      metrics: probe.metrics,
    },
    auth,
  });
}

async function handleRiskTreasuryPolicySet(req, res) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const updates = body && typeof body === 'object' ? { ...body } : {};
  delete updates.ledgerId;
  if (updates.clearTrip) {
    updates.manualTrip = false;
    updates.trippedAtMs = 0;
    updates.trippedUntilMs = 0;
    updates.tripReason = '';
    delete updates.clearTrip;
  }
  const policy = upsertTreasuryPolicy(ledgerId, updates);
  writeJson(res, 200, { ok: true, ledgerId, policy, auth });
}

async function handleCashierWallet(req, res, urlObj) {
  const ledger = await getOrCreateCashier(String(urlObj.searchParams.get('ledgerId') || 'default'));
  const playerId = String(urlObj.searchParams.get('playerId') || '').trim();
  if (!playerId) return badRequest(res, 'playerId is required');
  writeJson(res, 200, { ok: true, wallet: ledger.walletView(playerId) });
}

async function handleCashierReconcile(req, res, urlObj) {
  const ledger = await getOrCreateCashier(String(urlObj.searchParams.get('ledgerId') || 'default'));
  writeJson(res, 200, { ok: true, reconciliation: ledger.reconcile() });
}

async function handleCashierAttestation(req, res, urlObj) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const ledgerId = String(urlObj.searchParams.get('ledgerId') || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const policy = getTreasuryPolicy(ledgerId);
  const out = computeCashierAttestation(ledgerId, ledger, policy);
  writeJson(res, 200, { ok: true, auth, ...out });
}

async function handleCashierAttestationPublish(req, res) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const ledgerId = String(body.ledgerId || 'default');
  const ledger = await getOrCreateCashier(ledgerId);
  const policy = getTreasuryPolicy(ledgerId);
  const artifact = publishReserveAttestationArtifact({
    ledgerId,
    ledger,
    policy,
    periodStartIso: String(body.periodStartIso || ''),
    periodEndIso: String(body.periodEndIso || ''),
    reportLabel: String(body.reportLabel || ''),
    actor: String(body.actor || 'risk-operator'),
  });
  writeJson(res, 201, { ok: true, auth, artifact });
}

async function handleCashierAttestationHistory(req, res, urlObj) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const ledgerId = String(urlObj.searchParams.get('ledgerId') || 'default');
  const limit = Math.max(1, Math.min(500, Number(urlObj.searchParams.get('limit') || 50)));
  const history = getReserveAttestationHistory(ledgerId);
  writeJson(res, 200, {
    ok: true,
    auth,
    ledgerId,
    artifacts: history.slice(-limit).reverse(),
  });
}

async function handleCashierAttestationVerify(req, res) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const artifact = body.artifact && typeof body.artifact === 'object' ? body.artifact : null;
  if (!artifact) return badRequest(res, 'artifact object is required');
  const out = verifyReserveAttestationArtifact(artifact);
  writeJson(res, 200, { ok: true, auth, verification: out });
}

async function handleCashierEntries(req, res, urlObj) {
  const ledger = await getOrCreateCashier(String(urlObj.searchParams.get('ledgerId') || 'default'));
  const playerId = String(urlObj.searchParams.get('playerId') || '').trim();
  const limit = Math.max(1, Math.min(200, Number(urlObj.searchParams.get('limit') || 50)));
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  const filtered = playerId
    ? entries.filter((row) => String(row.playerId || '') === playerId)
    : entries;
  writeJson(res, 200, { ok: true, entries: filtered.slice(-limit).reverse() });
}

function webhookSecret(provider) {
  if (provider === 'stripe') return String(process.env.CASIN8_STRIPE_WEBHOOK_SECRET || '').trim();
  if (provider === 'paypal') return String(process.env.CASIN8_PAYPAL_WEBHOOK_SECRET || '').trim();
  return '';
}

function parseWebhookSignature(headerValue) {
  const raw = String(headerValue || '');
  const out = {};
  for (const token of raw.split(',')) {
    const [k, v] = token.split('=');
    if (!k || !v) continue;
    out[String(k).trim()] = String(v).trim();
  }
  return out;
}

function verifyWebhookSignature({ provider, headerValue, rawBody }) {
  const secret = webhookSecret(provider);
  if (!secret) {
    throw new Error(`${provider} webhook secret not configured`);
  }
  const sig = parseWebhookSignature(headerValue);
  const ts = Number(sig.t || sig.ts || 0);
  const v1 = String(sig.v1 || sig.sig || '').toLowerCase();
  if (!Number.isFinite(ts) || ts <= 0 || !/^[a-f0-9]{64}$/.test(v1)) {
    throw new Error('Invalid webhook signature header');
  }
  if (Math.abs(Date.now() - ts * 1000) > 10 * 60 * 1000) {
    throw new Error('Webhook timestamp outside allowed skew');
  }
  const payload = `${ts}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const exp = Buffer.from(expected, 'hex');
  const got = Buffer.from(v1, 'hex');
  if (exp.length !== got.length || !crypto.timingSafeEqual(exp, got)) {
    throw new Error('Webhook signature mismatch');
  }
  return { timestamp: ts, signature: v1 };
}

function upsertOrderFromIntent({
  orderId,
  provider,
  playerId,
  fiatCurrency,
  fiatAmountMinor,
  tokenUnits,
  ledgerId,
}) {
  const order = {
    orderId,
    provider,
    playerId,
    fiatCurrency,
    fiatAmountMinor,
    tokenUnits: tokenUnits.toString(),
    ledgerId,
    status: 'requires_payment',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ledgerDepositIdempotencyKey: null,
    providerEventId: null,
    providerPaymentId: null,
    providerFraudSignals: {},
  };
  swarmState.paymentOrders.set(orderId, order);
  riskDb.upsertPaymentOrder(order);
  return order;
}

async function createStripePaymentIntent({
  orderId,
  fiatAmountMinor,
  fiatCurrency,
  playerId,
  tokenUnits,
}) {
  const secret = String(process.env.CASIN8_STRIPE_SECRET_KEY || '').trim();
  if (!secret) return null;
  const body = new URLSearchParams();
  body.set('amount', String(fiatAmountMinor));
  body.set('currency', String(fiatCurrency || 'USD').toLowerCase());
  body.set('metadata[orderId]', orderId);
  body.set('metadata[playerId]', playerId);
  body.set('metadata[tokenUnits]', String(tokenUnits));
  body.set('automatic_payment_methods[enabled]', 'true');
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Stripe intent failed: ${json?.error?.message || res.status}`);
  }
  return {
    providerPaymentId: String(json.id || ''),
    clientSecret: String(json.client_secret || ''),
    status: String(json.status || 'requires_payment_method'),
    raw: json,
  };
}

async function getPaypalAccessToken() {
  const clientId = String(process.env.CASIN8_PAYPAL_CLIENT_ID || '').trim();
  const secret = String(process.env.CASIN8_PAYPAL_SECRET || '').trim();
  const baseUrl = String(process.env.CASIN8_PAYPAL_BASE_URL || 'https://api-m.paypal.com').trim();
  if (!clientId || !secret) return null;
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${json?.error_description || res.status}`);
  }
  return { accessToken: String(json.access_token || ''), baseUrl };
}

async function createPaypalOrder({ orderId, fiatAmountMinor, fiatCurrency, playerId, tokenUnits }) {
  const auth = await getPaypalAccessToken();
  if (!auth) return null;
  const amount = (Number(fiatAmountMinor) / 100).toFixed(2);
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderId,
        custom_id: orderId,
        description: `Casin8 token purchase for ${playerId}`,
        amount: {
          currency_code: fiatCurrency,
          value: amount,
        },
      },
    ],
    application_context: {
      brand_name: 'Casin8 Poker Room',
      user_action: 'PAY_NOW',
      return_url: 'https://ai-arcade.xyz/',
      cancel_url: 'https://ai-arcade.xyz/',
    },
    payment_source: {},
    metadata: {
      orderId,
      playerId,
      tokenUnits: String(tokenUnits),
    },
  };
  const res = await fetch(`${auth.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `casin8-${orderId}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PayPal order failed: ${json?.message || res.status}`);
  }
  const approveLink = Array.isArray(json.links)
    ? json.links.find((l) => String(l?.rel || '').toLowerCase() === 'approve')?.href || ''
    : '';
  return {
    providerPaymentId: String(json.id || ''),
    status: String(json.status || 'CREATED').toLowerCase(),
    approveUrl: approveLink,
    raw: json,
  };
}

function normalizeProviderWebhook(provider, body) {
  if (provider === 'stripe') {
    const obj = body?.data?.object || {};
    const eventType = String(body?.type || '').toLowerCase();
    const legacyStatus = String(body?.status || '').toLowerCase();
    const status =
      eventType.includes('succeeded') ||
      String(obj?.status || '').toLowerCase() === 'succeeded' ||
      legacyStatus === 'paid'
        ? 'paid'
        : 'ignored';
    const charge = Array.isArray(obj?.charges?.data) ? obj.charges.data[0] || {} : {};
    const orderId = String(obj?.metadata?.orderId || body?.orderId || '').trim();
    return {
      eventId: String(body?.id || body?.eventId || '').trim(),
      orderId,
      status,
      providerPaymentId: String(obj?.id || charge?.payment_intent || '').trim(),
      providerFraudSignals: {
        riskLevel: String(charge?.outcome?.risk_level || ''),
        riskScore: Number(charge?.outcome?.risk_score || 0),
        cvcCheck: String(charge?.payment_method_details?.card?.checks?.cvc_check || ''),
        avsPostalCheck: String(
          charge?.payment_method_details?.card?.checks?.address_postal_code_check || ''
        ),
      },
    };
  }
  const resource = body?.resource || {};
  const eventType = String(body?.event_type || '').toUpperCase();
  const orderId = String(resource?.custom_id || body?.orderId || '').trim();
  const status =
    String(resource?.status || '').toUpperCase() === 'COMPLETED' ||
    eventType.includes('PAYMENT.CAPTURE.COMPLETED')
      ? 'paid'
      : 'ignored';
  return {
    eventId: String(body?.id || body?.eventId || '').trim(),
    orderId,
    status,
    providerPaymentId: String(resource?.id || '').trim(),
    providerFraudSignals: {
      sellerProtection: String(resource?.seller_protection?.status || ''),
      disputeCategory: String(resource?.seller_protection?.dispute_categories?.[0] || ''),
      payerCountry: String(resource?.payer?.address?.country_code || ''),
    },
  };
}

async function handleComplianceUpsert(req, res) {
  const auth = requireRoles(req, res, ['compliance']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const playerId = String(body.playerId || '').trim();
  if (!playerId) return badRequest(res, 'playerId is required');
  const profile = getComplianceProfile(playerId);
  const update = sanitizeComplianceUpdate(body);
  Object.assign(profile, update, { updatedAt: nowIso() });
  swarmState.complianceProfiles.set(playerId, profile);
  riskDb.upsertComplianceProfile(profile);
  writeJson(res, 200, { ok: true, profile, auth });
}

async function handleComplianceStatus(req, res, urlObj) {
  const playerId = String(urlObj.searchParams.get('playerId') || '').trim();
  if (!playerId) return badRequest(res, 'playerId is required');
  const profile = getComplianceProfile(playerId);
  writeJson(res, 200, { ok: true, profile });
}

async function handlePaymentsIntent(req, res) {
  const auth = requireAnyRole(req, res, ['compliance', 'risk']);
  if (!auth.ok) return;
  const body = await readBodyJson(req);
  const provider = String(body.provider || '')
    .trim()
    .toLowerCase();
  if (!['stripe', 'paypal'].includes(provider))
    return badRequest(res, 'provider must be stripe or paypal');
  const playerId = String(body.playerId || '').trim();
  if (!playerId) return badRequest(res, 'playerId is required');
  const fiatCurrency = String(body.fiatCurrency || 'USD')
    .trim()
    .toUpperCase()
    .slice(0, 5);
  const fiatAmountMinor = Number(body.fiatAmountMinor || 0);
  const tokenUnits = parseBigIntInput(body.tokenUnits, 'tokenUnits', 1n);
  if (!Number.isInteger(fiatAmountMinor) || fiatAmountMinor <= 0) {
    return badRequest(res, 'fiatAmountMinor must be positive integer');
  }
  const risk = evaluateCashierRisk(req, {
    playerId,
    amountUnits: tokenUnits,
    action: 'intent',
    source: 'fiat-bridge',
  });
  if (!risk.allowed) {
    return writeJson(res, 403, {
      ok: false,
      error: 'Compliance or risk checks failed',
      reasons: risk.reasons,
      profile: risk.profile,
    });
  }
  const order = upsertOrderFromIntent({
    orderId: String(body.orderId || crypto.randomUUID()).trim(),
    provider,
    playerId,
    fiatCurrency,
    fiatAmountMinor,
    tokenUnits,
    ledgerId: String(body.ledgerId || 'default').trim(),
  });
  let checkout = {
    provider,
    mode: 'mock',
    reference: `cashier:${order.orderId}`,
  };
  if (provider === 'stripe') {
    try {
      const stripe = await createStripePaymentIntent({
        orderId: order.orderId,
        fiatAmountMinor,
        fiatCurrency,
        playerId,
        tokenUnits,
      });
      if (stripe) {
        order.providerPaymentId = stripe.providerPaymentId;
        order.status = stripe.status;
        order.updatedAt = nowIso();
        order.providerFraudSignals = {};
        swarmState.paymentOrders.set(order.orderId, order);
        riskDb.upsertPaymentOrder(order);
        checkout = {
          provider: 'stripe',
          mode: 'live',
          paymentIntentId: stripe.providerPaymentId,
          clientSecret: stripe.clientSecret,
          status: stripe.status,
        };
      }
    } catch (err) {
      addRiskAlert({
        type: 'payments-intent-fallback',
        provider: 'stripe',
        orderId: order.orderId,
        playerId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (provider === 'paypal') {
    try {
      const paypal = await createPaypalOrder({
        orderId: order.orderId,
        fiatAmountMinor,
        fiatCurrency,
        playerId,
        tokenUnits,
      });
      if (paypal) {
        order.providerPaymentId = paypal.providerPaymentId;
        order.status = paypal.status;
        order.updatedAt = nowIso();
        swarmState.paymentOrders.set(order.orderId, order);
        riskDb.upsertPaymentOrder(order);
        checkout = {
          provider: 'paypal',
          mode: 'live',
          orderId: paypal.providerPaymentId,
          approveUrl: paypal.approveUrl,
          status: paypal.status,
        };
      }
    } catch (err) {
      addRiskAlert({
        type: 'payments-intent-fallback',
        provider: 'paypal',
        orderId: order.orderId,
        playerId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
  writeJson(res, 201, {
    ok: true,
    order,
    checkout,
  });
}

async function handlePaymentsOrder(req, res, urlObj) {
  const auth = requireAnyRole(req, res, ['compliance', 'risk']);
  if (!auth.ok) return;
  const orderId = String(urlObj.searchParams.get('orderId') || '').trim();
  if (!orderId) return badRequest(res, 'orderId is required');
  const order = swarmState.paymentOrders.get(orderId) || riskDb.getPaymentOrder(orderId);
  if (!order) return badRequest(res, 'Unknown orderId');
  writeJson(res, 200, { ok: true, order });
}

async function applyWebhookOrderPayment(provider, req, res) {
  const raw = await readBodyRaw(req, 1024 * 256);
  const sigHeader = String(
    req.headers['x-casin8-signature'] ||
      req.headers['stripe-signature'] ||
      req.headers['paypal-signature'] ||
      ''
  );
  const verified = verifyWebhookSignature({ provider, headerValue: sigHeader, rawBody: raw });
  let body;
  try {
    body = raw.length > 0 ? JSON.parse(raw.toString('utf8')) : {};
  } catch {
    return badRequest(res, 'Invalid webhook JSON');
  }
  const normalized = normalizeProviderWebhook(provider, body);
  const eventId = normalized.eventId;
  if (!eventId) return badRequest(res, 'eventId is required');
  if (swarmState.webhookEvents.has(eventId) || riskDb.hasWebhookEvent(eventId)) {
    return writeJson(res, 200, { ok: true, duplicate: true });
  }
  const orderId = normalized.orderId;
  if (!orderId) return badRequest(res, 'orderId is required');
  const order = swarmState.paymentOrders.get(orderId) || riskDb.getPaymentOrder(orderId);
  if (!order) return badRequest(res, 'Unknown orderId');
  if (order.provider !== provider) return badRequest(res, 'Provider mismatch for order');
  if (normalized.status !== 'paid') return badRequest(res, 'Only paid status accepted');

  const ledger = await getOrCreateCashier(order.ledgerId);
  const depositKey = `webhook:${provider}:${eventId}`;
  const out = ledger.applyDeposit({
    playerId: order.playerId,
    amountUnits: BigInt(order.tokenUnits),
    idempotencyKey: depositKey,
    source: `${provider}-webhook`,
  });
  order.status = 'paid';
  order.updatedAt = nowIso();
  order.providerEventId = eventId;
  order.providerPaymentId = normalized.providerPaymentId || order.providerPaymentId || null;
  order.providerFraudSignals = normalized.providerFraudSignals || {};
  order.ledgerDepositIdempotencyKey = depositKey;
  swarmState.paymentOrders.set(orderId, order);
  riskDb.upsertPaymentOrder(order);
  const webhookRow = {
    eventId,
    provider,
    orderId,
    timestamp: verified.timestamp,
    providerPaymentId: normalized.providerPaymentId || '',
    providerFraudSignals: normalized.providerFraudSignals || {},
    receivedAt: nowIso(),
  };
  swarmState.webhookEvents.set(eventId, webhookRow);
  riskDb.addWebhookEvent(webhookRow);
  writeJson(res, 200, { ok: true, verified, deposit: out, order });
}

async function handleStripeWebhook(req, res) {
  return applyWebhookOrderPayment('stripe', req, res);
}

async function handlePaypalWebhook(req, res) {
  return applyWebhookOrderPayment('paypal', req, res);
}

async function handleRiskAlerts(req, res, urlObj) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const limit = Math.max(1, Math.min(200, Number(urlObj.searchParams.get('limit') || 100)));
  writeJson(res, 200, { ok: true, alerts: riskDb.listRiskAlerts(limit), auth });
}

async function handleRiskCollusionScan(req, res, urlObj) {
  const auth = requireRoles(req, res, ['risk']);
  if (!auth.ok) return;
  const tableId = String(urlObj.searchParams.get('tableId') || '').trim();
  if (!tableId) return badRequest(res, 'tableId is required');
  const minPairHands = Math.max(
    1,
    Math.min(50, Number(urlObj.searchParams.get('minPairHands') || 3))
  );
  const scoreThreshold = Math.max(
    0,
    Math.min(1, Number(urlObj.searchParams.get('scoreThreshold') || 0))
  );

  const holdem = swarmState.holdemTables.get(tableId) || null;
  const mod = await fraudCollusionPromise;
  const sourceEvents = holdem && Array.isArray(holdem.events) ? holdem.events : [];
  const scan = mod.scanReplayForCollusion(sourceEvents, { minPairHands });
  const pairs = scan.pairs.filter((row) => row.collusionScore >= scoreThreshold);
  const top = pairs.slice(0, 20);
  for (const row of top) {
    if (row.collusionScore < 0.65) continue;
    addRiskAlert({
      type: 'collusion-scan',
      tableId,
      pair: row.pair,
      collusionScore: row.collusionScore,
      opportunities: row.opportunities,
      softFoldRate: row.softFoldRate,
      repeatedTransferEvents: row.repeatedTransferEvents,
    });
  }
  writeJson(res, 200, {
    ok: true,
    tableId,
    scannedHands: scan.scannedHands,
    pairCount: scan.pairCount,
    scoreThreshold,
    pairs,
    auth,
  });
}

async function handleSponsorshipSettleAndCredit(req, res) {
  const body = await readBodyJson(req);
  const mod = await sponsorshipPromise;
  const positionId = String(body.positionId || '').trim();
  const position = loadSponsorshipPosition(positionId);
  if (!position) return badRequest(res, 'Unknown positionId');
  const settlement = mod.settleEvent(position, {
    eventId: String(body.eventId || crypto.randomUUID()),
    buyInUnits: parseBigIntInput(body.buyInUnits, 'buyInUnits', 0n),
    prizeUnits: parseBigIntInput(body.prizeUnits, 'prizeUnits', 0n),
    rakeUnits: parseBigIntInput(body.rakeUnits ?? '0', 'rakeUnits', 0n),
  });
  const ledger = await getOrCreateCashier(String(body.ledgerId || 'default'));
  const credits = [];
  for (const row of settlement.sponsorPayouts) {
    if (row.payoutUnits <= 0n) continue;
    const playerId = String(body.sponsorPlayerMap?.[row.sponsorId] || row.sponsorId).trim();
    const deposit = ledger.applyDeposit({
      playerId,
      amountUnits: row.payoutUnits,
      idempotencyKey: `sponsor-settle:${positionId}:${settlement.eventId}:${row.sponsorId}`,
      source: 'sponsorship-settlement',
    });
    credits.push({ sponsorId: row.sponsorId, playerId, payoutUnits: row.payoutUnits, deposit });
  }
  persistSponsorshipPosition(position);
  writeJson(res, 200, {
    ok: true,
    settlement,
    credits,
    position: mod.getPositionView(position),
  });
}

async function handleSponsorshipSimulate(req, res) {
  const body = await readBodyJson(req);
  const runs = Math.max(10, Math.min(2000, Number(body.runs || 200)));
  const stakeForSaleBps = Math.max(0, Math.min(10000, Number(body.stakeForSaleBps ?? 7000)));
  const principalUnits = parseBigIntInput(body.principalUnits ?? '1000', 'principalUnits', 1n);
  const buyInUnits = parseBigIntInput(body.buyInUnits ?? '1000', 'buyInUnits', 1n);
  const roiBpsMean = Number(body.roiBpsMean ?? 500);
  const roiBpsStdDev = Math.max(1, Number(body.roiBpsStdDev ?? 3000));
  const capLossBps = Math.max(0, Math.min(10000, Number(body.capLossBps ?? 10000)));
  let sponsorProfitTotal = 0n;
  let sponsorLossRuns = 0;
  let extremeLossRuns = 0;
  for (let i = 0; i < runs; i += 1) {
    const n1 = Math.random();
    const n2 = Math.random();
    const gauss = Math.sqrt(-2 * Math.log(Math.max(1e-9, n1))) * Math.cos(2 * Math.PI * n2);
    const roiBps = Math.round(roiBpsMean + gauss * roiBpsStdDev);
    const clampedRoiBps = Math.max(-capLossBps, roiBps);
    const pnl = (buyInUnits * BigInt(clampedRoiBps)) / 10000n;
    const sponsorPnl = (pnl * BigInt(stakeForSaleBps)) / 10000n;
    const sponsorReturn = principalUnits + sponsorPnl;
    if (sponsorReturn < principalUnits) sponsorLossRuns += 1;
    if (sponsorReturn <= principalUnits / 2n) extremeLossRuns += 1;
    sponsorProfitTotal += sponsorPnl;
  }
  const avgPnl = sponsorProfitTotal / BigInt(runs);
  const exploitRisk =
    extremeLossRuns / runs > 0.2 ? 'high' : extremeLossRuns / runs > 0.08 ? 'medium' : 'low';
  writeJson(res, 200, {
    ok: true,
    simulation: {
      runs,
      assumptions: {
        stakeForSaleBps,
        principalUnits: principalUnits.toString(),
        buyInUnits: buyInUnits.toString(),
        roiBpsMean,
        roiBpsStdDev,
        capLossBps,
      },
      outputs: {
        avgSponsorPnlUnits: avgPnl.toString(),
        sponsorLossRate: sponsorLossRuns / runs,
        extremeLossRate: extremeLossRuns / runs,
        exploitRisk,
      },
    },
  });
}

async function handleAgentActionContract(_req, res) {
  writeJson(res, 200, {
    ok: true,
    contract: {
      endpoint: '/api/strategy/decide',
      requestSchema: {
        type: 'object',
        required: [
          'agentId',
          'bankrollUnits',
          'legalActions',
          'handStrength',
          'potUnits',
          'toCallUnits',
        ],
        properties: {
          agentId: { type: 'string' },
          bankrollUnits: { type: 'integer' },
          legalActions: { type: 'array', items: { type: 'string' } },
          handStrength: { type: 'number', minimum: 0, maximum: 1 },
          potUnits: { type: 'integer', minimum: 0 },
          toCallUnits: { type: 'integer', minimum: 0 },
          temperament: { type: 'string' },
          maxRiskBps: { type: 'integer', minimum: 1, maximum: 10000 },
        },
      },
      responseSchema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          profile: { type: 'object' },
          decision: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              amountUnits: { type: 'integer' },
              confidence: { type: 'number' },
              explanation: { type: 'string' },
            },
          },
          policy: { type: 'object' },
          executable: { type: 'boolean' },
        },
      },
    },
  });
}

async function handleRealtimeMutation(req, res) {
  const body = await readBodyJson(req);
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const bus = await getOrCreateRealtimeBus(tableId);
  const out = bus.consumeMutation({
    idempotencyKey: String(body.idempotencyKey || '').trim(),
    mutationType: String(body.mutationType || '').trim(),
    payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
  });
  writeJson(res, 200, { ok: true, result: out, cursor: bus.latestCursor() });
}

async function handleRealtimeSnapshotWrite(req, res) {
  const body = await readBodyJson(req);
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const bus = await getOrCreateRealtimeBus(tableId);
  const out = bus.writeSnapshot(
    body.snapshotState && typeof body.snapshotState === 'object' ? body.snapshotState : {}
  );
  writeJson(res, 200, { ok: true, event: out });
}

async function handleRealtimeSnapshotRead(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId') || 'lobby-1');
  const cursor = urlObj.searchParams.get('cursor');
  const bus = await getOrCreateRealtimeBus(tableId);
  const out = cursor ? bus.readSnapshot(cursor) : bus.readSnapshot();
  writeJson(res, 200, { ok: true, snapshot: out, cursor: bus.latestCursor() });
}

async function handleRealtimeFeed(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId') || 'lobby-1');
  const since = Number(urlObj.searchParams.get('since') || 0);
  const bus = await getOrCreateRealtimeBus(tableId);
  const out = bus.subscribe({ since: Number.isFinite(since) ? Math.max(0, Math.floor(since)) : 0 });
  writeJson(res, 200, { ok: true, events: out, cursor: bus.latestCursor() });
}

async function handleTableStateInit(req, res) {
  const body = await readBodyJson(req);
  const engineCore = await engineCorePromise;
  const engine = await enginePromise;
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const handId = String(body.handId || crypto.randomUUID()).trim();
  const seats = (Array.isArray(body.seats) ? body.seats : [{ seat: 0 }, { seat: 1 }]).map(
    (seat, idx) => ({
      seat: Number.isInteger(seat?.seat) ? seat.seat : idx,
      folded: false,
      stack: Number.isFinite(Number(seat?.stack)) ? Number(seat.stack) : 1000,
      invested: 0,
    })
  );
  const actingSeat = Number.isInteger(body.actingSeat) ? body.actingSeat : 0;
  const pot = Number.isInteger(body.pot) ? body.pot : 0;

  const snapshot = engineCore.createTableSnapshot({
    tableId,
    handId,
    actingSeat,
    seats,
    pot,
  });
  snapshot.variant = 'holdem-cash';
  snapshot.street = 'preflop';
  snapshot.communityCards = [];
  snapshot.deckCards = [];
  snapshot.holeCards = {};
  snapshot.actionCountStreet = 0;
  snapshot.settled = false;
  snapshot.winnerSeat = null;
  snapshot.payoutUnits = 0;
  snapshot.showdown = null;
  snapshot.actedSeats = [];
  snapshot.streetBets = {};
  snapshot.currentBet = 0;
  snapshot.sessionBySeat =
    body.sessionBySeat && typeof body.sessionBySeat === 'object' ? body.sessionBySeat : null;

  const rng = engine.createRng(`${tableId}:${handId}:holdem-cash`);
  const deck = engine.buildDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  snapshot.deckCards = deck.map((card) => engine.cardToString(card));
  for (const seat of seats) {
    snapshot.holeCards[String(seat.seat)] = dealFromDeck(snapshot, 2);
  }

  const sb = Math.max(1, Number(body.smallBlind || 10));
  const bb = Math.max(sb, Number(body.bigBlind || 20));
  const snapshotSeats = Array.isArray(snapshot.seats) ? snapshot.seats : [];
  snapshot.buttonSeat = Number.isInteger(body.buttonSeat)
    ? Number(body.buttonSeat)
    : (() => {
        const prev = swarmState.tableSnapshots.get(tableId);
        if (!prev || !Number.isInteger(prev.buttonSeat)) return 0;
        return nextActiveSeat({ seats: snapshotSeats }, Number(prev.buttonSeat));
      })();
  const sbSeat = nextActiveSeat(snapshot, snapshot.buttonSeat);
  const bbSeat = nextActiveSeat(snapshot, sbSeat);
  const sbRow = snapshotSeats.find((s) => s.seat === sbSeat);
  const bbRow = snapshotSeats.find((s) => s.seat === bbSeat);

  if (sbRow) {
    const post = Math.min(Number(sbRow.stack || 0), sb);
    sbRow.stack -= post;
    sbRow.invested += post;
    snapshot.streetBets[String(sbSeat)] = post;
    snapshot.pot += post;
  }
  if (bbRow) {
    const post = Math.min(Number(bbRow.stack || 0), bb);
    bbRow.stack -= post;
    bbRow.invested += post;
    snapshot.streetBets[String(bbSeat)] = post;
    snapshot.pot += post;
  }

  snapshot.currentBet = Math.max(
    Number(snapshot.streetBets[String(sbSeat)] || 0),
    Number(snapshot.streetBets[String(bbSeat)] || 0)
  );
  snapshot.blinds = { smallBlind: sb, bigBlind: bb, sbSeat, bbSeat };
  snapshot.minRaise = bb;
  snapshot.lastRaiseSize = bb;
  snapshot.actingSeat = nextActiveSeat(snapshot, bbSeat);

  swarmState.tableSnapshots.set(tableId, snapshot);
  persistTableSnapshot(tableId, snapshot);

  const bus = await getOrCreateRealtimeBus(tableId);
  const snapshotEvent = bus.writeSnapshot(snapshot);
  publishTableEvent(tableId, {
    type: 'table_state_init',
    tableId,
    handId,
    actingSeat: snapshot.actingSeat,
    pot: snapshot.pot,
    street: snapshot.street,
    cursor: snapshotEvent.cursor,
    ts: nowIso(),
  });

  writeJson(res, 201, { ok: true, snapshot, cursor: snapshotEvent.cursor });
}

async function handleTableStateGet(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId') || 'lobby-1');
  const snapshot = swarmState.tableSnapshots.get(tableId);
  if (!snapshot) return badRequest(res, 'No table snapshot found. Initialize table first.');
  writeJson(res, 200, { ok: true, snapshot });
}

async function handleTableAction(req, res) {
  const body = await readBodyJson(req);
  const engineCore = await engineCorePromise;
  const engine = await enginePromise;
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const snapshot = swarmState.tableSnapshots.get(tableId);
  if (!snapshot) return badRequest(res, 'No table snapshot found. Initialize table first.');

  const bus = await getOrCreateRealtimeBus(tableId);
  const seat = Number(body.seat);
  const actionIn = String(body.action || '')
    .trim()
    .toLowerCase();
  const intentType = String(body.type || 'player.action').trim();
  const idempotencyKey = String(body.idempotencyKey || crypto.randomUUID()).trim();
  if (bus.hasProcessedIdempotencyKey(idempotencyKey)) {
    const duplicateMutation = bus.consumeMutation({
      idempotencyKey,
      mutationType: intentType,
      payload: {
        seat,
        action: actionIn,
        amount: Number(body.amount || 0),
      },
    });
    publishTableEvent(tableId, {
      type: 'table_action_rejected',
      tableId,
      handId: snapshot?.handId,
      intent: {
        type: intentType,
        seat,
        action: actionIn,
        amount: Number(body.amount || 0),
      },
      reason: 'DUPLICATE_IDEMPOTENCY_KEY',
      pot: snapshot?.pot,
      actingSeat: snapshot?.actingSeat,
      terminal: snapshot?.terminal === true,
      street: snapshot?.street,
      currentBet: snapshot?.currentBet,
      cursor: duplicateMutation.event?.cursor || snapshot?.cursor || null,
      ts: nowIso(),
    });
    writeJson(res, 200, {
      ok: true,
      accepted: false,
      duplicate: true,
      reason: 'DUPLICATE_IDEMPOTENCY_KEY',
      snapshot,
      mutationEvent: duplicateMutation.event,
      cursor: duplicateMutation.event?.cursor || snapshot?.cursor || null,
    });
    return;
  }

  const expectedCursor = body.expectedCursor == null ? null : String(body.expectedCursor).trim();
  const expectedSeqRaw = body.expectedSeq;
  const expectedSeq =
    expectedSeqRaw == null || expectedSeqRaw === '' ? null : Number(expectedSeqRaw);
  if (expectedCursor && expectedCursor !== String(snapshot.cursor || '')) {
    return conflict(res, 'STALE_ACTION: cursor mismatch');
  }
  if (
    expectedSeq != null &&
    (!Number.isInteger(expectedSeq) || expectedSeq !== Number(snapshot.seq || 0))
  ) {
    return conflict(res, 'STALE_ACTION: seq mismatch');
  }

  const streetBets =
    snapshot.streetBets && typeof snapshot.streetBets === 'object' ? snapshot.streetBets : {};
  const seatStreetBet = Number(streetBets[String(seat)] || 0);
  const currentBet = Number(snapshot.currentBet || 0);
  const rawAmount = Number(body.amount || 0);
  const seatRowsNow = Array.isArray(snapshot.seats) ? snapshot.seats : [];
  const seatRowNow = seatRowsNow.find(
    (row, idx) => (Number.isInteger(row?.seat) ? row.seat : idx) === seat
  );
  const availableStack = Math.max(0, Number(seatRowNow?.stack || 0));

  let normalizedAction = actionIn;
  let spend = 0;
  if (actionIn === 'check') {
    if (seatStreetBet !== currentBet) return badRequest(res, 'Cannot check while facing a bet');
    spend = 0;
  } else if (actionIn === 'call') {
    const required = Math.max(0, currentBet - seatStreetBet);
    spend = Math.min(required, availableStack);
  } else if (actionIn === 'bet') {
    if (currentBet > 0) return badRequest(res, 'Cannot bet after a bet exists; use raise');
    spend = Math.min(Math.max(1, rawAmount), availableStack);
    if (spend <= 0) return badRequest(res, 'No chips available to bet');
  } else if (actionIn === 'raise') {
    const target = Math.max(currentBet + 1, rawAmount);
    const requiredSpend = Math.max(0, target - seatStreetBet);
    spend = Math.min(requiredSpend, availableStack);
    const actualTarget = seatStreetBet + spend;
    const minRaise = Math.max(1, Number(snapshot.minRaise || snapshot.blinds?.bigBlind || 1));
    const isAllInShort =
      spend === availableStack && actualTarget > currentBet && actualTarget - currentBet < minRaise;
    if (actualTarget <= currentBet) return badRequest(res, 'Raise must exceed current bet');
    if (!isAllInShort && actualTarget - currentBet < minRaise) {
      return badRequest(res, `Raise must be at least ${minRaise}`);
    }
    if (isAllInShort) normalizedAction = 'call';
  } else if (actionIn === 'fold') {
    spend = 0;
  } else {
    return badRequest(res, 'Invalid action');
  }

  const intent = {
    type: intentType,
    seat,
    action: normalizedAction,
    amount: spend,
  };
  const out = engineCore.applyAction(snapshot, intent);
  const nextSnapshot = out.snapshot;
  if (out.accepted) {
    nextSnapshot.actionCountStreet = Number(nextSnapshot.actionCountStreet || 0) + 1;

    const seatRows = Array.isArray(nextSnapshot.seats) ? nextSnapshot.seats : [];
    const seatRow = seatRows.find(
      (row, idx) => (Number.isInteger(row?.seat) ? row.seat : idx) === intent.seat
    );
    if (seatRow) {
      const spend = Math.max(0, Number(intent.amount || 0));
      seatRow.invested = Number(seatRow.invested || 0) + spend;
      seatRow.stack = Math.max(0, Number(seatRow.stack || 0) - spend);
    }

    const updatedStreetBet = Number(streetBets[String(seat)] || 0) + spend;
    nextSnapshot.streetBets = {
      ...(nextSnapshot.streetBets && typeof nextSnapshot.streetBets === 'object'
        ? nextSnapshot.streetBets
        : {}),
      [String(seat)]: updatedStreetBet,
    };
    const actedSet = new Set(Array.isArray(nextSnapshot.actedSeats) ? nextSnapshot.actedSeats : []);

    if (normalizedAction === 'bet' || normalizedAction === 'raise') {
      const prevBet = Number(nextSnapshot.currentBet || 0);
      nextSnapshot.currentBet = updatedStreetBet;
      nextSnapshot.lastRaiseSize = Math.max(1, updatedStreetBet - prevBet);
      nextSnapshot.minRaise = nextSnapshot.lastRaiseSize;
      actedSet.clear();
      actedSet.add(seat);
    } else {
      actedSet.add(seat);
    }
    nextSnapshot.actedSeats = [...actedSet.values()];

    const activeCount = activeSeats(nextSnapshot).length;
    if (activeCount <= 1) {
      nextSnapshot.street = 'showdown';
      nextSnapshot.terminal = true;
      nextSnapshot.settled = true;
      nextSnapshot.winnerSeat = firstActiveSeat(nextSnapshot);
      nextSnapshot.payoutUnits = Math.max(0, Number(nextSnapshot.pot || 0));
      nextSnapshot.payoutBySeat = { [String(nextSnapshot.winnerSeat)]: nextSnapshot.payoutUnits };
      nextSnapshot.showdown = [{ seat: nextSnapshot.winnerSeat, scoreTuple: [99] }];
      settleSessionsFromSnapshot(nextSnapshot);
    } else if (isStreetRoundComplete(nextSnapshot)) {
      nextSnapshot.actionCountStreet = 0;
      advanceStreet(nextSnapshot, engine);
      if (!nextSnapshot.terminal) {
        nextSnapshot.actingSeat = nextActiveSeat(
          nextSnapshot,
          Number(nextSnapshot.buttonSeat || 0)
        );
      }
      if (nextSnapshot.terminal === true && nextSnapshot.settled === true) {
        settleSessionsFromSnapshot(nextSnapshot);
      }
    } else {
      nextSnapshot.actingSeat = nextActiveSeat(nextSnapshot, seat);
    }
  }
  swarmState.tableSnapshots.set(tableId, nextSnapshot);
  persistTableSnapshot(tableId, nextSnapshot);

  const mutation = bus.consumeMutation({
    idempotencyKey,
    mutationType: intent.type,
    payload: intent,
  });
  const snapEvent = bus.writeSnapshot(nextSnapshot);

  publishTableEvent(tableId, {
    type: out.accepted ? 'table_action_accepted' : 'table_action_rejected',
    tableId,
    handId: nextSnapshot?.handId,
    intent,
    reason: out.reason,
    pot: nextSnapshot?.pot,
    actingSeat: nextSnapshot?.actingSeat,
    terminal: nextSnapshot?.terminal === true,
    street: nextSnapshot?.street,
    currentBet: nextSnapshot?.currentBet,
    cursor: snapEvent.cursor,
    ts: nowIso(),
  });

  writeJson(res, 200, {
    ok: true,
    accepted: out.accepted,
    reason: out.reason,
    event: out.event,
    snapshot: nextSnapshot,
    mutationEvent: mutation.event,
    cursor: snapEvent.cursor,
  });
}

async function handleTableSettle(req, res) {
  const body = await readBodyJson(req);
  const engineCore = await engineCorePromise;
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const snapshot = swarmState.tableSnapshots.get(tableId);
  if (!snapshot) return badRequest(res, 'No table snapshot found. Initialize table first.');

  const winnerSeat = Number(body.winnerSeat);
  const payoutUnits = Number(body.payoutUnits);
  const idempotencyKey = String(body.idempotencyKey || '').trim();
  if (!Number.isInteger(winnerSeat) || winnerSeat < 0) {
    return badRequest(res, 'winnerSeat must be a non-negative integer');
  }
  if (!Number.isInteger(payoutUnits) || payoutUnits < 0) {
    return badRequest(res, 'payoutUnits must be a non-negative integer');
  }
  if (snapshot.settled === true) {
    if (idempotencyKey && idempotencyKey === String(snapshot.settleIdempotencyKey || '')) {
      return writeJson(res, 200, {
        ok: true,
        duplicate: true,
        settlement: snapshot.lastSettlementArtifacts || null,
        snapshot,
        cursor: snapshot.cursor || null,
      });
    }
    return conflict(res, 'HAND_ALREADY_SETTLED');
  }

  const artifacts = engineCore.buildSettlementArtifacts(snapshot, winnerSeat, payoutUnits);
  const bus = await getOrCreateRealtimeBus(tableId);
  const settleEvent = bus.publish({
    eventType: 'table.settled',
    handResult: artifacts.handResult,
    payoutDirective: artifacts.payoutDirective,
    fairnessMaterial: artifacts.fairnessMaterial,
  });

  const nextSnapshot = {
    ...snapshot,
    terminal: true,
    settled: true,
    winnerSeat,
    payoutUnits,
    settleIdempotencyKey: idempotencyKey || crypto.randomUUID(),
    lastSettlementArtifacts: artifacts,
    seq: settleEvent.seq,
    cursor: settleEvent.cursor,
  };
  settleSessionsFromSnapshot(nextSnapshot);
  swarmState.tableSnapshots.set(tableId, nextSnapshot);
  persistTableSnapshot(tableId, nextSnapshot);
  bus.writeSnapshot(nextSnapshot);

  publishTableEvent(tableId, {
    type: 'table_settled',
    tableId,
    handId: snapshot.handId,
    winnerSeat,
    payoutUnits,
    cursor: settleEvent.cursor,
    ts: nowIso(),
  });

  writeJson(res, 200, {
    ok: true,
    settlement: artifacts,
    snapshot: nextSnapshot,
    cursor: settleEvent.cursor,
  });
}

async function handleTableRoundAuto(req, res) {
  const body = await readBodyJson(req);
  const engineCore = await engineCorePromise;
  const engine = await enginePromise;
  const strategy = await agentStrategyPromise;
  const registry = await getAgentRegistry();
  const tableId = sanitizeTable(body.tableId || 'lobby-1');
  const maxActions = Math.max(1, Math.min(12, Number(body.maxActions || 4)));
  let snapshot = swarmState.tableSnapshots.get(tableId);

  if (!snapshot) {
    snapshot = engineCore.createTableSnapshot({
      tableId,
      handId: String(body.handId || crypto.randomUUID()).trim(),
      actingSeat: 0,
      seats: Array.isArray(body.seats) ? body.seats : [{ seat: 0 }, { seat: 1 }],
      pot: 0,
    });
    swarmState.tableSnapshots.set(tableId, snapshot);
    persistTableSnapshot(tableId, snapshot);
  }

  const bus = await getOrCreateRealtimeBus(tableId);
  const rng = engine.createRng(`${tableId}:${snapshot.handId}:${Date.now()}`);
  const timeline = [];

  for (let i = 0; i < maxActions; i += 1) {
    if (snapshot.terminal) break;

    const actingSeat = snapshot.actingSeat;
    const seatMeta = Array.isArray(snapshot.seats) ? snapshot.seats[actingSeat] || {} : {};
    const seatAgentId = String(seatMeta.agentId || seatMeta.playerId || `agent-seat-${actingSeat}`);

    if (!registry.agents.has(seatAgentId)) {
      registry.registerAgent({
        agentId: seatAgentId,
        ownerId: String(body.ownerId || 'system'),
        tier: String(body.tier || 'B'),
        style: String(body.style || 'tight_aggressive'),
      });
    }

    let profile = swarmState.agentStrategies.get(seatAgentId);
    if (!profile) {
      profile = strategy.buildStrategyProfile({
        agentId: seatAgentId,
        temperament: String(body.temperament || 'balanced'),
        maxRiskBps: Number(body.maxRiskBps ?? 800),
      });
      swarmState.agentStrategies.set(seatAgentId, profile);
    }

    const handStrength = Number((0.35 + rng() * 0.55).toFixed(3));
    const decision = strategy.chooseAction({
      profile,
      legalActions: ['fold', 'check', 'call', 'bet'],
      handStrength,
      potUnits: Number(snapshot.pot || 0),
      toCallUnits: Math.max(0, Math.floor(5 + rng() * 20)),
    });
    const capped = strategy.enforceRiskCap({
      actionDecision: decision,
      bankrollUnits: BigInt(String(body.bankrollUnits ?? 1000)),
      maxRiskBps: Number(body.maxRiskBps ?? profile.maxRiskBps ?? 800),
    });
    const policy = registry.evaluateActionPolicy(seatAgentId, {
      action: capped.action,
      amountUnits: BigInt(capped.amountUnits || 0),
      bankrollUnits: BigInt(String(body.bankrollUnits ?? 1000)),
    });
    const action = policy.allowed ? capped.action : 'check';
    const amount = policy.allowed ? Number(capped.amountUnits || 0) : 0;

    const out = engineCore.applyAction(snapshot, {
      type: 'agent.action',
      seat: actingSeat,
      action,
      amount,
    });
    snapshot = out.snapshot;
    swarmState.tableSnapshots.set(tableId, snapshot);

    const mutation = bus.consumeMutation({
      idempotencyKey: crypto.randomUUID(),
      mutationType: 'agent.action',
      payload: { seat: actingSeat, action, amount, agentId: seatAgentId },
    });
    const snapEvent = bus.writeSnapshot(snapshot);

    const row = {
      accepted: out.accepted,
      reason: out.reason,
      agentId: seatAgentId,
      action,
      amount,
      pot: snapshot.pot,
      actingSeat: snapshot.actingSeat,
      policy,
      terminal: snapshot.terminal === true,
      cursor: snapEvent.cursor,
      mutationSeq: mutation.event.seq,
    };
    timeline.push(row);
    publishTableEvent(tableId, { type: 'table_auto_action', tableId, ...row, ts: nowIso() });
  }

  let settlement = null;
  if (snapshot.terminal && !snapshot.settled) {
    const active = Array.isArray(snapshot.seats)
      ? snapshot.seats
          .map((s, idx) => ({ ...s, seat: Number.isInteger(s?.seat) ? s.seat : idx }))
          .filter((s) => !s.folded)
      : [];
    const winnerSeat = active.length > 0 ? active[0].seat : 0;
    const payoutUnits = Math.max(0, Number(snapshot.pot || 0));
    settlement = engineCore.buildSettlementArtifacts(snapshot, winnerSeat, payoutUnits);
    const settleEvent = bus.publish({
      eventType: 'table.settled',
      handResult: settlement.handResult,
      payoutDirective: settlement.payoutDirective,
      fairnessMaterial: settlement.fairnessMaterial,
    });
    snapshot = {
      ...snapshot,
      terminal: true,
      settled: true,
      winnerSeat,
      payoutUnits,
      seq: settleEvent.seq,
      cursor: settleEvent.cursor,
    };
    settleSessionsFromSnapshot(snapshot);
    swarmState.tableSnapshots.set(tableId, snapshot);
    persistTableSnapshot(tableId, snapshot);
    bus.writeSnapshot(snapshot);
    publishTableEvent(tableId, {
      type: 'table_auto_settled',
      tableId,
      handId: snapshot.handId,
      winnerSeat,
      payoutUnits,
      cursor: settleEvent.cursor,
      ts: nowIso(),
    });
  }

  persistTableSnapshot(tableId, snapshot);

  writeJson(res, 200, {
    ok: true,
    tableId,
    handId: snapshot.handId,
    timeline,
    settlement,
    snapshot,
  });
}

function handleSwarmStatus(req, res) {
  const dbStats = riskDb.stats();
  writeJson(res, 200, {
    ok: true,
    status: {
      agentsRegistered: swarmState.agentRegistry?.agents?.size || 0,
      strategyProfiles: swarmState.agentStrategies.size,
      sponsorshipPositions: swarmState.sponsorshipPositions.size,
      sngs: swarmState.sngs.size,
      mtts: swarmState.mtts.size,
      cashiers: swarmState.cashiers.size,
      fairnessCommits: swarmState.fairnessCommits.size,
      realtimeBuses: swarmState.realtimeBuses.size,
      complianceProfiles: swarmState.complianceProfiles.size,
      paymentOrders: swarmState.paymentOrders.size,
      webhookEvents: swarmState.webhookEvents.size,
      riskAlerts: swarmState.riskAlerts.length,
      riskDb: dbStats,
    },
  });
}

function handleGetSession(req, res, urlObj) {
  const id = urlObj.searchParams.get('sessionId');
  const session = getSessionOrNull(id);
  if (!session) return badRequest(res, 'Invalid sessionId');
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

function handleGetLedger(req, res, urlObj) {
  const id = urlObj.searchParams.get('sessionId');
  const session = getSessionOrNull(id);
  if (!session) return badRequest(res, 'Invalid sessionId');
  writeJson(res, 200, { ok: true, ledger: session.ledger.slice(0, 50) });
}

function handleGetTableEvents(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId'));
  const table = ensureTable(tableId);
  writeJson(res, 200, { ok: true, tableId, events: table.events.slice(0, 50) });
}

function handleTableStream(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId'));
  ensureTable(tableId);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write('retry: 2000\n\n');

  const clients = sseClients.get(tableId) || new Set();
  clients.add(res);
  sseClients.set(tableId, clients);

  req.on('close', () => {
    const set = sseClients.get(tableId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      sseClients.delete(tableId);
    }
  });
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const normalized = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const safePath = normalized.replace(/^[/\\]+/, '');
  const filePath = path.join(root, safePath || 'index.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        if (!path.extname(filePath)) {
          const fallback = path.join(root, 'index.html');
          fs.readFile(fallback, (fallbackErr, fallbackContent) => {
            if (fallbackErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Not Found');
              return;
            }
            res.writeHead(200, { 'Content-Type': mime['.html'] });
            res.end(fallbackContent);
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
    });
    res.end(content);
  });
}

const endpoint = (handler) => async (req, res, _urlObj) => handler(req, res);
const endpointWithQuery = (handler) => async (req, res, urlObj) => handler(req, res, urlObj);

const API_ROUTES = new Map([
  [
    'GET /api/health',
    async (_req, res) => writeJson(res, 200, { ok: true, status: 'ok', at: nowIso() }),
  ],
  [
    'GET /api/chain-config',
    async (_req, res) => writeJson(res, 200, { ok: true, config: chainConfig() }),
  ],
  [
    'GET /api/metrics',
    async (_req, res) =>
      writeJson(res, 200, {
        ok: true,
        metrics: {
          ...metrics,
          sessions: Object.keys(state.sessions).length,
          tables: Object.keys(state.tables).length,
          traitRollouts: swarmState.traitRollouts.size,
          traitRecommendations: swarmState.traitLastRecommendation.size,
          traitObservations: swarmState.traitObservations.size,
          traitPolicyFreeze: swarmState.traitPolicy.freeze,
          traitRevokedArtifacts: swarmState.traitPolicy.revokedArtifactIds.size,
        },
      }),
  ],
  [
    'GET /api/slo',
    async (_req, res) => {
      const p95TargetMs = Math.max(1, Number(process.env.CASIN8_SLO_P95_TARGET_MS || 500));
      const minSamples = Math.max(1, Number(process.env.CASIN8_SLO_MIN_SAMPLES || 20));
      const report = buildLatencyReport();
      const breaches = report
        .filter((row) => row.count >= minSamples && row.p95Ms > p95TargetMs)
        .map((row) => ({
          route: row.route,
          p95Ms: row.p95Ms,
          targetMs: p95TargetMs,
          count: row.count,
        }));
      writeJson(res, 200, {
        ok: true,
        slo: {
          p95TargetMs,
          minSamples,
          routes: report,
          breaches,
        },
      });
    },
  ],

  ['POST /api/session', endpoint(handleCreateSession)],
  ['GET /api/session', endpointWithQuery(handleGetSession)],
  ['POST /api/session/profile', endpoint(handleSetProfile)],
  ['POST /api/session/client-seed', endpoint(handleSetClientSeed)],
  ['POST /api/session/reset', endpoint(handleResetSession)],
  ['POST /api/session/reveal-rotate', endpoint(handleRevealRotate)],

  ['POST /api/fair/commit', endpoint(handleFairCommit)],
  ['POST /api/fair/rotate', endpoint(handleFairRotate)],
  ['POST /api/fair/verify', endpoint(handleFairVerify)],

  ['GET /api/ledger', endpointWithQuery(handleGetLedger)],
  ['POST /api/play', endpoint(handlePlay)],

  ['GET /api/table/events', endpointWithQuery(handleGetTableEvents)],
  ['POST /api/table/state/init', endpoint(handleTableStateInit)],
  ['GET /api/table/state', endpointWithQuery(handleTableStateGet)],
  ['POST /api/table/action', endpoint(handleTableAction)],
  ['POST /api/table/settle', endpoint(handleTableSettle)],
  ['POST /api/table/round/auto', endpoint(handleTableRoundAuto)],
  ['GET /api/table/stream', endpointWithQuery(handleTableStream)],

  ['POST /api/agents/register', endpoint(handleAgentRegister)],
  ['POST /api/agents/configure-style', endpoint(handleAgentConfigureStyle)],
  ['POST /api/agents/configure-risk', endpoint(handleAgentConfigureRisk)],
  ['POST /api/agents/policy-check', endpoint(handleAgentPolicyCheck)],
  ['GET /api/agents/action-contract', endpoint(handleAgentActionContract)],

  ['POST /api/strategy/profile', endpoint(handleStrategyProfile)],
  ['POST /api/strategy/decide', endpoint(handleStrategyDecide)],
  ['POST /api/strategy/traits/craft', endpoint(handleStrategyTraitsCraft)],
  ['POST /api/strategy/traits/texassolver', endpoint(handleStrategyTraitsTexasSolver)],
  ['POST /api/strategy/traits/rollout', endpoint(handleStrategyTraitsRollout)],
  ['POST /api/strategy/traits/rollout/evaluate', endpoint(handleStrategyTraitsRolloutEvaluate)],
  [
    'POST /api/strategy/traits/rollout/evaluate-live',
    endpoint(handleStrategyTraitsRolloutEvaluateLive),
  ],
  ['GET /api/strategy/traits/rollout/state', endpointWithQuery(handleStrategyTraitsRolloutState)],
  ['GET /api/strategy/traits/drift', endpointWithQuery(handleStrategyTraitsDrift)],
  ['GET /api/strategy/traits/dashboard', endpoint(handleStrategyTraitsDashboard)],
  ['POST /api/strategy/traits/policy/freeze', endpoint(handleStrategyTraitsFreeze)],
  [
    'POST /api/strategy/traits/policy/revoke-artifact',
    endpoint(handleStrategyTraitsArtifactRevoke),
  ],
  ['GET /api/strategy/traits/slo', endpoint(handleStrategyTraitsSlo)],
  ['POST /api/sim/equity', endpoint(handleSimEquity)],
  ['POST /api/agents/nurture/init', endpoint(handleAgentNurtureInit)],
  ['POST /api/agents/nurture/episode', endpoint(handleAgentNurtureEpisode)],
  ['POST /api/agents/nurture/evaluate', endpoint(handleAgentNurtureEvaluate)],
  ['GET /api/agents/nurture/state', endpointWithQuery(handleAgentNurtureState)],
  ['GET /api/swarm/status', endpoint(handleSwarmStatus)],

  ['POST /api/sponsorships/open', endpoint(handleSponsorshipOpen)],
  ['POST /api/sponsorships/fund', endpoint(handleSponsorshipFund)],
  ['POST /api/sponsorships/one-click-fund', endpoint(handleSponsorshipOneClickFund)],
  ['POST /api/sponsorships/close', endpoint(handleSponsorshipClose)],
  ['POST /api/sponsorships/settle', endpoint(handleSponsorshipSettle)],
  ['POST /api/sponsorships/settle-and-credit', endpoint(handleSponsorshipSettleAndCredit)],
  ['POST /api/sponsorships/claim', endpoint(handleSponsorshipClaim)],
  ['GET /api/sponsorships/marketplace', endpointWithQuery(handleSponsorshipMarketplace)],
  ['GET /api/sponsorships/sponsor-analytics', endpointWithQuery(handleSponsorshipSponsorAnalytics)],
  ['POST /api/sponsorships/simulate', endpoint(handleSponsorshipSimulate)],
  ['GET /api/sponsorships/history', endpointWithQuery(handleSponsorshipHistory)],
  ['GET /api/sponsorships/view', endpointWithQuery(handleSponsorshipView)],

  ['POST /api/sng/create', endpoint(handleSngCreate)],
  ['POST /api/sng/register', endpoint(handleSngRegister)],
  ['POST /api/sng/advance', endpoint(handleSngAdvance)],
  ['POST /api/sng/eliminate', endpoint(handleSngEliminate)],
  ['GET /api/sng/payouts', endpointWithQuery(handleSngPayouts)],
  ['GET /api/sng/state', endpointWithQuery(handleSngState)],

  ['POST /api/mtt/create', endpoint(handleMttCreate)],
  ['POST /api/mtt/register', endpoint(handleMttRegister)],
  ['POST /api/mtt/start', endpoint(handleMttStart)],
  ['POST /api/mtt/eliminate', endpoint(handleMttEliminate)],
  ['GET /api/mtt/state', endpointWithQuery(handleMttState)],

  ['POST /api/cashier/deposit', endpoint(handleCashierDeposit)],
  ['POST /api/cashier/reserve', endpoint(handleCashierReserve)],
  ['POST /api/cashier/settle', endpoint(handleCashierSettle)],
  ['POST /api/cashier/withdraw-request', endpoint(handleCashierWithdrawRequest)],
  ['POST /api/cashier/withdraw-finalize', endpoint(handleCashierWithdrawFinalize)],
  ['GET /api/cashier/wallet', endpointWithQuery(handleCashierWallet)],
  ['GET /api/cashier/reconcile', endpointWithQuery(handleCashierReconcile)],
  ['GET /api/cashier/attestation', endpointWithQuery(handleCashierAttestation)],
  ['POST /api/cashier/attestation/publish', endpoint(handleCashierAttestationPublish)],
  ['GET /api/cashier/attestation/history', endpointWithQuery(handleCashierAttestationHistory)],
  ['POST /api/cashier/attestation/verify', endpoint(handleCashierAttestationVerify)],
  ['GET /api/cashier/entries', endpointWithQuery(handleCashierEntries)],

  ['POST /api/compliance/upsert', endpoint(handleComplianceUpsert)],
  ['GET /api/compliance/status', endpointWithQuery(handleComplianceStatus)],
  ['POST /api/payments/intent', endpoint(handlePaymentsIntent)],
  ['GET /api/payments/order', endpointWithQuery(handlePaymentsOrder)],
  ['POST /api/payments/webhook/stripe', endpoint(handleStripeWebhook)],
  ['POST /api/payments/webhook/paypal', endpoint(handlePaypalWebhook)],
  ['GET /api/risk/alerts', endpointWithQuery(handleRiskAlerts)],
  ['GET /api/risk/collusion-scan', endpointWithQuery(handleRiskCollusionScan)],
  ['GET /api/risk/treasury-policy', endpointWithQuery(handleRiskTreasuryPolicyGet)],
  ['POST /api/risk/treasury-policy', endpoint(handleRiskTreasuryPolicySet)],

  ['POST /api/realtime/mutation', endpoint(handleRealtimeMutation)],
  ['POST /api/realtime/snapshot/write', endpoint(handleRealtimeSnapshotWrite)],
  ['GET /api/realtime/snapshot/read', endpointWithQuery(handleRealtimeSnapshotRead)],
  ['GET /api/realtime/feed', endpointWithQuery(handleRealtimeFeed)],

  ['POST /api/v2/holdem/tables', endpoint(handleV2HoldemTableCreate)],
  ['POST /api/v2/holdem/seat', endpoint(handleV2HoldemSeat)],
  ['POST /api/v2/holdem/seat-change', endpoint(handleV2HoldemSeatChange)],
  ['POST /api/v2/holdem/straddle', endpoint(handleV2HoldemStraddle)],
  ['POST /api/v2/holdem/connection', endpoint(handleV2HoldemSetConnection)],
  ['POST /api/v2/holdem/resume', endpoint(handleV2HoldemResume)],
  ['POST /api/v2/holdem/hands/start', endpoint(handleV2HoldemStart)],
  ['POST /api/v2/holdem/actions', endpoint(handleV2HoldemAction)],
  ['POST /api/v2/holdem/hands/settle', endpoint(handleV2HoldemSettle)],
  ['GET /api/v2/holdem/state', endpointWithQuery(handleV2HoldemState)],
  ['GET /api/v2/holdem/replay', endpointWithQuery(handleV2HoldemReplay)],

  ['POST /api/v2/tournaments', endpoint(handleV2TournamentCreate)],
  ['POST /api/v2/tournaments/register', endpoint(handleV2TournamentRegister)],
  ['POST /api/v2/tournaments/start', endpoint(handleV2TournamentStart)],
  ['POST /api/v2/tournaments/clock', endpoint(handleV2TournamentClock)],
  ['POST /api/v2/tournaments/pause', endpoint(handleV2TournamentPause)],
  ['POST /api/v2/tournaments/resume', endpoint(handleV2TournamentResume)],
  ['GET /api/v2/tournaments/recovery/export', endpointWithQuery(handleV2TournamentRecoveryExport)],
  ['POST /api/v2/tournaments/recovery/import', endpoint(handleV2TournamentRecoveryImport)],
  ['POST /api/v2/tournaments/rebuy', endpoint(handleV2TournamentRebuy)],
  ['POST /api/v2/tournaments/addon', endpoint(handleV2TournamentAddon)],
  ['POST /api/v2/tournaments/eliminate', endpoint(handleV2TournamentEliminate)],
  ['GET /api/v2/tournaments/state', endpointWithQuery(handleV2TournamentState)],
  ['GET /api/v2/tournaments/payouts', endpointWithQuery(handleV2TournamentPayouts)],
]);

async function handleApi(req, res, urlObj) {
  metrics.apiRequestsTotal += 1;
  if (isRateLimited(req)) {
    return writeJson(res, 429, { ok: false, error: 'Rate limit exceeded' });
  }

  const key = `${req.method} ${urlObj.pathname}`;
  const route = API_ROUTES.get(key);
  if (!route) return notFound(res);
  if (requiresPokerAuth(req.method, urlObj.pathname)) {
    const auth = requireRoles(req, res, ['poker']);
    if (!auth.ok) return;
  }
  const routeKey = `${req.method} ${urlObj.pathname}`;
  const started = process.hrtime.bigint();
  try {
    return await route(req, res, urlObj);
  } finally {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    recordRouteLatency(routeKey, elapsedMs);
  }
}

const server = http.createServer(async (req, res) => {
  metrics.requestsTotal += 1;
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (urlObj.pathname.startsWith('/api/')) {
      await handleApi(req, res, urlObj);
      return;
    }
    serveStatic(req, res);
  } catch (err) {
    const errMessage = String(err?.message || '');
    if (errMessage === 'Invalid JSON body' || errMessage === 'Payload too large') {
      return badRequest(res, errMessage);
    }
    if (String(urlObj.pathname || '').startsWith('/api/play')) {
      metrics.playFailuresTotal += 1;
      if (
        String(err?.message || '')
          .toLowerCase()
          .includes('on-chain')
      ) {
        metrics.onchainVerifyFail += 1;
      }
    }
    writeJson(res, 500, {
      ok: false,
      error: 'Internal error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, () => {
  console.log(`Casin8 games listening on :${PORT}`);
});
