import { Injectable } from '@nestjs/common';
import { injectable } from 'inversify';
import { Logger } from '@the-new-fuse/utils/logger';

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  prefix: string;
}

export interface MetricSnapshot {
  timestamp: Date;
  values: Record<string, number>;
}

@Injectable()
@injectable()
export class MetricsCollector {
  private logger: Logger;
  private metrics: Map<string, number>;
  private config: MetricsConfig;
  private startTime: Map<string, number>;
  private metricsHistory: MetricSnapshot[] = [];

  constructor() {
    this.logger = new Logger(MetricsCollector.name);
    this.metrics = new Map();
    this.startTime = new Map();
    this.config = {
      enabled: true,
      interval: 60000, // 1 minute
      prefix: 'app_'
    };
    this.startPeriodicCollection();
  }

  private startPeriodicCollection(): void {
    if (!this.config.enabled) return;

    setInterval(() => {
      const snapshot: MetricSnapshot = {
        timestamp: new Date(),
        values: Object.fromEntries(this.metrics)
      };
      this.metricsHistory.push(snapshot);

      // Keep last 24 hours of metrics (assuming 1-minute intervals)
      const maxSnapshots = 24 * 60;
      if (this.metricsHistory.length > maxSnapshots) {
        this.metricsHistory = this.metricsHistory.slice(-maxSnapshots);
      }
    }, this.config.interval);
  }

  public startTimer(label: string): void {
    this.startTime.set(label, Date.now());
  }

  public endTimer(label: string): number {
    const start = this.startTime.get(label);
    if (!start) {
      throw new Error(`Timer ${label} was not started`);
    }

    const duration = Date.now() - start;
    this.startTime.delete(label);
    return duration;
  }

  public incrementCounter(name: string, _tags: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const currentValue = this.metrics.get(name) || 0;
    this.metrics.set(name, currentValue + 1);
    this.logger.debug(`Incremented metric ${name}`, { value: currentValue + 1 });
  }

  public decrementCounter(name: string, _tags: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const currentValue = this.metrics.get(name) || 0;
    this.metrics.set(name, Math.max(0, currentValue - 1));
    this.logger.debug(`Decremented metric ${name}`, { value: currentValue - 1 });
  }

  public setValue(metric: string, value: number): void {
    if (!this.config.enabled) return;

    this.metrics.set(metric, value);
    this.logger.debug(`Set metric ${metric}`, { value });
  }

  public collectMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const currentValue = this.metrics.get(name) || 0;
    this.metrics.set(name, currentValue + value);
    this.logger.info('Collecting metric', { name, value, tags });
  }

  public recordEvent(name: string, data: Record<string, unknown> = {}): void {
    if (!this.config.enabled) return;

    this.logger.info('Recording event', { name, data });
  }

  public timeOperation(name: string, _tags: Record<string, string> = {}): () => void {
    const startTime = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      this.collectMetric(`${name}_duration_ms`, duration);
    };
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }

  public updateConfig(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.debug('Updated metrics configuration', { config: this.config });
  }

  public getMetricsHistory(startTime: Date, endTime: Date): Promise<MetricSnapshot[]> {
    return Promise.resolve(
      this.metricsHistory.filter(snapshot =>
        snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
      )
    );
  }
}
