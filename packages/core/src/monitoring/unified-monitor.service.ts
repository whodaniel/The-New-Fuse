import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UnifiedMonitorService {
  private metrics = new Map<string, any>();
  private readonly logger = new Logger(UnifiedMonitorService.name);

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.metrics.set('connections', 0);
    this.metrics.set('messages', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('latency', []);
    this.metrics.set('events', []);
  }

  incrementMetric(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  recordLatency(operation: string, timeMs: number): void {
    const latencies = this.metrics.get('latency') || [];
    latencies.push({ operation, timeMs, timestamp: new Date() });
    this.metrics.set('latency', latencies);
  }

  logEvent(eventType: string, data: any): void {
    const events = this.metrics.get('events') || [];
    events.push({ eventType, data, timestamp: new Date() });
    this.metrics.set('events', events);
    this.logger.log(`Event: ${eventType}`, data);
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.set(name, { value, tags, timestamp: new Date() });
  }

  captureError(error: Error | string, context?: Record<string, any>): void {
    this.incrementMetric('errors');
    this.logEvent('error', {
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context
    });
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }

  getMetric(name: string): any {
    return this.metrics.get(name);
  }

  resetMetrics(): void {
    this.metrics.clear();
    this.initializeMetrics();
  }
}