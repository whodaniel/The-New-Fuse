import { EventEmitter } from 'events';
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  inputPricing?: number;
  outputPricing?: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyRequired?: boolean;
  models: ModelInfo[];
  supportedFeatures?: string[];
}

export class ProviderRegistry extends EventEmitter {
  private providers = new Map<string, ProviderInfo>();
  constructor() {
    super();
    this.initializeDefaultProviders();
  }

  registerProvider(provider: ProviderInfo): void {
    this.providers.set(provider.id, provider);
    this.emit('provider-registered', provider);
  }

  unregisterProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (provider) {
      this.providers.delete(providerId);
      this.emit('provider-unregistered', provider);
      return true;
    }
    return false;
  }

  getProvider(providerId: string): ProviderInfo | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): ProviderInfo[] {
    return Array.from(this.providers.values());
  }

  getProviderModels(providerId: string): ModelInfo[] {
    const provider = this.providers.get(providerId);
    return provider ? provider.models : [];
  }

  findModelById(modelId: string): { provider: ProviderInfo; model: ModelInfo } | undefined {
    for (const provider of this.providers.values()) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        return { provider, model };
      }
    }
    return undefined;
  }

  private initializeDefaultProviders(): void {
    // OpenAI Provider
    this.registerProvider({
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyRequired: true,
      supportedFeatures: ['chat', 'completion', 'embeddings', 'images'],
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most advanced multimodal model',
          contextLength: 128000,
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          description: 'High performance GPT-4 model',
          contextLength: 128000,
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and cost-effective model',
          contextLength: 16000,
        },
      ],
    });
    // Anthropic Provider
    this.registerProvider({
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKeyRequired: true,
      supportedFeatures: ['chat', 'completion'],
      models: [
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          description: 'Most powerful Claude model',
          contextLength: 200000,
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Balanced performance and speed',
          contextLength: 200000,
        },
        {
          id: 'claude-3-haiku',
          name: 'Claude 3 Haiku',
          description: 'Fastest Claude model',
          contextLength: 200000,
        },
      ],
    });
    this.emit('default-providers-initialized');
  }

  updateProvider(providerId: string, updates: Partial<ProviderInfo>): boolean {
    const provider = this.providers.get(providerId);
    if (provider) {
      const updatedProvider = { ...provider, ...updates };
      this.providers.set(providerId, updatedProvider);
      this.emit('provider-updated', updatedProvider);
      return true;
    }
    return false;
  }

  isProviderRegistered(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  getProviderCount(): number {
    return this.providers.size;
  }
}
