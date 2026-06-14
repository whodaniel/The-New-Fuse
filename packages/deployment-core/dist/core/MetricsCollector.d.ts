import { PipelineResult, BuildResult, DeploymentResult } from '../types/pipeline.js';
import { InfrastructureMetrics } from '../interfaces/IInfrastructureManager.js';
import { Logger } from 'winston';
/**
 * Metrics Collector gathers and analyzes pipeline performance metrics
 */
export declare class MetricsCollector {
    private logger;
    private metrics;
    private pipelineHistory;
    private buildHistory;
    private deploymentHistory;
    private infrastructureMetrics;
    constructor(logger: Logger);
    /**
     * Record pipeline execution metrics
     */
    recordPipelineMetrics(result: PipelineResult): void;
    /**
     * Record build metrics
     */
    recordBuildMetrics(result: BuildResult): void;
    /**
     * Record deployment metrics
     */
    recordDeploymentMetrics(result: DeploymentResult): void;
    /**
     * Get pipeline metrics for a specific time range
     */
    getPipelineMetrics(timeRange: string): Promise<Record<string, any>>;
    /**
     * Record infrastructure provisioning metrics
     */
    recordProvisioningMetrics(metrics: {
        infrastructureId: string;
        duration: number;
        resourceCount: number;
        success: boolean;
    }): void;
    /**
     * Get infrastructure metrics for a specific infrastructure
     */
    getInfrastructureMetrics(infrastructureId: string): Promise<InfrastructureMetrics>;
    /**
     * Get real-time metrics dashboard data
     */
    getDashboardMetrics(): Record<string, any>;
    private recordMetric;
    private updatePipelineAggregates;
    private parseTimeRange;
    private calculateDORAMetrics;
    private calculatePerformanceMetrics;
    private calculateQualityMetrics;
    private calculateReliabilityMetrics;
    private calculateTrends;
    private calculateSuccessRate;
    private calculateAverageDuration;
    private calculateAverage;
    private calculateMedian;
    private calculatePercentile;
    private getDaysBetween;
    private calculateMTTR;
    private calculateAverageParallelization;
    private calculateCoverageTrend;
    private calculateQualityTrend;
    private calculateTestStability;
    private calculateRollbackRate;
    private calculateUptime;
    private calculateErrorRate;
    private calculateTrend;
    private generateAlerts;
    private classifyDeploymentFrequency;
    private classifyLeadTime;
    private classifyChangeFailureRate;
    private classifyMTTR;
    private isMetricsFresh;
}
//# sourceMappingURL=MetricsCollector.d.ts.map