/**
 * Canonical LLM provider registry for the desktop Settings surface.
 *
 * Source of truth: `data/providers/catalog.json` — the exact same bytes read
 * by packages/tnf-cli (src/services/provider-config.ts), apps/api
 * (available-models.controller.ts) and the model-watchdog. The hardcoded
 * <option> lists that used to live in Settings.tsx were another drifting
 * copy of "which providers exist": they omitted anthropic, xai, mistral,
 * qwen, moonshot, together, fireworks, perplexity, cohere, novita, lmstudio,
 * localai and textgenwebui, and listed Cerebras which is not in the registry
 * at all.
 *
 * The `aihubmix` entry mirrors a user-layer override loaded at runtime from
 * ~/.config/tnf/providers.json (provider-config.ts layers that file on top
 * of the catalog). A per-machine user layer cannot live in the repo catalog,
 * so its registration coordinates (2026-09-05) are pinned here.
 */
import catalogJson from '../../../../data/providers/catalog.json';

export interface LLMProviderOption {
  id: string;
  /** Display name from the catalog; also used as the <option> value. */
  name: string;
  /** Credential env var, surfaced as a hint next to the API key input. */
  envKey?: string | null;
  /** Resolution preference order — lower is tried first. */
  tier?: number;
  /** True for providers that come from the user layer (~/.config/tnf), not the repo catalog. */
  userLayer?: boolean;
}

interface CatalogEntry {
  id: string;
  name?: string;
  envKey?: string | null;
  tier?: number;
  enabled?: boolean;
}

const CATALOG = catalogJson as { providers?: CatalogEntry[] };

/**
 * User-layer provider mirror. Keep in sync with ~/.config/tnf/providers.json
 * (this machine's registration; the CLI remains the runtime authority).
 */
export const USER_LAYER_PROVIDERS: LLMProviderOption[] = [
  {
    id: 'aihubmix',
    name: 'AIHubMix',
    envKey: 'AIHUBMIX_API_KEY',
    tier: 25,
    userLayer: true,
  },
];

function fromCatalog(entry: CatalogEntry): LLMProviderOption | null {
  if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) return null;
  if (entry.enabled === false) return null;
  return {
    id: entry.id,
    name: typeof entry.name === 'string' && entry.name.trim() ? entry.name : entry.id,
    envKey: typeof entry.envKey === 'string' ? entry.envKey : null,
    tier: typeof entry.tier === 'number' ? entry.tier : undefined,
  };
}

function byTierThenId(a: LLMProviderOption, b: LLMProviderOption): number {
  return (a.tier ?? 999) - (b.tier ?? 999) || a.id.localeCompare(b.id);
}

const catalogProviders = (CATALOG.providers ?? [])
  .map(fromCatalog)
  .filter((p): p is LLMProviderOption => p !== null);

const seen = new Set(catalogProviders.map((p) => p.id));

export const LLM_PROVIDERS: LLMProviderOption[] = [
  ...catalogProviders,
  ...USER_LAYER_PROVIDERS.filter((p) => !seen.has(p.id)),
].sort(byTierThenId);

/** Sentinel for the fallback select — disables failover entirely. */
export const FALLBACK_PROVIDER_NONE = 'None';

/** Registry provider ids, for id-keyed consumers (workflow node data). */
export const LLM_PROVIDER_IDS = LLM_PROVIDERS.map((p) => p.id);

/** Canonical default provider id (NVIDIA-first, mirrors llm-provider-detector). */
export const DEFAULT_PROVIDER_ID = LLM_PROVIDER_IDS.includes('nvidia') ? 'nvidia' : LLM_PROVIDER_IDS[0];

/** Display name of the catalog default, used when nothing valid is stored. */
export const DEFAULT_PROVIDER_NAME =
  LLM_PROVIDERS.find((p) => p.id === 'nvidia')?.name ?? LLM_PROVIDERS[0].name;

/**
 * Guard persisted selections against registry changes: a stored name that no
 * longer resolves (e.g. the removed "Cerebras" option, or a provider disabled
 * in the catalog) falls back to the catalog default instead of rendering a
 * blank select.
 */
export function resolveProviderName(stored: string | undefined, allowNone = false): string {
  if (!stored) return DEFAULT_PROVIDER_NAME;
  if (allowNone && stored === FALLBACK_PROVIDER_NONE) return stored;
  if (LLM_PROVIDERS.some((p) => p.name === stored)) return stored;
  return DEFAULT_PROVIDER_NAME;
}

/**
 * Same guard for id-keyed stored values (workflow node data). `legacyIds`
 * are pre-registry ids that saved graphs may still carry — they stay
 * selectable so old drafts keep rendering, but new selections use registry
 * ids. Unresolvable values fall back to the canonical default id.
 */
export function resolveProviderId(stored: string | undefined, legacyIds: string[] = []): string {
  if (!stored) return DEFAULT_PROVIDER_ID;
  if (LLM_PROVIDER_IDS.includes(stored) || legacyIds.includes(stored)) return stored;
  return DEFAULT_PROVIDER_ID;
}

/** Env keys worth naming in the API key hint, in tier order. */
export const LLM_PROVIDER_ENV_KEYS = LLM_PROVIDERS.map((p) => p.envKey).filter(
  (key): key is string => Boolean(key)
);
