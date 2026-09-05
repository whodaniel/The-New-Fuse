/**
 * Offline fallback LLM catalog for TNF desktop Create Agent.
 *
 * Registry layer: provider entries are derived from data/providers/catalog.json
 * (the same bytes read by packages/tnf-cli, apps/api's available-models
 * endpoint and the Settings surface) via src/config/llmProviders.ts, so the
 * offline fallback covers the FULL canonical registry instead of a
 * hand-maintained subset that silently drifts.
 *
 * Model layer (hybrid, marked per provider):
 *  - providers whose catalog entry carries inline models use those bytes
 *    verbatim (nvidia, google, groq, perplexity, cohere, anthropic, openai);
 *  - providers whose catalog entry has no inline models use a curated list in
 *    CURATED_MODEL_FALLBACKS below;
 *  - everything else ships with an empty model list — Create Agent renders a
 *    "connect to API for live discovery" placeholder rather than stale ids.
 *
 * Desktop-only surfaces (chrome-ai, google-gemma, edge-slm) are on-device
 * catalogs that exist only in this app; they are intentionally not part of
 * the LLM provider registry. The "Cerebras" entry from earlier revisions was
 * dropped: it is not in the canonical registry. NVIDIA-first default order is
 * preserved (parity with packages/tnf-cli/src/utils/llm-provider-detector.ts).
 */
import catalogJson from '../../../../data/providers/catalog.json';
import { LLM_PROVIDERS } from './llmProviders';

export interface CatalogProvider {
  id: string;
  name: string;
  models: string[];
  priority: number;
}

interface CatalogEntry {
  id: string;
  models?: string[];
}

const CATALOG = catalogJson as { providers?: CatalogEntry[] };

/** Model lists for registry providers whose catalog entry has no inline models. */
const CURATED_MODEL_FALLBACKS: Record<string, string[]> = {
  // Known-good AIHubMix coding-plan endpoints (user-layer provider; current
  // session default model first).
  aihubmix: ['coding-glm-5.3', 'glm-5.3'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat-v3-0324',
    'google/gemma-2-9b-it:free',
    'google/gemma-3-12b-it:free',
  ],
  sambanova: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
};

/**
 * On-device / free surfaces specific to the desktop app. Not LLM registry
 * providers — kept verbatim from earlier revisions.
 */
const DESKTOP_ONLY_SURFACES: CatalogProvider[] = [
  {
    id: 'chrome-ai',
    name: 'Chrome Built-in AI (On-Device / Free)',
    priority: 11,
    models: [
      'gemini-nano-prompt-api',
      'gemini-nano-summarizer',
      'gemini-nano-writer',
      'gemini-nano-rewriter',
      'gemini-nano-translator',
    ],
  },
  {
    id: 'google-gemma',
    name: 'Google Gemma (Apache 2.0 / Edge)',
    priority: 10,
    models: [
      'gemma-4-e2b',
      'gemma-4-e4b',
      'gemma-4-12b-unified',
      'gemma-4-26b-moe',
      'gemma-4-31b',
      'paligemma-2-10b',
      'gemma-3-1b',
      'gemma-3-4b',
      'gemma-3-12b',
      'gemma-3-27b',
    ],
  },
  {
    id: 'edge-slm',
    name: 'Edge & WebGPU SLMs (Local / $0)',
    priority: 10,
    models: [
      'qwen-2.5-coder-0.5b',
      'qwen-2.5-coder-1.5b',
      'qwen-2.5-coder-3b',
      'qwen-2.5-coder-7b',
      'smollm2-135m',
      'smollm2-360m',
      'smollm2-1.7b',
      'llama-3.2-1b',
      'llama-3.2-3b',
      'phi-4-mini',
    ],
  },
];

const catalogModelsById = new Map<string, string[]>();
for (const entry of CATALOG.providers ?? []) {
  if (entry && typeof entry.id === 'string') {
    catalogModelsById.set(entry.id, Array.isArray(entry.models) ? entry.models : []);
  }
}

/**
 * Registry-derived entries: canonical LLM_PROVIDERS order (tier asc), NVIDIA
 * hoisted to the front to preserve the NVIDIA-first default. Priorities are
 * informational for the offline path; live mode replaces this list entirely.
 */
function buildRegistryEntries(): CatalogProvider[] {
  let priority = 9;
  return LLM_PROVIDERS.map((provider) => {
    const curated = CURATED_MODEL_FALLBACKS[provider.id];
    const models = (catalogModelsById.get(provider.id) ?? []).length
      ? (catalogModelsById.get(provider.id) as string[])
      : (curated ?? []);
    const entry: CatalogProvider = {
      id: provider.id,
      name: provider.name,
      models: [...models],
      priority: provider.id === 'nvidia' ? 12 : Math.max(priority--, 0),
    };
    return entry;
  }).sort((a, b) => {
    if (a.id === 'nvidia') return -1;
    if (b.id === 'nvidia') return 1;
    return 0; // preserve canonical (tier) order otherwise
  });
}

export const VERIFIED_PROVIDER_CATALOG: CatalogProvider[] = [
  ...buildRegistryEntries(),
  ...DESKTOP_ONLY_SURFACES,
];

export function defaultProviderId(): string {
  return VERIFIED_PROVIDER_CATALOG[0]?.id || 'nvidia';
}

export function modelsForProvider(providerId: string): string[] {
  return VERIFIED_PROVIDER_CATALOG.find((p) => p.id === providerId)?.models || [];
}
