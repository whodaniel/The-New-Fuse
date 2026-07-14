export const SUPPORTED_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
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

export const PROVIDER_DEFAULTS: Record<string, Partial<ProviderConfig> & { name: string }> = {
  [SUPPORTED_PROVIDERS.OPENAI]: {
    name: 'OpenAI',
    model: 'gpt-4o',
    parameters: { temperature: 0.7, maxTokens: 2048 },
  },
  [SUPPORTED_PROVIDERS.ANTHROPIC]: {
    name: 'Anthropic',
    model: 'claude-3-5-sonnet',
    parameters: { temperature: 0.7, maxTokens: 4096 },
  },
  [SUPPORTED_PROVIDERS.GEMINI]: {
    name: 'Google Gemini',
    model: 'gemini-1.5-pro',
    parameters: { temperature: 0.7, maxTokens: 2048 },
  },
  [SUPPORTED_PROVIDERS.OLLAMA]: {
    name: 'Ollama (Local)',
    model: 'llama3',
    endpoint: 'http://localhost:11434',
    parameters: { temperature: 0.7, maxTokens: 2048 },
  },
  [SUPPORTED_PROVIDERS.LMSTUDIO]: {
    name: 'LMStudio (Local)',
    model: 'local-model',
    endpoint: 'http://localhost:1234/v1',
    parameters: { temperature: 0.7, maxTokens: 2048 },
  },
  [SUPPORTED_PROVIDERS.TNF_CLOUD]: {
    name: 'TNF Cloud (Pro/Teams)',
    model: 'tnf-hosted',
    parameters: { temperature: 0.7, maxTokens: 4096 },
  },
};

export const validateProviderConfig = async (config: ProviderConfig): Promise<boolean> => {
  if (!config.name) return false;
  if (!config.model) return false;

  // Local and TNF Cloud don't always need an API key for validation at this level
  if (
    config.name !== SUPPORTED_PROVIDERS.OLLAMA &&
    config.name !== SUPPORTED_PROVIDERS.LMSTUDIO &&
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
