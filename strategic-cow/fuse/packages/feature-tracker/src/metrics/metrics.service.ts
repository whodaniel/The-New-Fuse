/**
 * Service for tracking metrics related to features
 */
export class MetricsService {
  private metrics: Map<string, any> = new Map();

  /**
   * Record a metric value for a feature
   * @param featureId - The ID of the feature
   * @param metricName - The name of the metric
   * @param value - The value of the metric
   */
  recordMetric(featureId: string, metricName: string, value: any): void {
    const featureMetrics = this.metrics.get(featureId) || {};
    featureMetrics[metricName] = value;
    this.metrics.set(featureId, featureMetrics);
  }

  /**
   * Get metrics for a specific feature
   * @param featureId - The ID of the feature
   * @returns The metrics for the feature
   */
  getMetrics(featureId: string): Record<string, any> {
    return this.metrics.get(featureId) || {};
  }

  /**
   * Get all metrics
   * @returns All metrics
   */
  getAllMetrics(): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};
    this.metrics.forEach((metrics, featureId) => {
      result[featureId] = metrics;
    });
    return result;
  }

  /**
   * Clear metrics for a specific feature
   * @param featureId - The ID of the feature
   */
  clearMetrics(featureId: string): void {
    this.metrics.delete(featureId);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics.clear();
  }
}