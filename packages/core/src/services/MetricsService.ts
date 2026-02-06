import { Injectable } from '@nestjs/common';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricsSnapshot {
  timestamp: Date;
  metrics: Metric[];
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
}

@Injectable()
export class MetricsService {
  private metrics: Map<string, Metric[]> = new Map();
  private readonly maxMetricsPerKey = 1000;

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricsList = this.metrics.get(name)!;
    metricsList.push(metric);

    // Keep only the most recent metrics
    if (metricsList.length > this.maxMetricsPerKey) {
      metricsList.shift();
    }
  }

  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  getAllMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  getSnapshot(): MetricsSnapshot {
    const allMetrics: Metric[] = [];

    for (const metricsList of this.metrics.values()) {
      allMetrics.push(...metricsList);
    }

    const values = allMetrics.map((m) => m.value);
    const summary = {
      total: values.length,
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    };

    return {
      timestamp: new Date(),
      metrics: allMetrics,
      summary,
    };
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  getMetricsSummary(name: string): { count: number; latest: number; average: number } {
    const metricsList = this.getMetrics(name);

    if (metricsList.length === 0) {
      return { count: 0, latest: 0, average: 0 };
    }

    const values = metricsList.map((m) => m.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];

    return {
      count: metricsList.length,
      latest,
      average,
    };
  }
}
