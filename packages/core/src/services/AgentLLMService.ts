import { Injectable, Logger } from '@nestjs/common';
import { AnthropicProvider, AnthropicConfig } from '../llm/providers/AnthropicProvider.js';

export type TaskComplexity = 'director' | 'worker' | 'extractor';

export interface LLMRequest {
  prompt: string;
  model?: string;
  complexity?: TaskComplexity;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class AgentLLMService {
  private readonly logger = new Logger(AgentLLMService.name);
  private anthropicProvider: AnthropicProvider;

  private readonly heavyModels = ['claude-3-5-sonnet-20241022', 'gemini-1.5-pro', 'gpt-4o'];
  private readonly fastModels = ['claude-3-5-haiku-20241022', 'gemini-1.5-flash', 'gpt-4o-mini', 'llama-3-8b'];
  private readonly defaultHeavyModel = 'claude-3-5-sonnet-20241022';
  private readonly defaultFastModel = 'claude-3-5-haiku-20241022';

  constructor() {
    const config: AnthropicConfig = {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      modelName: this.defaultHeavyModel,
    };
    this.anthropicProvider = new AnthropicProvider(config);
  }

  private routeModel(request: LLMRequest): string {
    if (request.model) return request.model;

    switch (request.complexity) {
      case 'director':
        return this.defaultHeavyModel;
      case 'worker':
      case 'extractor':
        return this.defaultFastModel;
      default:
        return this.defaultHeavyModel; // Default to heavy if unspecified
    }
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      this.logger.log(`Generating response for model: ${this.routeModel(request)}`);
      return await this.callLLMAPI(request);
    } catch (error: any) {
      this.logger.error(`LLM generation failed: ${error.message}`);
      throw new Error(`LLM generation failed: ${error.message}`);
    }
  }

  async streamResponse(request: LLMRequest): Promise<AsyncIterable<string>> {
    if (!request.stream) {
      throw new Error('Stream mode not enabled in request');
    }

    return this.createStreamResponse(request);
  }

  private async callLLMAPI(request: LLMRequest): Promise<LLMResponse> {
    const model = this.routeModel(request);

    // We update config model dynamically for Anthropic
    const response = await this.anthropicProvider.chat([{ role: 'user', content: request.prompt }], {
      modelName: model,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    });

    return {
      content: response.content,
      model: model,
      usage: response.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private async* createStreamResponse(request: LLMRequest): AsyncIterable<string> {
    const model = this.routeModel(request);
    const stream = await this.anthropicProvider.streamChat([{ role: 'user', content: request.prompt }], {
      modelName: model,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async validateModel(model: string): Promise<boolean> {
    return this.getSupportedModels().includes(model);
  }

  getDefaultModel(complexity: TaskComplexity = 'director'): string {
    return complexity === 'director' ? this.defaultHeavyModel : this.defaultFastModel;
  }

  getSupportedModels(): string[] {
    return [...this.heavyModels, ...this.fastModels];
  }
}
