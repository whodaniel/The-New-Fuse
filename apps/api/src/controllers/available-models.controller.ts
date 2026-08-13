import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Available LLM catalog for agent creation / operator UIs.
 * Source of truth aligned with packages/tnf-cli llm-provider-detector (NVIDIA-first).
 * Public read endpoint — no JWT — so local desktop can populate Create Agent
 * without an auth session.
 */

const VERIFIED_MODELS: Record<string, string[]> = {
  nvidia: [
    'thinkingmachines/inkling',
    'poolside/laguna-xs-2.1',
    'z-ai/glm-5.2',
    'minimaxai/minimax-m3',
    'openai/gpt-oss-120b',
    'qwen/qwen3-next-80b-a3b-instruct',
    'meta/llama-3.3-70b-instruct',
    'meta/llama-4-maverick-17b-128e-instruct',
    'meta/llama-guard-4-12b',
    'meta/llama-3.2-90b-vision-instruct',
    'google/gemma-3n-e4b-it',
    'mistralai/ministral-14b-instruct-2512',
    'mistralai/mistral-small-4-119b-2603',
    'mistralai/mistral-medium-3.5-128b',
    'stockmark/stockmark-2-100b-instruct',
    'deepseek-ai/deepseek-v4-flash',
    'deepseek-ai/deepseek-v4-pro',
    'qwen/qwen3.5-397b-a17b',
    'google/gemma-4-31b-it',
    'z-ai/glm-5.1',
    'z-ai/glm5',
    'z-ai/glm4.7',
    'qwen/qwen3-coder-480b-a35b-instruct',
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct'],
  sambanova: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
  cerebras: ['llama-3.3-70b', 'llama-3.1-8b'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  openrouter: [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat-v3-0324',
    'google/gemma-2-9b-it:free',
  ],
};

const PROVIDER_META: Record<
  string,
  { name: string; priority: number; envKey: string; baseUrl: string }
> = {
  nvidia: {
    name: 'NVIDIA NIM',
    priority: 12,
    envKey: 'NVIDIA_API_KEY',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
  },
  groq: {
    name: 'Groq',
    priority: 9,
    envKey: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  sambanova: {
    name: 'SambaNova',
    priority: 8,
    envKey: 'SAMBANOVA_API_KEY',
    baseUrl: 'https://api.sambanova.ai/v1',
  },
  cerebras: {
    name: 'Cerebras',
    priority: 7,
    envKey: 'CEREBRAS_API_KEY',
    baseUrl: 'https://api.cerebras.ai/v1',
  },
  deepseek: {
    name: 'DeepSeek',
    priority: 6,
    envKey: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
  },
  gemini: {
    name: 'Google Gemini',
    priority: 4,
    envKey: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  },
  openai: {
    name: 'OpenAI',
    priority: 3,
    envKey: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
  },
  openrouter: {
    name: 'OpenRouter',
    priority: 0,
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};

async function fetchLiveModels(
  providerId: string,
  baseUrl: string,
  apiKey: string
): Promise<string[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    if (!response?.ok) return null;
    const data = (await response.json()) as { data?: Array<{ id?: string }> };
    if (!Array.isArray(data?.data)) return null;
    const ids = data.data.map((m) => m.id).filter((id): id is string => Boolean(id));
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

interface ProviderModel {
  id: string;
  name: string;
  provider: string;
}

interface ProviderEntry {
  id: string;
  name: string;
  priority: number;
  configured: boolean;
  source: 'verified' | 'live';
  models: ProviderModel[];
}

@ApiTags('llm')
@Controller('llm')
export class AvailableModelsController {
  @Get('models')
  @ApiOperation({ summary: 'List available LLM models (verified + live when keyed)' })
  @ApiResponse({ status: 200, description: 'Provider/model catalog' })
  async listModels(@Query('provider') provider?: string, @Query('refresh') refresh?: string) {
    const wantRefresh = refresh === '1' || refresh === 'true';
    const providerIds = provider
      ? [provider]
      : Object.keys(PROVIDER_META).sort(
          (a, b) => (PROVIDER_META[b]?.priority || 0) - (PROVIDER_META[a]?.priority || 0)
        );

    const providers: ProviderEntry[] = [];
    for (const id of providerIds) {
      const meta = PROVIDER_META[id];
      if (!meta) continue;
      const apiKey = process.env[meta.envKey];
      const configured = Boolean(apiKey && apiKey !== 'missing-key' && apiKey.length > 10);
      let models = VERIFIED_MODELS[id] || [];
      let source: 'verified' | 'live' = 'verified';
      if (configured && wantRefresh) {
        const live = await fetchLiveModels(id, meta.baseUrl, apiKey!);
        if (live?.length) {
          // Prefer verified order, then append any live-only ids
          const verifiedSet = new Set(models);
          const extras = live.filter((m) => !verifiedSet.has(m));
          models = [...models.filter((m) => live.includes(m) || verifiedSet.has(m)), ...extras];
          source = 'live';
        }
      }
      providers.push({
        id,
        name: meta.name,
        priority: meta.priority,
        configured,
        source,
        models: models.map((modelId) => ({ id: modelId, name: modelId, provider: id })),
      });
    }

    return {
      defaultProvider: providers.find((p) => p.configured)?.id || providers[0]?.id || 'nvidia',
      providers,
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'List LLM providers with configuration status' })
  async listProviders() {
    const catalog = await this.listModels();
    return catalog.providers.map((p) => ({
      id: p.id,
      name: p.name,
      configured: p.configured,
      modelCount: p.models.length,
      priority: p.priority,
    }));
  }
}
