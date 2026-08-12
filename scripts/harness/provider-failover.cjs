#!/usr/bin/env node
/**
 * Unified provider failover resolver for TNF harness hosts.
 * Policy: data/harness/provider-failover-policy.json
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY = path.join(ROOT, 'data/harness/provider-failover-policy.json');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');
const CONTEXT = path.join(ROOT, '.agent/runtime-state/harness-context.latest.json');

function parseArgs(argv) {
  const out = { json: false, host: null, write: false };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--json') out.json = true;
    else if (t === '--write') out.write = true;
    else if (t === '--host') out.host = argv[++i] || null;
  }
  return out;
}

function loadJson(abs, fallback) {
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch {
    return fallback;
  }
}

function disabledSet(policy) {
  const ids = new Set();
  for (const envName of policy.disabledProvidersEnv || []) {
    for (const part of String(process.env[envName] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      ids.add(part.toLowerCase());
    }
  }
  return ids;
}

function catalogPrimary(ctx) {
  const primary = ctx?.models?.primaryProvider || null;
  const working = ctx?.models?.workingModel || ctx?.env?.TNF_WORKING_MODEL || null;
  const fromPrimary = primary?.id || primary?.model || null;
  const family = String(fromPrimary || working || 'catalog_primary')
    .split('/')[0]
    .toLowerCase()
    .replace(/^nvidia-.*/, 'nvidia');
  // Normalize known vendor prefixes from catalog ids.
  const normalized = family.startsWith('nvidia')
    ? 'nvidia'
    : family.startsWith('google')
      ? 'google'
      : family.startsWith('anthropic')
        ? 'anthropic'
        : family.startsWith('openai')
          ? 'openai'
          : family;
  return {
    id: normalized || 'catalog_primary',
    model: primary?.model || working || null,
    source: 'harness-context',
  };
}

function contextWatchdogChain(ctx) {
  const fromModels = Array.isArray(ctx?.models?.watchdogChain) ? ctx.models.watchdogChain : [];
  if (fromModels.length) return fromModels.map((s) => String(s).toLowerCase());
  const envChain = String(ctx?.env?.MODEL_WATCHDOG_PROVIDER_CHAIN || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return envChain;
}

function resolveChain(policy, host, ctx) {
  const disabled = disabledSet(policy);
  const pin = (host && policy.hostPins && policy.hostPins[host]) || null;
  const primary = catalogPrimary(ctx);
  const liveChain = contextWatchdogChain(ctx);
  const preferred = [
    ...(pin?.prefer || []),
    ...liveChain,
    ...(policy.defaultChain || []),
  ];
  const chain = [];
  const seen = new Set();

  const push = (raw) => {
    let id = String(raw || '').toLowerCase();
    if (id === 'catalog_primary') id = primary.id;
    if (!id || seen.has(id) || disabled.has(id)) return;
    seen.add(id);
    chain.push(id);
  };

  for (const item of preferred) push(item);
  return {
    host: host || 'default',
    primary,
    chain,
    assimilate: pin?.assimilate || null,
    disabled: [...disabled],
    liveWatchdog: liveChain,
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(POLICY)) {
    console.error(`missing policy: ${POLICY}`);
    process.exit(1);
  }
  const policy = loadJson(POLICY, null);
  const ctx = loadJson(CONTEXT, {});
  const resolution = resolveChain(policy, opts.host, ctx);
  const payload = {
    ok: resolution.chain.length > 0,
    at: new Date().toISOString(),
    policyVersion: policy.version,
    ...resolution,
  };

  if (opts.write || true) {
    fs.mkdirSync(RECEIPT_DIR, { recursive: true });
    const receipt = path.join(RECEIPT_DIR, `provider-failover-${Date.now()}.json`);
    fs.writeFileSync(receipt, `${JSON.stringify(payload, null, 2)}\n`);
    payload.receipt = path.relative(ROOT, receipt);
  }

  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log('TNF provider failover');
    console.log(`host: ${payload.host}`);
    console.log(`primary: ${payload.primary.id}${payload.primary.model ? ` (${payload.primary.model})` : ''}`);
    console.log(`chain: ${payload.chain.join(' → ') || '(empty)'}`);
    if (payload.assimilate) console.log(`assimilate: ${payload.assimilate}`);
    if (payload.disabled.length) console.log(`disabled: ${payload.disabled.join(', ')}`);
    console.log(`receipt: ${payload.receipt}`);
    console.log(payload.ok ? '\nFAILOVER POLICY OK' : '\nFAILOVER POLICY EMPTY');
  }
  process.exit(payload.ok ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`provider-failover: ${err.message}`);
  process.exit(1);
}
