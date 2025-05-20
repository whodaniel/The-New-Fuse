import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
import { AlertManager } from './alerts.js';
import { TracingService } from './tracing.js';
import { PerformanceProfiler } from './profiler.js';
export declare class SystemMonitor {
    private readonly configService;
    private readonly eventEmitter;
    private readonly metricCollector;
    private readonly alertManager;
    private readonly tracingService;
    private readonly performanceProfiler;
    private readonly config;
    private readonly dashboards;
    private readonly healthChecks;
    private healthCheckTimer;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, metricCollector: MetricCollector, alertManager: AlertManager, tracingService: TracingService, performanceProfiler: PerformanceProfiler);
    private initialize;
    private collectHeapMetrics;
}
export { SystemMonitor };
export { MetricCollector } from './metrics.js';
export { PerformanceProfiler as PerformanceMonitor } from './profiler.js';
export * from './types.js';
