import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

/**
 * Shared provider naming + catalog logic.
 *
 * This exists so the AI source picker and the chat executor agree. They previously did not share
 * code: the picker listed globally-configured providers only, while the executor resolved a user's
 * personal key. A user with their own Anthropic key saw no Anthropic option, and any divergence in
 * provider-name normalisation would have let the picker offer a provider the executor then rejects.
 */
@Injectable()
export class ProviderCatalogService {
  private readonly logger = new Logger('ProviderCatalogService');

  constructor(private readonly db: DatabaseService) {}

  normalizeProvider(value?: string): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  defaultModelForProvider(provider: string): string {
    if (provider === 'google-adk') return 'gemini-2.5-pro';
    if (provider === 'anthropic') return 'claude-3-5-sonnet-20240620';
    if (provider === 'openrouter') return 'openai/gpt-4o-mini';
    if (provider === 'perplexity') return 'sonar';
    if (provider === 'groq') return 'llama-3.1-70b-versatile';
    if (provider === 'gemini' || provider === 'google') return 'gemini-2.5-flash';
    return 'gpt-4o-mini';
  }

  async safeLoadEnabledConfigs(): Promise<
    Array<{
      provider: string;
      modelName: string;
      apiKey: string;
      apiEndpoint: string | null;
      priority: number;
    }>
  > {
    try {
      return (await this.db.llmConfigs.findEnabled()) as Array<{
        provider: string;
        modelName: string;
        apiKey: string;
        apiEndpoint: string | null;
        priority: number;
      }>;
    } catch (error) {
      this.logger.warn(`LLM config lookup failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Providers this user can actually select: the globally-configured ones, plus any provider they
   * hold a personal API key for. Personal keys win on conflict, since that is the precedence the
   * executor applies (see OrchestrationController.resolveProviderForUser).
   *
   * Never returns key material — only names and model defaults.
   */
  async listAvailableForUser(userId?: string): Promise<
    Array<{
      id: string;
      name: string;
      provider: string;
      modelName: string;
      isDefault: boolean;
      isUserKey: boolean;
    }>
  > {
    const configs = [...(await this.safeLoadEnabledConfigs())].sort(
      (a, b) => a.priority - b.priority
    );

    let userProviders: string[] = [];
    if (userId) {
      try {
        const rows = await this.db.providerApiKeys.listByUser(userId);
        userProviders = rows
          .map((row: { provider: string }) => this.normalizeProvider(row.provider))
          .filter(Boolean);
      } catch (error) {
        this.logger.warn(`Provider key lookup failed: ${(error as Error).message}`);
      }
    }

    const userProviderSet = new Set(userProviders);
    const byProvider = new Map<string, ReturnType<typeof this.buildEntry>>();

    configs.forEach((config, index) => {
      const provider = this.normalizeProvider(config.provider);
      if (!provider || byProvider.has(provider)) return;
      byProvider.set(
        provider,
        this.buildEntry(provider, config.modelName, index === 0, userProviderSet.has(provider))
      );
    });

    for (const provider of userProviderSet) {
      const existing = byProvider.get(provider);
      if (existing) {
        // Global entry exists, but the user's own key is what will actually be used.
        existing.isUserKey = true;
        continue;
      }
      byProvider.set(
        provider,
        this.buildEntry(provider, this.defaultModelForProvider(provider), false, true)
      );
    }

    return [...byProvider.values()];
  }

  private buildEntry(provider: string, modelName: string, isDefault: boolean, isUserKey: boolean) {
    return {
      id: provider,
      name: this.displayName(provider),
      provider,
      modelName: modelName || this.defaultModelForProvider(provider),
      isDefault,
      isUserKey,
    };
  }

  private displayName(provider: string): string {
    const known: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Google Gemini',
      google: 'Google Gemini',
      openrouter: 'OpenRouter',
      perplexity: 'Perplexity',
      groq: 'Groq',
      mistral: 'Mistral',
      cohere: 'Cohere',
    };
    return known[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}
