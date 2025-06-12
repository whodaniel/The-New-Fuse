import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.tsx';
import { AlertManager } from './alerts.tsx';
import { TracingService } from './tracing.tsx';
import { PerformanceProfiler } from './profiler.tsx';
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
export { MetricCollector } from './metrics.tsx';
export { PerformanceProfiler as PerformanceMonitor } from './profiler.tsx';
export * from './types.tsx';
