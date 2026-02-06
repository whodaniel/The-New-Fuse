import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface LLMRegistry {
  registerProvider(id: string, config: any): Promise<void>;
  unregisterProvider(id: string): Promise<void>;
  getProvider(id: string): any;
}

export interface LLMProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
  enabled: boolean;
  priority: number;
}

@Injectable()
export class RealLLMRegistry implements LLMRegistry {
  private readonly logger = new Logger('RealLLMRegistry');
  private providers = new Map<string, LLMProviderConfig>();

  constructor(private readonly db: DatabaseService) {}

  async registerProvider(id: string, config: LLMProviderConfig): Promise<void> {
    try {
      this.providers.set(id, config);
      this.logger.log(`Registered LLM provider: ${config.provider}/${config.model}`);
    } catch (error) {
      this.logger.error(`Failed to register LLM provider ${id}:`, error);
      throw error;
    }
  }

  async unregisterProvider(id: string): Promise<void> {
    try {
      const deleted = this.providers.delete(id);
      if (deleted) {
        this.logger.log(`Unregistered LLM provider: ${id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to unregister LLM provider ${id}:`, error);
      throw error;
    }
  }

  getProvider(id: string): any {
    return this.providers.get(id);
  }
}
