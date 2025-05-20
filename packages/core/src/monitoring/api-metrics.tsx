import { EventEmitter } from 'events';
import { Logger } from '../logging.js';

/**
 * Metrics collector for API operations
 */
export class ApiMetrics extends EventEmitter {
  private metrics: Map<string, any> = new Map();
  private logger: Logger;
  private flushInterval: NodeJS.Timeout;
  
  constructor(logger: Logger, flushIntervalMs: number = 60000) {
    super();
    this.logger = logger;
    
    // Initialize metrics
    this.initializeMetrics();
    
    // Set up periodic flushing of metrics
    this.flushInterval = setInterval(() => this.flushMetrics(), flushIntervalMs);
  }

  /**
   * Record an API request
   */
  recordRequest(provider: string, model: string, startTime: number): string {
    const requestId = crypto.randomUUID();
    
    // Increment total requests
    this.incrementCounter('totalRequests');
    this.incrementCounter(`provider.${provider}.requests`);
    this.incrementCounter(`model.${model}.requests`);
    
    // Store request timing information for later use
    this.metrics.set(`request.${requestId}`, {
      provider,
      model,
      startTime,
      status: 'pending'
    });
    
    return requestId;
  }

  /**
   * Record a successful API response
   */
  recordSuccess(requestId: string, tokens: { prompt: number, completion: number }, latency: number): void {
    const request = this.metrics.get(`request.${requestId}`);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return;
    }
    
    const { provider, model } = request;
    
    // Update request status
    request.status = 'success';
    request.latency = latency;
    request.tokens = tokens;
    
    // Increment success counters
    this.incrementCounter('successfulRequests');
    this.incrementCounter(`provider.${provider}.successfulRequests`);
    this.incrementCounter(`model.${model}.successfulRequests`);
    
    // Update token counts
    this.incrementCounter('totalTokens.prompt', tokens.prompt);
    this.incrementCounter('totalTokens.completion', tokens.completion);
    this.incrementCounter(`provider.${provider}.tokens.prompt`, tokens.prompt);
    this.incrementCounter(`provider.${provider}.tokens.completion`, tokens.completion);
    
    // Update latency metrics
    this.recordLatency('overallLatency', latency);
    this.recordLatency(`provider.${provider}.latency`, latency);
    this.recordLatency(`model.${model}.latency`, latency);
  }

  /**
   * Record a failed API request
   */
  recordFailure(requestId: string, error: string, latency: number): void {
    const request = this.metrics.get(`request.${requestId}`);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return;
    }
    
    const { provider, model } = request;
    
    // Update request status
    request.status = 'failure';
    request.error = error;
    request.latency = latency;
    
    // Increment failure counters
    this.incrementCounter('failedRequests');
    this.incrementCounter(`provider.${provider}.failedRequests`);
    this.incrementCounter(`model.${model}.failedRequests`);
    this.incrementCounter(`error.${this.normalizeErrorType(error)}`);
    
    // Update latency metrics for failures
    this.recordLatency('failureLatency', latency);
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(provider: string, model: string): void {
    this.incrementCounter('cacheHits');
    this.incrementCounter(`provider.${provider}.cacheHits`);
    this.incrementCounter(`model.${model}.cacheHits`);
  }

  private initializeMetrics(): void {
    // Initialize counters
    this.metrics.set('totalRequests', 0);
    this.metrics.set('successfulRequests', 0);
    this.metrics.set('failedRequests', 0);
    this.metrics.set('cacheHits', 0);
    
    // Initialize token counters
    this.metrics.set('totalTokens.prompt', 0);
    this.metrics.set('totalTokens.completion', 0);
    
    // Initialize latency tracking
    this.metrics.set('overallLatency', { sum: 0, count: 0, min: Infinity, max: 0 });
    this.metrics.set('failureLatency', { sum: 0, count: 0, min: Infinity, max: 0 });
  }

  private incrementCounter(key: string, value: number = 1): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, 0);
    }
    this.metrics.set(key, this.metrics.get(key) + value);
  }

  private recordLatency(key: string, latency: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { sum: 0, count: 0, min: Infinity, max: 0 });
    }
    
    const stats = this.metrics.get(key);
    stats.sum += latency;
    stats.count += 1;
    stats.min = Math.min(stats.min, latency);
    stats.max = Math.max(stats.max, latency);
  }

  private normalizeErrorType(error: string): string {
    // Extract error type from various error formats
    if (error.includes('rate limit')) return 'rate_limit';
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('auth')) return 'authentication';
    if (error.includes('invalid')) return 'validation';
    return 'other';
  }

  private flushMetrics(): void {
    // Calculate derived metrics
    const metrics = this.getMetrics();
    
    // Emit metrics event
    this.emit('metrics', metrics);
    
    // Log metrics summary
    this.logger.info('API Metrics Summary', {
      totalRequests: metrics.totalRequests,
      successRate: metrics.successRate,
      avgLatency: metrics.avgLatency,
      errorRate: metrics.errorRate
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, any> {
    const totalRequests = this.metrics.get('totalRequests');
    const successfulRequests = this.metrics.get('successfulRequests');
    const failedRequests = this.metrics.get('failedRequests');
    const overallLatency = this.metrics.get('overallLatency');
    
    // Calculate derived metrics
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const avgLatency = overallLatency.count > 0 ? overallLatency.sum / overallLatency.count : 0;
    
    // Construct provider-specific metrics
    const providerMetrics: Record<string, any> = {};
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('provider.')) {
        const parts = key.split('.');
        const provider = parts[1];
        const metricName = parts.slice(2).join('.');
        
        if (!providerMetrics[provider]) {
          providerMetrics[provider] = {};
        }
        
        providerMetrics[provider][metricName] = value;
      }
    }
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      errorRate,
      avgLatency,
      providers: providerMetrics,
      // Add more metrics as needed
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.initializeMetrics();
    this.logger.info('API metrics reset');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    clearInterval(this.flushInterval);
  }
}
