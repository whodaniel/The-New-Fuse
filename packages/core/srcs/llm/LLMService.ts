import { Injectable, Logger } from '@nestjs/common';
import { LLMRegistry } from './LLMRegistry';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);

  constructor(private readonly llmRegistry: LLMRegistry) {}

  async generate(providerName: string, prompt: string): Promise<string> {
    this.logger.log(`Generating text from ${providerName} for prompt: ${prompt}`);
    const provider = this.llmRegistry.get(providerName);
    return provider.generate(prompt);
  }
}
