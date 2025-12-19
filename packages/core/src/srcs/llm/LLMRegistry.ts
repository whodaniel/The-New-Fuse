import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from './LLMProvider';

@Injectable()
export class LLMRegistry {
  private readonly logger = new Logger(LLMRegistry.name);
  private readonly providers = new Map<string, LLMProvider>();

  register(name: string, provider: LLMProvider): void {
    this.logger.log(`Registering LLM provider: ${name}`);
    this.providers.set(name, provider);
  }

  get(name: string): LLMProvider {
    this.logger.log(`Getting LLM provider: ${name}`);
    return this.providers.get(name);
  }
}
