/**
 * Dynamic LLM Provider Detector
 *
 * Inspects environment for API keys, verifies connectivity,
 * and selects the best available provider with working models.
 *
 * Protocol: Inspect → Verify → Select
 *
 * Single source of truth: data/providers/catalog.json (catalog) +
 * data/providers/nvidia-models.json (full NVIDIA NIM catalog). Hardcoded
 * provider/model lists used to live here; they drifted from the same lists
 * in available-models.controller.ts and llm-client.ts. Now both consumers
 * read the shared catalog at module load and merge a small built-in
 * fallback so the CLI still works when the file is missing.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ProviderInfo {
  name: string;
  envKey: string;
  baseUrl: string;
  hasKey: boolean;
  reachable: boolean;
  models: string[];
  selectedModel?: string;
  priority: number;
}

export interface DetectionResult {
  selected: ProviderInfo | null;
  available: ProviderInfo[];
  errors: string[];
}

interface CatalogProvider {
  id: string;
  name?: string;
  envKey?: string | null;
  baseUrl?: string;
  tier?: number;
  enabled?: boolean;
  defaultModel?: string;
  models?: string[];
}

/**
 * Locate the shared provider catalog. Mirrors the resolution logic in
 * provider-config.ts so this detector and the resolver always read the
 * same bytes.
 */
function resolveCatalogPath(): string | null {
  const candidates: string[] = [];
  const override = process.env.TNF_PROVIDER_CATALOG_PATH;
  if (override && override.trim()) candidates.push(override.trim());
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    // packages/tnf-cli/src/utils -> repo root
    candidates.push(path.resolve(here, '../../../..', 'data', 'providers', 'catalog.json'));
  } catch {
    // import.meta.url unavailable in CJS fallback
  }
  candidates.push(path.resolve(process.cwd(), 'data/providers/catalog.json'));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Provider priority order (higher = more preferred).
 * Built-in fallback used ONLY when the catalog is unreadable. The catalog
 * itself orders providers by `tier`; the priority field here lets a
 * resolver bias specific providers (e.g. nvidia=12 because it's the only
 * provider currently returning 200s with a stable key).
 *
 * OpenRouter kept at priority 0 — credits exhausted 2026-05-17 (HTTP 402),
 * still in catalog but never auto-selects first.
 */
const BUILTIN_PRIORITY: Record<string, number> = {
  nvidia: 12,
  groq: 9,
  sambanova: 8,
  cerebras: 7,
  deepseek: 6,
  gemini: 4,
  openai: 3,
  openrouter: 0, // DEAD — credits exhausted
};

/**
 * Built-in fallback model lists. Used only when the catalog has no `models`
 * array for a provider — keeps the detector working in air-gapped or
 * first-boot scenarios.
 */
const BUILTIN_MODELS: Record<string, string[]> = {
  nvidia: [
    'nvidia/nemotron-3-ultra-550b-a55b',
    'thinkingmachines/inkling',
    'poolside/laguna-xs-2.1',
    'z-ai/glm-5.2',
    'minimaxai/minimax-m3',
    'openai/gpt-oss-120b',
    'meta/llama-3.3-70b-instruct',
    'meta/llama-guard-4-12b',
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct'],
  sambanova: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
  cerebras: ['llama-3.3-70b', 'llama-3.1-8b'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat-v3-0324',
    'google/gemma-2-9b-it:free',
  ],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
};

/** Provider endpoint catalog (built-in fallback). */
const BUILTIN_PROVIDERS: Array<{
  name: string;
  envKey: string;
  baseUrl: string;
}> = [
  { name: 'nvidia', envKey: 'NVIDIA_API_KEY', baseUrl: 'https://integrate.api.nvidia.com/v1' },
  { name: 'groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1' },
  { name: 'sambanova', envKey: 'SAMBANOVA_API_KEY', baseUrl: 'https://api.sambanova.ai/v1' },
  { name: 'cerebras', envKey: 'CEREBRAS_API_KEY', baseUrl: 'https://api.cerebras.ai/v1' },
  { name: 'deepseek', envKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'openrouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1' },
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  },
  { name: 'openai', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1' },
];

interface LoadedRegistry {
  providers: CatalogProvider[];
  warnings: string[];
}

let cachedRegistry: LoadedRegistry | null = null;

/**
 * Load provider metadata + model lists from the shared catalog. Cached
 * after the first call so we don't re-read the JSON on every probe.
 */
function loadRegistry(): LoadedRegistry {
  if (cachedRegistry) return cachedRegistry;
  const warnings: string[] = [];
  const catalogPath = resolveCatalogPath();
  if (!catalogPath) {
    warnings.push('data/providers/catalog.json not found — using built-in defaults');
    cachedRegistry = {
      providers: BUILTIN_PROVIDERS.map((p) => ({
        id: p.name,
        name: p.name,
        envKey: p.envKey,
        baseUrl: p.baseUrl,
        tier: 50,
        enabled: true,
        models: BUILTIN_MODELS[p.name] || [],
      })),
      warnings,
    };
    return cachedRegistry;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const rows = Array.isArray(raw?.providers) ? raw.providers : [];
    const providers: CatalogProvider[] = rows
      .filter((r: CatalogProvider) => r && r.id && r.enabled !== false && r.envKey)
      .map((r: CatalogProvider) => ({
        id: r.id,
        name: r.name || r.id,
        envKey: r.envKey,
        baseUrl: r.baseUrl,
        tier: typeof r.tier === 'number' ? r.tier : 50,
        enabled: r.enabled !== false,
        defaultModel: r.defaultModel,
        models: Array.isArray(r.models) ? r.models : BUILTIN_MODELS[r.id] || [],
      }));
    if (providers.length === 0) {
      warnings.push(`${catalogPath} contained no usable providers — using built-in defaults`);
      cachedRegistry = { providers: [], warnings };
    } else {
      cachedRegistry = { providers, warnings };
    }
  } catch (err) {
    warnings.push(
      `${catalogPath} unreadable (${(err as Error).message}) — using built-in defaults`
    );
    cachedRegistry = { providers: [], warnings };
  }
  return cachedRegistry;
}

/**
 * Provider model list, merged: catalog.models wins, built-in fallback
 * supplies missing entries so the CLI keeps working if the catalog is
 * stale.
 */
function resolveModelsForProvider(providerId: string): string[] {
  const reg = loadRegistry();
  const fromCatalog = reg.providers.find((p) => p.id === providerId)?.models || [];
  const builtin = BUILTIN_MODELS[providerId] || [];
  // Verified/live entries from the catalog come first; everything else after.
  // Dedup preserving order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of fromCatalog) {
    if (!seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  for (const m of builtin) {
    if (!seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  return out;
}

/**
 * Public accessor — exposed so other modules (CLI list command, API
 * controllers) can share the resolved list without re-implementing the
 * catalog lookup.
 */
export function getProviderModels(providerId: string): string[] {
  return resolveModelsForProvider(providerId);
}

export function getProviderPriority(providerId: string): number {
  return BUILTIN_PRIORITY[providerId] ?? 50;
}

export function listConfiguredProviders(): Array<{
  name: string;
  envKey: string;
  baseUrl: string;
}> {
  const reg = loadRegistry();
  if (reg.providers.length > 0) {
    return reg.providers.map((p) => ({
      name: p.id,
      envKey: p.envKey as string,
      baseUrl: p.baseUrl as string,
    }));
  }
  return BUILTIN_PROVIDERS;
}

/** Clear the in-memory registry cache — used by tests and live-refresh tooling. */
export function clearRegistryCache(): void {
  cachedRegistry = null;
}

/**
 * Detect available providers from environment
 */
export async function detectProviders(): Promise<DetectionResult> {
  const providers: ProviderInfo[] = [];
  const errors: string[] = [];

  // INSPECT: surface any registry load warnings before listing providers
  const reg = loadRegistry();
  errors.push(...reg.warnings);

  // Pull the catalog provider list (envKey + baseUrl); fall back to the
  // built-in endpoint table when the catalog is missing.
  const catalog = listConfiguredProviders();

  // Pre-resolve model lists once (the catalog has 90+ NVIDIA models now).
  const modelsByName = new Map<string, string[]>(
    catalog.map((p) => [p.name, resolveModelsForProvider(p.name)])
  );

  for (const provider of catalog) {
    const apiKey = process.env[provider.envKey];
    const hasKey = !!apiKey && apiKey !== 'missing-key' && apiKey.length > 10;

    const info: ProviderInfo = {
      name: provider.name,
      envKey: provider.envKey,
      baseUrl: provider.baseUrl,
      hasKey,
      reachable: false,
      models: modelsByName.get(provider.name) || [],
      priority: BUILTIN_PRIORITY[provider.name] || 50,
    };

    if (hasKey) {
      // VERIFY: Test connectivity
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${provider.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeout);

        if (response?.ok) {
          info.reachable = true;
          // Could parse models from response if needed
        } else if (response?.status === 401) {
          errors.push(`${provider.name}: API key invalid (401)`);
          info.hasKey = false;
        } else if (response?.status === 429) {
          errors.push(`${provider.name}: Rate limited (429)`);
          info.reachable = true; // Still usable, just limited
        }
      } catch (err: any) {
        errors.push(`${provider.name}: Connection failed - ${err.message}`);
      }
    }

    providers.push(info);
  }

  // SELECT: Choose best available provider
  const available = providers
    .filter((p) => p.hasKey && (p.reachable || p.name === 'nvidia')) // NVIDIA always usable if key present
    .sort((a, b) => b.priority - a.priority);

  const selected = available.length > 0 ? available[0] : null;

  // Set selected model for chosen provider
  if (selected && selected.models.length > 0) {
    selected.selectedModel = selected.models[0];
  }

  return {
    selected,
    available,
    errors,
  };
}

/**
 * Get best model for a provider
 */
export function getBestModel(providerName: string): string {
  const models = resolveModelsForProvider(providerName);
  if (!models || models.length === 0) {
    return 'model-auto';
  }
  return models[0];
}

/**
 * Report detection results
 */
export function reportDetection(result: DetectionResult): void {
  console.log('=== LLM Provider Detection ===\n');

  if (result.selected) {
    console.log(`✅ Selected: ${result.selected.name}`);
    console.log(`   Model: ${result.selected.selectedModel}`);
    console.log(`   Priority: ${result.selected.priority}`);
  } else {
    console.log('⚠️  No providers available');
  }

  console.log(`\n📊 Available: ${result.available.length}`);
  for (const p of result.available) {
    console.log(`   - ${p.name} (priority: ${p.priority}, reachable: ${p.reachable})`);
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.log(`   - ${err}`);
    }
  }
  console.log('');
}
