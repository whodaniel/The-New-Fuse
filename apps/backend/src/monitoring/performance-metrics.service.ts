import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

/**
 * Performance Metrics Service
 * Collects and exposes performance metrics for monitoring
 * Compatible with Prometheus, Grafana, and other monitoring tools
 */
@Injectable()
export class PerformanceMetricsService {
  private readonly logger = new Logger(PerformanceMetricsService.name);
  private readonly registry: Registry;

  // HTTP Metrics
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly httpRequestErrors: Counter;
  private readonly httpRequestsInFlight: Gauge;

  // Database Metrics
  private readonly dbQueryDuration: Histogram;
  private readonly dbConnectionPoolSize: Gauge;
  private readonly dbQueryErrors: Counter;
  private readonly dbActiveConnections: Gauge;

  // Cache Metrics
  private readonly cacheHits: Counter;
  private readonly cacheMisses: Counter;
  private readonly cacheOperationDuration: Histogram;

  // Business Metrics
  private readonly activeUsers: Gauge;
  private readonly agentsCreated: Counter;
  private readonly messagesProcessed: Counter;

  constructor() {
    this.registry = new Registry();

    // Initialize HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    this.httpRequestsInFlight = new Gauge({
      name: 'http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
      registers: [this.registry],
    });

    // Initialize Database Metrics
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.dbConnectionPoolSize = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Current size of database connection pool',
      registers: [this.registry],
    });

    this.dbQueryErrors = new Counter({
      name: 'db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'table', 'error_type'],
      registers: [this.registry],
    });

    this.dbActiveConnections = new Gauge({
      name: 'db_active_connections',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Initialize Cache Metrics
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheOperationDuration = new Histogram({
      name: 'cache_operation_duration_seconds',
      help: 'Duration of cache operations in seconds',
      labelNames: ['operation', 'cache_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
      registers: [this.registry],
    });

    // Initialize Business Metrics
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      registers: [this.registry],
    });

    this.agentsCreated = new Counter({
      name: 'agents_created_total',
      help: 'Total number of agents created',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.messagesProcessed = new Counter({
      name: 'messages_processed_total',
      help: 'Total number of messages processed',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.logger.log('Performance metrics service initialized');
  }

  // HTTP Metrics Methods
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration / 1000); // Convert to seconds

    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  recordHttpError(method: string, route: string, errorType: string): void {
    this.httpRequestErrors.labels(method, route, errorType).inc();
  }

  incrementRequestsInFlight(): void {
    this.httpRequestsInFlight.inc();
  }

  decrementRequestsInFlight(): void {
    this.httpRequestsInFlight.dec();
  }

  // Database Metrics Methods
  recordDbQuery(operation: string, table: string, duration: number): void {
    this.dbQueryDuration
      .labels(operation, table)
      .observe(duration / 1000); // Convert to seconds
  }

  recordDbError(operation: string, table: string, errorType: string): void {
    this.dbQueryErrors.labels(operation, table, errorType).inc();
  }

  setDbConnectionPoolSize(size: number): void {
    this.dbConnectionPoolSize.set(size);
  }

  setDbActiveConnections(count: number): void {
    this.dbActiveConnections.set(count);
  }

  // Cache Metrics Methods
  recordCacheHit(cacheType: string = 'redis'): void {
    this.cacheHits.labels(cacheType).inc();
  }

  recordCacheMiss(cacheType: string = 'redis'): void {
    this.cacheMisses.labels(cacheType).inc();
  }

  recordCacheOperation(
    operation: string,
    cacheType: string,
    duration: number,
  ): void {
    this.cacheOperationDuration
      .labels(operation, cacheType)
      .observe(duration / 1000); // Convert to seconds
  }

  // Business Metrics Methods
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  recordAgentCreated(type: string): void {
    this.agentsCreated.labels(type).inc();
  }

  recordMessageProcessed(type: string): void {
    this.messagesProcessed.labels(type).inc();
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Get metrics in JSON format
  async getMetricsJson() {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  // Reset all metrics (useful for testing)
  resetMetrics(): void {
    this.registry.resetMetrics();
    this.logger.log('All metrics reset');
  }

  // Get current metric values
  getCurrentMetrics() {
    return {
      http: {
        requestsInFlight: this.httpRequestsInFlight['hashMap'],
      },
      database: {
        connectionPoolSize: this.dbConnectionPoolSize['hashMap'],
        activeConnections: this.dbActiveConnections['hashMap'],
      },
      business: {
        activeUsers: this.activeUsers['hashMap'],
      },
    };
  }
}
