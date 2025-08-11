import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class UnifiedMonitorService {
  // Implementation needed
}
  private metrics = new Map<string, any>();
  private readonly logger = new Logger(UnifiedMonitorService.name);
  constructor() {
  // Implementation needed
}
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
  // Implementation needed
}
    this.metrics.set('connections', 0);
    this.metrics.set('messages', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('latency', []);
    this.metrics.set('events', []);
  }

  incrementMetric(name: string, value: number = 1): void {
  // Implementation needed
}
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  recordLatency(operation: string, timeMs: number): void {
  // Implementation needed
}
    const latencies = this.metrics.get('latency') || [];
    latencies.push({ operation, timeMs, timestamp: new Date() });
    this.metrics.set('latency', latencies);
  }

  logEvent(eventType: string, data: any): void {
  // Implementation needed
}
    const events = this.metrics.get('events') || [];
    events.push({ eventType, data, timestamp: new Date() });
    this.metrics.set('events', events);
    this.logger.log(`Event: ${eventType}`, data);
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  // Implementation needed
}
    this.metrics.set(name, { value, tags, timestamp: new Date() });
  }

  captureError(error: Error | string, context?: Record<string, any>): void {
  // Implementation needed
}
    this.incrementMetric('errors');
    this.logEvent('error', {
  // Implementation needed
}
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context
    });
  }

  getMetrics(): Record<string, any> {
  // Implementation needed
}
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics.entries()) {
  // Implementation needed
}
      result[key] = value;
    }
    return result;
  }

  getMetric(name: string): any {
  // Implementation needed
}
    return this.metrics.get(name);
  }

  resetMetrics(): void {
  // Implementation needed
}
    this.metrics.clear();
    this.initializeMetrics();
  }
}