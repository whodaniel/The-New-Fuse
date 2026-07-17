#!/usr/bin/env node
/**
 * resolve-harness-context.cjs
 *
 * Adaptive starting context for TNF harness / agent-network Terminals.
 * Replaces stale hard-coded models/providers/hosts with a fresh resolution
 * from: user profile, model-providers catalog, model-policy, runtime-state,
 * PATH-available CLIs, and live host probes.
 *
 * Outputs (under .agent/runtime-state/ by default):
 *   harness-context.latest.json  — machine receipt
 *   harness-context.env          — sourceable by Terminal launch scripts
 *   harness-context.md           — short operator/agent frontload snippet
 *
 * Usage:
 *   node scripts/runtime/resolve-harness-context.cjs [--force] [--json] [--ttl-seconds N]
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT =
  process.env.TNF_REPO_ROOT ||
  process.env.TNF_ROOT_DIR ||
  path.resolve(__dirname, '../..');
const HOME = process.env.HOME || os.homedir();
const TNF_HOME = process.env.TNF_HOME || path.join(HOME, '.tnf');
const RUNTIME_STATE = path.join(ROOT, '.agent', 'runtime-state');
const DEFAULT_TTL_SECONDS = Number(process.env.TNF_HARNESS_CONTEXT_TTL_SECONDS || 900);

function parseArgs(argv) {
  const out = { force: false, json: false, ttlSeconds: DEFAULT_TTL_SECONDS, profile: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') out.force = true;
    else if (a === '--json') out.json = true;
    else if (a === '--ttl-seconds' && argv[i + 1]) {
      out.ttlSeconds = Math.max(60, parseInt(argv[++i], 10) || DEFAULT_TTL_SECONDS);
    } else if (a === '--profile' && argv[i + 1]) {
      out.profile = argv[++i];
    }
  }
  return out;
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return '';
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function commandExists(cmd) {
  if (!cmd) return false;
  const r = spawnSync('bash', ['-lc', `command -v ${JSON.stringify(cmd)}`], {
    encoding: 'utf8',
  });
  return r.status === 0 && Boolean((r.stdout || '').trim());
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function resolveProfile(preferredCallsign) {
  const profilesDir = path.join(TNF_HOME, 'profiles');
  const defaultName = readText(path.join(profilesDir, 'default')) || 'goldberg';
  const callsign = preferredCallsign || process.env.TNF_PROFILE || defaultName;
  const active = readJson(path.join(profilesDir, 'active.json'));
  const named = readJson(path.join(profilesDir, `${callsign}.json`));
  const profile = named || active || {
    callsign,
    tnf_account_id: `${callsign}@thenewfuse.com`,
    harness: {},
  };
  return { callsign: profile.callsign || callsign, profile };
}

function loadActiveProviders() {
  const catalog = readJson(path.join(TNF_HOME, 'model-providers.json'));
  if (!catalog || !Array.isArray(catalog.providers)) return [];
  return catalog.providers
    .filter((p) => p && p.active !== false && p.model)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

function providerFamily(provider) {
  const blob = `${provider.id || ''} ${provider.name || ''} ${provider.model || ''} ${provider.endpoint || ''}`.toLowerCase();
  if (/gemini|google/.test(blob)) return 'google';
  if (/anthropic|claude/.test(blob)) return 'anthropic';
  if (/openai|gpt-oss|gpt-/.test(blob)) return 'openai';
  if (/nvidia|minimax|mistral|llama|integrate\.api\.nvidia/.test(blob)) return 'nvidia';
  if (/openrouter/.test(blob)) return 'openrouter';
  if (/deepseek/.test(blob)) return 'deepseek';
  if (/neuralwatt|glm/.test(blob)) return 'neuralwatt';
  return 'other';
}

function detectCliSurface() {
  return {
    agy: commandExists('agy'),
    gemini: commandExists('gemini'),
    claude: commandExists('claude'),
    hermes: commandExists('hermes'),
    pi: commandExists('pi'),
    opencode: commandExists('opencode'),
    openclaw: commandExists('openclaw'),
    cursor: commandExists('cursor'),
  };
}

function resolveHosts() {
  const redisFromRuntime = readText(path.join(RUNTIME_STATE, 'redis-url.txt'));
  const apiFromRuntime = readText(path.join(RUNTIME_STATE, 'live-api-url.txt'));
  const redis =
    process.env.REDIS_URL ||
    redisFromRuntime ||
    'redis://127.0.0.1:6379';
  let api =
    process.env.TNF_API_BASE ||
    process.env.LEDGER_API_BASE ||
    process.env.CLOUD_RUNTIME_API_URL ||
    apiFromRuntime ||
    'https://api.thenewfuse.com';

  // Soft probe: if configured local API is down, prefer live.
  if (/localhost|127\.0\.0\.1/.test(api)) {
    const probe = spawnSync(
      'curl',
      ['-fsS', '--max-time', '1', `${api.replace(/\/$/, '')}/api/health`],
      { encoding: 'utf8' }
    );
    if (probe.status !== 0) {
      api = 'https://api.thenewfuse.com';
    }
  }

  const relayPort = process.env.RELAY_PORT || '3000';
  const relayUrl =
    process.env.RELAY_URL ||
    process.env.TNF_RELAY_URL ||
    `ws://127.0.0.1:${relayPort}/ws`;

  return {
    redisUrl: redis,
    apiBase: api.replace(/\/$/, ''),
    relayUrl,
    relayPort: String(relayPort),
    publicBase: process.env.TNF_PUBLIC_BASE || 'https://thenewfuse.com',
  };
}

function pickModelForFamily(providers, family) {
  const hit = providers.find((p) => providerFamily(p) === family);
  return hit || null;
}

function buildWatchdogChain(providers, clis) {
  const disabled = new Set(
    String(process.env.MODEL_WATCHDOG_DISABLED_PROVIDERS || process.env.TNF_DISABLED_PROVIDERS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const preferred = [];
  const seen = new Set();
  const push = (id) => {
    if (!id || seen.has(id) || disabled.has(id)) return;
    seen.add(id);
    preferred.push(id);
  };

  // Catalog priority wins. Do NOT put google first just because `agy` is installed —
  // that caused failover loops while nvidia was the active primary.
  for (const p of providers) push(providerFamily(p));
  if (clis.claude) push('anthropic');
  // Only append google as a fallback when a google catalog entry exists (or CLI is present).
  if (providers.some((p) => providerFamily(p) === 'google') || clis.agy || clis.gemini) {
    push('google');
  }
  ['openai', 'openrouter', 'nvidia', 'deepseek', 'neuralwatt'].forEach(push);
  return preferred.join(',');
}

function buildContext(args) {
  const generatedAt = new Date().toISOString();
  const { callsign, profile } = resolveProfile(args.profile);
  const providers = loadActiveProviders();
  const clis = detectCliSurface();
  const hosts = resolveHosts();
  const harnessProfile = (profile && profile.harness) || {};

  const primary = providers[0] || null;
  const google = pickModelForFamily(providers, 'google');
  const anthropic = pickModelForFamily(providers, 'anthropic');
  const nvidia = pickModelForFamily(providers, 'nvidia');

  const geminiModel =
    process.env.GEMINI_MODEL ||
    harnessProfile.geminiModel ||
    (google && google.model) ||
    'gemini-2.5-flash';
  const geminiFallbacks =
    process.env.GEMINI_FALLBACK_MODELS ||
    harnessProfile.geminiFallbacks ||
    providers
      .filter((p) => providerFamily(p) === 'google')
      .map((p) => p.model)
      .slice(0, 3)
      .join(',') ||
    `${geminiModel}`;

  const piModel =
    process.env.PI_MODEL ||
    harnessProfile.piModel ||
    (primary && primary.model) ||
    (nvidia && nvidia.model) ||
    '';
  const piProvider =
    process.env.PI_PROVIDER ||
    harnessProfile.piProvider ||
    (primary ? providerFamily(primary) : '') ||
    '';

  const workingModel =
    process.env.TNF_WORKING_MODEL ||
    harnessProfile.workingModel ||
    (primary && primary.model) ||
    piModel ||
    geminiModel;

  const llmBaseUrl =
    process.env.TNF_LLM_BASE_URL ||
    harnessProfile.llmBaseUrl ||
    (primary && primary.endpoint) ||
    '';

  const watchdogChain =
    process.env.MODEL_WATCHDOG_PROVIDER_CHAIN ||
    harnessProfile.providerChain ||
    buildWatchdogChain(providers, clis);

  const geminiCmd =
    process.env.GEMINI_CMD ||
    harnessProfile.geminiCmd ||
    (clis.agy ? 'agy' : clis.gemini ? 'gemini' : 'agy');

  const primaryFamily = primary ? providerFamily(primary) : '';
  const forceGeminiWrapper =
    process.env.TNF_FORCE_GEMINI_WRAPPER === '1' || harnessProfile.forceGeminiWrapper === true;
  // Gemini CLI only speaks Google. On nvidia/minimax-primary profiles, skip it unless forced.
  const skipGeminiWrapper =
    !forceGeminiWrapper &&
    Boolean(primaryFamily) &&
    primaryFamily !== 'google' &&
    process.env.TNF_SKIP_GEMINI_WRAPPER !== '0';

  const handoff = readJson(path.join(ROOT, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'));
  const livingPreview = readText(path.join(ROOT, 'docs/protocols/LIVING_STATE.md'))
    .split('\n')
    .slice(0, 12)
    .join('\n');

  const env = {
    TNF_HARNESS_CONTEXT_GENERATED_AT: generatedAt,
    TNF_PROFILE: callsign,
    TNF_ACCOUNT_ID: profile.tnf_account_id || `${callsign}@thenewfuse.com`,
    TNF_REPO_ROOT: ROOT,
    TNF_HOME: TNF_HOME,
    REDIS_URL: hosts.redisUrl,
    TNF_API_BASE: hosts.apiBase,
    LEDGER_API_BASE: hosts.apiBase,
    RELAY_URL: hosts.relayUrl,
    RELAY_PORT: hosts.relayPort,
    TNF_PUBLIC_BASE: hosts.publicBase,
    TNF_WORKING_MODEL: workingModel,
    TNF_LLM_BASE_URL: llmBaseUrl,
    GEMINI_CMD: geminiCmd,
    GEMINI_MODEL: geminiModel,
    GEMINI_FALLBACK_MODELS: geminiFallbacks,
    GEMINI_DISABLED: skipGeminiWrapper ? '1' : '',
    TNF_SKIP_GEMINI_WRAPPER: skipGeminiWrapper ? '1' : '',
    PI_MODEL: piModel,
    PI_PROVIDER: piProvider,
    MODEL_WATCHDOG_PROVIDER_CHAIN: watchdogChain,
    TNF_ONBOARDED: '1',
    TNF_HARNESS_ADAPTIVE: '1',
    AGENT_PLATFORM_DEFAULT: 'tnf-harness',
  };

  // Drop empty values so wrappers keep their own adaptive defaults.
  for (const [k, v] of Object.entries(env)) {
    if (v === '' || v == null) delete env[k];
  }

  return {
    version: 1,
    generatedAt,
    ttlSeconds: args.ttlSeconds,
    profile: {
      callsign,
      tnf_account_id: env.TNF_ACCOUNT_ID,
      source: path.join(TNF_HOME, 'profiles'),
    },
    hosts,
    clis,
    models: {
      workingModel,
      geminiModel,
      geminiFallbacks: geminiFallbacks.split(',').filter(Boolean),
      piModel: piModel || null,
      piProvider: piProvider || null,
      skipGeminiWrapper,
      llmBaseUrl: llmBaseUrl || null,
      primaryProvider: primary
        ? { id: primary.id, model: primary.model, endpoint: primary.endpoint, priority: primary.priority }
        : null,
      activeProviderCount: providers.length,
      watchdogChain: watchdogChain.split(',').filter(Boolean),
    },
    session: {
      handoffId: handoff?.handoff_id || handoff?.handoffId || null,
      livingPreview,
    },
    env,
    notes: [
      'Generated by scripts/runtime/resolve-harness-context.cjs',
      'Terminal launches should source harness-context.env before wrappers.',
      skipGeminiWrapper
        ? 'Gemini wrapper skipped: primary provider is not google (set TNF_FORCE_GEMINI_WRAPPER=1 to override).'
        : 'Gemini wrapper enabled for google-primary / forced mode.',
      'Re-run with --force after changing ~/.tnf/model-providers.json or profile harness overrides.',
    ],
  };
}

function writeOutputs(ctx) {
  fs.mkdirSync(RUNTIME_STATE, { recursive: true });
  const jsonPath = path.join(RUNTIME_STATE, 'harness-context.latest.json');
  const envPath = path.join(RUNTIME_STATE, 'harness-context.env');
  const mdPath = path.join(RUNTIME_STATE, 'harness-context.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(ctx, null, 2)}\n`);

  const envLines = Object.entries(ctx.env)
    .map(([k, v]) => `export ${k}=${shellQuote(v)}`)
    .join('\n');
  fs.writeFileSync(
    envPath,
    `# TNF adaptive harness context — generated ${ctx.generatedAt}\n# Do not edit by hand; regenerate via resolve-harness-context.cjs\n${envLines}\n`
  );

  const md = `# TNF Adaptive Harness Context

Generated: \`${ctx.generatedAt}\`  
Profile: **${ctx.profile.callsign}** (\`${ctx.profile.tnf_account_id}\`)  
TTL: ${ctx.ttlSeconds}s

## Live hosts
- Redis: \`${ctx.hosts.redisUrl}\`
- API: \`${ctx.hosts.apiBase}\`
- Relay: \`${ctx.hosts.relayUrl}\`

## Models / providers
- Working model: \`${ctx.models.workingModel}\`
- Gemini: \`${ctx.models.geminiModel}\` (fallbacks: ${ctx.models.geminiFallbacks.join(', ') || 'n/a'})
- Pi: \`${ctx.models.piModel || 'unset'}\` / provider \`${ctx.models.piProvider || 'unset'}\`
- Watchdog chain: \`${ctx.models.watchdogChain.join(' → ')}\`
- Active catalog providers: ${ctx.models.activeProviderCount}

## CLI surfaces detected
${Object.entries(ctx.clis)
  .map(([k, v]) => `- ${k}: ${v ? 'yes' : 'no'}`)
  .join('\n')}

## Session
- Handoff: \`${ctx.session.handoffId || 'none'}\`

Source this env before agent wrappers:

\`\`\`bash
source ${envPath}
\`\`\`
`;
  fs.writeFileSync(mdPath, md);

  return { jsonPath, envPath, mdPath };
}

function isFresh(jsonPath, ttlSeconds) {
  const existing = readJson(jsonPath);
  if (!existing?.generatedAt) return false;
  const ageMs = Date.now() - Date.parse(existing.generatedAt);
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs < ttlSeconds * 1000;
}

function main() {
  const args = parseArgs(process.argv);
  const jsonPath = path.join(RUNTIME_STATE, 'harness-context.latest.json');
  const envPath = path.join(RUNTIME_STATE, 'harness-context.env');

  if (!args.force && isFresh(jsonPath, args.ttlSeconds) && fs.existsSync(envPath)) {
    const existing = readJson(jsonPath);
    if (args.json) {
      console.log(JSON.stringify({ reused: true, context: existing }, null, 2));
    } else {
      console.log(`[harness-context] reused (age < ${args.ttlSeconds}s): ${jsonPath}`);
      console.log(`[harness-context] env: ${envPath}`);
    }
    process.exit(0);
  }

  const ctx = buildContext(args);
  const paths = writeOutputs(ctx);
  if (args.json) {
    console.log(JSON.stringify({ reused: false, paths, context: ctx }, null, 2));
  } else {
    console.log(`[harness-context] wrote ${paths.jsonPath}`);
    console.log(`[harness-context] env ${paths.envPath}`);
    console.log(
      `[harness-context] profile=${ctx.profile.callsign} model=${ctx.models.workingModel} api=${ctx.hosts.apiBase}`
    );
  }
}

main();
