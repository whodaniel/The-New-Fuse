import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

interface ApiMetric {
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number; // in milliseconds
  requestSize?: number; // in bytes
  responseSize?: number; // in bytes
}

@Injectable()
export class ApiMetricsCollector {
  private readonly logger = new Logger(ApiMetricsCollector.name);
  private metrics: ApiMetric[] = [];

  constructor() {
    // Periodically process and clear metrics to prevent memory leaks
    setInterval(() => this.processMetrics(), 60000); // Process every minute
  }

  track(metric: Omit<ApiMetric, 'timestamp' | 'duration'> & { startTime: number }): void {
    const duration = performance.now() - metric.startTime;
    const fullMetric: ApiMetric = {
      ...metric,
      duration,
      timestamp: Date.now(),
    };
    this.metrics.push(fullMetric);
    this.logger.debug(`Tracked API call: ${metric.method} ${metric.endpoint} - ${metric.statusCode} (${duration.toFixed(2)}ms)`);
  }

  private processMetrics(): void {
    if (this.metrics.length === 0) {
      return;
    }

    this.logger.log(`Processing ${this.metrics.length} API metrics...`);

    // In a real implementation, you would send these metrics to a monitoring service
    // like Prometheus, Grafana, or a custom dashboard.
    // For now, we will log summary statistics to the console.

    const summary = this.calculateSummary();
    this.logger.log('API Metrics Summary:', summary);

    // Clear the metrics array after processing
    this.metrics = [];
  }

  private calculateSummary(): Record<string, any> {
    const summary = {
      totalCalls: this.metrics.length,
      successfulCalls: this.metrics.filter(m => m.statusCode >= 200 && m.statusCode < 300).length,
      errorCalls: this.metrics.filter(m => m.statusCode >= 400).length,
      averageDuration: this.metrics.reduce((acc, m) => acc + m.duration, 0) / this.metrics.length,
      endpoints: {},
    };

    // Group metrics by endpoint
    for (const metric of this.metrics) {
      if (!summary.endpoints[metric.endpoint]) {
        summary.endpoints[metric.endpoint] = {
          calls: 0,
          totalDuration: 0,
          averageDuration: 0,
          statusCodes: {},
        };
      }
      const endpointStats = summary.endpoints[metric.endpoint];
      endpointStats.calls++;
      endpointStats.totalDuration += metric.duration;
      endpointStats.averageDuration = endpointStats.totalDuration / endpointStats.calls;
      endpointStats.statusCodes[metric.statusCode] = (endpointStats.statusCodes[metric.statusCode] || 0) + 1;
    }

    return summary;
  }
}
