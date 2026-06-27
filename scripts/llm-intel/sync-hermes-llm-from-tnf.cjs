#!/usr/bin/env node
'use strict';

/**
 * Sync Hermes LLM provider/model settings from TNF canonical sources.
 *
 * Sources (priority order):
 *   ~/.tnf/model-providers.json   — active NVIDIA fleet + priorities
 *   ~/.tnf/llm-config-enhanced.json — fallback chain
 *   ~/.hermes/plugins/nvidia-catalog/nvidia-models.yaml — curated catalog
 *
 * Targets:
 *   ~/.hermes/config.yaml
 *   ~/.hermes/model-fallback-chain.json
 *   ~/.hermes/override-model.yaml
 *   ~/.hermes/.env (TNF_LLM_MODEL only)
 *
 * Also repairs nvidia-catalog plugin max_models=None crash (Hermes 0.17+).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME || process.env.USERPROFILE;
const HERMES = path.join(HOME, '.hermes');
const TNF = path.join(HOME, '.tnf');

const PATHS = {
  modelProviders: path.join(TNF, 'model-providers.json'),
  llmEnhanced: path.join(TNF, 'llm-config-enhanced.json'),
  catalogYaml: path.join(HERMES, 'plugins/nvidia-catalog/nvidia-models.yaml'),
  hermesConfig: path.join(HERMES, 'config.yaml'),
  hermesFallback: path.join(HERMES, 'model-fallback-chain.json'),
  hermesOverride: path.join(HERMES, 'override-model.yaml'),
  hermesEnv: path.join(HERMES, '.env'),
  nvidiaCatalogInit: path.join(HERMES, 'plugins/nvidia-catalog/__init__.py'),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadYaml(file) {
  try {
    return JSON.parse(execSync(`python3 -c "import yaml,json,sys; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))" "${file}"`, { encoding: 'utf8' }));
  } catch (err) {
    throw new Error(`Failed to parse YAML ${file}: ${err.message}`);
  }
}

function dumpYaml(obj) {
  return execSync('python3 -c "import yaml,json,sys; yaml.safe_dump(json.load(sys.stdin), sys.stdout, sort_keys=False, default_flow_style=False)"', {
    input: JSON.stringify(obj),
    encoding: 'utf8',
  });
}

function backup(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(HERMES, 'config-backups');
  fs.mkdirSync(dir, { recursive: true });
  const base = path.basename(file);
  const dest = path.join(dir, `${base}.pre_sync_${ts}`);
  fs.copyFileSync(file, dest);
  return dest;
}

function stripNvidiaPrefix(model) {
  const value = String(model || '').trim();
  return value.startsWith('nvidia/') ? value.slice('nvidia/'.length) : value;
}

function mergeNvidiaModels(mp, llm, catalog) {
  const active = (mp.providers || []).filter((p) => p.active !== false);
  active.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const nvidiaActive = active
    .filter((p) => String(p.endpoint || '').startsWith('https://integrate.api.nvidia.com'))
    .map((p) => stripNvidiaPrefix(p.model));

  const llmNvidia = (llm.availableProviders?.nvidia?.models || []).map((m) => stripNvidiaPrefix(m));

  const catalogIds = (catalog.models || []).map((m) => stripNvidiaPrefix(m.id)).filter(Boolean);

  const seen = new Set();
  const merged = [];
  for (const src of [nvidiaActive, llmNvidia, catalogIds]) {
    for (const m of src) {
      const key = m.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(m);
      }
    }
  }

  // Hermes nvidia provider expects bare integrate.api model ids (no nvidia/ prefix).
  const hermesModels = merged;
  const primary = nvidiaActive[0] || 'minimaxai/minimax-m3';
  const defaultModel = stripNvidiaPrefix(primary);

  return { hermesModels, defaultModel, nvidiaActive, active };
}

function patchNvidiaCatalogPlugin() {
  const file = PATHS.nvidiaCatalogInit;
  if (!fs.existsSync(file)) return { patched: false, reason: 'missing plugin' };
  let src = fs.readFileSync(file, 'utf8');
  const broken = 'def _lap_with_higher_max(*args, max_models=max_override, **kwargs):\n            if max_models < max_override:';
  const fixed = 'def _lap_with_higher_max(*args, max_models=None, **kwargs):\n            if max_models is None or max_models < max_override:';
  if (src.includes(broken)) {
    src = src.replace(broken, fixed);
    fs.writeFileSync(file, src);
    return { patched: true, reason: 'applied max_models=None fix' };
  }
  if (src.includes('max_models is None or max_models < max_override')) {
    return { patched: false, reason: 'already fixed' };
  }
  return { patched: false, reason: 'pattern not found' };
}

function updateEnvModel(defaultModel) {
  if (!fs.existsSync(PATHS.hermesEnv)) return;
  const lines = fs.readFileSync(PATHS.hermesEnv, 'utf8').split('\n');
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith('TNF_LLM_MODEL=')) {
      found = true;
      return `TNF_LLM_MODEL=${stripNvidiaPrefix(defaultModel)}`;
    }
    return line;
  });
  if (!found) out.push(`TNF_LLM_MODEL=${stripNvidiaPrefix(defaultModel)}`);
  fs.writeFileSync(PATHS.hermesEnv, out.join('\n'));
}

function repairHermesCronJobModels(defaultModel) {
  const cronJobsPath = path.join(HERMES, 'cron', 'jobs.json');
  if (!fs.existsSync(cronJobsPath)) return { repaired: 0 };
  const payload = readJson(cronJobsPath);
  if (!payload || !Array.isArray(payload.jobs)) return { repaired: 0 };
  const target = stripNvidiaPrefix(defaultModel);
  let repaired = 0;
  for (const job of payload.jobs) {
    if (!job?.model) continue;
    const normalized = stripNvidiaPrefix(job.model);
    const next =
      normalized === 'mistralai/mistral-small-4-119b-2603' ? target : normalized;
    if (job.model !== next) {
      job.model = next;
      repaired += 1;
    }
  }
  if (repaired > 0) {
    fs.writeFileSync(cronJobsPath, `${JSON.stringify(payload, null, 2)}\n`);
  }
  return { repaired };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  for (const [k, p] of Object.entries(PATHS)) {
    if (k === 'nvidiaCatalogInit') continue;
    if (!fs.existsSync(p)) {
      console.error(`Missing required file: ${p}`);
      process.exit(1);
    }
  }

  const mp = readJson(PATHS.modelProviders);
  const llm = readJson(PATHS.llmEnhanced);
  const catalog = loadYaml(PATHS.catalogYaml);
  const { hermesModels, defaultModel, nvidiaActive, active } = mergeNvidiaModels(mp, llm, catalog);

  const fallbackProviders = nvidiaActive.slice(1, 13).map((m) => ({ provider: 'nvidia', model: m }));
  const fallbackOrder = active
    .filter((p) => String(p.endpoint || '').startsWith('https://integrate.api.nvidia.com'))
    .map((p) => ({
      name: p.model,
      provider: 'nvidia',
      timeout: Math.max(15, Math.min(120, Math.round((p.maxLatencyMs || 30000) / 1000))),
      max_failures: 2,
    }));

  const catalogPatch = patchNvidiaCatalogPlugin();

  console.log('=== sync-hermes-llm-from-tnf ===');
  console.log(`default: ${defaultModel}`);
  console.log(`nvidia models: ${hermesModels.length}`);
  console.log(`fallback_providers: ${fallbackProviders.length}`);
  console.log(`model-fallback-chain entries: ${fallbackOrder.length}`);
  console.log(`nvidia-catalog plugin: ${catalogPatch.reason}`);

  if (dryRun) {
    console.log('\n[dry-run] No files written.');
    process.exit(0);
  }

  const cfgBak = backup(PATHS.hermesConfig);
  const cfg = loadYaml(PATHS.hermesConfig);
  const model = cfg.model && typeof cfg.model === 'object' ? cfg.model : {};
  cfg.model = {
    ...model,
    default: defaultModel,
    provider: 'nvidia',
    base_url: 'https://integrate.api.nvidia.com/v1',
    api_mode: model.api_mode || 'chat_completions',
  };
  cfg.providers = cfg.providers || {};
  cfg.providers.nvidia = {
    ...(cfg.providers.nvidia || {}),
    name: 'NVIDIA NGC',
    api: 'https://integrate.api.nvidia.com/v1',
    default_model: defaultModel,
    models: hermesModels,
  };
  cfg.fallback_providers = fallbackProviders;
  fs.writeFileSync(PATHS.hermesConfig, dumpYaml(cfg));

  const fbBak = backup(PATHS.hermesFallback);
  const fb = {
    primary_model: nvidiaActive[0] || 'minimaxai/minimax-m3',
    fallback_order: fallbackOrder,
    failure_policy: { circuit_breaker_window: 60, backoff_base: 1.3, reset_after: 300 },
    auto_switch: true,
    silent_failover: true,
    log_fallbacks: true,
  };
  fs.writeFileSync(PATHS.hermesFallback, JSON.stringify(fb, null, 2) + '\n');

  fs.writeFileSync(PATHS.hermesOverride, dumpYaml({ model: defaultModel, provider: 'nvidia' }));
  updateEnvModel(defaultModel);
  const cronRepair = repairHermesCronJobModels(defaultModel);

  console.log(`\nWrote ${PATHS.hermesConfig} (backup ${cfgBak})`);
  console.log(`Wrote ${PATHS.hermesFallback} (backup ${fbBak})`);
  if (cronRepair.repaired > 0) {
    console.log(`Repaired ${cronRepair.repaired} Hermes cron job model entr${cronRepair.repaired === 1 ? 'y' : 'ies'}`);
  }
  console.log('Done.');
}

main();
