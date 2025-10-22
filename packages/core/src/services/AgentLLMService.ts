import { Injectable } from '@nestjs/common';

export interface LLMRequest {
  prompt: string;
  model?: string;
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
  private readonly defaultModel = 'gpt-3.5-turbo';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Simulate LLM API call
      const response = await this.callLLMAPI(request);
      return response;
    } catch (error: any) {
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
    // Mock implementation - replace with actual LLM API call
    const model = request.model || this.defaultModel;
    const content = `Response to: ${request.prompt}`;
    
    return {
      content,
      model,
      usage: {
        promptTokens: request.prompt.length / 4,
        completionTokens: content.length / 4,
        totalTokens: (request.prompt.length + content.length) / 4
      }
    };
  }

  private async* createStreamResponse(request: LLMRequest): AsyncIterable<string> {
    const words = `Response to: ${request.prompt}`.split(' ');
    
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async validateModel(model: string): Promise<boolean> {
    const supportedModels = [
      'gpt-3.5-turbo',
      'gpt-4',
      'claude-3-sonnet',
      'claude-3-haiku'
    ];
    
    return supportedModels.includes(model);
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getSupportedModels(): string[] {
    return [
      'gpt-3.5-turbo',
      'gpt-4',
      'claude-3-sonnet',
      'claude-3-haiku'
    ];
  }
}