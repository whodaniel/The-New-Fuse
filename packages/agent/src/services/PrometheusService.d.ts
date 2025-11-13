import { BaseService } from '../core/BaseService';
import { Counter, Gauge, Histogram, Summary } from 'prom-client';
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
}
//# sourceMappingURL=PrometheusService.d.ts.map