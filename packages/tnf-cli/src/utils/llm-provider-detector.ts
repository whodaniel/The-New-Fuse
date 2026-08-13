/**
 * Dynamic LLM Provider Detector
 *
 * Inspects environment for API keys, verifies connectivity,
 * and selects the best available provider with working models.
 *
 * Protocol: Inspect → Verify → Select
 */

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

/**
 * Provider priority order (higher = more preferred)
 * Based on cost, speed, and capability
 * Updated 2026-06-29 from active session intel.
 *
 * Note: OpenRouter credits exhausted 2026-05-17 (HTTP 402) — kept in catalog
 * but demoted to priority 0 so it never auto-selects first. NVIDIA is the
 * only provider currently returning 200s with a stable key.
 */
const PROVIDER_PRIORITY: Record<string, number> = {
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
 * Known working models per provider (updated 2026-07-17).
 *
 * Order within each array = fallback preference (index 0 first).
 * Models pulled from:
 *   - Top of catalog (build.nvidia.com, 2026-07-17):
 *     thinkingmachines/inkling, poolside/laguna-xs-2.1, z-ai/glm-5.2
 *   - Proven fallback: minimaxai/minimax-m3 (NVIDIA).
 *   - data/llm-intel/ranking-report-latest.md (2026-05-12 intel snapshot)
 *     for NVIDIA-tier fallbacks ranked by latency.
 *   - Knowingly stale entries that were returning 429/timeout removed.
 *
 * Models NOT in NVIDIA live list (per ranking) were dropped:
 *   - minimaxai/minimax-m2.7  (timeout)
 *   - minimaxai/minimax-m2.5  (eol / HTTP 410)
 *   - nvidia/meta/llama-3.3-70b-instruct (wrong double-prefix; real path
 *     on NVIDIA is just meta/llama-3.3-70b-instruct — kept below without
 *     the redundant nvidia/ prefix)
 *   - nvidia/nemotron-3-ultra-550b-a55b, nvidia/z-ai/glm-5 (incorrect
 *     names; not in the NVIDIA live catalog)
 *
 * OpenRouter branch kept minimal because credits are exhausted (HTTP 402
 * returned on every probe since 2026-05-17); these will fail until
 * credits are refilled.
 */
const VERIFIED_MODELS: Record<string, string[]> = {
  nvidia: [
    // ACTIVE tier — build.nvidia.com flagships (2026-07-17)
    'thinkingmachines/inkling',
    'poolside/laguna-xs-2.1',
    'z-ai/glm-5.2',
    // Proven agentic fallback
    'minimaxai/minimax-m3',
    // Fastest healthy NVIDIA fallbacks (sub-500ms in ranking)
    'openai/gpt-oss-120b', // 104ms
    'qwen/qwen3-next-80b-a3b-instruct', // 288ms (thinking variant also available)
    'meta/llama-3.3-70b-instruct', // 307ms — note: rate-limited 429 at peak
    'meta/llama-4-maverick-17b-128e-instruct', // 481ms
    'meta/llama-guard-4-12b', // 495ms — guardrail/classification
    'meta/llama-3.2-90b-vision-instruct', // 3661ms — multimodal
    'google/gemma-3n-e4b-it', // 728ms
    'mistralai/ministral-14b-instruct-2512', // 291ms
    'mistralai/mistral-small-4-119b-2603', // 442ms
    'mistralai/mistral-medium-3.5-128b', // 664ms
    'stockmark/stockmark-2-100b-instruct', // 385ms
    // Larger / slower reasoning models
    'deepseek-ai/deepseek-v4-flash', // 1657ms — fast DeepSeek
    'deepseek-ai/deepseek-v4-pro', // 4216ms
    'qwen/qwen3.5-397b-a17b', // 1479ms
    'google/gemma-4-31b-it', // 1779ms
    'z-ai/glm-5.1', // 3912ms (top arena score in ranking)
    'z-ai/glm5', // 3766ms
    'z-ai/glm4.7', // 15052ms — slow, only as last resort
    'qwen/qwen3-coder-480b-a35b-instruct', // 3323ms — code specialist
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct'],
  sambanova: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
  cerebras: ['llama-3.3-70b', 'llama-3.1-8b'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  // OpenRouter dead since 2026-05-17 — kept for when credits return
  openrouter: [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat-v3-0324',
    'google/gemma-2-9b-it:free',
  ],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
};

/**
 * Detect available providers from environment
 */
export async function detectProviders(): Promise<DetectionResult> {
  const providers: ProviderInfo[] = [];
  const errors: string[] = [];

  // Provider catalog to inspect
  const catalog = [
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

  // INSPECT: Check which keys are available
  for (const provider of catalog) {
    const apiKey = process.env[provider.envKey];
    const hasKey = !!apiKey && apiKey !== 'missing-key' && apiKey.length > 10;

    const info: ProviderInfo = {
      name: provider.name,
      envKey: provider.envKey,
      baseUrl: provider.baseUrl,
      hasKey,
      reachable: false,
      models: VERIFIED_MODELS[provider.name] || [],
      priority: PROVIDER_PRIORITY[provider.name] || 0,
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
  const models = VERIFIED_MODELS[providerName];
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
