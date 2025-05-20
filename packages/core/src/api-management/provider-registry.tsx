import { EventEmitter } from 'events';
import { Logger } from '../logging.js';
import { LLMProvider } from '../types/providers.js';

/**
 * Registry for managing available LLM API providers
 */
export class ProviderRegistry extends EventEmitter {
  private providers: Map<string, LLMProvider> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Register a new provider
   */
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
    this.logger.info(`Registered provider: ${provider.name} (${provider.id})`);
    this.emit('provider:added', provider);
  }

  /**
   * Update an existing provider
   */
  updateProvider(providerId: string, updates: Partial<LLMProvider>): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    const updatedProvider = { ...provider, ...updates };
    this.providers.set(providerId, updatedProvider);
    this.logger.info(`Updated provider: ${updatedProvider.name} (${updatedProvider.id})`);
    this.emit('provider:updated', updatedProvider);
    return true;
  }

  /**
   * Remove a provider
   */
  removeProvider(providerId: string): boolean {
    if (!this.providers.has(providerId)) {
      return false;
    }
    
    const provider = this.providers.get(providerId)!;
    this.providers.delete(providerId);
    this.logger.info(`Removed provider: ${provider.name} (${provider.id})`);
    this.emit('provider:removed', provider);
    return true;
  }

  /**
   * Get a provider by ID
   */
  getProvider(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider exists
   */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Get providers that support a specific model
   */
  getProvidersForModel(modelId: string): LLMProvider[] {
    return Array.from(this.providers.values()).filter(provider => 
      provider.models.some(model => model.id === modelId)
    );
  }

  /**
   * Initialize with default providers
   */
  initializeDefaultProviders(): void {
    // OpenAI
    this.registerProvider({
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, costPer1kTokens: { input: 0.01, output: 0.03 } },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, costPer1kTokens: { input: 0.01, output: 0.03 } },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16384, costPer1kTokens: { input: 0.0005, output: 0.0015 } }
      ],
      available: true,
      maxRatePerMinute: 500
    });

    // Anthropic
    this.registerProvider({
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      models: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', contextWindow: 200000, costPer1kTokens: { input: 0.015, output: 0.075 } },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', contextWindow: 200000, costPer1kTokens: { input: 0.003, output: 0.015 } },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', contextWindow: 200000, costPer1kTokens: { input: 0.00025, output: 0.00125 } }
      ],
      available: true,
      maxRatePerMinute: 300
    });

    // Add more default providers as needed
  }
}
