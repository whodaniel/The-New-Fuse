/**
 * Prometheus Metrics Collection
 * Provides custom metrics for application monitoring
 */

import { EventEmitter } from 'events';

export interface MetricsConfig {
  enabled: boolean;
  prefix?: string;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
  collectInterval?: number;
}

export interface CustomMetric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
}

/**
 * Prometheus Metrics Service
 */
export class PrometheusMetrics extends EventEmitter {
  private client: any;
  private register: any;
  private metrics: Map<string, any> = new Map();
  private config: MetricsConfig;
  private initialized = false;

  // Common metrics
  public httpRequestDuration: any;
  public httpRequestTotal: any;
  public httpRequestErrors: any;
  public activeConnections: any;
  public databaseQueryDuration: any;
  public databaseConnectionPool: any;
  public cacheHits: any;
  public cacheMisses: any;
  public jobQueueSize: any;
  public jobProcessingDuration: any;
  public websocketConnections: any;
  public agentCount: any;
  public workflowExecutions: any;

  constructor(config: MetricsConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize Prometheus client
   */
  async initialize(): Promise<void> {
    try {
      this.client = await import('prom-client');
      this.register = new this.client.Registry();

      // Set default labels
      if (this.config.defaultLabels) {
        this.register.setDefaultLabels(this.config.defaultLabels);
      }

      // Collect default metrics (CPU, memory, etc.)
      if (this.config.collectDefaultMetrics !== false) {
        this.client.collectDefaultMetrics({
          register: this.register,
          prefix: this.config.prefix,
          timeout: this.config.collectInterval || 10000,
        });
      }

      // Initialize common metrics
      this.initializeCommonMetrics();

      this.initialized = true;
      this.emit('initialized');
      console.log('Prometheus metrics initialized');
    } catch (error) {
      console.error('Failed to initialize Prometheus metrics:', error);
      throw error;
    }
  }

  /**
   * Initialize common application metrics
   */
  private initializeCommonMetrics(): void {
    const prefix = this.config.prefix ? `${this.config.prefix}_` : '';

    // HTTP request duration histogram
    this.httpRequestDuration = new this.client.Histogram({
      name: `${prefix}http_request_duration_ms`,
      help: 'Duration of HTTP requests in milliseconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.register],
    });

    // HTTP request total counter
    this.httpRequestTotal = new this.client.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP request errors counter
    this.httpRequestErrors = new this.client.Counter({
      name: `${prefix}http_request_errors_total`,
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
      registers: [this.register],
    });

    // Active connections gauge
    this.activeConnections = new this.client.Gauge({
      name: `${prefix}active_connections`,
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.register],
    });

    // Database query duration histogram
    this.databaseQueryDuration = new this.client.Histogram({
      name: `${prefix}database_query_duration_ms`,
      help: 'Duration of database queries in milliseconds',
      labelNames: ['operation', 'table', 'status'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
      registers: [this.register],
    });

    // Database connection pool gauge
    this.databaseConnectionPool = new this.client.Gauge({
      name: `${prefix}database_connection_pool`,
      help: 'Database connection pool metrics',
      labelNames: ['state', 'database'],
      registers: [this.register],
    });

    // Cache hits counter
    this.cacheHits = new this.client.Counter({
      name: `${prefix}cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.register],
    });

    // Cache misses counter
    this.cacheMisses = new this.client.Counter({
      name: `${prefix}cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.register],
    });

    // Job queue size gauge
    this.jobQueueSize = new this.client.Gauge({
      name: `${prefix}job_queue_size`,
      help: 'Number of jobs in queue',
      labelNames: ['queue_name', 'status'],
      registers: [this.register],
    });

    // Job processing duration histogram
    this.jobProcessingDuration = new this.client.Histogram({
      name: `${prefix}job_processing_duration_ms`,
      help: 'Duration of job processing in milliseconds',
      labelNames: ['job_type', 'status'],
      buckets: [100, 500, 1000, 2000, 5000, 10000, 30000, 60000],
      registers: [this.register],
    });

    // WebSocket connections gauge
    this.websocketConnections = new this.client.Gauge({
      name: `${prefix}websocket_connections`,
      help: 'Number of active WebSocket connections',
      labelNames: ['status'],
      registers: [this.register],
    });

    // Agent count gauge
    this.agentCount = new this.client.Gauge({
      name: `${prefix}agents_total`,
      help: 'Total number of agents',
      labelNames: ['status', 'type'],
      registers: [this.register],
    });

    // Workflow executions counter
    this.workflowExecutions = new this.client.Counter({
      name: `${prefix}workflow_executions_total`,
      help: 'Total number of workflow executions',
      labelNames: ['workflow_type', 'status'],
      registers: [this.register],
    });
  }

  /**
   * Create custom metric
   */
  createMetric(metric: CustomMetric): any {
    if (!this.initialized) {
      throw new Error('Prometheus metrics not initialized');
    }

    const prefix = this.config.prefix ? `${this.config.prefix}_` : '';
    const name = `${prefix}${metric.name}`;

    if (this.metrics.has(name)) {
      return this.metrics.get(name);
    }

    let metricInstance: any;

    switch (metric.type) {
      case 'counter':
        metricInstance = new this.client.Counter({
          name,
          help: metric.help,
          labelNames: metric.labelNames,
          registers: [this.register],
        });
        break;

      case 'gauge':
        metricInstance = new this.client.Gauge({
          name,
          help: metric.help,
          labelNames: metric.labelNames,
          registers: [this.register],
        });
        break;

      case 'histogram':
        metricInstance = new this.client.Histogram({
          name,
          help: metric.help,
          labelNames: metric.labelNames,
          buckets: metric.buckets || [0.1, 0.5, 1, 2, 5, 10],
          registers: [this.register],
        });
        break;

      case 'summary':
        metricInstance = new this.client.Summary({
          name,
          help: metric.help,
          labelNames: metric.labelNames,
          percentiles: metric.percentiles || [0.5, 0.9, 0.95, 0.99],
          registers: [this.register],
        });
        break;

      default:
        throw new Error(`Unsupported metric type: ${metric.type}`);
    }

    this.metrics.set(name, metricInstance);
    return metricInstance;
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    if (!this.initialized) return;

    const labels = { method, route, status_code: statusCode.toString() };
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        ...labels,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    if (!this.initialized) return;

    this.databaseQueryDuration.observe(
      {
        operation,
        table,
        status: success ? 'success' : 'error',
      },
      duration
    );
  }

  /**
   * Set database connection pool metrics
   */
  setDatabaseConnectionPool(database: string, idle: number, active: number, total: number): void {
    if (!this.initialized) return;

    this.databaseConnectionPool.set({ state: 'idle', database }, idle);
    this.databaseConnectionPool.set({ state: 'active', database }, active);
    this.databaseConnectionPool.set({ state: 'total', database }, total);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string, keyPattern: string): void {
    if (!this.initialized) return;
    this.cacheHits.inc({ cache_type: cacheType, key_pattern: keyPattern });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string, keyPattern: string): void {
    if (!this.initialized) return;
    this.cacheMisses.inc({ cache_type: cacheType, key_pattern: keyPattern });
  }

  /**
   * Set job queue size
   */
  setJobQueueSize(
    queueName: string,
    pending: number,
    active: number,
    completed: number,
    failed: number
  ): void {
    if (!this.initialized) return;

    this.jobQueueSize.set({ queue_name: queueName, status: 'pending' }, pending);
    this.jobQueueSize.set({ queue_name: queueName, status: 'active' }, active);
    this.jobQueueSize.set({ queue_name: queueName, status: 'completed' }, completed);
    this.jobQueueSize.set({ queue_name: queueName, status: 'failed' }, failed);
  }

  /**
   * Record job processing
   */
  recordJobProcessing(jobType: string, duration: number, success: boolean): void {
    if (!this.initialized) return;

    this.jobProcessingDuration.observe(
      {
        job_type: jobType,
        status: success ? 'success' : 'error',
      },
      duration
    );
  }

  /**
   * Set WebSocket connections
   */
  setWebSocketConnections(connected: number, disconnected: number = 0): void {
    if (!this.initialized) return;

    this.websocketConnections.set({ status: 'connected' }, connected);
    if (disconnected > 0) {
      this.websocketConnections.set({ status: 'disconnected' }, disconnected);
    }
  }

  /**
   * Set agent count
   */
  setAgentCount(active: number, inactive: number, type: string = 'all'): void {
    if (!this.initialized) return;

    this.agentCount.set({ status: 'active', type }, active);
    this.agentCount.set({ status: 'inactive', type }, inactive);
  }

  /**
   * Record workflow execution
   */
  recordWorkflowExecution(workflowType: string, success: boolean): void {
    if (!this.initialized) return;

    this.workflowExecutions.inc({
      workflow_type: workflowType,
      status: success ? 'success' : 'error',
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    if (!this.initialized) {
      throw new Error('Prometheus metrics not initialized');
    }

    return this.register.metrics();
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    if (!this.initialized) {
      throw new Error('Prometheus metrics not initialized');
    }

    return this.register.contentType;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    if (!this.initialized) return;
    this.register.resetMetrics();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    if (!this.initialized) return;
    this.register.clear();
    this.metrics.clear();
  }
}
