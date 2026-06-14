import { BaseService } from '../core/BaseService';
import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';
/**
 * Configuration options for the PrometheusService.
 */
export interface PrometheusConfig {
    prefix?: string;
    defaultLabels?: Record<string, string>;
    collectDefaultMetrics?: boolean;
}
/**
 * Service responsible for exposing metrics in Prometheus format.
 */
export declare class PrometheusService extends BaseService {
    private register;
    private logger;
    private serviceConfig;
    readonly requestsTotal: Counter<string>;
    readonly activeConnections: Gauge<string>;
    readonly requestDuration: Histogram<string>;
    readonly responseSummary: Summary<string>;
    constructor(config?: PrometheusConfig);
    /**
     * Returns the metrics in Prometheus format.
     */
    getMetrics(): Promise<string>;
    /**
     * Returns the content type for the metrics endpoint.
     */
    getContentType(): string;
    /**
     * Get the underlying registry instance.
     */
    getRegistry(): Registry;
    incrementRequestsTotal(labels: {
        method: string;
        path: string;
        status_code: number | string;
    }): void;
    incrementActiveConnections(): void;
    decrementActiveConnections(): void;
    observeRequestDuration(durationSeconds: number, labels: {
        method: string;
        path: string;
        status_code: number | string;
    }): void;
    observeResponseSummary(durationSeconds: number, labels: {
        method: string;
        path: string;
    }): void;
    /**
     * Creates a new Counter metric.
     */
    createCounter<T extends string>(name: string, help: string, labelNames?: T[]): Counter<T>;
    /**
     * Creates a new Gauge metric.
     */
    createGauge<T extends string>(name: string, help: string, labelNames?: T[]): Gauge<T>;
    /**
    * Creates a new Histogram metric.
    */
    createHistogram<T extends string>(name: string, help: string, labelNames?: T[], buckets?: number[]): Histogram<T>;
    /**
    * Creates a new Summary metric.
    */
    createSummary<T extends string>(name: string, help: string, labelNames?: T[], percentiles?: number[]): Summary<T>;
}
//# sourceMappingURL=PrometheusService.d.ts.map