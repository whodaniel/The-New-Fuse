import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';
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
//# sourceMappingURL=PerformanceMonitoringService.d.ts.map