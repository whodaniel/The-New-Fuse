import { Injectable } from '@nestjs/common';

export interface ModelConfig {
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

@Injectable()
export class AIService {
  private models: Map<string, ModelConfig>;

  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  private initializeModels(): void {
    // Initialize default models
    this.models.set('gpt-3.5-turbo', {
      name: 'gpt-3.5-turbo',
      provider: 'openai',
      maxTokens: 4096,
      temperature: 0.7,
    });

    this.models.set('gpt-4', {
      name: 'gpt-4',
      provider: 'openai',
      maxTokens: 8192,
      temperature: 0.7,
    });

    this.models.set('claude-3-sonnet', {
      name: 'claude-3-sonnet',
      provider: 'anthropic',
      maxTokens: 4096,
      temperature: 0.7,
    });

    this.models.set('gemini-pro', {
      name: 'gemini-pro',
      provider: 'google',
      maxTokens: 2048,
      temperature: 0.7,
    });
  }

  public getModel(modelName: string): ModelConfig | undefined {
    return this.models.get(modelName);
  }

  public getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  public getModelsByProvider(provider: string): ModelConfig[] {
    return Array.from(this.models.values()).filter((model) => model.provider === provider);
  }

  public async generateResponse(request: AIRequest): Promise<AIResponse> {
    const modelConfig = this.getModel(request.model || 'gpt-3.5-turbo');

    if (!modelConfig) {
      throw new Error(`Model ${request.model} not found`);
    }

    // Mock implementation - in real scenario would call actual AI providers
    return {
      content: `Mock response for: ${request.prompt}`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(request.prompt.length / 4) + 100,
      },
      model: modelConfig.name,
    };
  }

  public async generateStreamResponse(request: AIRequest): Promise<AsyncIterable<string>> {
    const modelConfig = this.getModel(request.model || 'gpt-3.5-turbo');

    if (!modelConfig) {
      throw new Error(`Model ${request.model} not found`);
    }

    // Mock streaming implementation
    async function* mockStream() {
      const words = `Mock streaming response for: ${request.prompt}`.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return mockStream();
  }

  public validateRequest(request: AIRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required and cannot be empty');
    }

    if (request.model && !this.models.has(request.model)) {
      errors.push(`Model ${request.model} is not supported`);
    }

    if (request.maxTokens && request.maxTokens <= 0) {
      errors.push('maxTokens must be greater than 0');
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      errors.push('temperature must be between 0 and 2');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public addModel(config: ModelConfig): boolean {
    if (this.models.has(config.name)) {
      return false;
    }

    this.models.set(config.name, config);
    return true;
  }

  public removeModel(modelName: string): boolean {
    return this.models.delete(modelName);
  }

  public updateModel(modelName: string, updates: Partial<ModelConfig>): boolean {
    const existing = this.models.get(modelName);
    if (!existing) {
      return false;
    }

    const updated = { ...existing, ...updates };
    this.models.set(modelName, updated);
    return true;
  }

  public getModelStats(): {
    totalModels: number;
    providerDistribution: Record<string, number>;
    averageMaxTokens: number;
  } {
    const models = Array.from(this.models.values());
    const providerDistribution: Record<string, number> = {};

    for (const model of models) {
      providerDistribution[model.provider] = (providerDistribution[model.provider] || 0) + 1;
    }

    const averageMaxTokens =
      models.reduce((sum, model) => sum + model.maxTokens, 0) / models.length;

    return {
      totalModels: models.length,
      providerDistribution,
      averageMaxTokens: Math.round(averageMaxTokens),
    };
  }
}
