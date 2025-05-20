/**
 * Service for tracking metrics related to features
 */
export class MetricsService {
    constructor() {
        this.metrics = new Map();
    }
    /**
     * Record a metric value for a feature
     * @param featureId - The ID of the feature
     * @param metricName - The name of the metric
     * @param value - The value of the metric
     */
    recordMetric(featureId, metricName, value) {
        const featureMetrics = this.metrics.get(featureId) || {};
        featureMetrics[metricName] = value;
        this.metrics.set(featureId, featureMetrics);
    }
    /**
     * Get metrics for a specific feature
     * @param featureId - The ID of the feature
     * @returns The metrics for the feature
     */
    getMetrics(featureId) {
        return this.metrics.get(featureId) || {};
    }
    /**
     * Get all metrics
     * @returns All metrics
     */
    getAllMetrics() {
        const result = {};
        this.metrics.forEach((metrics, featureId) => {
            result[featureId] = metrics;
        });
        return result;
    }
    /**
     * Clear metrics for a specific feature
     * @param featureId - The ID of the feature
     */
    clearMetrics(featureId) {
        this.metrics.delete(featureId);
    }
    /**
     * Clear all metrics
     */
    clearAllMetrics() {
        this.metrics.clear();
    }
}
//# sourceMappingURL=metrics.service.js.map