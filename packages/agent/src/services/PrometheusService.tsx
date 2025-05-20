import { BaseService } from '../core/BaseService.js'; // Corrected import path
import { Logger } from '@packages/utils'; // Assuming Logger is available
import client, { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';

/**
 * Configuration options for the PrometheusService.
 */
export interface PrometheusConfig {
  prefix?: string; // Optional prefix for all metrics
  defaultLabels?: Record<string, string>; // Labels applied to all metrics
  collectDefaultMetrics?: boolean; // Whether to collect default Node.js metrics
}

/**
 * Service responsible for exposing metrics in Prometheus format.
 */
export class PrometheusService extends BaseService {
  private register: Registry;
  private logger: Logger;
  private config: PrometheusConfig;

  // Example metrics (replace/extend as needed)
  public readonly requestsTotal: Counter<string>;
  public readonly activeConnections: Gauge<string>;
  public readonly requestDuration: Histogram<string>;
  public readonly responseSummary: Summary<string>;

  constructor(config: PrometheusConfig = {}) {
    super();
    this.logger = new Logger('PrometheusService');
    this.config = {
      collectDefaultMetrics: true, // Default to collecting Node.js metrics
      ...config,
    };
    this.register = new client.Registry();

    if (this.config.defaultLabels) {
      this.register.setDefaultLabels(this.config.defaultLabels);
    }

    if (this.config.collectDefaultMetrics) {
      client.collectDefaultMetrics({
        register: this.register,
        prefix: this.config.prefix,
      });
      this.logger.info('Collecting default Node.js metrics.');
    }

    // --- Initialize Custom Metrics ---
    const metricPrefix = this.config.prefix ? `${this.config.prefix}_` : '';

    this.requestsTotal = new client.Counter({
      name: `${metricPrefix}requests_total`,
      help: 'Total number of requests processed',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.register],
    });

    this.activeConnections = new client.Gauge({
      name: `${metricPrefix}active_connections`,
      help: 'Number of active connections',
      registers: [this.register],
    });

    this.requestDuration = new client.Histogram({
      name: `${metricPrefix}request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.1, 0.5, 1, 2.5, 5, 10], // Example buckets
      registers: [this.register],
    });

     this.responseSummary = new client.Summary({
      name: `${metricPrefix}response_time_summary_seconds`,
      help: 'Summary of response times in seconds',
      labelNames: ['method', 'path'],
      percentiles: [0.5, 0.9, 0.99], // Example percentiles
      registers: [this.register],
    });
    // --- End Custom Metrics ---

    this.logger.info('PrometheusService initialized.');
  }

  /**
   * Returns the metrics in Prometheus format.
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Returns the content type for the metrics endpoint.
   */
  getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Get the underlying registry instance.
   */
  getRegistry(): Registry {
    return this.register;
  }

  // --- Helper methods for common metric operations ---

  incrementRequestsTotal(labels: { method: string; path: string; status_code: number | string }): void {
    this.requestsTotal.inc(labels);
  }

  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }

  observeRequestDuration(durationSeconds: number, labels: { method: string; path: string; status_code: number | string }): void {
    this.requestDuration.observe(labels, durationSeconds);
  }

   observeResponseSummary(durationSeconds: number, labels: { method: string; path: string }): void {
    this.responseSummary.observe(labels, durationSeconds);
  }

  /**
   * Creates a new Counter metric.
   */
  createCounter<T extends string>(name: string, help: string, labelNames?: T[]): Counter<T> {
    const counter = new client.Counter<T>({
      name: this.config.prefix ? `${this.config.prefix}_${name}` : name,
      help,
      labelNames,
      registers: [this.register],
    });
    return counter;
  }

  /**
   * Creates a new Gauge metric.
   */
  createGauge<T extends string>(name: string, help: string, labelNames?: T[]): Gauge<T> {
    const gauge = new client.Gauge<T>({
      name: this.config.prefix ? `${this.config.prefix}_${name}` : name,
      help,
      labelNames,
      registers: [this.register],
    });
    return gauge;
  }

   /**
   * Creates a new Histogram metric.
   */
  createHistogram<T extends string>(name: string, help: string, labelNames?: T[], buckets?: number[]): Histogram<T> {
    const histogram = new client.Histogram<T>({
      name: this.config.prefix ? `${this.config.prefix}_${name}` : name,
      help,
      labelNames,
      buckets,
      registers: [this.register],
    });
    return histogram;
  }

   /**
   * Creates a new Summary metric.
   */
  createSummary<T extends string>(name: string, help: string, labelNames?: T[], percentiles?: number[]): Summary<T> {
    const summary = new client.Summary<T>({
      name: this.config.prefix ? `${this.config.prefix}_${name}` : name,
      help,
      labelNames,
      percentiles,
      registers: [this.register],
    });
    return summary;
  }
}
