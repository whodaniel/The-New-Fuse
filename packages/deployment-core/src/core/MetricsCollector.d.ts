import { PipelineResult, DeploymentResult } from '../types/pipeline';
import { InfrastructureMetrics } from '../interfaces/IInfrastructureManager';
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
}
//# sourceMappingURL=MetricsCollector.d.ts.map