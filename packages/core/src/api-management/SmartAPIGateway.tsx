import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../types/providers.js';
import { Logger } from '../logging.js';

interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  priority: number;
  costPerToken: number;
  maxRatePerMinute: number;
  timeout: number;
  active: boolean;
}

interface RequestStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  totalTokens: {
    input: number;
    output: number;
  };
  averageLatency: number;
  costAccumulated: number;
}

interface RateLimitState {
  requestCount: number;
  lastResetTime: number;
  isLimited: boolean;
}

interface CacheEntry {
  result: any;
  timestamp: number;
  promptHash: string;
  provider: string;
  cost: number;
}

export class SmartAPIGateway extends EventEmitter {
  private providers: Map<string, ProviderConfig> = new Map();
  private providerStats: Map<string, RequestStats> = new Map();
  private rateLimitState: Map<string, RateLimitState> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private logger: Logger;
  private cacheEnabled: boolean = true;
  private cacheTTL: number = 3600 * 1000; // 1 hour in milliseconds
  private semanticCacheEnabled: boolean = true;
  private costTrackingEnabled: boolean = true;
  private failoverEnabled: boolean = true;

  constructor(logger: Logger) {
    super();
    this.logger = logger;

    // Set up automatic rate limit reset
    setInterval(() => this.resetRateLimits(), 60 * 1000); // Reset every minute
  }

  /**
   * Registers a new provider with the gateway
   */
  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.id, config);
    this.providerStats.set(config.id, {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      totalTokens: { input: 0, output: 0 },
      averageLatency: 0,
      costAccumulated: 0
    });
    this.rateLimitState.set(config.id, {
      requestCount: 0,
      lastResetTime: Date.now(),
      isLimited: false
    });
    this.logger.info(`Registered provider: ${config.name} (${config.id})`);
  }

  /**
   * Makes an API call to an LLM provider with smart routing
   */
  async callLLM(params: {
    prompt: string;
    model?: string;
    provider?: string;
    maxTokens?: number;
    temperature?: number;
    cacheKey?: string;
    bypassCache?: boolean;
  }): Promise<any> {
    const requestId = uuidv4();
    const startTime = Date.now();
    const cacheKey = params.cacheKey || this.generateCacheKey(params.prompt, params.model || 'default');

    this.logger.debug(`Starting LLM request ${requestId}`, { params });

    // Check cache if enabled and not bypassed
    if (this.cacheEnabled && !params.bypassCache) {
      const cachedResult = this.checkCache(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Cache hit for request ${requestId}`);
        this.emit('cacheHit', { cacheKey, requestId });
        return cachedResult;
      }
    }

    // Get available providers
    const availableProviders = this.getAvailableProviders(params.model);
    if (availableProviders.length === 0) {
      const error = new Error('No available providers for request');
      this.logger.error(`Failed request ${requestId}: ${error.message}`);
      throw error;
    }

    // If specific provider requested, use it if available
    let selectedProviders = availableProviders;
    if (params.provider && this.providers.has(params.provider)) {
      const provider = this.providers.get(params.provider)!;
      if (provider.active && !this.isRateLimited(provider.id)) {
        selectedProviders = [provider];
      } else {
        this.logger.warn(`Requested provider ${params.provider} is not available, using fallbacks`);
      }
    }

    // Try providers in priority order
    let lastError: Error | null = null;
    for (const provider of selectedProviders) {
      try {
        if (this.isRateLimited(provider.id)) {
          this.logger.debug(`Provider ${provider.id} is rate limited, skipping`);
          continue;
        }

        this.incrementRateLimit(provider.id);
        this.providerStats.get(provider.id)!.totalRequests++;

        const result = await this.makeProviderRequest(provider, params);
        
        // Update stats
        const stats = this.providerStats.get(provider.id)!;
        stats.successCount++;
        const latency = Date.now() - startTime;
        stats.averageLatency = (stats.averageLatency * (stats.successCount - 1) + latency) / stats.successCount;
        
        // Track tokens and costs if enabled
        if (this.costTrackingEnabled && result.usage) {
          stats.totalTokens.input += result.usage.promptTokens || 0;
          stats.totalTokens.output += result.usage.completionTokens || 0;
          const cost = this.calculateCost(
            provider, 
            result.usage.promptTokens || 0, 
            result.usage.completionTokens || 0
          );
          stats.costAccumulated += cost;
        }

        // Add to cache if enabled
        if (this.cacheEnabled) {
          this.addToCache(cacheKey, result, provider.id);
        }

        this.logger.debug(`Completed LLM request ${requestId} with provider ${provider.id}`, {
          latency,
          tokens: result.usage,
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.providerStats.get(provider.id)!.failureCount++;
        this.logger.warn(`Provider ${provider.id} failed: ${error.message}`);
        
        // If failover is disabled, don't try other providers
        if (!this.failoverEnabled) {
          break;
        }
      }
    }

    this.logger.error(`All providers failed for request ${requestId}`, { 
      error: lastError?.message 
    });
    throw lastError || new Error('All available providers failed');
  }

  /**
   * Actual implementation of provider-specific request
   */
  private async makeProviderRequest(
    provider: ProviderConfig,
    params: any
  ): Promise<any> {
    // Implement provider-specific API calls here
    // This is a placeholder for the actual implementation
    const apiKey = provider.apiKey;
    const baseUrl = provider.baseUrl;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail for example purposes
        if (Math.random() > 0.1) {
          resolve({
            completion: "This is a mock response",
            usage: {
              promptTokens: 10,
              completionTokens: 5,
              totalTokens: 15
            }
          });
        } else {
          reject(new Error("Mock API call failed"));
        }
      }, 500); // Simulate network latency
    });
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<string, RequestStats> {
    const stats: Record<string, RequestStats> = {};
    for (const [id, providerStats] of this.providerStats.entries()) {
      stats[id] = { ...providerStats };
    }
    return stats;
  }

  /**
   * Calculate the cost of a request based on token counts
   */
  private calculateCost(provider: ProviderConfig, inputTokens: number, outputTokens: number): number {
    return provider.costPerToken * (inputTokens + outputTokens);
  }

  /**
   * Generate a cache key from the prompt and model
   */
  private generateCacheKey(prompt: string, model: string): string {
    // In a real implementation, we might use a more sophisticated hashing algorithm
    return `${model}:${prompt.substring(0, 100)}`;
  }

  /**
   * Check if a result is cached
   */
  private checkCache(cacheKey: string): any | null {
    const entry = this.cache.get(cacheKey);
    if (entry && (Date.now() - entry.timestamp) < this.cacheTTL) {
      return entry.result;
    }
    return null;
  }

  /**
   * Add a result to the cache
   */
  private addToCache(cacheKey: string, result: any, providerId: string): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      promptHash: cacheKey,
      provider: providerId,
      cost: 0 // This would be calculated in a real implementation
    });
  }

  /**
   * Check if a provider is rate limited
   */
  private isRateLimited(providerId: string): boolean {
    const state = this.rateLimitState.get(providerId);
    if (!state) return false;
    
    return state.isLimited;
  }

  /**
   * Increment the rate limit counter for a provider
   */
  private incrementRateLimit(providerId: string): void {
    const state = this.rateLimitState.get(providerId);
    if (!state) return;
    
    state.requestCount++;
    
    const provider = this.providers.get(providerId);
    if (provider && state.requestCount >= provider.maxRatePerMinute) {
      state.isLimited = true;
    }
  }

  /**
   * Reset rate limits for all providers
   */
  private resetRateLimits(): void {
    for (const state of this.rateLimitState.values()) {
      state.requestCount = 0;
      state.isLimited = false;
      state.lastResetTime = Date.now();
    }
  }

  /**
   * Get available providers that can handle the requested model
   */
  private getAvailableProviders(requestedModel?: string): ProviderConfig[] {
    const availableProviders: ProviderConfig[] = [];
    
    for (const provider of this.providers.values()) {
      if (!provider.active) continue;
      
      if (requestedModel && !provider.models.includes(requestedModel)) {
        continue;
      }
      
      availableProviders.push(provider);
    }
    
    // Sort by priority (lower number = higher priority)
    return availableProviders.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Configure the gateway
   */
  configure(config: {
    cacheEnabled?: boolean;
    cacheTTL?: number;
    semanticCacheEnabled?: boolean;
    costTrackingEnabled?: boolean;
    failoverEnabled?: boolean;
  }): void {
    if (config.cacheEnabled !== undefined) this.cacheEnabled = config.cacheEnabled;
    if (config.cacheTTL !== undefined) this.cacheTTL = config.cacheTTL;
    if (config.semanticCacheEnabled !== undefined) this.semanticCacheEnabled = config.semanticCacheEnabled;
    if (config.costTrackingEnabled !== undefined) this.costTrackingEnabled = config.costTrackingEnabled;
    if (config.failoverEnabled !== undefined) this.failoverEnabled = config.failoverEnabled;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }
}
