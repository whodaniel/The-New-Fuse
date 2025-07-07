import { MetricsService } from '../metrics/metrics.service;';
export declare class ResourceManagerService {
    private metrics;
    constructor(metrics: MetricsService);
    allocateResources(): Promise<void>;
}
