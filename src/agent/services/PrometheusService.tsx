import { Injectable, Logger } from "@nestjs/common";
import { Counter, Gauge, Histogram, Registry } from "prom-client";
import { MetricConfig, MetricType, Labels } from '../../types/metrics.types.js';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly logger = new Logger(PrometheusService.name);
  private readonly metrics = new Map<string, Counter | Gauge | Histogram>();

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({
      app: "agent-service",
    });
  }

  createMetric<T extends MetricType>(config: MetricConfig<T>): void {
    const { name, help, type, labelNames = [] } = config;

    if (this.metrics.has(name)) {
      this.logger.warn(`Metric ${name} already exists`);
      return;
    }

    let metric: Counter | Gauge | Histogram;

    switch (type) {
      case "counter":
        metric = new Counter({
          name,
          help,
          labelNames,
          registers: [this.registry],
        });
        break;

      case "gauge":
        metric = new Gauge({
          name,
          help,
          labelNames,
          registers: [this.registry],
        });
        break;

      case "histogram":
        metric = new Histogram({
          name,
          help,
          labelNames,
          buckets: config.buckets,
          registers: [this.registry],
        });
        break;

      default:
        throw new Error(`Unsupported metric type: ${type}`);
    }

    this.metrics.set(name, metric);
    this.logger.debug(`Created ${type} metric: ${name}`);
  }

  incrementCounter(name: string, value = 1, labels?: Labels): void {
    const metric = this.getMetric(name, "counter");
    metric.inc(labels, value);
  }

  setGauge(name: string, value: number, labels?: Labels): void {
    const metric = this.getMetric(name, "gauge");
    metric.set(labels, value);
  }

  observeHistogram(name: string, value: number, labels?: Labels): void {
    const metric = this.getMetric(name, "histogram");
    metric.observe(labels, value);
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  resetMetrics(): void {
    this.registry.resetMetrics();
    this.metrics.clear();
    this.logger.debug("All metrics have been reset");
  }

  private getMetric<T extends Counter | Gauge | Histogram>(
    name: string,
    expectedType: MetricType
  ): T {
    const metric = this.metrics.get(name);

    if (!metric) {
      throw new Error(`Metric ${name} not found`);
    }

    switch (expectedType) {
      case "counter":
        if (!(metric instanceof Counter)) {
          throw new Error(`Metric ${name} is not a counter`);
        }
        break;
      case "gauge":
        if (!(metric instanceof Gauge)) {
          throw new Error(`Metric ${name} is not a gauge`);
        }
        break;
      case "histogram":
        if (!(metric instanceof Histogram)) {
          throw new Error(`Metric ${name} is not a histogram`);
        }
        break;
    }

    return metric as T;
  }
}
