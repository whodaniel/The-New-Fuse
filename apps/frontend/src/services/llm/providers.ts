/**
 * Frontend-side provider registry.
 *
 * Curated subset of @the-new-fuse/llm-catalog with display labels + the
 * per-provider defaults that the Web control panel UI knows how to
 * validate. The full 12+ provider catalog (NVIDIA, Groq, SambaNova,
 * DeepSeek, OpenRouter, xAI, Moonshot, Anthropic, OpenAI, Google, plus
 * local Ollama + llama.cpp) is available via `loadCatalog()` from
 * @the-new-fuse/llm-catalog.
 */

export const SUPPORTED_PROVIDERS = {
  NVIDIA: 'nvidia',
  GROQ: 'groq',
  SAMBANOVA: 'sambanova',
  DEEPSEEK: 'deepseek',
  OPENROUTER: 'openrouter',
  XAI: 'xai',
  MOONSHOT: 'moonshot',
  GOOGLE: 'google',
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  LLAMACPP: 'llamacpp',
  TNF_CLOUD: 'tnf_cloud',
} as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[keyof typeof SUPPORTED_PROVIDERS];

export interface ProviderConfig {
  name: SupportedProvider | '';
  apiKey?: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
  };
  endpoint?: string;
}

export const PROVIDER_DEFAULTS: Record<
  string,
  Omit<Partial<ProviderConfig>, 'name'> & { label: string }
> = {
  [SUPPORTED_PROVIDERS.NVIDIA]: {
    label: 'NVIDIA NIM (free)',
    model: 'nvidia/nemotron-3-ultra-550b-a55b',
    endpoint: 'https://integrate.api.nvidia.com/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.GROQ]: {
    label: 'Groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.SAMBANOVA]: {
    label: 'SambaNova',
    model: 'Meta-Llama-3.1-405B-Instruct',
    endpoint: 'https://api.sambanova.ai/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.DEEPSEEK]: {
    label: 'DeepSeek',
    model: 'deepseek-chat',
    endpoint: 'https://api.deepseek.com/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.OPENROUTER]: {
    label: 'OpenRouter',
    model: 'openrouter/auto',
    endpoint: 'https://openrouter.ai/api/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.XAI]: {
    label: 'xAI (Grok)',
    model: 'grok-4.6',
    endpoint: 'https://api.x.ai/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.MOONSHOT]: {
    label: 'Moonshot',
    model: 'moonshot-v1-8k',
    endpoint: 'https://api.moonshot.cn/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.GOOGLE]: {
    label: 'Google Gemini',
    model: 'gemini-3-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.ANTHROPIC]: {
    label: 'Anthropic',
    model: 'claude-3-5-sonnet',
    endpoint: 'https://api.anthropic.com/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.OPENAI]: {
    label: 'OpenAI',
    model: 'gpt-4o',
    endpoint: 'https://api.openai.com/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.OLLAMA]: {
    label: 'Ollama (Local)',
    model: 'qwen2.5-coder:7b',
    endpoint: 'http://localhost:11434/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.LMSTUDIO]: {
    label: 'LMStudio (Local)',
    model: 'qwen2.5-coder-7b',
    endpoint: 'http://localhost:1234/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.LLAMACPP]: {
    label: 'llama.cpp (Local)',
    model: 'qwen2.5-coder-3b-instruct',
    endpoint: 'http://127.0.0.1:8081/v1',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
  [SUPPORTED_PROVIDERS.TNF_CLOUD]: {
    label: 'TNF Cloud (Pro/Teams)',
    model: 'tnf-hosted',
    parameters: { temperature: 0.7, maxTokens: 8192 },
  },
};

export const validateProviderConfig = async (config: ProviderConfig): Promise<boolean> => {
  if (!config.name) return false;
  if (!config.model) return false;

  // Local and TNF Cloud don't always need an API key for validation at this level
  if (
    config.name !== SUPPORTED_PROVIDERS.OLLAMA &&
    config.name !== SUPPORTED_PROVIDERS.LMSTUDIO &&
    config.name !== SUPPORTED_PROVIDERS.LLAMACPP &&
    config.name !== SUPPORTED_PROVIDERS.TNF_CLOUD
  ) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      return false;
    }
  }

  if (config.parameters.temperature < 0 || config.parameters.temperature > 2) return false;
  if (config.parameters.maxTokens < 1) return false;

  return true;
};
