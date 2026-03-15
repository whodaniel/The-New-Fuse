export type ProviderCategory =
  | 'Core'
  | 'Gateways'
  | 'Performance'
  | 'Local'
  | 'Enterprise'
  | 'Community';

export interface LlmProviderOption {
  id: string;
  name: string;
  category: ProviderCategory;
  description: string;
  exampleModels?: string[];
  isAdvanced?: boolean;
  requiresGateway?: boolean;
}

export const LLM_PROVIDER_CATALOG: LlmProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'Core',
    description: 'General-purpose multimodal models for chat, reasoning, and tool use.',
    exampleModels: ['gpt-4o', 'o3', 'gpt-4.1'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'Core',
    description: 'Claude models optimized for reasoning, long context, and safe outputs.',
    exampleModels: ['claude-3-5-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'Core',
    description: 'Gemini models for multimodal reasoning and high-context workflows.',
    exampleModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'Gateways',
    description: 'Unified gateway to access many providers and models with one key.',
    requiresGateway: true,
    exampleModels: ['openai/gpt-4o-mini', 'anthropic/claude-3-opus'],
  },
  {
    id: 'togetherai',
    name: 'Together AI',
    category: 'Gateways',
    description: 'Open-model hosting with broad OSS model coverage.',
    exampleModels: ['meta-llama/llama-3.1', 'mistralai/mixtral'],
  },
  {
    id: 'fireworksai',
    name: 'Fireworks AI',
    category: 'Gateways',
    description: 'High-throughput inference for open models and fine-tunes.',
    exampleModels: ['llama-3.1', 'mixtral-8x22b'],
  },
  {
    id: 'groq',
    name: 'Groq',
    category: 'Performance',
    description: 'Ultra-low latency inference for select open models.',
    exampleModels: ['llama-3.1', 'mixtral'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'Performance',
    description: 'Search-augmented answers with citations and web grounding.',
    exampleModels: ['pplx-70b', 'pplx-7b'],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    category: 'Performance',
    description: 'Enterprise-focused models for RAG, embeddings, and structured outputs.',
    exampleModels: ['command-r', 'command-r-plus'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    category: 'Performance',
    description: 'European provider with efficient open and hosted models.',
    exampleModels: ['mistral-large', 'mistral-medium'],
  },
  {
    id: 'xai',
    name: 'xAI',
    category: 'Community',
    description: 'Grok models for real-time reasoning and social context.',
    exampleModels: ['grok-beta', 'grok-3'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'Community',
    description: 'Strong reasoning and coding models with OpenAI-compatible APIs.',
    exampleModels: ['deepseek-chat', 'deepseek-r1'],
  },
  {
    id: 'qwen',
    name: 'Qwen',
    category: 'Community',
    description: 'Alibaba Qwen models for coding and multilingual tasks.',
    exampleModels: ['qwen-2.5-max', 'qwen-2.5-coder'],
  },
  {
    id: 'novita',
    name: 'Novita',
    category: 'Community',
    description: 'Open-model hosting with OpenAI-compatible endpoints.',
    exampleModels: ['qwen', 'llama'],
    isAdvanced: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    category: 'Local',
    description: 'Run open models locally with a simple CLI runtime.',
    exampleModels: ['llama3', 'phi-3'],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    category: 'Local',
    description: 'Desktop UI for running local models with OpenAI-compatible APIs.',
    exampleModels: ['llama3', 'mistral'],
  },
  {
    id: 'localai',
    name: 'LocalAI (Local)',
    category: 'Local',
    description: 'Self-hosted OpenAI-compatible API for local inference.',
    exampleModels: ['llama', 'mistral'],
  },
  {
    id: 'generic-openai',
    name: 'OpenAI-Compatible',
    category: 'Enterprise',
    description: 'Custom OpenAI-compatible endpoints (self-hosted or proxy).',
    isAdvanced: true,
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    category: 'Enterprise',
    description: 'Enterprise deployment of OpenAI models via Azure.',
    isAdvanced: true,
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    category: 'Enterprise',
    description: 'Managed foundation models in AWS for enterprise workloads.',
    isAdvanced: true,
  },
  {
    id: 'textgenwebui',
    name: 'Text-Generation Web UI',
    category: 'Local',
    description: 'Self-hosted UI for local models with optional API bridge.',
    isAdvanced: true,
  },
  {
    id: 'native',
    name: 'Native (System)',
    category: 'Enterprise',
    description: 'Internal provider routing managed by The New Fuse platform.',
    isAdvanced: true,
  },
];

export const LLM_PROVIDER_CATEGORIES: ProviderCategory[] = [
  'Core',
  'Gateways',
  'Performance',
  'Community',
  'Local',
  'Enterprise',
];

export const getProviderById = (id?: string) =>
  LLM_PROVIDER_CATALOG.find((provider) => provider.id === id);

export const getProvidersByCategory = (includeAdvanced = false) => {
  const providers = includeAdvanced
    ? LLM_PROVIDER_CATALOG
    : LLM_PROVIDER_CATALOG.filter((provider) => !provider.isAdvanced);

  return LLM_PROVIDER_CATEGORIES.map((category) => ({
    category,
    providers: providers.filter((provider) => provider.category === category),
  })).filter((group) => group.providers.length > 0);
};

export const getProviderOptions = (includeAdvanced = false) => {
  return (includeAdvanced
    ? LLM_PROVIDER_CATALOG
    : LLM_PROVIDER_CATALOG.filter((provider) => !provider.isAdvanced)
  ).map((provider) => ({
    value: provider.id,
    label: provider.name,
    description: provider.description,
  }));
};
