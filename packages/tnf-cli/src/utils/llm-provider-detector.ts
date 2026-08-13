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
 */
const PROVIDER_PRIORITY: Record<string, number> = {
  nvidia: 10,
  groq: 9,
  sambanova: 8,
  cerebras: 7,
  deepseek: 6,
  openrouter: 5,
  gemini: 4,
  openai: 3,
};

/**
 * Known working models per provider (verified as of 2026-06)
 */
const VERIFIED_MODELS: Record<string, string[]> = {
  nvidia: [
    'minimaxai/minimax-m3',
    'nvidia/nemotron-3-ultra-550b-a55b',
    'nvidia/z-ai/glm-5',
    'nvidia/meta/llama-3.3-70b-instruct',
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  sambanova: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
  cerebras: ['llama-3.3-70b'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct', 'google/gemma-2-9b-it:free'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
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
