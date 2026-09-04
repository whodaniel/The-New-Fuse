/**
 * Verified LLM catalog for TNF desktop Create Agent.
 * Mirrors packages/tnf-cli/src/utils/llm-provider-detector.ts (NVIDIA-first).
 * Used as offline fallback when REST API models endpoint is unavailable.
 */

export interface CatalogProvider {
  id: string;
  name: string;
  models: string[];
  priority: number;
}

export const VERIFIED_PROVIDER_CATALOG: CatalogProvider[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    priority: 12,
    models: [
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
      'google/gemma-4-e2b-it',
      'google/gemma-4-e4b-it',
      'google/gemma-4-12b-it',
      'google/gemma-4-26b-moe-it',
      'google/gemma-4-31b-it',
      'google/paligemma-2-10b-pt-896',
      'mistralai/ministral-14b-instruct-2512',
      'mistralai/mistral-small-4-119b-2603',
      'mistralai/mistral-medium-3.5-128b',
      'stockmark/stockmark-2-100b-instruct',
      'deepseek-ai/deepseek-v4-flash',
      'deepseek-ai/deepseek-v4-pro',
      'qwen/qwen3.5-397b-a17b',
      'z-ai/glm-5.1',
      'z-ai/glm5',
      'z-ai/glm4.7',
      'qwen/qwen3-coder-480b-a35b-instruct',
    ],
  },
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
  {
    id: 'groq',
    name: 'Groq',
    priority: 9,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct'],
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    priority: 8,
    models: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    priority: 7,
    models: ['llama-3.3-70b', 'llama-3.1-8b'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    priority: 6,
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    priority: 4,
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-pro-exp-02-05',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    priority: 3,
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o3-mini', 'o1'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    priority: 0,
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat-v3-0324',
      'google/gemma-2-9b-it:free',
      'google/gemma-3-12b-it:free',
    ],
  },
];

export function defaultProviderId(): string {
  return VERIFIED_PROVIDER_CATALOG[0]?.id || 'nvidia';
}

export function modelsForProvider(providerId: string): string[] {
  return VERIFIED_PROVIDER_CATALOG.find((p) => p.id === providerId)?.models || [];
}
