/**
 * Base metrics collector implementation
 * Provides common functionality for all metrics collectors
 */

import { EventEmitter } from 'events';
import { 
  IMetricsCollector, 
  TimeSeries, 
  MetricDataPoint 
} from '../interfaces/IMonitoring';
import { Logger } from '../utils/Logger';

/**
 * Base metrics collector configuration
 */
export interface BaseMetricsCollectorConfig {
  interval: number;
  retentionPeriod: number;
  storage: {
    type: 'memory' | 'file' | 'database';
    options?: Record<string, any>;
  };
}

/**
 * Base metrics collector that can be extended
 */
export abstract class BaseMetricsCollector<TMetrics = any> 
  extends EventEmitter implements IMetricsCollector<TMetrics> {
  
  protected readonly config: BaseMetricsCollectorConfig;
  protected readonly logger: Logger;
  protected running = false;
  protected collectionTimer?: NodeJS.Timeout;

  // Metric storage
  protected readonly metrics = new Map<string, TimeSeries>();
  protected readonly counters = new Map<string, number>();
  protected readonly histograms = new Map<string, number[]>();
  protected readonly gauges = new Map<string, number>();

  constructor(config: BaseMetricsCollectorConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger('BaseMetricsCollector');
  }

  /**
   * Start collecting metrics
   */
  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('Metrics collector is already running');
      return;
    }

    this.logger.info('Starting metrics collector', {
      interval: this.config.interval,
      retentionPeriod: this.config.retentionPeriod
    });

    this.running = true;

    // Start collection timer
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    // Initial collection
    this.collectMetrics();

    this.logger.info('Metrics collector started');
    this.emit('started');
  }

  /**
   * Stop collecting metrics
   */
  async stop(): Promise<void> {
    if (!this.running) {
      this.logger.warn('Metrics collector is not running');
      return;
    }

    this.logger.info('Stopping metrics collector');

    this.running = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    this.logger.info('Metrics collector stopped');
    this.emit('stopped');
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const timestamp = new Date();
    const dataPoint: MetricDataPoint = {
      timestamp,
      value,
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        dataPoints: [],
        metadata: { labels }
      });
    }

    const timeSeries = this.metrics.get(name)!;
    timeSeries.dataPoints.push(dataPoint);

    // Clean up old data points
    this.cleanupTimeSeries(timeSeries);

    this.emit('metricRecorded', name, value, labels);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    this.recordMetric(name, current + 1, labels);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    const histogram = this.histograms.get(key)!;
    histogram.push(value);

    // Keep only recent values
    while (histogram.length > 1000) { // Limit histogram size
      histogram.shift();
    }

    this.recordMetric(name, value, labels);
  }

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
    this.recordMetric(name, value, labels);
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number): TimeSeries[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const history: TimeSeries[] = [];

    for (const [name, timeSeries] of this.metrics) {
      const filteredDataPoints = timeSeries.dataPoints.filter(
        point => point.timestamp >= cutoff
      );

      if (filteredDataPoints.length > 0) {
        history.push({
          name,
          dataPoints: filteredDataPoints,
          metadata: timeSeries.metadata
        });
      }
    }

    return history;
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): TimeSeries | null {
    return this.metrics.get(name) || null;
  }

  /**
   * Abstract method to get current metrics
   * Must be implemented by subclasses
   */
  abstract getCurrentMetrics(): TMetrics;

  /**
   * Abstract method to collect metrics
   * Must be implemented by subclasses
   */
  protected abstract collectMetrics(): void;

  /**
   * Calculate percentile from array of values
   */
  protected calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Clean up old data points from time series
   */
  protected cleanupTimeSeries(timeSeries: TimeSeries): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    const initialLength = timeSeries.dataPoints.length;
    
    timeSeries.dataPoints = timeSeries.dataPoints.filter(
      point => point.timestamp >= cutoff
    );

    if (timeSeries.dataPoints.length < initialLength) {
      this.logger.debug(`Cleaned up ${initialLength - timeSeries.dataPoints.length} old data points for ${timeSeries.name}`);
    }
  }

  /**
   * Generate metric key with labels
   */
  protected getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }

  /**
   * Get counter value
   */
  protected getCounterValue(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  protected getGaugeValue(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram values
   */
  protected getHistogramValues(name: string, labels?: Record<string, string>): number[] {
    const key = this.getMetricKey(name, labels);
    return this.histograms.get(key) || [];
  }
}