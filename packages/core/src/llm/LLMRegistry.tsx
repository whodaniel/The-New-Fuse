// Copyright (c) The New Fuse Project

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { BaseLLMProvider, LLMConfig } from './LLMProvider.tsx';
import { OpenAIProvider } from './providers/OpenAIProvider.tsx';

export interface ExtendedLLMConfig extends LLMConfig {
  provider: string;
  enabled: boolean;
  priority: number;
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  metadata?: Record<string, unknown>;
  modelName: string;
}

interface ProviderStats {
  requests: number;
  tokens: number;
  errors: number;
  latency: number[];
  lastUsed: Date;
}

@Injectable()
export class LLMRegistry extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: any;
  private db: DatabaseService;
  private providers: Map<string, BaseLLMProvider> = new Map();
  private configs: Map<string, ExtendedLLMConfig> = new Map();
  private stats: Map<string, ProviderStats> = new Map();
  private rateLimiters: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    // Initialize logger, redis, db as needed
  }

  async onModuleInit(): Promise<void> {
    // Load configs and register providers
  }

  async registerProvider(name: string, config: ExtendedLLMConfig): Promise<void> {
    // Register and initialize provider
  }

  getProvider(name: string): BaseLLMProvider | undefined {
    return this.providers.get(name);
  }

  getConfig(name: string): ExtendedLLMConfig | undefined {
    return this.configs.get(name);
  }

  getStats(name: string): ProviderStats | undefined {
    return this.stats.get(name);
  }

  cleanup(): void {
    for (const timer of this.rateLimiters.values()) {
      clearInterval(timer);
    }
    this.rateLimiters.clear();
    this.providers.clear();
    this.configs.clear();
    this.stats.clear();
    // Optionally log cleanup
  }
}
