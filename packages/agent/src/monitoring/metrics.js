"use strict";
/**
 * Monitoring and metrics collection for agents
 * Provides performance monitoring and metrics aggregation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRegistry = void 0;
class MetricsRegistry {
    agentId;
    counters = new Map();
    gauges = new Map();
    timers = new Map();
    metrics = [];
    constructor(agentId) {
        this.agentId = agentId;
    }
    /**
     * Create or get a counter metric
     */
    counter(name) {
        const fullName = `${this.agentId}.${name};
    
    if (!this.counters.has(fullName)) {
      const counter: Counter = {
        name: fullName,
        value: 0,
        increment: (amount = 1) => {
          counter.value += amount;
          this.recordMetric(fullName, counter.value, 'count');
        },
        reset: () => {
          counter.value = 0;
          this.recordMetric(fullName, 0, 'count');
        }
      };
      this.counters.set(fullName, counter);
    }
    
    return this.counters.get(fullName)!;
  }

  /**
   * Create or get a gauge metric
   */
  gauge(name: string): Gauge {`;
        const fullName = $, { this: , agentId };
        `.${name}`;
        if (!this.gauges.has(fullName)) {
            const gauge = {
                name: fullName,
                value: 0,
                set: (value) => {
                    gauge.value = value;
                    this.recordMetric(fullName, value, 'gauge');
                },
                increment: (amount = 1) => {
                    gauge.value += amount;
                    this.recordMetric(fullName, gauge.value, 'gauge');
                },
                decrement: (amount = 1) => {
                    gauge.value -= amount;
                    this.recordMetric(fullName, gauge.value, 'gauge');
                }
            };
            this.gauges.set(fullName, gauge);
        }
        return this.gauges.get(fullName);
    }
    /**
     * Create or get a timer metric
     */
    timer(name) {
        const fullName = $, { this: , agentId }, $, { name };
        if (!this.timers.has(fullName)) {
            const durations = [];
            const timer = {
                name: fullName,
                start: () => {
                    const startTime = Date.now();
                    return () => {
                        const duration = Date.now() - startTime;
                        timer.record(duration);
                        return duration;
                    };
                },
                record: (duration) => {
                    durations.push(duration);
                    this.recordMetric(fullName, duration, 'ms');
                    // Keep only last 1000 measurements
                    if (durations.length > 1000) {
                        durations.splice(0, durations.length - 1000);
                    }
                },
                getStats: () => {
                    if (durations.length === 0) {
                        return { count: 0, avg: 0, min: 0, max: 0 };
                    }
                    const sum = durations.reduce((a, b) => a + b, 0);
                    return {
                        count: durations.length,
                        avg: sum / durations.length,
                        min: Math.min(...durations),
                        max: Math.max(...durations)
                    };
                }
            };
            this.timers.set(fullName, timer);
        }
        return this.timers.get(fullName);
    }
    /**
     * Record a metric manually
     */
    recordMetric(name, value, unit, tags) {
        const metric = {} `
      name: `, $, { this: , agentId }, $, { name };
        `,
      value,
      timestamp: Date.now(),
      unit,
      tags
    };
    
    this.metrics.push(metric);
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics.splice(0, this.metrics.length - 10000);
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, any> {
    return {
      agentId: this.agentId,
      counters: Array.from(this.counters.entries()).map(([name, counter]) => ({
        name,
        value: counter.value
      })),
      gauges: Array.from(this.gauges.entries()).map(([name, gauge]) => ({
        name,
        value: gauge.value
      })),
      timers: Array.from(this.timers.entries()).map(([name, timer]) => ({
        name,
        stats: timer.getStats()
      })),
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.timers.clear();
    this.metrics = [];
  }
}

export class PerformanceMonitor {
  private agentId: string;
  private redisClient?: Redis;
  private metrics: MetricsRegistry;
  private isRunning: boolean = false;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(agentId: string, redisClient?: Redis) {
    this.agentId = agentId;
    this.redisClient = redisClient;
    this.metrics = new MetricsRegistry(agentId);
  }

  /**
   * Start monitoring
   */
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Collect system metrics periodically
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
      this.publishMetrics();
    }, intervalMs);

    console.log(Performance monitor started for agent ${this.agentId});
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId as any);
      this.intervalId = undefined;
    }

    
  }

  /**
   * Get metrics registry
   */
  getMetrics(): MetricsRegistry {
    return this.metrics;
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.gauge('memory.rss').set(memUsage.rss);
    this.metrics.gauge('memory.heap_used').set(memUsage.heapUsed);
    this.metrics.gauge('memory.heap_total').set(memUsage.heapTotal);
    this.metrics.gauge('memory.external').set(memUsage.external);

    // Process uptime
    this.metrics.gauge('uptime').set(process.uptime());

    // Event loop lag (simple approximation)
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      this.metrics.gauge('event_loop_lag').set(lag);
    });
  }

  /**
   * Publish metrics to Redis
   */
  private async publishMetrics(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const summary = this.metrics.getSummary();`;
        const key = metrics, $, { this: , agentId };
        `;
      
      await this.redisClient.set(
        key,
        JSON.stringify(summary),
        'EX',
        300 // 5 minutes TTL
      );
    } catch {
      
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    return {
      agentId: this.agentId,
      isRunning: this.isRunning,
      metrics: this.metrics.getSummary(),
      timestamp: Date.now()
    };
  }
};
    }
}
exports.MetricsRegistry = MetricsRegistry;
//# sourceMappingURL=metrics.js.map