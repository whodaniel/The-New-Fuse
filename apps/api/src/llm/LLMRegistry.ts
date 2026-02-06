export interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'sambanova' | 'local' | 'other';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class LLMRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): LLMProvider | null {
    return this.providers.get(id) || null;
  }

  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }
}

export const llmRegistry = new LLMRegistry();
