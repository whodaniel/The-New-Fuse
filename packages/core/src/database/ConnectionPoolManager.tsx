import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  connectionTimeouts: number;
  queryDuration: {
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
}

interface ConnectionPoolOptions extends PoolConfig {
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  statementTimeout?: number;
}

@Injectable()
export class ConnectionPoolManager implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private metricsInterval: NodeJS.Timeout;
  private queryDurations: number[] = [];
  private readonly defaultOptions: ConnectionPoolOptions = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxRetries: 3,
    retryDelay: 1000,
    statementTimeout: 30000,
  };

  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.initializePool();
    this.startMetricsCollection();
  }

  async onModuleDestroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    await this.pool.end();
  }

  private async initializePool() {
    const options = {
      ...this.defaultOptions,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'fuse',
    };

    this.pool = new Pool(options);

    this.pool.on('connect', (client) => {
      this.setupClient(client);
      this.metrics.increment('database.pool.connections');
    });

    this.pool.on('error', (error, client) => {
      this.logger.error('Unexpected error on idle client', error);
      this.metrics.increment('database.pool.errors');
    });

    this.pool.on('remove', () => {
      this.metrics.decrement('database.pool.connections');
    });
  }

  private setupClient(client: PoolClient) {
    // Set statement timeout
    client.query(`SET statement_timeout = ${this.defaultOptions.statementTimeout}`);
    
    // Enable query timing
    const originalQuery = client.query.bind(client);
    client.query = (...args: any[]) => {
      const startTime = process.hrtime();
      const query = originalQuery(...args);
      
      query.then(() => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        this.recordQueryDuration(duration);
      });

      return query;
    };
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getPoolMetrics();
        
        this.metrics.gauge('database.pool.total_connections', metrics.totalConnections);
        this.metrics.gauge('database.pool.active_connections', metrics.activeConnections);
        this.metrics.gauge('database.pool.idle_connections', metrics.idleConnections);
        this.metrics.gauge('database.pool.waiting_clients', metrics.waitingClients);
        
        this.eventEmitter.emit('database.pool.metrics', metrics);

        // Reset query durations after processing
        this.queryDurations = [];
      } catch (error) {
        this.logger.error('Failed to collect pool metrics:', error);
      }
    }, 60000); // Collect metrics every minute
  }

  private recordQueryDuration(duration: number) {
    this.queryDurations.push(duration);
    
    // Keep only last 1000 queries for metrics
    if (this.queryDurations.length > 1000) {
      this.queryDurations.shift();
    }
  }

  private calculateQueryMetrics(): PoolMetrics['queryDuration'] {
    if (this.queryDurations.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0 };
    }

    const sorted = [...this.queryDurations].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index],
    };
  }

  async getPoolMetrics(): Promise<PoolMetrics> {
    const poolState = await this.pool.query('SELECT COUNT(*) as count FROM pg_stat_activity');
    
    return {
      totalConnections: this.pool.totalCount,
      activeConnections: this.pool.activeCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      maxConnections: this.pool.options.max as number,
      connectionTimeouts: parseInt(poolState.rows[0].count, 10),
      queryDuration: this.calculateQueryMetrics(),
    };
  }

  async getClient(
    retryCount: number = 0
  ): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      if (retryCount < (this.defaultOptions.maxRetries || 3)) {
        this.logger.warn(`Failed to get client, retrying (${retryCount + 1}/${this.defaultOptions.maxRetries})...`);
        await new Promise(resolve => 
          setTimeout(resolve, (this.defaultOptions.retryDelay || 1000) * (retryCount + 1))
        );
        return this.getClient(retryCount + 1);
      }
      throw error;
    }
  }

  async executeWithClient<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      return await operation(client);
    } finally {
      client.release();
    }
  }

  async checkConnections(): Promise<{
    healthy: boolean;
    details: {
      overloaded: boolean;
      deadConnections: number;
      longRunningQueries: number;
    };
  }> {
    const metrics = await this.getPoolMetrics();
    const longRunningQueries = await this.pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active' 
        AND NOW() - query_start > interval '30 seconds'
    `);

    const deadConnections = await this.pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'idle in transaction (aborted)'
    `);

    const details = {
      overloaded: metrics.waitingClients > 0,
      deadConnections: parseInt(deadConnections.rows[0].count, 10),
      longRunningQueries: parseInt(longRunningQueries.rows[0].count, 10),
    };

    return {
      healthy: !details.overloaded && 
               details.deadConnections === 0 && 
               details.longRunningQueries === 0,
      details,
    };
  }

  async killIdleConnections(idleTimeout: number = 3600000): Promise<number> {
    const result = await this.pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
        AND state_change < NOW() - interval '${idleTimeout} milliseconds'
    `);

    return result.rowCount;
  }

  async resetPool(): Promise<void> {
    try {
      // End all clients
      await this.pool.end();
      
      // Reinitialize the pool
      await this.initializePool();
      
      this.metrics.increment('database.pool.reset.success');
      this.logger.info('Connection pool reset successfully');
    } catch (error) {
      this.metrics.increment('database.pool.reset.failed');
      this.logger.error('Failed to reset connection pool:', error);
      throw error;
    }
  }
}