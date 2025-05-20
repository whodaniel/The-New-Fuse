import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConnectionPoolManager } from './ConnectionPoolManager.js';

export interface DatabaseHealthConfig {
  enabled: boolean;
  checkIntervalMs: number;
  connectionTimeoutMs: number;
  queryTimeoutMs: number;
  maxConsecutiveFailures: number;
}

export interface DatabaseHealthStatus {
  healthy: boolean;
  responseTimeMs: number;
  connectionPool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  };
  deadlocks: number;
  longRunningQueries: number;
  diskUsage: {
    totalBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  lastChecked: Date;
  consecutiveFailures: number;
}

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  private readonly logger: any;
  private config: DatabaseHealthConfig;
  private healthCheckInterval: NodeJS.Timeout;
  private healthStatus: DatabaseHealthStatus;
  private consecutiveFailures: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly prisma: PrismaService,
    private readonly connectionPoolManager: ConnectionPoolManager,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('DatabaseHealth');
    
    // Initialize health status
    this.healthStatus = {
      healthy: true,
      responseTimeMs: 0,
      connectionPool: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      },
      deadlocks: 0,
      longRunningQueries: 0,
      diskUsage: {
        totalBytes: 0,
        usedBytes: 0,
        usagePercent: 0
      },
      lastChecked: new Date(),
      consecutiveFailures: 0
    };
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('database.health.enabled', true),
      checkIntervalMs: this.configService.get<number>('database.health.checkIntervalMs', 60000), // 1 minute
      connectionTimeoutMs: this.configService.get<number>('database.health.connectionTimeoutMs', 5000),
      queryTimeoutMs: this.configService.get<number>('database.health.queryTimeoutMs', 10000),
      maxConsecutiveFailures: this.configService.get<number>('database.health.maxConsecutiveFailures', 3)
    };

    if (!this.config.enabled) {
      this.logger.info('Database health monitoring is disabled');
      return;
    }

    // Start health check interval
    this.healthCheckInterval = setInterval(() => this.checkHealth(), this.config.checkIntervalMs);
    
    // Run initial health check
    await this.checkHealth();
    
    this.logger.info('Database health service initialized', {
      metadata: {
        checkIntervalMs: this.config.checkIntervalMs,
        connectionTimeoutMs: this.config.connectionTimeoutMs
      }
    });
  }

  /**
   * Get current database health status
   */
  getHealthStatus(): DatabaseHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Check if the database is healthy
   */
  isHealthy(): boolean {
    return this.healthStatus.healthy;
  }

  /**
   * Manually trigger a health check
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    try {
      const startTime = Date.now();
      
      // Check basic connectivity with a simple query
      await this.runWithTimeout(
        this.prisma.$queryRaw`SELECT 1`,
        this.config.queryTimeoutMs
      );
      
      // Calculate response time
      const responseTimeMs = Date.now() - startTime;
      
      // Get connection pool metrics
      const poolMetrics = await this.connectionPoolManager.getPoolMetrics();
      
      // Check for deadlocks
      const deadlocks = await this.getDeadlockCount();
      
      // Check for long-running queries
      const longRunningQueries = await this.getLongRunningQueriesCount();
      
      // Check disk usage
      const diskUsage = await this.getDiskUsage();
      
      // Reset consecutive failures
      this.consecutiveFailures = 0;
      
      // Update health status
      this.healthStatus = {
        healthy: true,
        responseTimeMs,
        connectionPool: {
          totalConnections: poolMetrics.totalConnections,
          activeConnections: poolMetrics.activeConnections,
          idleConnections: poolMetrics.idleConnections,
          waitingClients: poolMetrics.waitingClients
        },
        deadlocks,
        longRunningQueries,
        diskUsage,
        lastChecked: new Date(),
        consecutiveFailures: this.consecutiveFailures
      };
      
      // Emit health status event
      this.eventEmitter.emit('database.health', {
        status: 'healthy',
        metrics: this.healthStatus
      });
      
      this.logger.info('Database health check passed', {
        metadata: {
          responseTimeMs,
          connectionPool: this.healthStatus.connectionPool,
          longRunningQueries
        }
      });
      
      return this.healthStatus;
    } catch (error) {
      // Increment consecutive failures
      this.consecutiveFailures++;
      
      // Update health status
      this.healthStatus = {
        ...this.healthStatus,
        healthy: this.consecutiveFailures < this.config.maxConsecutiveFailures,
        lastChecked: new Date(),
        consecutiveFailures: this.consecutiveFailures
      };
      
      // Emit health status event
      this.eventEmitter.emit('database.health', {
        status: this.healthStatus.healthy ? 'degraded' : 'unhealthy',
        error: error.message,
        consecutiveFailures: this.consecutiveFailures,
        metrics: this.healthStatus
      });
      
      this.logger.error('Database health check failed', {
        error,
        metadata: {
          consecutiveFailures: this.consecutiveFailures,
          maxConsecutiveFailures: this.config.maxConsecutiveFailures
        }
      });
      
      return this.healthStatus;
    }
  }

  /**
   * Private methods
   */

  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  private async getDeadlockCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE wait_event_type = 'Lock'
        AND wait_event = 'transactionid'
      `;
      
      return parseInt((result as any[])[0].count, 10);
    } catch (error) {
      this.logger.error('Failed to get deadlock count', { error });
      return 0;
    }
  }

  private async getLongRunningQueriesCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query NOT ILIKE '%pg_stat_activity%'
        AND now() - query_start > interval '5 minutes'
      `;
      
      return parseInt((result as any[])[0].count, 10);
    } catch (error) {
      this.logger.error('Failed to get long running queries count', { error });
      return 0;
    }
  }

  private async getDiskUsage(): Promise<{ totalBytes: number; usedBytes: number; usagePercent: number }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT
          pg_database_size(current_database()) as db_size,
          pg_size_pretty(pg_database_size(current_database())) as pretty_size
      `;
      
      const dbSizeBytes = parseInt((result as any[])[0].db_size, 10);
      
      // Get tablespace info
      const tablespaceResult = await this.prisma.$queryRaw`
        SELECT
          pg_tablespace_size(t.spcname) as size_bytes
        FROM pg_tablespace t
        WHERE t.spcname = 'pg_default'
      `;
      
      const totalBytes = parseInt((tablespaceResult as any[])[0].size_bytes, 10);
      const usedBytes = dbSizeBytes;
      const usagePercent = (usedBytes / totalBytes) * 100;
      
      return {
        totalBytes,
        usedBytes,
        usagePercent
      };
    } catch (error) {
      this.logger.error('Failed to get disk usage', { error });
      return {
        totalBytes: 0,
        usedBytes: 0,
        usagePercent: 0
      };
    }
  }
}
