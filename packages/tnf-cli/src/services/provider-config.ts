/**
 * User-configurable LLM provider registry and resolver tolerances.
 *
 * Until 2026-08-05 the provider list lived as a hardcoded `providerConfigs`
 * array inside ModelsService.listProviders(). That made it the fourth
 * competing copy of "which providers exist", alongside
 * `~/.hermes/scripts/model-watchdog.py` (PROVIDER_DEFS),
 * `~/.hermes/skills/rate-limit-failover-routing/`, and the OpenClaw model
 * chain (whose config tree was deleted — see the 2026-08-05 audit). Four
 * lists means four drift surfaces and no single place a user can change
 * behaviour.
 *
 * This module makes that list a user-editable file and gives the resolver its
 * tolerances, following the config convention already established in this
 * package: flat domain files under `~/.config/tnf/` next to
 * `model.default.json` (cf. `mcp/mcp.json`, `agents/agents.json`).
 *
 * Design rules, in order of importance:
 *
 *   1. Never fail closed. A missing or malformed config must degrade to the
 *      built-in defaults so the CLI keeps working.
 *   2. Never fail *silently*. Every degradation is recorded in `warnings` and
 *      surfaced to the caller. A provider list that quietly loses entries is
 *      how a failover chain stops failing over.
 *   3. Defaults stay in code. The file is an override layer, not a
 *      replacement, so a user who deletes a key gets the built-in back rather
 *      than an empty registry.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ProviderDef {
  id: string;
  name: string;
  /** Local endpoints do not require a credential and are probed directly. */
  type: 'cloud' | 'local' | 'custom';
  /** Environment variable holding this provider's credential. */
  envKey: string | null;
  /** Accepted credential aliases, in priority order after envKey. */
  altEnvKeys: string[];
  baseUrl: string;
  /** Provider-specific model discovery path. Defaults to /models. */
  modelsPath: string;
  /** Authentication contract for model discovery. */
  authStyle: 'bearer' | 'query' | 'x-api-key' | 'none';
  /** Some catalogs (notably OpenRouter) can be listed without a key. */
  authOptional: boolean;
  defaultModel?: string;
  /** Durable fallback entries used when live discovery is unavailable. */
  models: string[];
  /** Optional fuller model registry, resolved relative to catalog.json. */
  modelRegistry?: string;
  openaiCompatible?: boolean;
  /**
   * Preference order for tier resolution — lower is tried first. Free and
   * OAuth-backed providers belong at the low end so the resolver reaches for
   * them before anything metered.
   */
  tier: number;
  /** Set false to keep a provider defined but out of resolution. */
  enabled: boolean;
}

export interface ResolverTolerances {
  /** How long a cached model list stays fresh. */
  cacheExpiryMs: number;
  /** Per-provider probe budget. Unbounded fetches are how `--help` hangs. */
  fetchTimeoutMs: number;
}

export type ProviderConfigSource = 'defaults' | 'user' | 'user+defaults';

export interface ProviderConfig {
  providers: ProviderDef[];
  tolerances: ResolverTolerances;
  source: ProviderConfigSource;
  configPath: string;
  /** Non-fatal problems. Always inspected by callers; never swallowed. */
  warnings: string[];
}

/**
 * Built-in registry. Ordered free/OAuth-leaning first so that a user who never
 * writes a config still gets sensible tier ordering.
 */
export const DEFAULT_PROVIDERS: ProviderDef[] = [
  {
    id: 'ollama',
    name: 'Local Ollama',
    type: 'local',
    envKey: null,
    altEnvKeys: [],
    baseUrl: 'http://localhost:11434',
    modelsPath: '/api/tags',
    authStyle: 'none',
    authOptional: true,
    tier: 1,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'llamacpp',
    name: 'Local llama.cpp',
    type: 'local',
    envKey: null,
    altEnvKeys: [],
    baseUrl: 'http://127.0.0.1:8081/v1',
    modelsPath: '/models',
    authStyle: 'none',
    authOptional: true,
    tier: 2,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'google',
    name: 'Google AI',
    type: 'cloud',
    envKey: 'GOOGLE_API_KEY',
    altEnvKeys: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsPath: '/models',
    authStyle: 'query',
    authOptional: false,
    tier: 10,
    enabled: true,
    models: [],
    openaiCompatible: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    type: 'cloud',
    envKey: 'GROQ_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: false,
    tier: 20,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    type: 'cloud',
    envKey: 'NVIDIA_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: false,
    tier: 30,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'cloud',
    envKey: 'DEEPSEEK_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://api.deepseek.com/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: false,
    tier: 40,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'cloud',
    envKey: 'OPENROUTER_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: true,
    tier: 50,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    // SpaceXAI (formerly xAI). Flagship long-running agent model as of 2026-08-12:
    // grok-4.6 (also via OpenRouter as x-ai/grok-4.6). Distinct from Grok Bot ETR.
    id: 'xai',
    name: 'SpaceXAI (xAI)',
    type: 'cloud',
    envKey: 'XAI_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://api.x.ai/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: false,
    tier: 55,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'cloud',
    envKey: 'ANTHROPIC_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://api.anthropic.com/v1',
    modelsPath: '/models',
    authStyle: 'x-api-key',
    authOptional: false,
    tier: 60,
    enabled: true,
    models: [],
    openaiCompatible: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'cloud',
    envKey: 'OPENAI_API_KEY',
    altEnvKeys: [],
    baseUrl: 'https://api.openai.com/v1',
    modelsPath: '/models',
    authStyle: 'bearer',
    authOptional: false,
    tier: 70,
    enabled: true,
    models: [],
    openaiCompatible: true,
  },
];

export const DEFAULT_TOLERANCES: ResolverTolerances = {
  cacheExpiryMs: 24 * 60 * 60 * 1000,
  fetchTimeoutMs: 10_000,
};

/**
 * Resolution order: explicit env override (used by tests and by callers that
 * manage their own config root), then the global convention path.
 */
export function providerConfigPath(): string {
  const override = process.env.TNF_PROVIDER_CONFIG_PATH;
  if (override && override.trim()) return override.trim();
  return path.join(os.homedir(), '.config', 'tnf', 'providers.json');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merge one user-supplied provider entry over a built-in (or accept it as a
 * wholly new provider). Invalid entries are dropped *with a warning* rather
 * than silently ignored.
 */
function mergeProvider(
  raw: unknown,
  index: number,
  base: Map<string, ProviderDef>,
  warnings: string[]
): ProviderDef | null {
  if (!isRecord(raw)) {
    warnings.push(`providers[${index}] is not an object — entry ignored`);
    return null;
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) {
    warnings.push(`providers[${index}] has no "id" — entry ignored`);
    return null;
  }

  const existing = base.get(id);
  const type =
    raw.type === 'local' || raw.type === 'custom' || raw.type === 'cloud'
      ? raw.type
      : (existing?.type ?? 'cloud');
  const envKey =
    typeof raw.envKey === 'string'
      ? raw.envKey.trim() || null
      : raw.envKey === null
        ? null
        : (existing?.envKey ?? null);
  const authStyle =
    raw.authStyle === 'query' ||
    raw.authStyle === 'x-api-key' ||
    raw.authStyle === 'none' ||
    raw.authStyle === 'bearer'
      ? raw.authStyle
      : (existing?.authStyle ?? (type === 'local' ? 'none' : 'bearer'));
  const merged: ProviderDef = {
    id,
    name: typeof raw.name === 'string' ? raw.name : (existing?.name ?? id),
    type,
    envKey,
    altEnvKeys: Array.isArray(raw.altEnvKeys)
      ? raw.altEnvKeys.filter(
          (key): key is string => typeof key === 'string' && Boolean(key.trim())
        )
      : (existing?.altEnvKeys ?? []),
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : (existing?.baseUrl ?? ''),
    modelsPath:
      typeof raw.modelsPath === 'string'
        ? raw.modelsPath
        : (existing?.modelsPath ?? (id === 'ollama' ? '/api/tags' : '/models')),
    authStyle,
    authOptional:
      typeof raw.authOptional === 'boolean'
        ? raw.authOptional
        : (existing?.authOptional ?? (type === 'local' || authStyle === 'none')),
    defaultModel: typeof raw.defaultModel === 'string' ? raw.defaultModel : existing?.defaultModel,
    models: Array.isArray(raw.models)
      ? raw.models.filter((model): model is string => typeof model === 'string' && Boolean(model))
      : (existing?.models ?? []),
    modelRegistry:
      typeof raw.modelRegistry === 'string' ? raw.modelRegistry : existing?.modelRegistry,
    openaiCompatible:
      typeof raw.openaiCompatible === 'boolean' ? raw.openaiCompatible : existing?.openaiCompatible,
    tier:
      typeof raw.tier === 'number' && Number.isFinite(raw.tier)
        ? raw.tier
        : (existing?.tier ?? 100),
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : (existing?.enabled ?? true),
  };

  // A brand-new provider with no endpoint or credential key cannot be probed,
  // so it would silently contribute nothing. Reject it loudly instead.
  if (!merged.baseUrl || (!merged.envKey && !merged.authOptional && merged.type !== 'local')) {
    warnings.push(
      `provider "${id}" is missing ${!merged.baseUrl ? 'baseUrl' : 'envKey'} and cannot be probed — entry ignored`
    );
    return null;
  }

  return merged;
}

function mergeTolerances(raw: unknown, warnings: string[]): ResolverTolerances {
  const out: ResolverTolerances = { ...DEFAULT_TOLERANCES };
  if (raw === undefined) return out;
  if (!isRecord(raw)) {
    warnings.push('"tolerances" is not an object — built-in tolerances used');
    return out;
  }

  for (const key of Object.keys(out) as (keyof ResolverTolerances)[]) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      warnings.push(`tolerances.${key} must be a positive number — built-in value kept`);
      continue;
    }
    out[key] = value;
  }

  for (const key of Object.keys(raw)) {
    if (!(key in out)) warnings.push(`unknown tolerance "${key}" ignored`);
  }

  return out;
}

/**
 * Load the effective provider configuration. Always returns a usable result;
 * inspect `warnings` to report degradation.
 */
/**
 * Path to the shared, language-neutral provider catalog.
 *
 * TNF had four provider lists that drifted apart: this file's
 * DEFAULT_PROVIDERS (7), scripts/swarm/llm-provider-tester.cjs (9, and the
 * only one that knew about local Ollama), the sub-director resolver (2
 * hardcoded constants), and the generated status file. Nothing reconciled
 * them, so a provider added here was invisible to the worker fleet and vice
 * versa. See docs/protocols/TNF_PROVIDER_RESOLUTION_COHERENCE.md.
 *
 * The catalog is JSON precisely so the TypeScript CLI, the CommonJS tester and
 * the Python resolver can all read the same bytes.
 */
export function providerCatalogPath(moduleUrl: string | URL = import.meta.url): string {
  const override = process.env.TNF_PROVIDER_CATALOG_PATH;
  if (override && override.trim()) return override.trim();
  // This package is ESM ("type": "module"), where __dirname does not exist —
  // using it typechecks fine and then throws at runtime, which would have made
  // every consumer degrade silently to built-in defaults. Derive the directory
  // from import.meta.url instead.
  const here = path.dirname(fileURLToPath(moduleUrl));
  // Support each real execution form:
  // - src/services/provider-config.ts (tsx development)
  // - dist/services/provider-config.js (tsc output)
  // - dist/cli.js (single/split bundled entry)
  // - dist/chunks/*.js (split-bundle chunks)
  // The build copies both catalog files under dist/catalog so an installed
  // binary keeps the full provider and NVIDIA registries instead of silently
  // degrading to the smaller embedded fallback.
  const candidates = [
    path.resolve(here, 'catalog', 'catalog.json'),
    path.resolve(here, '..', 'catalog', 'catalog.json'),
    path.resolve(here, '../../../..', 'data', 'providers', 'catalog.json'),
    path.resolve(here, '../../..', 'data', 'providers', 'catalog.json'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

/**
 * Catalog entries as ProviderDef, or null when the catalog is unreadable.
 *
 * Never throws: a missing or malformed catalog must fall back to the built-in
 * defaults rather than leaving the CLI with no providers at all.
 */
export function loadProviderCatalog(): { providers: ProviderDef[]; warning?: string } | null {
  const catalogPath = providerCatalogPath();
  try {
    if (!fs.existsSync(catalogPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const rows = Array.isArray(parsed?.providers) ? parsed.providers : [];
    const providers: ProviderDef[] = [];
    let warning: string | undefined;
    for (const row of rows) {
      if (!isRecord(row)) continue;
      if (typeof row.id !== 'string' || typeof row.baseUrl !== 'string') continue;
      if (row.enabled === false) continue;
      const type: ProviderDef['type'] = row.type === 'local' ? 'local' : 'cloud';
      const authStyle: ProviderDef['authStyle'] =
        row.authStyle === 'query' ||
        row.authStyle === 'x-api-key' ||
        row.authStyle === 'none' ||
        row.authStyle === 'bearer'
          ? row.authStyle
          : row.id === 'google'
            ? 'query'
            : row.id === 'anthropic'
              ? 'x-api-key'
              : type === 'local'
                ? 'none'
                : 'bearer';
      const models = Array.isArray(row.models)
        ? row.models.filter((model: unknown): model is string => typeof model === 'string')
        : [];
      if (typeof row.modelRegistry === 'string') {
        try {
          const registryPath = path.resolve(path.dirname(catalogPath), row.modelRegistry);
          const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
          for (const entry of Array.isArray(registry?.models) ? registry.models : []) {
            const modelId = typeof entry === 'string' ? entry : entry?.id;
            if (typeof modelId === 'string' && !models.includes(modelId)) models.push(modelId);
          }
        } catch (err) {
          // Preserve the inline models and every other provider; a missing
          // secondary registry must not truncate the primary provider list.
          warning = `${row.modelRegistry} unreadable (${(err as Error).message})`;
        }
      }
      providers.push({
        id: row.id,
        name: typeof row.name === 'string' ? row.name : row.id,
        type,
        envKey: typeof row.envKey === 'string' && row.envKey ? row.envKey : null,
        altEnvKeys: Array.isArray(row.altEnvKeys)
          ? row.altEnvKeys.filter((key: unknown): key is string => typeof key === 'string')
          : [],
        baseUrl: row.baseUrl,
        modelsPath:
          typeof row.modelsPath === 'string'
            ? row.modelsPath
            : row.id === 'ollama'
              ? '/api/tags'
              : '/models',
        authStyle,
        authOptional:
          typeof row.authOptional === 'boolean'
            ? row.authOptional
            : type === 'local' || row.id === 'openrouter',
        defaultModel: typeof row.defaultModel === 'string' ? row.defaultModel : undefined,
        models,
        modelRegistry: typeof row.modelRegistry === 'string' ? row.modelRegistry : undefined,
        openaiCompatible:
          typeof row.openaiCompatible === 'boolean' ? row.openaiCompatible : undefined,
        tier: typeof row.tier === 'number' ? row.tier : 100,
        enabled: true,
      });
    }
    return providers.length ? { providers, ...(warning ? { warning } : {}) } : null;
  } catch (err) {
    return { providers: [], warning: `${catalogPath} unreadable (${(err as Error).message})` };
  }
}

export function loadProviderConfig(): ProviderConfig {
  const configPath = providerConfigPath();
  const warnings: string[] = [];

  // Shared catalog first, built-in list as the floor. The user file at
  // providerConfigPath() still layers on top of both, so per-machine overrides
  // keep working exactly as before.
  const catalog = loadProviderCatalog();
  if (catalog?.warning) warnings.push(catalog.warning);
  const DEFAULTS = catalog?.providers?.length ? catalog.providers : DEFAULT_PROVIDERS;

  const base = new Map(DEFAULTS.map((p) => [p.id, { ...p }]));

  if (!fs.existsSync(configPath)) {
    return {
      providers: [...DEFAULTS],
      tolerances: { ...DEFAULT_TOLERANCES },
      source: 'defaults',
      configPath,
      warnings,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    warnings.push(
      `${configPath} is not valid JSON (${(err as Error).message}) — built-in defaults used`
    );
    return {
      providers: [...DEFAULTS],
      tolerances: { ...DEFAULT_TOLERANCES },
      source: 'defaults',
      configPath,
      warnings,
    };
  }

  if (!isRecord(parsed)) {
    warnings.push(`${configPath} must contain a JSON object — built-in defaults used`);
    return {
      providers: [...DEFAULTS],
      tolerances: { ...DEFAULT_TOLERANCES },
      source: 'defaults',
      configPath,
      warnings,
    };
  }

  const tolerances = mergeTolerances(parsed.tolerances, warnings);

  if (parsed.providers === undefined) {
    return {
      providers: [...DEFAULTS],
      tolerances,
      source: 'user+defaults',
      configPath,
      warnings,
    };
  }

  if (!Array.isArray(parsed.providers)) {
    warnings.push('"providers" must be an array — built-in provider list used');
    return {
      providers: [...DEFAULTS],
      tolerances,
      source: 'user+defaults',
      configPath,
      warnings,
    };
  }

  // User entries override built-ins by id; built-ins the user did not mention
  // are preserved, so removing a key never empties the registry.
  const effective = new Map(base);
  parsed.providers.forEach((raw, i) => {
    const merged = mergeProvider(raw, i, base, warnings);
    if (merged) effective.set(merged.id, merged);
  });

  const providers = [...effective.values()].sort(
    (a, b) => a.tier - b.tier || a.id.localeCompare(b.id)
  );

  return {
    providers,
    tolerances,
    source:
      providers.length === DEFAULTS.length && parsed.providers.length === 0
        ? 'user+defaults'
        : 'user',
    configPath,
    warnings,
  };
}
