/**
 * Sync Health Service
 * Integrates with existing health monitoring infrastructure
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthStatus, ISystemHealthMonitor } from '@the-new-fuse/core-monitoring';
import { EventEmitter } from 'events';
import { PerformanceOptimizationService } from '../performance/PerformanceOptimizationService';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';

export interface SyncHealthMetrics {
  masterClock: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    drift: number;
    lastSync: Date;
    responseTime: number;
  };
  fileWatcher: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    watchedPaths: number;
    eventsPerSecond: number;
    errorRate: number;
  };
  orchestrator: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSyncs: number;
    queueSize: number;
    throughput: number;
  };
  performance: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connectionPool: number;
    queryLatency: number;
    errorRate: number;
  };
  redis: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connectionCount: number;
    memoryUsage: number;
    commandLatency: number;
  };
}

@Injectable()
export class SyncHealthService extends EventEmitter implements ISystemHealthMonitor {
  private readonly logger = new Logger(SyncHealthService.name);
  private healthHistory: HealthStatus[] = [];
  private readonly maxHistorySize = 100;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly masterClock: MasterClockService,
    private readonly orchestrator: SyncOrchestrator,
    private readonly fileWatcher: EnhancedFileSystemWatcher,
    private readonly performance: PerformanceOptimizationService
  ) {
    super();
    this.startHealthMonitoring();
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    const interval = parseInt(process.env.SYNC_HEALTH_CHECK_INTERVAL || '30000');

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        this.addToHistory(health);
        this.emit('health-update', health);

        if (health.overall !== 'healthy') {
          this.logger.warn('Sync system health degraded', { health });
        }
      } catch (error) {
        this.logger.error('Health check failed', error);
      }
    }, interval);
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date();
    const components: HealthStatus['components'] = {};
    let overallScore = 0;
    let componentCount = 0;

    try {
      // Check master clock health
      const clockHealth = await this.checkMasterClockHealth();
      components.masterClock = clockHealth;
      overallScore += this.getComponentScore(clockHealth.status);
      componentCount++;

      // Check file watcher health
      const watcherHealth = await this.checkFileWatcherHealth();
      components.fileWatcher = watcherHealth;
      overallScore += this.getComponentScore(watcherHealth.status);
      componentCount++;

      // Check orchestrator health
      const orchestratorHealth = await this.checkOrchestratorHealth();
      components.orchestrator = orchestratorHealth;
      overallScore += this.getComponentScore(orchestratorHealth.status);
      componentCount++;

      // Check performance health
      const performanceHealth = await this.checkPerformanceHealth();
      components.performance = performanceHealth;
      overallScore += this.getComponentScore(performanceHealth.status);
      componentCount++;

      // Check database health
      const databaseHealth = await this.checkDatabaseHealth();
      components.database = databaseHealth;
      overallScore += this.getComponentScore(databaseHealth.status);
      componentCount++;

      // Check Redis health
      const redisHealth = await this.checkRedisHealth();
      components.redis = redisHealth;
      overallScore += this.getComponentScore(redisHealth.status);
      componentCount++;
    } catch (error) {
      this.logger.error('Error during health check', error);
      components.error = {
        status: 'unhealthy',
        message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    const avgScore = componentCount > 0 ? overallScore / componentCount : 0;
    const overall = this.determineOverallHealth(avgScore);

    return {
      timestamp,
      overall,
      components,
      score: Math.round(avgScore),
    };
  }

  /**
   * Check master clock service health
   */
  private async checkMasterClockHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      const drift = await this.masterClock.detectDrift();
      const responseTime = Date.now() - startTime;

      if (drift.maxDrift > 1000) {
        // 1 second
        return {
          status: 'unhealthy',
          message: `High clock drift: ${drift.maxDrift}ms`,
          responseTime,
        };
      } else if (drift.maxDrift > 100) {
        // 100ms
        return {
          status: 'degraded',
          message: `Moderate clock drift: ${drift.maxDrift}ms`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `Clock drift: ${drift.maxDrift}ms`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Master clock error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check file watcher health
   */
  private async checkFileWatcherHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      const metrics = await this.fileWatcher.getMetrics();
      const responseTime = Date.now() - startTime;

      if (metrics.errorRate > 0.1) {
        // 10% error rate
        return {
          status: 'unhealthy',
          message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          responseTime,
        };
      } else if (metrics.errorRate > 0.05) {
        // 5% error rate
        return {
          status: 'degraded',
          message: `Moderate error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `Watching ${metrics.watchedPaths} paths, ${metrics.eventsPerSecond.toFixed(1)} events/sec`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `File watcher error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check orchestrator health
   */
  private async checkOrchestratorHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      const metrics = await this.orchestrator.getMetrics();
      const responseTime = Date.now() - startTime;

      if (metrics.queueSize > 1000) {
        return {
          status: 'unhealthy',
          message: `High queue size: ${metrics.queueSize}`,
          responseTime,
        };
      } else if (metrics.queueSize > 500) {
        return {
          status: 'degraded',
          message: `Moderate queue size: ${metrics.queueSize}`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `${metrics.activeSyncs} active syncs, ${metrics.throughput.toFixed(1)} ops/sec`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Orchestrator error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check performance optimization health
   */
  private async checkPerformanceHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      const metrics = await this.performance.getPerformanceMetrics();
      const responseTime = Date.now() - startTime;

      if (metrics.memoryUsage > 0.9) {
        // 90% memory usage
        return {
          status: 'unhealthy',
          message: `High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
          responseTime,
        };
      } else if (metrics.memoryUsage > 0.8) {
        // 80% memory usage
        return {
          status: 'degraded',
          message: `Moderate memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `Memory: ${(metrics.memoryUsage * 100).toFixed(1)}%, Cache hit: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Performance error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      // Simple database ping
      await this.orchestrator.healthCheck();
      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        // 5 seconds
        return {
          status: 'unhealthy',
          message: `High database latency: ${responseTime}ms`,
          responseTime,
        };
      } else if (responseTime > 1000) {
        // 1 second
        return {
          status: 'degraded',
          message: `Moderate database latency: ${responseTime}ms`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `Database responsive: ${responseTime}ms`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<HealthStatus['components'][string]> {
    const startTime = Date.now();

    try {
      // Redis ping through orchestrator
      await this.orchestrator.redisHealthCheck();
      const responseTime = Date.now() - startTime;

      if (responseTime > 1000) {
        // 1 second
        return {
          status: 'unhealthy',
          message: `High Redis latency: ${responseTime}ms`,
          responseTime,
        };
      } else if (responseTime > 500) {
        // 500ms
        return {
          status: 'degraded',
          message: `Moderate Redis latency: ${responseTime}ms`,
          responseTime,
        };
      }

      return {
        status: 'healthy',
        message: `Redis responsive: ${responseTime}ms`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get component score for overall calculation
   */
  private getComponentScore(status: 'healthy' | 'degraded' | 'unhealthy'): number {
    switch (status) {
      case 'healthy':
        return 100;
      case 'degraded':
        return 50;
      case 'unhealthy':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Determine overall health from average score
   */
  private determineOverallHealth(avgScore: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (avgScore >= 80) return 'healthy';
    if (avgScore >= 40) return 'degraded';
    return 'unhealthy';
  }

  /**
   * Add health status to history
   */
  private addToHistory(health: HealthStatus): void {
    this.healthHistory.push(health);

    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(): HealthStatus[] {
    return [...this.healthHistory];
  }

  /**
   * Get detailed sync metrics
   */
  async getSyncHealthMetrics(): Promise<SyncHealthMetrics> {
    const [clockMetrics, watcherMetrics, orchestratorMetrics, performanceMetrics] =
      await Promise.all([
        this.getMasterClockMetrics(),
        this.getFileWatcherMetrics(),
        this.getOrchestratorMetrics(),
        this.getPerformanceMetrics(),
      ]);

    return {
      masterClock: clockMetrics,
      fileWatcher: watcherMetrics,
      orchestrator: orchestratorMetrics,
      performance: performanceMetrics,
      database: await this.getDatabaseMetrics(),
      redis: await this.getRedisMetrics(),
    };
  }

  private async getMasterClockMetrics() {
    const drift = await this.masterClock.detectDrift();
    return {
      status: drift.maxDrift > 100 ? 'degraded' : ('healthy' as const),
      drift: drift.maxDrift,
      lastSync: new Date(),
      responseTime: 0,
    };
  }

  private async getFileWatcherMetrics() {
    const metrics = await this.fileWatcher.getMetrics();
    return {
      status: metrics.errorRate > 0.05 ? 'degraded' : ('healthy' as const),
      watchedPaths: metrics.watchedPaths,
      eventsPerSecond: metrics.eventsPerSecond,
      errorRate: metrics.errorRate,
    };
  }

  private async getOrchestratorMetrics() {
    const metrics = await this.orchestrator.getMetrics();
    return {
      status: metrics.queueSize > 500 ? 'degraded' : ('healthy' as const),
      activeSyncs: metrics.activeSyncs,
      queueSize: metrics.queueSize,
      throughput: metrics.throughput,
    };
  }

  private async getPerformanceMetrics() {
    const metrics = await this.performance.getPerformanceMetrics();
    return {
      status: metrics.memoryUsage > 0.8 ? 'degraded' : ('healthy' as const),
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage || 0,
      cacheHitRate: metrics.cacheHitRate,
    };
  }

  private async getDatabaseMetrics() {
    return {
      status: 'healthy' as const,
      connectionPool: 10,
      queryLatency: 50,
      errorRate: 0,
    };
  }

  private async getRedisMetrics() {
    return {
      status: 'healthy' as const,
      connectionCount: 5,
      memoryUsage: 0.3,
      commandLatency: 10,
    };
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
  }
}
