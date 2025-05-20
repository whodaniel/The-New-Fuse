import { EventEmitter } from 'events';
import { Logger } from '../logging.js';

export interface ApiUsageEvent {
  provider: string;
  service: string;
  operation: string;
  timestamp: number;
  success: boolean;
  latency: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  errorType?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CostRate {
  inputTokens: number;  // Cost per 1K input tokens
  outputTokens: number; // Cost per 1K output tokens
}

export interface UsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatency: number;
  usageByProvider: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  usageByService: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  timeRangeMs: number;
}

export class ApiUsageTracker extends EventEmitter {
  private logger: Logger;
  private usageEvents: ApiUsageEvent[] = [];
  private costRates: Record<string, Record<string, CostRate>> = {};
  private retentionPeriodMs: number;
  private flushIntervalId?: NodeJS.Timeout;
  private persistenceEnabled: boolean = false;
  private persistenceCallback?: (events: ApiUsageEvent[]) => Promise<void>;

  constructor(
    logger: Logger, 
    options: { 
      retentionPeriodMs?: number; 
      flushIntervalMs?: number;
      enablePersistence?: boolean;
      persistenceCallback?: (events: ApiUsageEvent[]) => Promise<void>;
    } = {}
  ) {
    super();
    this.logger = logger;
    this.retentionPeriodMs = options.retentionPeriodMs || 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (options.flushIntervalMs) {
      this.flushIntervalId = setInterval(() => this.pruneOldEvents(), options.flushIntervalMs);
    }
    
    this.persistenceEnabled = options.enablePersistence || false;
    this.persistenceCallback = options.persistenceCallback;
  }

  /**
   * Register cost rates for a provider and service
   */
  registerCostRate(provider: string, service: string, costRate: CostRate): void {
    if (!this.costRates[provider]) {
      this.costRates[provider] = {};
    }
    this.costRates[provider][service] = costRate;
    this.logger.debug(`Registered cost rate for ${provider}/${service}`, costRate);
  }

  /**
   * Track an API usage event
   */
  trackUsage(event: Omit<ApiUsageEvent, 'timestamp'>): void {
    const fullEvent: ApiUsageEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    // Calculate cost if not provided but tokens are
    if (fullEvent.cost === undefined && 
        fullEvent.inputTokens !== undefined && 
        fullEvent.outputTokens !== undefined) {
      fullEvent.cost = this.calculateCost(
        fullEvent.provider, 
        fullEvent.service, 
        fullEvent.inputTokens, 
        fullEvent.outputTokens
      );
    }
    
    this.usageEvents.push(fullEvent);
    
    // Emit real-time events
    this.emit('usage', fullEvent);
    if (fullEvent.success) {
      this.emit('success', fullEvent);
    } else {
      this.emit('error', fullEvent);
    }
    
    // Persist event if enabled
    if (this.persistenceEnabled && this.persistenceCallback) {
      this.persistenceCallback([fullEvent]).catch(err => {
        this.logger.error('Failed to persist API usage event', err);
      });
    }
    
    this.logger.debug('Tracked API usage', {
      provider: fullEvent.provider,
      service: fullEvent.service,
      success: fullEvent.success,
      cost: fullEvent.cost
    });
  }

  /**
   * Get usage summary for a given time range
   */
  getUsageSummary(timeRangeMs: number = 24 * 60 * 60 * 1000): UsageSummary {
    const cutoffTime = Date.now() - timeRangeMs;
    const relevantEvents = this.usageEvents.filter(event => event.timestamp > cutoffTime);
    
    const summary: UsageSummary = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      usageByProvider: {},
      usageByService: {},
      timeRangeMs
    };
    
    let totalLatency = 0;
    
    relevantEvents.forEach(event => {
      // Update overall stats
      summary.totalRequests++;
      totalLatency += event.latency;
      
      if (event.success) {
        summary.successfulRequests++;
      } else {
        summary.failedRequests++;
      }
      
      if (event.inputTokens) {
        summary.totalInputTokens += event.inputTokens;
      }
      
      if (event.outputTokens) {
        summary.totalOutputTokens += event.outputTokens;
      }
      
      if (event.cost) {
        summary.totalCost += event.cost;
      }
      
      // Update provider-specific stats
      if (!summary.usageByProvider[event.provider]) {
        summary.usageByProvider[event.provider] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0
        };
      }
      
      summary.usageByProvider[event.provider].requests++;
      
      if (event.inputTokens) {
        summary.usageByProvider[event.provider].inputTokens += event.inputTokens;
      }
      
      if (event.outputTokens) {
        summary.usageByProvider[event.provider].outputTokens += event.outputTokens;
      }
      
      if (event.cost) {
        summary.usageByProvider[event.provider].cost += event.cost;
      }
      
      // Update service-specific stats
      const serviceKey = `${event.provider}/${event.service}`;
      
      if (!summary.usageByService[serviceKey]) {
        summary.usageByService[serviceKey] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0
        };
      }
      
      summary.usageByService[serviceKey].requests++;
      
      if (event.inputTokens) {
        summary.usageByService[serviceKey].inputTokens += event.inputTokens;
      }
      
      if (event.outputTokens) {
        summary.usageByService[serviceKey].outputTokens += event.outputTokens;
      }
      
      if (event.cost) {
        summary.usageByService[serviceKey].cost += event.cost;
      }
    });
    
    // Calculate average latency
    summary.avgLatency = summary.totalRequests > 0 ? totalLatency / summary.totalRequests : 0;
    
    return summary;
  }

  /**
   * Calculate the cost based on registered rates
   */
  private calculateCost(provider: string, service: string, inputTokens: number, outputTokens: number): number {
    const providerRates = this.costRates[provider];
    if (!providerRates) {
      return 0;
    }
    
    const rates = providerRates[service];
    if (!rates) {
      return 0;
    }
    
    // Convert to cost per 1K tokens
    const inputCost = (inputTokens / 1000) * rates.inputTokens;
    const outputCost = (outputTokens / 1000) * rates.outputTokens;
    
    return inputCost + outputCost;
  }

  /**
   * Remove events older than the retention period
   */
  private pruneOldEvents(): void {
    const cutoffTime = Date.now() - this.retentionPeriodMs;
    const initialCount = this.usageEvents.length;
    
    this.usageEvents = this.usageEvents.filter(event => event.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.usageEvents.length;
    if (removedCount > 0) {
      this.logger.debug(`Pruned ${removedCount} old API usage events`);
    }
  }

  /**
   * Export all usage events for a given time range
   */
  exportEvents(timeRangeMs: number = this.retentionPeriodMs): ApiUsageEvent[] {
    const cutoffTime = Date.now() - timeRangeMs;
    return this.usageEvents.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * Clear all usage data
   */
  clearAll(): void {
    this.usageEvents = [];
    this.logger.info('Cleared all API usage data');
    this.emit('cleared');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
  }
}
