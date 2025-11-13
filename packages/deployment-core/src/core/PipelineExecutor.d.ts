import { PipelineTask, PipelineStage, PipelineDefinition, TaskResult, DeploymentConfig, DeploymentResult } from '../types/pipeline';
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
    /**`
     * Execute a deployment configuration`
     */
    executeDeployment(deployment: DeploymentConfig): Promise<DeploymentResult>;
    catch(error: any): void;
    shellProcess: any;
    on(: any): any;
}
//# sourceMappingURL=PipelineExecutor.d.ts.map