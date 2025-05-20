import { FeatureProgress } from './types.js';
import { MetricsService } from '../metrics/metrics.service.js';
export declare class FeatureTracker {
    private readonly metrics;
    private features;
    constructor(metrics: MetricsService);
    trackFeature(featureId: string, updates: Partial<FeatureProgress>): Promise<void>;
    private calculateMetrics;
    private notifySubscribers;
}
