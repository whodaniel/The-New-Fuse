/**
 * Build-specific monitoring system implementation
 * Extends the base monitoring system with build-specific functionality
 */
import { BaseMonitoringSystem, BaseMonitoringConfig, IMetricsCollector, Logger } from '@the-new-fuse/core-monitoring';
import { DetailedBuildMetrics } from './BuildMetricsCollector.js';
/**
 * Build monitoring configuration
 */
export interface BuildMonitoringConfig extends BaseMonitoringConfig {
    trackMemoryUsage?: boolean;
    trackStageMetrics?: boolean;
    trackPerformanceStats?: boolean;
    memoryMonitoringInterval?: number;
}
/**
 * Build monitoring system implementation
 */
export declare class BuildMonitoringSystem extends BaseMonitoringSystem<DetailedBuildMetrics, BuildMonitoringConfig> {
    private buildMetricsCollector?;
    constructor(logger?: Logger);
    /**
     * Create build-specific metrics collector
     */
    protected createMetricsCollector(): IMetricsCollector<DetailedBuildMetrics>;
    /**
     * Format build metrics for Prometheus export
     */
    protected formatPrometheusMetrics(metrics: DetailedBuildMetrics): string;
    /**
     * Get build-specific status information
     */
    getBuildStatus(): Promise<{
        isBuilding: boolean;
        currentStage?: string;
        progress: number;
        memoryUsage: number;
    }>;
    /**
     * Start build monitoring
     */
    startBuildMonitoring(): void;
    /**
     * Stop build monitoring
     */
    stopBuildMonitoring(): DetailedBuildMetrics;
    /**
     * Record build events
     */
    recordBuildEvent(event: any): void;
    /**
     * Record successful build
     */
    recordSuccessfulBuild(packageName: string, duration: number): void;
    /**
     * Record failed build
     */
    recordFailedBuild(packageName: string, error: string): void;
    /**
     * Generate build report
     */
    generateBuildReport(): string;
}
//# sourceMappingURL=BuildMonitoringSystem.d.ts.map