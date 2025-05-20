import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from './DatabaseService.js';
import { ConnectionPoolManager } from './ConnectionPoolManager.js';
import { CacheManager } from './CacheManager.js';
import { HealthCheckService } from './HealthCheckService.js';
import { IndexManager } from './IndexManager.js';
import { VectorOperationsService } from './VectorOperationsService.js';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: Record<string, any>;
    };
    cache: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: Record<string, any>;
    };
    connectionPool: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: Record<string, any>;
    };
    vector: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: Record<string, any>;
    };
  };
  metrics: {
    queryLatency: number;
    errorRate: number;
    throughput: number;
    cacheHitRate: number;
    connectionUtilization: number;
  };
}

interface PerformanceMetrics {
  timestamp: Date;
  queryCount: number;
  avgQueryTime: number;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
  activeConnections: number;
  waitingConnections: number;
  vectorSearchLatency: number;
}

@Injectable()
export class ObservabilityService implements OnModuleInit {
  private metricsBuffer: PerformanceMetrics[] = [];
  private readonly bufferSize = 1440; // Store 24 hours of minute-by-minute data
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly db: DatabaseService,
    private readonly poolManager: ConnectionPoolManager,
    private readonly cacheManager: CacheManager,
    private readonly healthCheck: HealthCheckService,
    private readonly indexManager: IndexManager,
    private readonly vectorOps: VectorOperationsService,
  ) {}

  async onModuleInit() {
    this.startHealthChecks();
    this.setupEventListeners();
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.getSystemHealth();
      this.eventEmitter.emit('system.health', health);

      if (health.status !== 'healthy') {
        this.logger.warn('System health check detected issues:', health);
      }

      // Store metrics
      this.recordMetrics({
        timestamp: new Date(),
        queryCount: await this.getQueryCount(),
        avgQueryTime: await this.getAverageQueryTime(),
        errorCount: await this.getErrorCount(),
        cacheHits: await this.getCacheHits(),
        cacheMisses: await this.getCacheMisses(),
        activeConnections: await this.getActiveConnections(),
        waitingConnections: await this.getWaitingConnections(),
        vectorSearchLatency: await this.getVectorSearchLatency(),
      });
    }, 60000); // Check every minute
  }

  private setupEventListeners() {
    this.eventEmitter.on('database.error', (error) => {
      this.metrics.increment('database.errors');
      this.logger.error('Database error detected:', error);
    });

    this.eventEmitter.on('cache.error', (error) => {
      this.metrics.increment('cache.errors');
      this.logger.error('Cache error detected:', error);
    });

    this.eventEmitter.on('vector.error', (error) => {
      this.metrics.increment('vector.errors');
      this.logger.error('Vector operation error detected:', error);
    });
  }

  private recordMetrics(metrics: PerformanceMetrics) {
    this.metricsBuffer.push(metrics);
    if (this.metricsBuffer.length > this.bufferSize) {
      this.metricsBuffer.shift();
    }

    // Record metrics
    this.metrics.gauge('system.query_latency', metrics.avgQueryTime);
    this.metrics.gauge('system.error_rate', metrics.errorCount);
    this.metrics.gauge('system.throughput', metrics.queryCount);
    this.metrics.gauge('system.cache_hit_rate', 
      metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
    );
    this.metrics.gauge('system.connection_utilization',
      metrics.activeConnections / (metrics.activeConnections + metrics.waitingConnections)
    );
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [
      dbHealth,
      cacheHealth,
      poolHealth,
      vectorHealth
    ] = await Promise.all([
      this.healthCheck.getStatus(),
      this.getCacheHealth(),
      this.poolManager.checkConnections(),
      this.getVectorHealth(),
    ]);

    const metrics = await this.calculateSystemMetrics();

    return {
      status: this.determineOverallHealth(dbHealth, cacheHealth, poolHealth, vectorHealth),
      components: {
        database: {
          status: dbHealth.status,
          details: dbHealth.details,
        },
        cache: {
          status: this.determineCacheHealth(cacheHealth),
          details: cacheHealth,
        },
        connectionPool: {
          status: poolHealth.healthy ? 'healthy' : 'degraded',
          details: poolHealth.details,
        },
        vector: {
          status: vectorHealth.healthy ? 'healthy' : 'degraded',
          details: vectorHealth,
        },
      },
      metrics,
    };
  }

  private determineOverallHealth(
    dbHealth: any,
    cacheHealth: any,
    poolHealth: any,
    vectorHealth: any
  ): SystemHealth['status'] {
    const statuses = [
      dbHealth.status,
      this.determineCacheHealth(cacheHealth),
      poolHealth.healthy ? 'healthy' : 'degraded',
      vectorHealth.healthy ? 'healthy' : 'degraded',
    ];

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private determineCacheHealth(metrics: any): 'healthy' | 'degraded' | 'unhealthy' {
    if (metrics.hitRate < 0.5 || metrics.evictionRate > 0.1) {
      return 'degraded';
    }

    if (metrics.hitRate < 0.2 || metrics.evictionRate > 0.3) {
      return 'unhealthy';
    }

    return 'healthy';
  }

  private async calculateSystemMetrics(): Promise<SystemHealth['metrics']> {
    if (this.metricsBuffer.length === 0) {
      return {
        queryLatency: 0,
        errorRate: 0,
        throughput: 0,
        cacheHitRate: 0,
        connectionUtilization: 0,
      };
    }

    const recent = this.metricsBuffer.slice(-5); // Last 5 minutes
    
    return {
      queryLatency: this.average(recent.map(m => m.avgQueryTime)),
      errorRate: this.average(recent.map(m => m.errorCount / m.queryCount)),
      throughput: this.average(recent.map(m => m.queryCount)),
      cacheHitRate: this.average(recent.map(m => 
        m.cacheHits / (m.cacheHits + m.cacheMisses)
      )),
      connectionUtilization: this.average(recent.map(m =>
        m.activeConnections / (m.activeConnections + m.waitingConnections)
      )),
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  async getMetricsHistory(
    timeRange: { start: Date; end: Date }
  ): Promise<PerformanceMetrics[]> {
    return this.metricsBuffer.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  async getQueryCount(): Promise<number> {
    const result = await this.db.executeQuery(`
      SELECT count(*) as count 
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
    `);
    return parseInt(result[0].count, 10);
  }

  async getAverageQueryTime(): Promise<number> {
    const result = await this.db.executeQuery(`
      SELECT avg(mean_exec_time) as avg_time 
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
    `);
    return parseFloat(result[0].avg_time || '0');
  }

  async getErrorCount(): Promise<number> {
    const result = await this.db.executeQuery(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active' 
        AND state_change < NOW() - interval '30 seconds'
        AND query NOT LIKE '%pg_stat_activity%'
    `);
    return parseInt(result[0].count, 10);
  }

  private async getCacheHits(): Promise<number> {
    const stats = await this.cacheManager.getStats();
    return stats.hits;
  }

  private async getCacheMisses(): Promise<number> {
    const stats = await this.cacheManager.getStats();
    return stats.misses;
  }

  private async getActiveConnections(): Promise<number> {
    const metrics = await this.poolManager.getPoolMetrics();
    return metrics.activeConnections;
  }

  private async getWaitingConnections(): Promise<number> {
    const metrics = await this.poolManager.getPoolMetrics();
    return metrics.waitingClients;
  }

  private async getVectorSearchLatency(): Promise<number> {
    // Sample vector search latency with a test query
    const startTime = Date.now();
    await this.vectorOps.findNearest('test_vectors', 'embedding', new Array(1536).fill(0), { limit: 1 });
    return Date.now() - startTime;
  }

  private async getCacheHealth(): Promise<{
    hitRate: number;
    evictionRate: number;
    memoryUsage: number;
  }> {
    const stats = await this.cacheManager.getStats();
    const total = stats.hits + stats.misses;

    return {
      hitRate: total > 0 ? stats.hits / total : 1,
      evictionRate: stats.evictions / total,
      memoryUsage: stats.memory,
    };
  }

  private async getVectorHealth(): Promise<{
    healthy: boolean;
    avgLatency: number;
    errorRate: number;
    indexStatus: string;
  }> {
    try {
      const latencies: number[] = [];
      const errors: number[] = [];

      // Run 5 sample queries
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        try {
          await this.vectorOps.findNearest('test_vectors', 'embedding', new Array(1536).fill(0), { limit: 1 });
          latencies.push(Date.now() - startTime);
        } catch (error) {
          errors.push(1);
        }
      }

      const avgLatency = latencies.length > 0 
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
        : 0;

      return {
        healthy: errors.length === 0 && avgLatency < 1000,
        avgLatency,
        errorRate: errors.length / 5,
        indexStatus: await this.getVectorIndexStatus(),
      };
    } catch (error) {
      return {
        healthy: false,
        avgLatency: 0,
        errorRate: 1,
        indexStatus: 'error',
      };
    }
  }

  private async getVectorIndexStatus(): Promise<string> {
    try {
      const result = await this.db.executeQuery(`
        SELECT indexname, status 
        FROM pg_indexes 
        WHERE indexname LIKE '%vector%'
      `);
      return result[0]?.status || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async generateHealthReport(): Promise<string> {
    const health = await this.getSystemHealth();
    const metrics = await this.calculateSystemMetrics();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      status: health.status,
      components: health.components,
      metrics: metrics,
      recommendations: await this.generateRecommendations(health),
    }, null, 2);
  }

  private async generateRecommendations(
    health: SystemHealth
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (health.metrics.queryLatency > 1000) {
      recommendations.push('Consider optimizing slow queries or adding indexes');
    }

    if (health.metrics.cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate is low - review caching strategy');
    }

    if (health.metrics.connectionUtilization > 0.8) {
      recommendations.push('High connection pool utilization - consider increasing pool size');
    }

    if (health.components.vector.status !== 'healthy') {
      recommendations.push('Vector search performance issues detected - review vector indexes');
    }

    return recommendations;
  }
}