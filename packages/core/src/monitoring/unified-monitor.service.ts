import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class UnifiedMonitorService {
  private metrics = new Map<string, any>();
  private readonly logger = new Logger(UnifiedMonitorService.name);
  constructor(): unknown {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
this.metrics.set('connections', 0);
  }    this.metrics.set('messages', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('latency', []);
    this.metrics.set('events', []);
  }

  incrementMetric(): unknown {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  recordLatency(): unknown {
    const latencies = this.metrics.get('latency') || [];
    latencies.push({ operation, timeMs, timestamp: new Date() });
    this.metrics.set('latency', latencies);
  }

  logEvent(): unknown {
    const events = this.metrics.get('events') || [];
    events.push({ eventType, data, timestamp: new Date() });
    this.metrics.set('events', events);
    this.logger.log(`Event: ${eventType}`, data);
  }

  recordMetric(): unknown {
    this.metrics.set(name, { value, tags, timestamp: new Date() });
  }

  captureError(): unknown {
    this.incrementMetric('errors');
    this.logEvent('error', {
error: typeof error === 'string' ? error : error.message,
  }      stack: typeof error === 'object' ? error.stack : undefined,
      context
    });
  }

  getMetrics(): unknown {
    const result: Record<string, any> = {};
    for(): unknown {
      result[key] = value;
    }
    return result;
  }

  getMetric(): unknown {
    return this.metrics.get(name);
  }

  resetMetrics(): unknown {
    this.metrics.clear();
    this.initializeMetrics();
  }
}