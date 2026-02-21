// AI Provider stub for authentication context
export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<boolean>;
  abstract generateResponse(prompt: string): Promise<string>;
}

export class DefaultAIProvider extends BaseAIProvider {
  async authenticate(): Promise<boolean> {
    return true;
  }

  async generateResponse(prompt: string): Promise<string> {
    return `Response to: ${prompt}`;
  }
}