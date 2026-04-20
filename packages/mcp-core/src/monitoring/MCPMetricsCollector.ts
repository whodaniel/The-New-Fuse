/**
 * MCP-specific metrics collector
 * Extends the base metrics collector with MCP-specific functionality
 */

import {
  BaseMetricsCollector,
  BaseMetricsCollectorConfig,
  Logger
} from '@the-new-fuse/core-monitoring';
import { PerformanceMetrics } from '../types/monitoring.js';

/**
 * MCP metrics collector implementation
 */
export class MCPMetricsCollector extends (BaseMetricsCollector as any)<PerformanceMetrics> {

  // MCP-specific tracking
  private readonly requestTimes = new Map<string, number>();
  private requestCount = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private connectionCount = 0;
  private activeConnections = 0;
  private resourceAccessCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private toolExecutionCount = 0;
  private toolSuccessCount = 0;
  private startTime = Date.now();

  constructor(config: BaseMetricsCollectorConfig, logger?: Logger) {
    // @ts-ignore
    super(config, logger || new Logger('MCPMetricsCollector'));
  }

  /**
   * Get current MCP metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;
    const uptimeSeconds = uptime / 1000;

    // Calculate response time percentiles
    const responseTimes = Array.from(this.requestTimes.values());
    // @ts-ignore
    const p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
    // @ts-ignore
    const p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
    const avgResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    // Calculate rates
    const rps = uptimeSeconds > 0 ? this.requestCount / uptimeSeconds : 0;
    const cacheHitRate = (this.cacheHits + this.cacheMisses) > 0 ?
      this.cacheHits / (this.cacheHits + this.cacheMisses) : 0;
    const toolSuccessRate = this.toolExecutionCount > 0 ?
      this.toolSuccessCount / this.toolExecutionCount : 0;

    // Get system metrics
    const memoryUsage = process.memoryUsage().heapUsed;
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / uptimeSeconds * 100;

    return {
      requests: {
        total: this.requestCount,
        successful: this.successfulRequests,
        failed: this.failedRequests,
        rps,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime
      },
      connections: {
        active: this.activeConnections,
        total: this.connectionCount,
        failed: this.connectionCount - this.activeConnections,
        avgConnectionTime: 0 // TODO: Track connection times
      },
      resources: {
        total: this.getResourceCount(),
        accessCount: this.resourceAccessCount,
        cacheHitRate,
        avgReadTime: 0 // TODO: Track resource read times
      },
      tools: {
        total: this.getToolCount(),
        executionCount: this.toolExecutionCount,
        avgExecutionTime: 0, // TODO: Track tool execution times
        successRate: toolSuccessRate
      },
      system: {
        memoryUsage,
        cpuUsage: Math.min(cpuPercent, 100),
        uptime,
        healthScore: this.calculateHealthScore()
      }
    };
  }

  /**
   * Collect MCP-specific metrics
   */
  protected collectMetrics(): void {
    const metrics = this.getCurrentMetrics();

    // Record system metrics
    // @ts-ignore
    this.recordGauge('memory_usage_bytes', metrics.system.memoryUsage);
    // @ts-ignore
    this.recordGauge('cpu_usage_percent', metrics.system.cpuUsage);
    // @ts-ignore
    this.recordGauge('uptime_ms', metrics.system.uptime);
    // @ts-ignore
    this.recordGauge('health_score', metrics.system.healthScore);

    // Record performance metrics
    // @ts-ignore
    this.recordGauge('requests_per_second', metrics.requests.rps);
    // @ts-ignore
    this.recordGauge('response_time_avg_ms', metrics.requests.avgResponseTime);
    // @ts-ignore
    this.recordGauge('response_time_p95_ms', metrics.requests.p95ResponseTime);
    // @ts-ignore
    this.recordGauge('response_time_p99_ms', metrics.requests.p99ResponseTime);

    // @ts-ignore
    this.emit('metricsCollected', metrics);
  }

  /**
   * Record request start
   */
  recordRequestStart(requestId: string): void {
    this.requestTimes.set(requestId, Date.now());
    this.requestCount++;
    // @ts-ignore
    this.incrementCounter('requests_total');
  }

  /**
   * Record request end
   */
  recordRequestEnd(requestId: string, success: boolean): void {
    const startTime = this.requestTimes.get(requestId);
    if (startTime) {
      const duration = Date.now() - startTime;
      // @ts-ignore
      this.recordHistogram('request_duration_ms', duration);
      this.requestTimes.delete(requestId);
    }

    if (success) {
      this.successfulRequests++;
      // @ts-ignore
      this.incrementCounter('requests_successful');
    } else {
      this.failedRequests++;
      // @ts-ignore
      this.incrementCounter('requests_failed');
    }
  }

  /**
   * Record connection event
   */
  recordConnectionEvent(event: 'connect' | 'disconnect' | 'error'): void {
    switch (event) {
      case 'connect':
        this.connectionCount++;
        this.activeConnections++;
        // @ts-ignore
        this.incrementCounter('connections_total');
        // @ts-ignore
        this.recordGauge('connections_active', this.activeConnections);
        break;
      case 'disconnect':
        this.activeConnections = Math.max(0, this.activeConnections - 1);
        // @ts-ignore
        this.recordGauge('connections_active', this.activeConnections);
        break;
      case 'error':
        // @ts-ignore
        this.incrementCounter('connection_errors');
        break;
    }
  }

  /**
   * Record resource access
   */
  recordResourceAccess(uri: string, duration: number, cached: boolean): void {
    this.resourceAccessCount++;
    // @ts-ignore
    this.incrementCounter('resource_access_total');
    // @ts-ignore
    this.recordHistogram('resource_access_duration_ms', duration);

    if (cached) {
      this.cacheHits++;
      // @ts-ignore
      this.incrementCounter('resource_cache_hits');
    } else {
      this.cacheMisses++;
      // @ts-ignore
      this.incrementCounter('resource_cache_misses');
    }

    // @ts-ignore
    this.recordGauge('resource_cache_hit_rate',
      (this.cacheHits + this.cacheMisses) > 0 ?
        this.cacheHits / (this.cacheHits + this.cacheMisses) : 0
    );
  }

  /**
   * Record tool execution
   */
  recordToolExecution(name: string, duration: number, success: boolean): void {
    this.toolExecutionCount++;
    // @ts-ignore
    this.incrementCounter('tool_executions_total', { tool: name });
    // @ts-ignore
    this.recordHistogram('tool_execution_duration_ms', duration, { tool: name });

    if (success) {
      this.toolSuccessCount++;
      // @ts-ignore
      this.incrementCounter('tool_executions_successful', { tool: name });
    } else {
      // @ts-ignore
      this.incrementCounter('tool_executions_failed', { tool: name });
    }

    // @ts-ignore
    this.recordGauge('tool_success_rate',
      this.toolExecutionCount > 0 ? this.toolSuccessCount / this.toolExecutionCount : 0
    );
  }

  /**
   * Calculate system health score
   */
  private calculateHealthScore(): number {
    let score = 100;

    // Deduct points for high error rate
    const errorRate = this.requestCount > 0 ? this.failedRequests / this.requestCount : 0;
    score -= errorRate * 50;

    // Deduct points for high memory usage (assuming 1GB limit)
    const memoryUsageGB = process.memoryUsage().heapUsed / (1024 * 1024 * 1024);
    if (memoryUsageGB > 0.8) {
      score -= (memoryUsageGB - 0.8) * 100;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get resource count (placeholder - would be injected from resource manager)
   */
  private getResourceCount(): number {
    // @ts-ignore
    return this.getCounterValue('resources_registered') || 0;
  }

  /**
   * Get tool count (placeholder - would be injected from tool manager)
   */
  private getToolCount(): number {
    // @ts-ignore
    return this.getCounterValue('tools_registered') || 0;
  }
}
