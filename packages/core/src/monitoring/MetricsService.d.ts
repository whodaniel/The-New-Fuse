import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
export interface MetricOptions {
    labels?: Record<string, string | number>;
    help?: string;
}
export interface HistogramOptions extends MetricOptions {
    buckets?: number[];
}
export interface SummaryOptions extends MetricOptions {
    percentiles?: number[];
}
export declare class MetricsService {
    private readonly logger;
    private readonly configService;
    private readonly registry;
    private readonly metricsPrefix;
    private counters;
    private gauges;
    private histograms;
    private summaries;
    constructor(logger: LoggingService, configService: ConfigService);
    private getOrCreateCounter;
}
export default MetricsService;
//# sourceMappingURL=MetricsService.d.ts.map