import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, Counter>();
  private readonly gauges = new Map<string, Gauge>();
  private readonly histograms = new Map<string, Histogram>();

  constructor() {
    this.logger.log('Metrics Service Initialized.');
    register.setDefaultLabels({
      app: 'the-new-fuse-core',
    });
  }

  createCounter(name: string, help: string, labelNames?: string[]): Counter {
    if (this.counters.has(name)) {
      return this.counters.get(name);
    }
    const counter = new Counter({ name, help, labelNames });
    this.counters.set(name, counter);
    return counter;
  }

  createGauge(name: string, help: string, labelNames?: string[]): Gauge {
    if (this.gauges.has(name)) {
      return this.gauges.get(name);
    }
    const gauge = new Gauge({ name, help, labelNames });
    this.gauges.set(name, gauge);
    return gauge;
  }

  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram {
    if (this.histograms.has(name)) {
      return this.histograms.get(name);
    }
    const histogram = new Histogram({ name, help, labelNames, buckets });
    this.histograms.set(name, histogram);
    return histogram;
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
