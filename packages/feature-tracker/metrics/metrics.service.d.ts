/**
 * Service for tracking metrics related to features
 */
export declare class MetricsService {
    private metrics;
    /**
     * Record a metric value for a feature
     * @param featureId - The ID of the feature
     * @param metricName - The name of the metric
     * @param value - The value of the metric
     */
    recordMetric(featureId: string, metricName: string, value: any): void;
    /**
     * Get metrics for a specific feature
     * @param featureId - The ID of the feature
     * @returns The metrics for the feature
     */
    getMetrics(featureId: string): Record<string, any>;
    /**
     * Get all metrics
     * @returns All metrics
     */
    getAllMetrics(): Record<string, Record<string, any>>;
    /**
     * Clear metrics for a specific feature
     * @param featureId - The ID of the feature
     */
    clearMetrics(featureId: string): void;
    /**
     * Clear all metrics
     */
    clearAllMetrics(): void;
}
