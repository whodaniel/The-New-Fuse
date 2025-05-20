import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerformanceMonitoringService } from '../monitoring/performance-monitoring.service.js';
import { CorrelationIdManager } from '../utils/correlation-id.js';

export interface QueryPerformanceConfig {
  enabled: boolean;
  slowQueryThresholdMs: number;
  logAllQueries: boolean;
  sampleRate: number;
  trackBindParameters: boolean;
  trackStackTrace: boolean;
}

export interface QueryExecutionContext {
  source?: string;
  correlationId?: string;
  userId?: string;
  operation?: string;
}

@Injectable()
export class QueryPerformanceMonitorService implements OnModuleInit {
  private readonly logger: any;
  private config: QueryPerformanceConfig;
  private queryStats: Map<string, { count: number; totalDuration: number; maxDuration: number }> = new Map();
  private slowQueries: any[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly prisma: PrismaService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('QueryPerformanceMonitor');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('database.queryPerformance.enabled', true),
      slowQueryThresholdMs: this.configService.get<number>('database.queryPerformance.slowQueryThresholdMs', 1000),
      logAllQueries: this.configService.get<boolean>('database.queryPerformance.logAllQueries', false),
      sampleRate: this.configService.get<number>('database.queryPerformance.sampleRate', 0.1),
      trackBindParameters: this.configService.get<boolean>('database.queryPerformance.trackBindParameters', true),
      trackStackTrace: this.configService.get<boolean>('database.queryPerformance.trackStackTrace', false)
    };

    if (!this.config.enabled) {
      this.logger.info('Query performance monitoring is disabled');
      return;
    }

    // Set up Prisma middleware for query monitoring
    this.setupPrismaMiddleware();
    
    this.logger.info('Query performance monitor initialized', {
      metadata: {
        slowQueryThresholdMs: this.config.slowQueryThresholdMs,
        logAllQueries: this.config.logAllQueries,
        sampleRate: this.config.sampleRate
      }
    });
  }

  /**
   * Track a query's performance
   */
  trackQuery(
    query: string,
    durationMs: number,
    context?: QueryExecutionContext,
    parameters?: any[]
  ): void {
    if (!this.config.enabled) return;
    
    // Apply sampling
    if (!this.shouldSample()) return;
    
    const correlationId = context?.correlationId || CorrelationIdManager.getCurrentId();
    
    // Normalize query for aggregation
    const normalizedQuery = this.normalizeQuery(query);
    
    // Update query stats
    if (!this.queryStats.has(normalizedQuery)) {
      this.queryStats.set(normalizedQuery, {
        count: 0,
        totalDuration: 0,
        maxDuration: 0
      });
    }
    
    const stats = this.queryStats.get(normalizedQuery)!;
    stats.count++;
    stats.totalDuration += durationMs;
    stats.maxDuration = Math.max(stats.maxDuration, durationMs);
    
    // Record in performance monitoring
    this.performanceMonitor.recordResponseTime({
      operation: 'database.query',
      durationMs,
      tags: {
        source: context?.source || 'unknown',
        correlationId,
        operation: context?.operation || 'unknown'
      }
    });
    
    // Check if it's a slow query
    const isSlowQuery = durationMs > this.config.slowQueryThresholdMs;
    
    // Log query if needed
    if (isSlowQuery || this.config.logAllQueries) {
      const logLevel = isSlowQuery ? 'warn' : 'debug';
      const logMessage = isSlowQuery ? 'Slow query detected' : 'Query executed';
      
      this.logger[logLevel](`${logMessage}: ${durationMs}ms`, {
        metadata: {
          query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
          duration: durationMs,
          source: context?.source,
          correlationId,
          parameters: this.config.trackBindParameters ? parameters : undefined
        }
      });
    }
    
    // Track slow queries
    if (isSlowQuery) {
      const stackTrace = this.config.trackStackTrace ? new Error().stack : undefined;
      
      const slowQuery = {
        query,
        normalizedQuery,
        durationMs,
        timestamp: new Date(),
        context,
        parameters: this.config.trackBindParameters ? parameters : undefined,
        stackTrace
      };
      
      this.slowQueries.push(slowQuery);
      
      // Keep only the last 1000 slow queries
      if (this.slowQueries.length > 1000) {
        this.slowQueries.shift();
      }
      
      // Emit event
      this.eventEmitter.emit('database.slowQuery', {
        query,
        duration: durationMs,
        timestamp: new Date(),
        source: context?.source,
        correlationId,
        parameters: this.config.trackBindParameters ? parameters : undefined
      });
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    topSlowQueries: any[];
    mostFrequentQueries: any[];
  } {
    const totalQueries = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.count, 0);
    const totalDuration = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.totalDuration, 0);
    const avgDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;
    
    // Get top slow queries
    const topSlowQueries = [...this.slowQueries]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10);
    
    // Get most frequent queries
    const mostFrequentQueries = Array.from(this.queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalQueries,
      avgDuration,
      slowQueries: this.slowQueries.length,
      topSlowQueries,
      mostFrequentQueries
    };
  }

  /**
   * Reset query statistics
   */
  resetStats(): void {
    this.queryStats.clear();
    this.slowQueries = [];
    this.logger.info('Query performance statistics reset');
  }

  /**
   * Private methods
   */

  private setupPrismaMiddleware(): void {
    // Add middleware to track query performance
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();
      
      // Execute the query
      const result = await next(params);
      
      // Calculate duration
      const durationMs = Date.now() - startTime;
      
      // Track the query
      this.trackQuery(
        `${params.action} ${params.model}`,
        durationMs,
        {
          source: 'prisma',
          correlationId: CorrelationIdManager.getCurrentId(),
          operation: params.action
        },
        params.args
      );
      
      return result;
    });
  }

  private normalizeQuery(query: string): string {
    // Replace specific values with placeholders
    return query
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private shouldSample(): boolean {
    // Always track if logAllQueries is true
    if (this.config.logAllQueries) return true;
    
    // Apply sampling rate
    return Math.random() < this.config.sampleRate;
  }
}
