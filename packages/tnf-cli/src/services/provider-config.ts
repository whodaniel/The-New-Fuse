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

export interface ProviderDef {
  id: string;
  name: string;
  /** Environment variable holding this provider's credential. */
  envKey: string;
  baseUrl: string;
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
    id: 'google',
    name: 'Google AI',
    envKey: 'GOOGLE_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    tier: 10,
    enabled: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    tier: 20,
    enabled: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    envKey: 'NVIDIA_API_KEY',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    tier: 30,
    enabled: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    tier: 40,
    enabled: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    tier: 50,
    enabled: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    tier: 60,
    enabled: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    tier: 70,
    enabled: true,
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
  const merged: ProviderDef = {
    id,
    name: typeof raw.name === 'string' ? raw.name : (existing?.name ?? id),
    envKey: typeof raw.envKey === 'string' ? raw.envKey : (existing?.envKey ?? ''),
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : (existing?.baseUrl ?? ''),
    tier:
      typeof raw.tier === 'number' && Number.isFinite(raw.tier)
        ? raw.tier
        : (existing?.tier ?? 100),
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : (existing?.enabled ?? true),
  };

  // A brand-new provider with no endpoint or credential key cannot be probed,
  // so it would silently contribute nothing. Reject it loudly instead.
  if (!merged.baseUrl || !merged.envKey) {
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
export function loadProviderConfig(): ProviderConfig {
  const configPath = providerConfigPath();
  const warnings: string[] = [];
  const base = new Map(DEFAULT_PROVIDERS.map((p) => [p.id, { ...p }]));

  if (!fs.existsSync(configPath)) {
    return {
      providers: [...DEFAULT_PROVIDERS],
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
      providers: [...DEFAULT_PROVIDERS],
      tolerances: { ...DEFAULT_TOLERANCES },
      source: 'defaults',
      configPath,
      warnings,
    };
  }

  if (!isRecord(parsed)) {
    warnings.push(`${configPath} must contain a JSON object — built-in defaults used`);
    return {
      providers: [...DEFAULT_PROVIDERS],
      tolerances: { ...DEFAULT_TOLERANCES },
      source: 'defaults',
      configPath,
      warnings,
    };
  }

  const tolerances = mergeTolerances(parsed.tolerances, warnings);

  if (parsed.providers === undefined) {
    return {
      providers: [...DEFAULT_PROVIDERS],
      tolerances,
      source: 'user+defaults',
      configPath,
      warnings,
    };
  }

  if (!Array.isArray(parsed.providers)) {
    warnings.push('"providers" must be an array — built-in provider list used');
    return {
      providers: [...DEFAULT_PROVIDERS],
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
      providers.length === DEFAULT_PROVIDERS.length && parsed.providers.length === 0
        ? 'user+defaults'
        : 'user',
    configPath,
    warnings,
  };
}
