export declare class OpenAIProvider {
  private client;
  private logger;
  constructor(apiKey: string);
  generateCompletion(prompt: string, options?: unknown): Promise<string>;
}
