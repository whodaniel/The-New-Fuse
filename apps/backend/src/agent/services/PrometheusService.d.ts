import { ConfigService } from '@nestjs/config';
export declare class PrometheusService {
    private readonly configService;
    private metrics;
    constructor(configService: ConfigService);
    /**
     * Register a new metric
     */
    registerMetric(name: string, help: string, type?: 'counter' | 'gauge' | 'histogram'): void;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
    /**
     * Set a gauge metric value
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Observe a value for a histogram metric
     */
    observeHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Get all metrics in Prometheus format
     */
    getMetrics(): string;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Helper to create a string key from labels object
     */
    private getLabelKey;
}
//# sourceMappingURL=PrometheusService.d.ts.map