#!/usr/bin/env node
/**
 * Unified provider failover resolver for TNF harness hosts.
 * Policy: data/harness/provider-failover-policy.json
 *
 * Library (require):
 *   const { resolveProviderFailover } = require('./provider-failover.cjs');
 *   resolveProviderFailover({ host, seed, ctx, providers })
 *
 * CLI:
 *   node scripts/harness/provider-failover.cjs [--host name] [--seed] [--json]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY = path.join(ROOT, 'data/harness/provider-failover-policy.json');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');
const CONTEXT = path.join(ROOT, '.agent/runtime-state/harness-context.latest.json');

function loadJson(abs, fallback) {
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadPolicy() {
  const policy = loadJson(POLICY, null);
  if (!policy) throw new Error(`missing or invalid policy: ${POLICY}`);
  return policy;
}

function disabledSet(policy, env = process.env) {
  const ids = new Set();
  for (const envName of policy.disabledProvidersEnv || []) {
    for (const part of String(env[envName] || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)) {
      ids.add(part);
    }
  }
  return ids;
}

function normalizeFamily(raw) {
  const family = String(raw || '')
    .split('/')[0]
    .toLowerCase()
    .trim();
  if (!family) return '';
  if (family.startsWith('nvidia')) return 'nvidia';
  if (family.startsWith('google') || family === 'agy' || family === 'gemini') return 'google';
  if (family.startsWith('anthropic') || family === 'claude') return 'anthropic';
  if (family.startsWith('openai')) return 'openai';
  if (family === 'catalog_primary') return 'catalog_primary';
  return family;
}

function catalogPrimary(ctx, providers) {
  const primaryFromCtx = ctx?.models?.primaryProvider || null;
  const working = ctx?.models?.workingModel || ctx?.env?.TNF_WORKING_MODEL || null;
  const primaryFromList = Array.isArray(providers) && providers[0] ? providers[0] : null;
  const fromPrimary =
    primaryFromCtx?.id ||
    primaryFromCtx?.model ||
    primaryFromList?.id ||
    primaryFromList?.model ||
    primaryFromList?.provider ||
    null;
  const id = normalizeFamily(fromPrimary || working) || 'nvidia';
  return {
    id: id === 'catalog_primary' ? 'nvidia' : id,
    model: primaryFromCtx?.model || primaryFromList?.model || working || null,
    source: primaryFromCtx ? 'harness-context' : primaryFromList ? 'provider-catalog' : 'policy-default',
  };
}

function contextWatchdogChain(ctx) {
  const fromModels = Array.isArray(ctx?.models?.watchdogChain) ? ctx.models.watchdogChain : [];
  if (fromModels.length) return fromModels.map((s) => normalizeFamily(s)).filter(Boolean);
  const envChain = String(ctx?.env?.MODEL_WATCHDOG_PROVIDER_CHAIN || process.env.MODEL_WATCHDOG_PROVIDER_CHAIN || '')
    .split(',')
    .map((s) => normalizeFamily(s))
    .filter(Boolean);
  return envChain;
}

function catalogFamilies(providers) {
  if (!Array.isArray(providers)) return [];
  const out = [];
  const seen = new Set();
  for (const p of providers) {
    const id = normalizeFamily(p?.provider || p?.id || p?.model || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * @param {object} opts
 * @param {string} [opts.host]
 * @param {boolean} [opts.seed] - ignore live watchdog chain (use when *building* harness context)
 * @param {object} [opts.ctx]
 * @param {object[]} [opts.providers]
 * @param {object} [opts.policy]
 * @param {NodeJS.ProcessEnv} [opts.env]
 */
function resolveProviderFailover(opts = {}) {
  const policy = opts.policy || loadPolicy();
  const ctx = opts.ctx || {};
  const env = opts.env || process.env;
  const disabled = disabledSet(policy, env);
  const pin = (opts.host && policy.hostPins && policy.hostPins[opts.host]) || null;
  const primary = catalogPrimary(ctx, opts.providers);
  const liveChain = opts.seed ? [] : contextWatchdogChain(ctx);
  const fromCatalog = catalogFamilies(opts.providers);

  const preferred = [
    ...(pin?.prefer || []),
    ...liveChain,
    ...fromCatalog,
    ...(policy.defaultChain || []),
  ];

  const chain = [];
  const seen = new Set();
  const push = (raw) => {
    let id = normalizeFamily(raw);
    if (id === 'catalog_primary') id = primary.id;
    if (!id || seen.has(id) || disabled.has(id)) return;
    seen.add(id);
    chain.push(id);
  };

  for (const item of preferred) push(item);

  return {
    host: opts.host || 'default',
    primary,
    chain,
    chainCsv: chain.join(','),
    assimilate: pin?.assimilate || null,
    disabled: [...disabled],
    liveWatchdog: liveChain,
    seed: Boolean(opts.seed),
    policyVersion: policy.version,
  };
}

function writeReceipt(payload) {
  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const receipt = path.join(RECEIPT_DIR, `provider-failover-${Date.now()}.json`);
  fs.writeFileSync(receipt, `${JSON.stringify(payload, null, 2)}\n`);
  return path.relative(ROOT, receipt);
}

function parseArgs(argv) {
  const out = { json: false, host: null, seed: false, write: true };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--json') out.json = true;
    else if (t === '--seed') out.seed = true;
    else if (t === '--no-write') out.write = false;
    else if (t === '--write') out.write = true;
    else if (t === '--host') out.host = argv[++i] || null;
  }
  return out;
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  const ctx = opts.seed ? {} : loadJson(CONTEXT, {});
  // Seed still benefits from context primary/model when present.
  const ctxForPrimary = loadJson(CONTEXT, {});
  const resolution = resolveProviderFailover({
    host: opts.host || 'watchdog',
    seed: opts.seed,
    ctx: opts.seed
      ? {
          models: ctxForPrimary.models,
          env: ctxForPrimary.env,
        }
      : ctxForPrimary,
  });
  const payload = {
    ok: resolution.chain.length > 0,
    at: new Date().toISOString(),
    ...resolution,
  };
  if (opts.write) payload.receipt = writeReceipt(payload);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log('TNF provider failover');
    console.log(`host: ${payload.host}${payload.seed ? ' (seed)' : ''}`);
    console.log(
      `primary: ${payload.primary.id}${payload.primary.model ? ` (${payload.primary.model})` : ''}`
    );
    console.log(`chain: ${payload.chain.join(' → ') || '(empty)'}`);
    if (payload.assimilate) console.log(`assimilate: ${payload.assimilate}`);
    if (payload.disabled.length) console.log(`disabled: ${payload.disabled.join(', ')}`);
    if (payload.receipt) console.log(`receipt: ${payload.receipt}`);
    console.log(payload.ok ? '\nFAILOVER POLICY OK' : '\nFAILOVER POLICY EMPTY');
  }
  process.exit(payload.ok ? 0 : 1);
}

module.exports = {
  ROOT,
  POLICY,
  loadPolicy,
  resolveProviderFailover,
  normalizeFamily,
  main,
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`provider-failover: ${err.message}`);
    process.exit(1);
  }
}
