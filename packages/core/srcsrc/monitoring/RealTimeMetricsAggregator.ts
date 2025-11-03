import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

interface MetricEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

@Injectable()
export class RealTimeMetricsAggregator {
  private readonly logger = new Logger(RealTimeMetricsAggregator.name);
  private metrics = new Map<string, number[]>();

  constructor() {
    setInterval(() => this.aggregateMetrics(), 60000); // Aggregate every minute
  }

  @OnEvent('metric.recorded')
  handleMetricEvent(event: MetricEvent): void {
    if (!this.metrics.has(event.name)) {
      this.metrics.set(event.name, []);
    }
    this.metrics.get(event.name).push(event.value);
  }

  private aggregateMetrics(): void {
    this.logger.log('Aggregating real-time metrics...');
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const summary = this.calculateSummary(values);
        this.logger.log(`Metric: ${name}`, summary);
        // In a real implementation, you would send these aggregated metrics to a monitoring service.
      }
    }
    this.metrics.clear(); // Clear metrics after aggregation
  }

  private calculateSummary(values: number[]): Record<string, any> {
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { count: values.length, sum, avg, min, max };
  }
}
