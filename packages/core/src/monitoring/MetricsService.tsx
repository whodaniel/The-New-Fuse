import { Injectable } from '@nestjs/common';
import { IMetricsService, MetricValue, MetricsStorage } from './interfaces.js';
import { MetricLabel, MetricType, MetricUnit } from './types.js';

@Injectable()
export class MetricsService implements IMetricsService {
  constructor(private readonly storage: MetricsStorage) {}

  async recordCounter(name: string, value = 1, labels?: MetricLabel[]): Promise<void> {
    await this.storage.store({
      name,
      type: MetricType.COUNTER,
      value,
      unit: MetricUnit.COUNT,
      timestamp: new Date(),
      labels
    });
  }

  async recordGauge(name: string, value: number, unit: MetricUnit, labels?: MetricLabel[]): Promise<void> {
    await this.storage.store({
      name,
      type: MetricType.GAUGE,
      value,
      unit,
      timestamp: new Date(),
      labels
    });
  }

  async recordHistogram(name: string, value: number, unit: MetricUnit, labels?: MetricLabel[]): Promise<void> {
    await this.storage.store({
      name,
      type: MetricType.HISTOGRAM,
      value,
      unit,
      timestamp: new Date(),
      labels
    });
  }

  async recordTiming(name: string, valueMs: number, labels?: MetricLabel[]): Promise<void> {
    await this.storage.store({
      name,
      type: MetricType.HISTOGRAM,
      value: valueMs,
      unit: MetricUnit.MILLISECONDS,
      timestamp: new Date(),
      labels
    });
  }

  async recordMemory(name: string, valueBytes: number, labels?: MetricLabel[]): Promise<void> {
    await this.storage.store({
      name,
      type: MetricType.GAUGE,
      value: valueBytes,
      unit: MetricUnit.BYTES,
      timestamp: new Date(),
      labels
    });
  }

  async getMetric(name: string, type: MetricType, start?: Date, end?: Date): Promise<MetricValue[]> {
    return this.storage.retrieve({ name, type, start, end });
  }

  async cleanup(maxAge = 86400): Promise<void> {
    await this.storage.cleanup(maxAge);
  }
}