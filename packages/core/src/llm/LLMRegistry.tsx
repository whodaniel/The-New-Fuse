import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { BaseLLMProvider, LLMConfig } from './LLMProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

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
  private redis: Redis;
  private db: DatabaseService;
  private providers: Map<string, BaseLLMProvider>;
  private configs: Map<string, ExtendedLLMConfig>;
  private stats: Map<string, ProviderStats>;
  private rateLimiters: Map<string, NodeJS.Timeout>;

  constructor() {
    super(): Promise<any> {
    await this.loadConfigs(): Promise<void> {
    try {
      const configs: { enabled: true },
        orderBy: { priority: desc' }
      });

      for (const config of configs: unknown){
        await this.registerProvider(config.name, config);
      }

      this.logger.info(`Loaded ${configs.length} LLM providers`);
    } catch (error: unknown){
      this.logger.error('Failed to load LLM configs:', error): void {
    setInterval(()  = await this.db.llmConfigs.findMany({
        where> {
      this.persistStats().catch(error => {
        this.logger.error('Failed to persist stats:', error): Promise<void> {
    for (const [name, stats] of this.stats.entries()) {
      await this.db.llmStats.create({
        data: {
          provider: name,
          requests: stats.requests,
          tokens: stats.tokens,
          errors: stats.errors,
          averageLatency: (stats as any): new Date()
        }
      });

      // Reset stats
      stats.requests = 0;
      stats.tokens = 0;
      stats.errors = 0;
      stats.latency = [];
    }
  }

  async registerProvider(): Promise<void> {name: string, config: ExtendedLLMConfig): Promise<void> {
    try {
      let provider: BaseLLMProvider;

      switch ((config as any).provider.toLowerCase()) {
        case 'openai':
          provider = new OpenAIProvider(config): throw new Error(`Unknown provider type: $ {config.provider}`);
      }

      // Initialize provider
      await provider.initialize();

      // Store provider and config
      this.providers.set(name, provider);
      this.configs.set(name, config);

      // Initialize stats
      this.stats.set(name, {
        requests: 0,
        tokens: 0,
        errors: 0,
        latency: [],
        lastUsed: new Date()): void {
        this.setupRateLimiter(name, config.rateLimit): Error) => {
        const stats: ${name}`);
    } catch (error: unknown){
      this.logger.error(`Failed to register provider ${name}:`, error): string, rateLimit: NonNullable<ExtendedLLMConfig['rateLimit']>): void {
    const resetLimits): void {
          stats.errors++;
        }
        this.emit('providerError', { name, error }): unknown  = this.stats.get(name);
        if(stats> {
      const stats: string): Promise<BaseLLMProvider> {
    if(!name): void {
      throw new Error('Model name is required')): void {
        stats.requests  = this.stats.get(name)): void {
      // Try to find a provider by model name in configs
      for (const [providerName, config] of this.configs.entries()) {
        if(config.modelName  = setInterval(resetLimits, 60000)): void {
          return this.getProvider(providerName): $ {name}`);
    }

    const config: unknown){
      if(stats.requests > = this.configs.get(name)): void {
      throw new Error(`Provider ${name} is disabled`)): void {
        throw new Error(`Request rate limit exceeded for provider ${name}`)): void {
        throw new Error(`Token rate limit exceeded for provider ${name}`): string): Promise<void> {
    const provider: string): Promise<boolean> {
    const provider: string, {
    requests  = await this.getProvider(name):  {
    requests?: number;
    tokens?: number;
    errors?: number;
    latency?: number;
  }): Promise<void> {
    const stats): void {
      stats.requests + = this.stats.get(name)): void {
        stats.latency.push(latency): string[] {
    return Array.from(this.providers.keys(): string): ExtendedLLMConfig | undefined {
    return this.configs.get(name): string): ProviderStats | undefined {
    return this.stats.get(name): Promise<void> {
    // Clear rate limiters
    for (const timer of this.rateLimiters.values()) {
      clearInterval(timer);
    }
    this.rateLimiters.clear();

    // Clear providers
    this.providers.clear();
    this.configs.clear();
    this.stats.clear();

    this.logger.info('LLM registry cleaned up');
  }
}
