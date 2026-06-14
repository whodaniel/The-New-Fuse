import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { ICICDPipeline } from '../interfaces/ICICDPipeline.js';
import { BuildResult, BuildTrigger, DeploymentConfig, DeploymentResult, PipelineConfig, PipelineDefinition, PipelineResult, PipelineStatus, RollbackResult } from '../types/pipeline.js';
import { MetricsCollector } from './MetricsCollector.js';
import { NotificationService } from './NotificationService.js';
import { PipelineExecutor } from './PipelineExecutor.js';
import { PipelineStorage } from './PipelineStorage.js';
import { PipelineValidator } from './PipelineValidator.js';
/**
 * Core CI/CD Pipeline implementation
 * Manages the complete lifecycle of CI/CD pipelines including build, test, and deployment
 */
export declare class CICDPipeline extends EventEmitter implements ICICDPipeline {
    private executor;
    private validator;
    private storage;
    private notificationService;
    private metricsCollector;
    private logger;
    private runningPipelines;
    constructor(executor: PipelineExecutor, validator: PipelineValidator, storage: PipelineStorage, notificationService: NotificationService, metricsCollector: MetricsCollector, logger: Logger);
    /**
     * Trigger a build based on the provided trigger configuration
     */
    triggerBuild(trigger: BuildTrigger): Promise<BuildResult>;
    /**
     * Execute a complete pipeline based on the pipeline definition
     */
    executePipeline(pipeline: PipelineDefinition): Promise<PipelineResult>;
    /**
     * Deploy to a specific environment using the deployment configuration
     */
    deployToEnvironment(deployment: DeploymentConfig): Promise<DeploymentResult>;
    /**
     * Rollback a deployment to the previous stable version
     */
    rollbackDeployment(deploymentId: string): Promise<RollbackResult>;
    /**
     * Monitor the status of a running pipeline
     */
    monitorPipeline(pipelineId: string): Promise<PipelineStatus>;
    /**
     * Manage pipeline configuration
     */
    managePipelineConfiguration(config: PipelineConfig): Promise<void>;
    /**
     * Get pipeline execution history
     */
    getPipelineHistory(pipelineId?: string, limit?: number): Promise<PipelineResult[]>;
    /**
     * Cancel a running pipeline
     */
    cancelPipeline(pipelineId: string): Promise<boolean>;
    /**
     * Validate pipeline configuration
     */
    validatePipeline(pipeline: PipelineDefinition): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Get pipeline metrics
     */
    getPipelineMetrics(timeRange: string): Promise<Record<string, any>>;
    private setupEventHandlers;
    private findMatchingPipelines;
    private executeStage;
    private executeTask;
    private evaluateStageConditions;
    private evaluateCondition;
    private evaluateQualityGates;
    private determinePipelineStatus;
    private determineStageStatus;
    private collectArtifacts;
    private collectLogs;
    private collectTaskLogs;
    private calculatePipelineMetrics;
    private convertTouildMetrics;
    private waitForApprovals;
}
//# sourceMappingURL=CICDPipeline.d.ts.map