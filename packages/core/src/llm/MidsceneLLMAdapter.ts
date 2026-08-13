import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from './LLMProvider.js';

@Injectable()
export class MidsceneLLMAdapter {
  private readonly logger = new Logger(MidsceneLLMAdapter.name);

  constructor(private readonly llmProvider: LLMProvider) {}

  async generate(prompt: string): Promise<string> {
    this.logger.log(`Generating text for prompt: ${prompt}`);
    return this.llmProvider.generate(prompt);
  }
}
