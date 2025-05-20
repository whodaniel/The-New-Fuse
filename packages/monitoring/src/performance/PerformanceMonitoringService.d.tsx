import { MetricsService } from './metrics.service.js';
import { TracingService } from './tracing.service.js';
export declare class PerformanceMonitoringService {
    private readonly metricsService;
    private readonly tracingService;
    private readonly logger;
    PerformanceMetric: any;
    []: any;
    []: any;
    constructor(metricsService: MetricsService, tracingService: TracingService);
    trackMetric(): Promise<void>;
}
