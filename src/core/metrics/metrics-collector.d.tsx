import { ConfigService } from '../config/config-service.js';
import { Counter, Gauge, Histogram } from "prom-client";
export declare class MetricsCollector {
  private config;
  private registry;
  private counters;
  private gauges;
  private histograms;
  constructor(config: ConfigService);
  private initialize;
  createCounter(
    name: string,
    help: string,
    labelNames?: string[],
  ): Counter<string>;
  createGauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
  createHistogram(
    name: string,
    help: string,
    labelNames?: string[],
    buckets?: number[],
  ): Histogram<string>;
  incrementCounter(name: string, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void;
  getMetrics(): Promise<string>;
  clearMetrics(): void;
}
//# sourceMappingURL=metrics-(collector as any).d.ts.map
