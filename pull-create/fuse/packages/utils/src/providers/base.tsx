
export {}
exports.BaseLLMProvider = void 0;

export interface LLMConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  defaultHeaders?: Record<string, string>;
}

export abstract class BaseLLMProvider {
  protected apiKey: string;
  protected baseURL: string;
  protected model: string;
  protected maxTokens: number;
  protected client: any;
  protected defaultHeaders: Record<string, string>;

  constructor(config: LLMConfig = {}) {
    this.apiKey = config.apiKey || this.getDefaultApiKey();
    this.baseURL = config.baseURL || this.getDefaultBaseURL();
    this.model = config.model || this.getDefaultModel();
    this.maxTokens = config.maxTokens || this.getDefaultMaxTokens();
    this.defaultHeaders = config.defaultHeaders || this.getDefaultHeaders();
    this.initClient();
  }

  protected initClient(): void {
    // To be implemented by subclasses
  }

  abstract getDefaultApiKey(): string;
  abstract getDefaultBaseURL(): string;
  abstract getDefaultModel(): string;
  abstract getDefaultMaxTokens(): number;
  abstract getDefaultHeaders(): Record<string, string>;
}
