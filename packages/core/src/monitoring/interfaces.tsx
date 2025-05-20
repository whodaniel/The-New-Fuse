import { MetricLabel, MetricType, MetricUnit } from './types.js';

export interface IMetricsService {
  recordCounter(name: string, value?: number, labels?: MetricLabel[]): Promise<void>;
  recordGauge(name: string, value: number, unit: MetricUnit, labels?: MetricLabel[]): Promise<void>;
  recordHistogram(name: string, value: number, unit: MetricUnit, labels?: MetricLabel[]): Promise<void>;
  recordTiming(name: string, valueMs: number, labels?: MetricLabel[]): Promise<void>;
  recordMemory(name: string, valueBytes: number, labels?: MetricLabel[]): Promise<void>;
  getMetric(name: string, type: MetricType, start?: Date, end?: Date): Promise<MetricValue[]>;
  cleanup(maxAge?: number): Promise<void>;
}

export interface MetricValue {
  value: number;
  unit: MetricUnit;
  timestamp: Date;
  labels?: MetricLabel[];
}

export interface MetricsProviderOptions {
  prefix?: string;
  defaultLabels?: MetricLabel[];
  retentionPeriod?: number;
}

export interface MetricsCollectorConfig {
  enabled: boolean;
  interval: number;
  prefix: string;
  retention: {
    duration: number;
    resolution: number;
  };
}

export interface MetricsStorage {
  store(metric: MetricValue): Promise<void>;
  retrieve(query: MetricsQuery): Promise<MetricValue[]>;
  cleanup(maxAge: number): Promise<void>;
}

export interface MetricsQuery {
  name: string;
  type: MetricType;
  start?: Date;
  end?: Date;
  labels?: Record<string, string>;
}