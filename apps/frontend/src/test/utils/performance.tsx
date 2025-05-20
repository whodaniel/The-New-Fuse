import { PerformanceObserver, performance } from 'perf_hooks';
import { logger } from './logger.js';

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  static endMeasure(name: string): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name).pop();
    if (measure) {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)?.push(measure.duration);
    }
  }

  static generateReport(): void {
    for (const [name, durations] of this.metrics.entries()) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      logger.info(`Performance Report - ${name}:`, {
        average: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        samples: durations.length
      });
    }
  }
}