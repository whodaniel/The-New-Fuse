import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './DatabaseService.js';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details: {
    connectionPool: {
      active: number;
      idle: number;
      waiting: number;
      maxSize: number;
    };
    queryMetrics: {
      averageResponseTime: number;
      queriesPerSecond: number;
      errorRate: number;
    };
    replication?: {
      lag: number;
      status: 'synchronized' | 'replicating' | 'disconnected';
    };
    cacheStatus?: {
      hitRate: number;
      missRate: number;
      size: number;
      evictions: number;
    };
  };
}

@Injectable()
export class HealthCheckService implements OnModuleInit {
  private healthStatus: HealthStatus;
  private checkInterval: NodeJS.Timeout;
  private metricsWindow: number = 60000; // 1 minute
  private queryMetrics: Array<{ timestamp: number; duration: number; success: boolean }> = [];

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.startHealthChecks();
  }

  private startHealthChecks() {
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 15000); // Check every 15 seconds
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const [poolStats, queryStats, replicationStatus] = await Promise.all([
        this.getConnectionPoolStats(),
        this.calculateQueryMetrics(),
        this.checkReplicationStatus(),
      ]);

      const cacheStatus = await this.getCacheStatus();

      this.healthStatus = {
        status: this.determineOverallStatus(poolStats, queryStats),
        timestamp: new Date(),
        details: {
          connectionPool: poolStats,
          queryMetrics: queryStats,
          replication: replicationStatus,
          cacheStatus,
        },
      };

      this.metrics.gauge('database.health.status', this.healthStatus.status === 'healthy' ? 1 : 0);
      this.eventEmitter.emit('database.health.updated', this.healthStatus);

      if (this.healthStatus.status !== 'healthy') {
        this.logger.warn('Database health check detected issues', this.healthStatus);
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
      this.metrics.increment('database.health.check.failed');
      
      this.healthStatus = {
        status: 'unhealthy',
        timestamp: new Date(),
        details: {
          connectionPool: {
            active: 0,
            idle: 0,
            waiting: 0,
            maxSize: 0,
          },
          queryMetrics: {
            averageResponseTime: 0,
            queriesPerSecond: 0,
            errorRate: 1,
          },
        },
      };
    }
  }

  private async getConnectionPoolStats() {
    const poolStats = await this.db.executeQuery<any[]>(`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'waiting') as waiting,
        max_connections as max_size
      FROM pg_stat_activity;
    `);

    return {
      active: poolStats[0].active,
      idle: poolStats[0].idle,
      waiting: poolStats[0].waiting,
      maxSize: poolStats[0].max_size,
    };
  }

  private calculateQueryMetrics() {
    const now = Date.now();
    this.queryMetrics = this.queryMetrics.filter(m => now - m.timestamp < this.metricsWindow);

    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) {
      return {
        averageResponseTime: 0,
        queriesPerSecond: 0,
        errorRate: 0,
      };
    }

    const errors = this.queryMetrics.filter(m => !m.success).length;
    const totalDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      averageResponseTime: totalDuration / totalQueries,
      queriesPerSecond: (totalQueries / this.metricsWindow) * 1000,
      errorRate: errors / totalQueries,
    };
  }

  private async checkReplicationStatus() {
    try {
      const replicationStats = await this.db.executeQuery<any[]>(`
        SELECT 
          client_addr,
          state,
          write_lag,
          flush_lag,
          replay_lag
        FROM pg_stat_replication;
      `);

      if (replicationStats.length === 0) {
        return undefined;
      }

      const maxLag = Math.max(
        ...replicationStats.map(s => 
          Math.max(s.write_lag || 0, s.flush_lag || 0, s.replay_lag || 0)
        )
      );

      return {
        lag: maxLag,
        status: this.determineReplicationStatus(maxLag, replicationStats[0].state),
      };
    } catch {
      return undefined;
    }
  }

  private async getCacheStatus() {
    try {
      const cacheStats = await this.db.executeQuery<any[]>(`
        SELECT 
          sum(hits) as hits,
          sum(misses) as misses,
          sum(evictions) as evictions,
          sum(bytes) as size
        FROM pg_stat_database;
      `);

      const total = cacheStats[0].hits + cacheStats[0].misses;
      
      return {
        hitRate: total > 0 ? cacheStats[0].hits / total : 0,
        missRate: total > 0 ? cacheStats[0].misses / total : 0,
        size: cacheStats[0].size,
        evictions: cacheStats[0].evictions,
      };
    } catch {
      return undefined;
    }
  }

  private determineOverallStatus(
    poolStats: any,
    queryMetrics: any,
  ): HealthStatus['status'] {
    if (
      poolStats.waiting > poolStats.maxSize * 0.8 ||
      queryMetrics.errorRate > 0.1 ||
      queryMetrics.averageResponseTime > 1000
    ) {
      return 'unhealthy';
    }

    if (
      poolStats.waiting > poolStats.maxSize * 0.5 ||
      queryMetrics.errorRate > 0.05 ||
      queryMetrics.averageResponseTime > 500
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  private determineReplicationStatus(
    lag: number,
    state: string,
  ): 'synchronized' | 'replicating' | 'disconnected' {
    if (state !== 'streaming') {
      return 'disconnected';
    }

    return lag < 30000 ? 'synchronized' : 'replicating';
  }

  public getStatus(): HealthStatus {
    return this.healthStatus;
  }

  public recordQuery(duration: number, success: boolean) {
    this.queryMetrics.push({
      timestamp: Date.now(),
      duration,
      success,
    });
  }
}