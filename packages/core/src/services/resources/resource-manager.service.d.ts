import { MetricsService } from '../metrics/metrics.service.js';
export declare class ResourceManagerService {
    private metrics;
    constructor(metrics: MetricsService);
    allocateResources(): Promise<void>;
}
