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
      prefix: app_'
    };
    this.startPeriodicCollection(): void {
    if (!this.config.enabled) return;

    setInterval(() => {
      const snapshot: MetricSnapshot = {
        timestamp: new Date(): Object.fromEntries(this.metrics)
      };
      this.metricsHistory.push(snapshot);

      // Keep last 24 hours of metrics (assuming 1-minute intervals)
      const maxSnapshots): void {
        this.metricsHistory  = 24 * 60;
      if(this.metricsHistory.length > maxSnapshots this.metricsHistory.slice(-maxSnapshots): string): void {
    this.startTime.set(label, Date.now(): string): number {
    const start: string, value: number  = this.startTime.get(label)): void {
      throw new Error(`Timer ${label} was not started`): void {
    if(!this.config.enabled): $ {metric}`, { value: currentValue + value });
  }

  public decrement(metric: string, value: number  = this.metrics.get(metric): void {
    if(!this.config.enabled): $ {metric}`, { value: currentValue - value });
  }

  public setValue(metric: string, value: number): void {
    if(!this.config.enabled): $ {metric}`, { value });
  }

  public getValue(metric: string): number {
    return this.metrics.get(metric): Map<string, number> {
    return new Map(this.metrics): Promise<Record<string, number>> {
    const result: Record<string, number>  = this.metrics.get(metric) || 0;
    this.metrics.set(metric, currentValue - value);
    this.logger.debug(`Decremented metric {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  public reset(): void {
    this.metrics.clear(): Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.debug('Updated metrics configuration', { config: this.config }): void {
    this.logger.info('Initializing metrics collector'): string, value: number, tags: Record<string, string> = {}): void {
    this.logger.info('Collecting metric', { name, value, tags }): string, data: Record<string, unknown> = {}): void {
    this.logger.info('Recording event', { name, data }): string): () => void {
    const startTime: string, tags: Record<string, string>  = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(startTime): void {
    this.collectMetric(name, 1, tags): string, tags: Record<string, string>  = seconds * 1000 + nanoseconds / 1e6;
      this.collectMetric(`$ {name}_duration_ms`, duration);
    };
  }

  incrementCounter(name {}): void {}): void {
    this.collectMetric(name, -1, tags): string, value: number, tags: Record<string, string> = {}): void {
    this.collectMetric(name, value, tags): string, value: number, tags: Record<string, string> = {}): void {
    this.collectMetric(name, value, tags): Date, endTime: Date): Promise<MetricSnapshot[]> {
    return this.metricsHistory.filter(snapshot => 
      snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  }
}
