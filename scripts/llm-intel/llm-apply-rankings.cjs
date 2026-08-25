#!/usr/bin/env node
/**
 * TNF Open Runtime — apply an explicit operator-owned model policy plan.
 *
 * This tool no longer consumes TNF-generated hosted ranking recommendations.
 * The open runtime can still manage local provider configuration, but the
 * decision belongs to the operator (or an explicitly configured external
 * policy provider) and must arrive as a reviewable plan.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const CONFIG_FILES = {
  modelProviders: path.join(HOME, '.tnf/model-providers.json'),
  customProviders: path.join(HOME, '.tnf/custom-providers.json'),
  llmConfig: path.join(HOME, '.tnf/llm-config.json'),
  providerConfig: path.join(HOME, '.tnf/provider-config.json'),
  hermesFallback: path.join(HOME, '.hermes/model-fallback-chain.json'),
  openclawModels: path.join(HOME, '.openclaw/agents/main/agent/models.json'),
};

function parseArgs(argv) {
  const planIndex = argv.indexOf('--plan');
  return {
    plan: planIndex >= 0 ? argv[planIndex + 1] : process.env.TNF_LOCAL_LLM_POLICY_PLAN,
    apply: argv.includes('--apply') || process.env.TNF_LLM_POLICY_APPLY === '1',
    json: argv.includes('--json'),
  };
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = `${file}.bak-${stamp}`;
  fs.copyFileSync(file, out);
  return out;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('plan must be a JSON object');
  if (!['operator', 'user'].includes(plan.owner)) {
    throw new Error('plan.owner must be "operator" or "user"');
  }
  if (!Array.isArray(plan.changes) || plan.changes.length === 0) {
    throw new Error('plan.changes must be a non-empty array');
  }
  for (const [index, change] of plan.changes.entries()) {
    if (!change || typeof change !== 'object') throw new Error(`change[${index}] must be an object`);
    if (!CONFIG_FILES[change.target]) throw new Error(`change[${index}] unknown target: ${change.target}`);
    if (!change.model || typeof change.model !== 'string') throw new Error(`change[${index}] missing model`);
    if (!['set-priority', 'disable', 'remove', 'add'].includes(change.action)) {
      throw new Error(`change[${index}] unsupported action: ${change.action}`);
    }
    if (change.action === 'set-priority' && !Number.isFinite(Number(change.priority))) {
      throw new Error(`change[${index}] set-priority requires numeric priority`);
    }
  }
}

function modelIdentity(row) {
  return String(row?.id || row?.model || row?.nvidiaId || '');
}

function applyArrayChange(array, change) {
  const index = array.findIndex((row) => modelIdentity(row) === change.model);
  if (change.action === 'add') {
    if (index >= 0) return { changed: false, reason: 'already-present' };
    array.push({ model: change.model, id: change.model, priority: change.priority ?? null });
    return { changed: true };
  }
  if (index < 0) return { changed: false, reason: 'model-not-found' };
  if (change.action === 'remove') {
    array.splice(index, 1);
    return { changed: true };
  }
  if (change.action === 'disable') {
    array[index].disabled = true;
    array[index].enabled = false;
    return { changed: true };
  }
  if (change.action === 'set-priority') {
    array[index].priority = Number(change.priority);
    return { changed: true };
  }
  return { changed: false, reason: 'unsupported' };
}

function applyChange(config, change) {
  if (Array.isArray(config)) return applyArrayChange(config, change);

  for (const key of ['providers', 'models', 'chain']) {
    if (Array.isArray(config?.[key])) return applyArrayChange(config[key], change);
  }

  return { changed: false, reason: 'unsupported-config-shape' };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan) {
    throw new Error('No operator plan. Use --plan <json> or TNF_LOCAL_LLM_POLICY_PLAN. Nothing was changed.');
  }

  const planPath = path.resolve(args.plan);
  const plan = loadJson(planPath);
  validatePlan(plan);

  const preview = plan.changes.map((change) => ({
    target: change.target,
    file: CONFIG_FILES[change.target],
    action: change.action,
    model: change.model,
    priority: change.priority ?? null,
    fileExists: fs.existsSync(CONFIG_FILES[change.target]),
  }));

  if (!args.apply) {
    const payload = {
      ok: true,
      applied: false,
      owner: plan.owner,
      plan: planPath,
      changes: preview,
      instruction: 'Review this plan, then rerun with --apply (or TNF_LLM_POLICY_APPLY=1).',
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const grouped = new Map();
  for (const change of plan.changes) {
    const list = grouped.get(change.target) || [];
    list.push(change);
    grouped.set(change.target, list);
  }

  const receipts = [];
  for (const [target, changes] of grouped.entries()) {
    const file = CONFIG_FILES[target];
    if (!fs.existsSync(file)) {
      receipts.push({ target, file, status: 'skipped', reason: 'file-missing' });
      continue;
    }

    const config = loadJson(file);
    const before = JSON.stringify(config);
    const changeReceipts = changes.map((change) => ({ change, ...applyChange(config, change) }));
    const changed = JSON.stringify(config) !== before;

    if (!changed) {
      receipts.push({ target, file, status: 'unchanged', changes: changeReceipts });
      continue;
    }

    const backupPath = backup(file);
    saveJson(file, config);
    receipts.push({ target, file, status: 'updated', backup: backupPath, changes: changeReceipts });
  }

  const payload = {
    ok: true,
    applied: true,
    owner: plan.owner,
    plan: planPath,
    appliedAt: new Date().toISOString(),
    receipts,
    note: 'Changes came from an explicit operator/user-owned plan; no TNF hosted ranking algorithm was invoked.',
  };
  console.log(JSON.stringify(payload, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
}
