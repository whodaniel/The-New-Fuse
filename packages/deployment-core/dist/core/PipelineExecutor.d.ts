import { PipelineTask, PipelineStage, PipelineDefinition, TaskResult, DeploymentConfig, DeploymentResult, RollbackResult } from '../types/pipeline.js';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
/**
 * Pipeline Executor handles the actual execution of pipeline tasks and deployments
 */
export declare class PipelineExecutor extends EventEmitter {
    private logger;
    private runningTasks;
    private taskTimeouts;
    constructor(logger: Logger);
    /**
     * Execute a pipeline task
     */
    executeTask(task: PipelineTask, stage: PipelineStage, pipeline: PipelineDefinition, executionId: string): Promise<TaskResult>;
    /**
     * Execute a deployment configuration
     */
    executeDeployment(deployment: DeploymentConfig): Promise<DeploymentResult>;
    /**
     * Execute a rollback operation
     */
    executeRollback(deployment: DeploymentResult): Promise<RollbackResult>;
    /**
     * Cancel a running execution
     */
    cancelExecution(executionId: string): Promise<void>;
    private evaluateTaskConditions;
    private evaluateCondition;
    private executeShellTask;
    private executeDockerTask;
    private executeKubernetesTask;
    private executeTestTask;
    private executeBuildTask;
    private executeDeployTask;
    private executeCustomTask;
    private retryTask;
    private calculateRetryDelay;
    private buildDockerCommand;
    private buildKubectlCommand;
    private buildDeployCommand;
    private deployService;
    private executeHealthCheck;
    private simulateRollback;
}
//# sourceMappingURL=PipelineExecutor.d.ts.map