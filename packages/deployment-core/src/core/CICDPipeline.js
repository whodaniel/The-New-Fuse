"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CICDPipeline = void 0;
const pipeline_1 = require("../types/pipeline");
const events_1 = require("events");
/**
 * Core CI/CD Pipeline implementation
 * Manages the complete lifecycle of CI/CD pipelines including build, test, and deployment
 */
class CICDPipeline extends events_1.EventEmitter {
    executor;
    validator;
    storage;
    notificationService;
    metricsCollector;
    logger;
    runningPipelines = new Map();
    constructor(executor, validator, storage, notificationService, metricsCollector, logger) {
        super();
        this.executor = executor;
        this.validator = validator;
        this.storage = storage;
        this.notificationService = notificationService;
        this.metricsCollector = metricsCollector;
        this.logger = logger;
        this.setupEventHandlers();
    }
    /**
     * Trigger a build based on the provided trigger configuration
     */
    async triggerBuild(trigger) {
        this.logger.info(`Triggering build for ${trigger.source.repository}:${trigger.source.branch}, {
      triggerId: trigger.id,
      type: trigger.type,
      commit: trigger.source.commit
    });

    try {
      // Find matching pipeline configurations
      const pipelineConfigs = await this.findMatchingPipelines(trigger);
      
      if (pipelineConfigs.length === 0) {`);
        throw new Error(No, pipeline, configurations, found);
        for (trigger; ; )
            : $;
        {
            trigger.id;
        }
        `);
      }

      // Execute the first matching pipeline (or all if configured)
      const pipelineConfig = pipelineConfigs[0];
      const pipelineResult = await this.executePipeline(pipelineConfig.definition);

      // Convert pipeline result to build result
      const buildResult: BuildResult = {
        id: `;
        build - $;
        {
            Date.now();
        }
        triggerId: trigger.id,
            status;
        pipelineResult.status,
            startTime;
        pipelineResult.startTime,
            endTime;
        pipelineResult.endTime,
            duration;
        pipelineResult.duration,
            artifacts;
        pipelineResult.artifacts,
            logs;
        pipelineResult.logs,
            metrics;
        this.convertTouildMetrics(pipelineResult.metrics),
            error;
        pipelineResult.error;
    }
    ;
}
exports.CICDPipeline = CICDPipeline;
// Store build result
await this.storage.storeBuildResult(buildResult);
// Send notifications
await this.notificationService.notifyBuildComplete(buildResult);
// Collect metrics
this.metricsCollector.recordBuildMetrics(buildResult);
return buildResult;
try { }
catch (error) {
    `
      this.logger.error(Build trigger failed: ${error.message}` `, {
        triggerId: trigger.id,
        error: error.stack
      });

      const failedResult: BuildResult = {
        id: build-${Date.now()},
        triggerId: trigger.id,
        status: PipelineStatus.FAILED,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        artifacts: [],
        logs: [error.message],
        metrics: {
          buildTime: 0,
          artifactSize: 0,
          dependencies: 0
        },
        error: error.message
      };

      await this.storage.storeBuildResult(failedResult);
      return failedResult;
    }
  }

  /**
   * Execute a complete pipeline based on the pipeline definition
   */
  async executePipeline(pipeline: PipelineDefinition): Promise<PipelineResult> {`;
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.info(Starting, pipeline, execution, $, { pipeline, : .name }, {
        pipelineId: pipeline.id,
        executionId,
        stages: pipeline.stages.length
    });
    // Validate pipeline before execution
    const validation = await this.validatePipeline(pipeline);
    if (!validation.valid) {
        `
      throw new Error(`;
        Pipeline;
        validation;
        failed: $;
        {
            validation.errors.join(', ');
        }
        `);
    }

    const startTime = new Date();
    const execution: PipelineExecution = {
      id: executionId,
      pipelineId: pipeline.id,
      status: PipelineStatus.RUNNING,
      startTime,
      stages: [],
      currentStageIndex: 0
    };

    this.runningPipelines.set(executionId, execution);

    try {
      // Emit pipeline start event
      this.emit('pipeline:start', { executionId, pipeline });
      await this.notificationService.notifyPipelineStart(pipeline, executionId);

      // Execute pipeline stages
      const stageResults: StageResult[] = [];
      
      for (let i = 0; i < pipeline.stages.length; i++) {
        const stage = pipeline.stages[i];
        execution.currentStageIndex = i;

        this.logger.info(Executing stage: ${stage.name}, {
          pipelineId: pipeline.id,
          executionId,
          stageId: stage.id,
          stageIndex: i
        });

        // Check stage conditions
        if (!await this.evaluateStageConditions(stage, stageResults)) {`;
        this.logger.info(Stage, $, { stage, : .name }, skipped, due, to, conditions `, {
            pipelineId: pipeline.id,
            executionId,
            stageId: stage.id
          });
          
          const skippedResult: StageResult = {
            id: stage-${Date.now()},
            stageId: stage.id,
            name: stage.name,
            status: PipelineStatus.SKIPPED,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            tasks: [],
            logs: ['Stage skipped due to conditions']
          };
          
          stageResults.push(skippedResult);
          continue;
        }

        // Execute stage
        const stageResult = await this.executeStage(stage, pipeline, executionId);
        stageResults.push(stageResult);
        execution.stages.push(stageResult);` `
        // Check if stage failed and should stop pipeline
        if (stageResult.status === PipelineStatus.FAILED && !stage.continueOnError) {
          this.logger.error(`, Stage, $, { stage, : .name }, failed, stopping, pipeline, {
            pipelineId: pipeline.id,
            executionId,
            stageId: stage.id,
            error: stageResult.error
        });
        break;
    }
    // Evaluate quality gates after each stage
    await this.evaluateQualityGates(pipeline.qualityGates, stageResult);
}
const endTime = new Date();
const duration = endTime.getTime() - startTime.getTime();
// Determine overall pipeline status
const overallStatus = this.determinePipelineStatus(stageResults);
execution.status = overallStatus;
// Create pipeline result
const pipelineResult = {
    id: executionId,
    pipelineId: pipeline.id,
    status: overallStatus,
    startTime,
    endTime,
    duration,
    stages: stageResults,
    artifacts: this.collectArtifacts(stageResults),
    metrics: await this.calculatePipelineMetrics(stageResults, duration),
    logs: this.collectLogs(stageResults),
    triggeredBy: 'system', // TODO: Get from context
    environment: pipeline.environment.name
};
// Store pipeline result
await this.storage.storePipelineResult(pipelineResult);
// Emit pipeline complete event
this.emit('pipeline:complete', { executionId, pipeline, result: pipelineResult });
await this.notificationService.notifyPipelineComplete(pipelineResult);
// Collect metrics`
this.metricsCollector.recordPipelineMetrics(pipelineResult);
`

      this.logger.info(Pipeline execution completed: ${pipeline.name}`, {
    pipelineId: pipeline.id,
    executionId,
    status: overallStatus,
    duration
};
;
return pipelineResult;
try { }
catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    execution.status = pipeline_1.PipelineStatus.FAILED;
    this.logger.error(Pipeline, execution, failed, $, { pipeline, : .name }, {
        pipelineId: pipeline.id,
        executionId,
        error: error.stack
    });
    const failedResult = {
        id: executionId,
        pipelineId: pipeline.id,
        status: pipeline_1.PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        stages: execution.stages,
        artifacts: [],
        metrics: await this.calculatePipelineMetrics(execution.stages, duration),
        logs: [error.message],
        error: error.message,
        triggeredBy: 'system',
        environment: pipeline.environment.name
    };
    await this.storage.storePipelineResult(failedResult);
    this.emit('pipeline:failed', { executionId, pipeline, result: failedResult, error });
    await this.notificationService.notifyPipelineFailed(failedResult);
    return failedResult;
}
finally {
    this.runningPipelines.delete(executionId);
}
/**
 * Deploy to a specific environment using the deployment configuration`
 */ `
  async deployToEnvironment(deployment: DeploymentConfig): Promise<DeploymentResult> {
    this.logger.info(Starting deployment to ${deployment.environment}, {
      deploymentId: deployment.id,
      services: deployment.services.length
    });

    try {
      // Validate deployment configuration
      await this.validator.validateDeployment(deployment);

      // Check approvals if required
      if (deployment.approvals.some(a => a.required)) {
        await this.waitForApprovals(deployment);
      }

      // Execute deployment
      const result = await this.executor.executeDeployment(deployment);

      // Store deployment result
      await this.storage.storeDeploymentResult(result);

      // Send notifications
      await this.notificationService.notifyDeploymentComplete(result);

      // Collect metrics
      this.metricsCollector.recordDeploymentMetrics(result);

      return result;
`;
try { }
catch (error) {
    `
      this.logger.error(Deployment failed: ${error.message}`, {
        deploymentId: deployment.id,
        environment: deployment.environment,
        error: error.stack
    };
    ;
    const failedResult = {
        id: deploy - $
    }, { Date, now };
    ();
}
deploymentId: deployment.id,
    status;
pipeline_1.PipelineStatus.FAILED,
    startTime;
new Date(),
    endTime;
new Date(),
    duration;
0,
    environment;
deployment.environment,
    services;
[],
    healthChecks;
[],
    logs;
[error.message],
    error;
error.message;
;
await this.storage.storeDeploymentResult(failedResult);
await this.notificationService.notifyDeploymentFailed(failedResult);
return failedResult;
/**
 * Rollback a deployment to the previous stable version
 */
async;
rollbackDeployment(deploymentId, string);
Promise < pipeline_1.RollbackResult > {
    this: .logger.info(Starting, rollback), for: deployment, $
};
{
    deploymentId;
}
;
try {
    // Get deployment information`
    const deployment = await this.storage.getDeploymentResult(deploymentId);
    `
      if (!deployment) {`;
    throw new Error(Deployment, not, found, $, { deploymentId });
}
// Execute rollback
finally {
}
// Execute rollback
const result = await this.executor.executeRollback(deployment);
// Store rollback result
await this.storage.storeRollbackResult(result);
// Send notifications
await this.notificationService.notifyRollbackComplete(result);
return result;
try { }
catch (error) {
    this.logger.error(Rollback, failed, $, { error, : .message }, {
        deploymentId,
        error: error.stack
    });
    `
`;
    const failedResult = {} `
        id: rollback-${Date.now()},
        deploymentId,
        status: PipelineStatus.FAILED,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        previousVersion: 'unknown',
        currentVersion: 'unknown',
        reason: 'Manual rollback',
        logs: [error.message],
        error: error.message
      };

      return failedResult;
    }
  }

  /**
   * Monitor the status of a running pipeline
   */
  async monitorPipeline(pipelineId: string): Promise<PipelineStatus> {
    const execution = this.runningPipelines.get(pipelineId);
    
    if (!execution) {
      // Check if pipeline exists in storage
      const storedResult = await this.storage.getPipelineResult(pipelineId);
      return storedResult?.status || PipelineStatus.PENDING;
    }

    return execution.status;
  }

  /**
   * Manage pipeline configuration
   */
  async managePipelineConfiguration(config: PipelineConfig): Promise<void> {
    this.logger.info(Managing pipeline configuration: ${config.name}, {
      configId: config.id,
      version: config.version
    });

    // Validate configuration`;
    const validation = await this.validatePipeline(config.definition);
    `
    if (!validation.valid) {`;
    throw new Error(Pipeline, configuration, invalid, $, { validation, : .errors.join(', ') });
}
// Store configuration
await this.storage.storePipelineConfig(config);
this.logger.info(Pipeline, configuration, saved, $, { config, : .name });
/**
 * Get pipeline execution history
 */
async;
getPipelineHistory(pipelineId ?  : string, limit, number = 50);
Promise < pipeline_1.PipelineResult[] > {
    return: await this.storage.getPipelineHistory(pipelineId, limit)
};
/**
 * Cancel a running pipeline
 */
async;
cancelPipeline(pipelineId, string);
Promise < boolean > {
    const: execution = this.runningPipelines.get(pipelineId),
    if(, execution) {
        return false;
    },
    try: {
        // Cancel the execution
        await, this: .executor.cancelExecution(pipelineId),
        execution, : .status = pipeline_1.PipelineStatus.CANCELLED,
        this: .runningPipelines.delete(pipelineId)
    } `
`,
    this: .logger.info(Pipeline, cancelled, $, { pipelineId } `);
      return true;

    } catch (error) {
      this.logger.error(Failed to cancel pipeline: ${error.message}, {
        pipelineId,
        error: error.stack
      });
      return false;
    }
  }

  /**
   * Validate pipeline configuration
   */
  async validatePipeline(pipeline: PipelineDefinition): Promise<{ valid: boolean; errors: string[] }> {
    return await this.validator.validatePipeline(pipeline);
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(timeRange: string): Promise<Record<string, any>> {
    return await this.metricsCollector.getPipelineMetrics(timeRange);
  }

  // Private helper methods

  private setupEventHandlers(): void {`, this.on('pipeline:start', (data) => {
        `
      this.logger.info(`;
        Pipeline;
        started: $;
        {
            data.pipeline.name;
        }
        {
            executionId: data.executionId,
                pipelineId;
            data.pipeline.id;
        }
    }))
};
;
this.on('pipeline:complete', (data) => {
    this.logger.info(Pipeline, completed, $, { data, : .pipeline.name }, {
        executionId: data.executionId,
        status: data.result.status,
        duration: data.result.duration
    });
});
`
    this.on('pipeline:failed', (data) => {`;
this.logger.error(Pipeline, failed, $, { data, : .pipeline.name } `, {
        executionId: data.executionId,
        error: data.error.message
      });
    });
  }

  private async findMatchingPipelines(trigger: BuildTrigger): Promise<PipelineConfig[]> {
    const allConfigs = await this.storage.getAllPipelineConfigs();
    
    return allConfigs.filter(config => {
      return config.definition.triggers.some(pipelineTrigger => {
        if (pipelineTrigger.type !== trigger.type) {
          return false;
        }

        // Check filters
        return pipelineTrigger.filters.every(filter => {
          switch (filter.type) {
            case 'branch':
              const matches = new RegExp(filter.pattern).test(trigger.source.branch);
              return filter.exclude ? !matches : matches;
            case 'author':
              const authorMatches = new RegExp(filter.pattern).test(trigger.source.author);
              return filter.exclude ? !authorMatches : authorMatches;
            default:
              return true;
          }
        });
      });
    });
  }

  private async executeStage(
    stage: PipelineStage, 
    pipeline: PipelineDefinition, 
    executionId: string
  ): Promise<StageResult> {
    const startTime = new Date();
    
    try {
      const taskResults: TaskResult[] = [];

      // Execute tasks in parallel or sequence based on stage configuration
      if (stage.parallel) {
        const taskPromises = stage.tasks.map(task => 
          this.executeTask(task, stage, pipeline, executionId)
        );
        const results = await Promise.allSettled(taskPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            taskResults.push(result.value);
          } else {
            taskResults.push({
              id: task-${Date.now()}-${index},
              taskId: stage.tasks[index].id,
              name: stage.tasks[index].name,
              status: PipelineStatus.FAILED,
              startTime: new Date(),
              endTime: new Date(),
              duration: 0,
              logs: [result.reason.message],
              artifacts: [],
              error: result.reason.message
            });
          }
        });
      } else {
        // Execute tasks sequentially
        for (const task of stage.tasks) {
          const taskResult = await this.executeTask(task, stage, pipeline, executionId);
          taskResults.push(taskResult);

          // Stop if task failed and stage doesn't continue on error
          if (taskResult.status === PipelineStatus.FAILED && !stage.continueOnError) {
            break;
          }
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Determine stage status
      const stageStatus = this.determineStageStatus(taskResults);

      return {
        id: stage-${Date.now()},
        stageId: stage.id,
        name: stage.name,
        status: stageStatus,
        startTime,
        endTime,
        duration,
        tasks: taskResults,
        logs: this.collectTaskLogs(taskResults)
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();` `
      return {`, id, stage - $, { Date, : .now() } `,
        stageId: stage.id,
        name: stage.name,
        status: PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        tasks: [],
        logs: [error.message],
        error: error.message
      };
    }
  }

  private async executeTask(
    task: PipelineTask,
    stage: PipelineStage,
    pipeline: PipelineDefinition,
    executionId: string
  ): Promise<TaskResult> {
    return await this.executor.executeTask(task, stage, pipeline, executionId);
  }

  private async evaluateStageConditions(
    stage: PipelineStage, 
    previousStages: StageResult[]
  ): Promise<boolean> {
    for (const condition of stage.conditions) {
      const result = await this.evaluateCondition(condition, previousStages);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: any, context: any): Promise<boolean> {
    // Implementation depends on condition type
    // This is a simplified version
    switch (condition.type) {
      case 'branch':
        return condition.operator === 'equals' ? 
          context.branch === condition.value : 
          context.branch !== condition.value;
      case 'previous_stage':
        const previousStage = context.find((s: StageResult) => s.name === condition.value);
        return previousStage?.status === PipelineStatus.SUCCESS;
      default:
        return true;
    }
  }

  private async evaluateQualityGates(_qualityGates: any[], _stageResult: StageResult): Promise<void> {
    // Implementation for quality gate evaluation
    // This would check various metrics and thresholds
  }

  private determinePipelineStatus(stageResults: StageResult[]): PipelineStatus {
    if (stageResults.length === 0) {
      return PipelineStatus.PENDING;
    }

    const hasFailures = stageResults.some(s => s.status === PipelineStatus.FAILED);
    const hasCancelled = stageResults.some(s => s.status === PipelineStatus.CANCELLED);
    const allCompleted = stageResults.every(s => 
      s.status === PipelineStatus.SUCCESS || 
      s.status === PipelineStatus.SKIPPED ||
      s.status === PipelineStatus.FAILED
    );

    if (hasCancelled) {
      return PipelineStatus.CANCELLED;
    }

    if (hasFailures) {
      return PipelineStatus.FAILED;
    }

    if (allCompleted) {
      return PipelineStatus.SUCCESS;
    }

    return PipelineStatus.RUNNING;
  }

  private determineStageStatus(taskResults: TaskResult[]): PipelineStatus {
    if (taskResults.length === 0) {
      return PipelineStatus.SUCCESS;
    }

    const hasFailures = taskResults.some(t => t.status === PipelineStatus.FAILED);
    const hasCancelled = taskResults.some(t => t.status === PipelineStatus.CANCELLED);

    if (hasCancelled) {
      return PipelineStatus.CANCELLED;
    }

    if (hasFailures) {
      return PipelineStatus.FAILED;
    }

    return PipelineStatus.SUCCESS;
  }

  private collectArtifacts(stageResults: StageResult[]): any[] {
    const artifacts: any[] = [];
    
    stageResults.forEach(stage => {
      stage.tasks.forEach(task => {
        artifacts.push(...task.artifacts);
      });
    });

    return artifacts;
  }

  private collectLogs(stageResults: StageResult[]): string[] {
    const logs: string[] = [];
    
    stageResults.forEach(stage => {
      logs.push(...stage.logs);
      stage.tasks.forEach(task => {
        logs.push(...task.logs);
      });
    });

    return logs;
  }

  private collectTaskLogs(taskResults: TaskResult[]): string[] {
    const logs: string[] = [];
    taskResults.forEach(task => {
      logs.push(...task.logs);
    });
    return logs;
  }

  private async calculatePipelineMetrics(
    stageResults: StageResult[], 
    totalDuration: number
  ): Promise<PipelineMetrics> {
    const buildStages = stageResults.filter(s => s.name.toLowerCase().includes('build'));
    const testStages = stageResults.filter(s => s.name.toLowerCase().includes('test'));
    const deployStages = stageResults.filter(s => s.name.toLowerCase().includes('deploy'));

    const buildTime = buildStages.reduce((sum, s) => sum + (s.duration || 0), 0);
    const testTime = testStages.reduce((sum, s) => sum + (s.duration || 0), 0);
    const deployTime = deployStages.reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      totalDuration,
      queueTime: 0, // TODO: Calculate actual queue time
      buildTime,
      testTime,
      deployTime,
      successRate: 0, // TODO: Calculate from historical data
      failureRate: 0, // TODO: Calculate from historical data
      averageDuration: 0, // TODO: Calculate from historical data
      throughput: 0, // TODO: Calculate from historical data
      leadTime: 0, // TODO: Calculate from commit to deployment
      changeFailureRate: 0, // TODO: Calculate from deployment data
      meanTimeToRecovery: 0 // TODO: Calculate from incident data
    };
  }

  private convertTouildMetrics(pipelineMetrics: PipelineMetrics): any {
    return {
      buildTime: pipelineMetrics.buildTime,
      testCoverage: 0, // TODO: Extract from test results
      codeQualityScore: 0, // TODO: Extract from quality checks
      securityScore: 0, // TODO: Extract from security scans
      artifactSize: 0, // TODO: Calculate from artifacts
      dependencies: 0 // TODO: Extract from dependency analysis
    };
  }

  private async waitForApprovals(_deployment: DeploymentConfig): Promise<void> {
    // Implementation for approval workflow
    // This would integrate with approval systems
  }
}

// Internal types for pipeline execution tracking
interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: PipelineStatus;
  startTime: Date;
  stages: StageResult[];
  currentStageIndex: number;
});
//# sourceMappingURL=CICDPipeline.js.map