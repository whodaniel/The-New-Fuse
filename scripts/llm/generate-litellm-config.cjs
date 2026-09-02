#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Generate a LiteLLM proxy config from TNF's unified catalog.
 *
 * WHY GENERATE RATHER THAN HAND-MAINTAIN
 *   docs/UNIFIED_LLM_CATALOG.md exists because every TNF surface used to keep
 *   its own hardcoded provider list and they drifted. A hand-written
 *   litellm config.yaml would be exactly that mistake again, one surface later.
 *   data/providers/*.json stays the single source of truth; this file is
 *   derived and disposable.
 *
 * Usage
 *   node scripts/llm/generate-litellm-config.cjs                  # cloud providers
 *   node scripts/llm/generate-litellm-config.cjs --include-local  # + localhost
 *   node scripts/llm/generate-litellm-config.cjs --only-configured
 *   node scripts/llm/generate-litellm-config.cjs --nvidia-limit 40
 *   node scripts/llm/generate-litellm-config.cjs --out config/litellm/config.yaml
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const catalogPath = path.join(repoRoot, 'data/providers/catalog.json');
const nvidiaPath = path.join(repoRoot, 'data/providers/nvidia-models.json');

// Providers whose native LiteLLM integration is better than their
// OpenAI-compatible shim (or that have no shim at all). Everything else routes
// through openai/ with an explicit api_base, which is what openaiCompatible
// means in the catalog.
const NATIVE_PREFIX = {
  google: 'gemini',
  anthropic: 'anthropic',
  cohere: 'cohere',
  openai: 'openai',
};

// The same credential is spelled differently across TNF surfaces:
// catalog.json says GOOGLE_API_KEY, apps/api/src/controllers/ai.controller.ts
// reads GEMINI_API_KEY || GOOGLE_AI_API_KEY, and the live Cloud Run service
// actually has GEMINI_API_KEY. Emitting the catalog's spelling verbatim would
// point the proxy at a variable nothing sets, so the one configured provider
// would fail at call time.
//
// Resolve to whichever alias is actually populated; fall back to the catalog's
// spelling when none is, so the generated file stays honest about what it wants.
// Fixing this properly means reconciling the names at the source, but that
// touches every surface reading the shared catalog -- deliberately not done here.
const ENV_KEY_ALIASES = {
  GOOGLE_API_KEY: ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
  TOGETHER_API_KEY: ['TOGETHER_API_KEY', 'TOGETHERAI_API_KEY'],
  DASHSCOPE_API_KEY: ['DASHSCOPE_API_KEY', 'QWEN_API_KEY'],
};

function resolveEnvKey(envKey) {
  const aliases = ENV_KEY_ALIASES[envKey] || [envKey];
  const populated = aliases.find((k) => (process.env[k] || '').trim());
  return { key: populated || envKey, resolved: Boolean(populated), aliases };
}

function parseArgs(argv) {
  const a = {
    includeLocal: false,
    onlyConfigured: false,
    nvidiaLimit: 0,
    out: 'config/litellm/config.yaml',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--include-local') a.includeLocal = true;
    else if (t === '--only-configured') a.onlyConfigured = true;
    else if (t === '--nvidia-limit') a.nvidiaLimit = Number(argv[++i] || 0);
    else if (t === '--out') a.out = argv[++i] || a.out;
    else if (t === '--stdout') a.stdout = true;
    else if (t === '--help' || t === '-h') {
      console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].split('/**')[1]);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${t}`);
  }
  return a;
}

function yamlStr(v) {
  // Quote anything YAML could reinterpret: colons, slashes with leading digits,
  // version-like strings. Model ids such as "openai/gpt-oss-120b" and
  // "qwen2.5-coder:7b" both need it.
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

function entryFor(p, modelId, aliasSuffix) {
  const alias = aliasSuffix ? `${p.id}/${aliasSuffix}` : `${p.id}/${modelId}`;
  const nativePrefix = NATIVE_PREFIX[p.id];
  const lines = [];
  lines.push(`  - model_name: ${yamlStr(alias)}`);
  lines.push('    litellm_params:');

  if (nativePrefix && p.id !== 'openai') {
    // Native integration: LiteLLM owns the transport, no api_base needed.
    lines.push(`      model: ${yamlStr(`${nativePrefix}/${modelId}`)}`);
  } else if (p.id === 'openai') {
    lines.push(`      model: ${yamlStr(`openai/${modelId}`)}`);
  } else {
    // OpenAI-compatible shim behind an explicit base URL.
    lines.push(`      model: ${yamlStr(`openai/${modelId}`)}`);
    lines.push(`      api_base: ${yamlStr(p.baseUrl)}`);
  }

  if (p.envKey) {
    lines.push(`      api_key: ${yamlStr(`os.environ/${resolveEnvKey(p.envKey).key}`)}`);
  } else {
    // Local runtimes accept any non-empty key; LiteLLM still requires the field.
    lines.push('      api_key: "not-needed"');
  }
  lines.push(`    model_info:`);
  lines.push(`      tnf_provider: ${yamlStr(p.id)}`);
  lines.push(`      tnf_tier: ${p.tier}`);
  lines.push(`      tnf_type: ${yamlStr(p.type)}`);
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let providers = (catalog.providers || []).filter((p) => p.enabled !== false);

  if (!args.includeLocal) {
    // Cloud Run cannot reach a localhost provider. Shipping them in a
    // server-side config produces models that exist in the menu and fail on
    // call -- the advertised-tool-with-no-executor shape TNF keeps hitting.
    providers = providers.filter((p) => p.type !== 'local');
  }
  if (args.onlyConfigured) {
    providers = providers.filter((p) => !p.envKey || resolveEnvKey(p.envKey).resolved);
  }

  providers.sort((a, b) => (a.tier ?? 999) - (b.tier ?? 999));

  const entries = [];
  const skipped = [];
  for (const p of providers) {
    if (!p.defaultModel) {
      skipped.push(`${p.id} (no defaultModel in catalog)`);
      continue;
    }
    entries.push(entryFor(p, p.defaultModel));
  }

  // NVIDIA NIM fleet: 202 free models behind one key. Opt-in by count because
  // emitting all of them makes the config unreadable and slows proxy startup.
  let nvidiaAdded = 0;
  if (args.nvidiaLimit > 0) {
    const nv = providers.find((p) => p.id === 'nvidia');
    if (nv && fs.existsSync(nvidiaPath)) {
      const raw = JSON.parse(fs.readFileSync(nvidiaPath, 'utf8'));
      const models = (raw.models || raw || []).filter((m) => m.callable !== false);
      for (const m of models.slice(0, args.nvidiaLimit)) {
        const id = m.id || m.model || m.name;
        if (!id || id === nv.defaultModel) continue;
        entries.push(entryFor(nv, id));
        nvidiaAdded += 1;
      }
    }
  }

  // Fallback chain ordered by catalog tier: cheapest/fastest first, the
  // expensive frontier providers last.
  const chain = providers.filter((p) => p.defaultModel).map((p) => `${p.id}/${p.defaultModel}`);
  const primary = chain[0];
  const rest = chain.slice(1);

  const header = [
    '# GENERATED FILE — DO NOT EDIT BY HAND.',
    '#',
    '# Source of truth: data/providers/catalog.json (+ nvidia-models.json)',
    '# Regenerate:     node scripts/llm/generate-litellm-config.cjs',
    '# Rationale:      docs/UNIFIED_LLM_CATALOG.md',
    '#',
    '# Editing this file directly recreates the per-surface drift the unified',
    '# catalog was built to eliminate. Change the JSON and regenerate.',
    `#`,
    `# providers: ${providers.length}   entries: ${entries.length}` +
      (nvidiaAdded ? `   (incl. ${nvidiaAdded} NVIDIA NIM)` : ''),
    `# generated: ${new Date().toISOString()}`,
    '',
    'model_list:',
  ].join('\n');

  const routerSettings = [
    '',
    'router_settings:',
    '  routing_strategy: simple-shuffle',
    ...(primary && rest.length
      ? [
          '  fallbacks:',
          `    - ${yamlStr(primary)}: [${rest.map((m) => yamlStr(m)).join(', ')}]`,
        ]
      : []),
    '',
    'general_settings:',
    '  # Virtual keys, per-key budgets and spend tracking all require this.',
    '  # Without DATABASE_URL the proxy still routes but records nothing, which',
    '  # is useless for BYOK quotas or any metered tier.',
    '  database_url: "os.environ/DATABASE_URL"',
    '  master_key: "os.environ/LITELLM_MASTER_KEY"',
    '',
    'litellm_settings:',
    '  drop_params: true',
    '  set_verbose: false',
    '',
  ].join('\n');

  const out = `${header}\n${entries.join('\n')}\n${routerSettings}`;

  if (args.stdout) {
    process.stdout.write(out);
  } else {
    const dest = path.join(repoRoot, args.out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    console.log(`[litellm-config] wrote ${args.out}`);
    console.log(`[litellm-config] providers=${providers.length} entries=${entries.length}` +
      (nvidiaAdded ? ` nvidia=${nvidiaAdded}` : ''));
    if (skipped.length) console.log(`[litellm-config] skipped: ${skipped.join(', ')}`);
    const unset = providers.filter((p) => p.envKey && !resolveEnvKey(p.envKey).resolved);
    if (unset.length) {
      console.log(
        `[litellm-config] NOTE ${unset.length} provider(s) have no key in this shell and will fail at call time: ` +
          unset.map((p) => `${p.id}(${resolveEnvKey(p.envKey).aliases.join('|')})`).join(', ')
      );
      console.log('[litellm-config] use --only-configured to emit just the usable ones.');
    }
  }
}

try {
  main();
} catch (e) {
  console.error(`generate-litellm-config failed: ${e.message}`);
  process.exit(1);
}
