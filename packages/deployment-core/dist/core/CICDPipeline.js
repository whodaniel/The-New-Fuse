"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CICDPipeline = void 0;
const events_1 = require("events");
const pipeline_js_1 = require("../types/pipeline.js");
/**
 * Core CI/CD Pipeline implementation
 * Manages the complete lifecycle of CI/CD pipelines including build, test, and deployment
 */
class CICDPipeline extends events_1.EventEmitter {
    constructor(executor, validator, storage, notificationService, metricsCollector, logger) {
        super();
        this.runningPipelines = new Map();
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
        this.logger.info(`Triggering build for ${trigger.source.repository}:${trigger.source.branch}`, {
            triggerId: trigger.id,
            type: trigger.type,
            commit: trigger.source.commit,
        });
        try {
            // Find matching pipeline configurations
            const pipelineConfigs = await this.findMatchingPipelines(trigger);
            if (pipelineConfigs.length === 0) {
                throw new Error(`No pipeline configurations found for trigger: ${trigger.id}`);
            }
            // Execute the first matching pipeline (or all if configured)
            const pipelineConfig = pipelineConfigs[0];
            const pipelineResult = await this.executePipeline(pipelineConfig.definition);
            // Convert pipeline result to build result
            const buildResult = {
                id: `build-${Date.now()}`,
                triggerId: trigger.id,
                status: pipelineResult.status,
                startTime: pipelineResult.startTime,
                endTime: pipelineResult.endTime,
                duration: pipelineResult.duration,
                artifacts: pipelineResult.artifacts,
                logs: pipelineResult.logs,
                metrics: this.convertTouildMetrics(pipelineResult.metrics),
                error: pipelineResult.error,
            };
            // Store build result
            await this.storage.storeBuildResult(buildResult);
            // Send notifications
            await this.notificationService.notifyBuildComplete(buildResult);
            // Collect metrics
            this.metricsCollector.recordBuildMetrics(buildResult);
            return buildResult;
        }
        catch (error) {
            this.logger.error(`Build trigger failed: ${error.message}`, {
                triggerId: trigger.id,
                error: error.stack,
            });
            const failedResult = {
                id: `build-${Date.now()}`,
                triggerId: trigger.id,
                status: pipeline_js_1.PipelineStatus.FAILED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                artifacts: [],
                logs: [error.message],
                metrics: {
                    buildTime: 0,
                    artifactSize: 0,
                    dependencies: 0,
                },
                error: error.message,
            };
            await this.storage.storeBuildResult(failedResult);
            return failedResult;
        }
    }
    /**
     * Execute a complete pipeline based on the pipeline definition
     */
    async executePipeline(pipeline) {
        const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.logger.info(`Starting pipeline execution: ${pipeline.name}`, {
            pipelineId: pipeline.id,
            executionId,
            stages: pipeline.stages.length,
        });
        // Validate pipeline before execution
        const validation = await this.validatePipeline(pipeline);
        if (!validation.valid) {
            throw new Error(`Pipeline validation failed: ${validation.errors.join(', ')}`);
        }
        const startTime = new Date();
        const execution = {
            id: executionId,
            pipelineId: pipeline.id,
            status: pipeline_js_1.PipelineStatus.RUNNING,
            startTime,
            stages: [],
            currentStageIndex: 0,
        };
        this.runningPipelines.set(executionId, execution);
        try {
            // Emit pipeline start event
            this.emit('pipeline:start', { executionId, pipeline });
            await this.notificationService.notifyPipelineStart(pipeline, executionId);
            // Execute pipeline stages
            const stageResults = [];
            for (let i = 0; i < pipeline.stages.length; i++) {
                const stage = pipeline.stages[i];
                execution.currentStageIndex = i;
                this.logger.info(`Executing stage: ${stage.name}`, {
                    pipelineId: pipeline.id,
                    executionId,
                    stageId: stage.id,
                    stageIndex: i,
                });
                // Check stage conditions
                if (!(await this.evaluateStageConditions(stage, stageResults))) {
                    this.logger.info(`Stage ${stage.name} skipped due to conditions`, {
                        pipelineId: pipeline.id,
                        executionId,
                        stageId: stage.id,
                    });
                    const skippedResult = {
                        id: `stage-${Date.now()}`,
                        stageId: stage.id,
                        name: stage.name,
                        status: pipeline_js_1.PipelineStatus.SKIPPED,
                        startTime: new Date(),
                        endTime: new Date(),
                        duration: 0,
                        tasks: [],
                        logs: ['Stage skipped due to conditions'],
                    };
                    stageResults.push(skippedResult);
                    continue;
                }
                // Execute stage
                const stageResult = await this.executeStage(stage, pipeline, executionId);
                stageResults.push(stageResult);
                execution.stages.push(stageResult);
                // Check if stage failed and should stop pipeline
                if (stageResult.status === pipeline_js_1.PipelineStatus.FAILED && !stage.continueOnError) {
                    this.logger.error(`Stage ${stage.name} failed, stopping pipeline`, {
                        pipelineId: pipeline.id,
                        executionId,
                        stageId: stage.id,
                        error: stageResult.error,
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
                metrics: await this.calculatePipelineMetrics(pipeline.id, stageResults, duration, overallStatus),
                logs: this.collectLogs(stageResults),
                triggeredBy: 'system', // TODO: Get from context
                environment: pipeline.environment.name,
            };
            // Store pipeline result
            await this.storage.storePipelineResult(pipelineResult);
            // Emit pipeline complete event
            this.emit('pipeline:complete', { executionId, pipeline, result: pipelineResult });
            await this.notificationService.notifyPipelineComplete(pipelineResult);
            // Collect metrics
            this.metricsCollector.recordPipelineMetrics(pipelineResult);
            this.logger.info(`Pipeline execution completed: ${pipeline.name}`, {
                pipelineId: pipeline.id,
                executionId,
                status: overallStatus,
                duration,
            });
            return pipelineResult;
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            execution.status = pipeline_js_1.PipelineStatus.FAILED;
            this.logger.error(`Pipeline execution failed: ${pipeline.name}`, {
                pipelineId: pipeline.id,
                executionId,
                error: error.stack,
            });
            const failedResult = {
                id: executionId,
                pipelineId: pipeline.id,
                status: pipeline_js_1.PipelineStatus.FAILED,
                startTime,
                endTime,
                duration,
                stages: execution.stages,
                artifacts: [],
                metrics: await this.calculatePipelineMetrics(pipeline.id, execution.stages, duration, pipeline_js_1.PipelineStatus.FAILED),
                logs: [error.message],
                error: error.message,
                triggeredBy: 'system',
                environment: pipeline.environment.name,
            };
            await this.storage.storePipelineResult(failedResult);
            this.emit('pipeline:failed', { executionId, pipeline, result: failedResult, error });
            await this.notificationService.notifyPipelineFailed(failedResult);
            return failedResult;
        }
        finally {
            this.runningPipelines.delete(executionId);
        }
    }
    /**
     * Deploy to a specific environment using the deployment configuration
     */
    async deployToEnvironment(deployment) {
        this.logger.info(`Starting deployment to ${deployment.environment}`, {
            deploymentId: deployment.id,
            services: deployment.services.length,
        });
        try {
            // Validate deployment configuration
            await this.validator.validateDeployment(deployment);
            // Check approvals if required
            if (deployment.approvals.some((a) => a.required)) {
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
        }
        catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`, {
                deploymentId: deployment.id,
                environment: deployment.environment,
                error: error.stack,
            });
            const failedResult = {
                id: `deploy-${Date.now()}`,
                deploymentId: deployment.id,
                status: pipeline_js_1.PipelineStatus.FAILED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                environment: deployment.environment,
                services: [],
                healthChecks: [],
                logs: [error.message],
                error: error.message,
            };
            await this.storage.storeDeploymentResult(failedResult);
            await this.notificationService.notifyDeploymentFailed(failedResult);
            return failedResult;
        }
    }
    /**
     * Rollback a deployment to the previous stable version
     */
    async rollbackDeployment(deploymentId) {
        this.logger.info(`Starting rollback for deployment: ${deploymentId}`);
        try {
            // Get deployment information
            const deployment = await this.storage.getDeploymentResult(deploymentId);
            if (!deployment) {
                throw new Error(`Deployment not found: ${deploymentId}`);
            }
            // Execute rollback
            const result = await this.executor.executeRollback(deployment);
            // Store rollback result
            await this.storage.storeRollbackResult(result);
            // Send notifications
            await this.notificationService.notifyRollbackComplete(result);
            return result;
        }
        catch (error) {
            this.logger.error(`Rollback failed: ${error.message}`, {
                deploymentId,
                error: error.stack,
            });
            const failedResult = {
                id: `rollback-${Date.now()}`,
                deploymentId,
                status: pipeline_js_1.PipelineStatus.FAILED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                previousVersion: 'unknown',
                currentVersion: 'unknown',
                reason: 'Manual rollback',
                logs: [error.message],
                error: error.message,
            };
            return failedResult;
        }
    }
    /**
     * Monitor the status of a running pipeline
     */
    async monitorPipeline(pipelineId) {
        const execution = this.runningPipelines.get(pipelineId);
        if (!execution) {
            // Check if pipeline exists in storage
            const storedResult = await this.storage.getPipelineResult(pipelineId);
            return storedResult?.status || pipeline_js_1.PipelineStatus.PENDING;
        }
        return execution.status;
    }
    /**
     * Manage pipeline configuration
     */
    async managePipelineConfiguration(config) {
        this.logger.info(`Managing pipeline configuration: ${config.name}`, {
            configId: config.id,
            version: config.version,
        });
        // Validate configuration
        const validation = await this.validatePipeline(config.definition);
        if (!validation.valid) {
            throw new Error(`Pipeline configuration invalid: ${validation.errors.join(', ')}`);
        }
        // Store configuration
        await this.storage.storePipelineConfig(config);
        this.logger.info(`Pipeline configuration saved: ${config.name}`);
    }
    /**
     * Get pipeline execution history
     */
    async getPipelineHistory(pipelineId, limit = 50) {
        return await this.storage.getPipelineHistory(pipelineId, limit);
    }
    /**
     * Cancel a running pipeline
     */
    async cancelPipeline(pipelineId) {
        const execution = this.runningPipelines.get(pipelineId);
        if (!execution) {
            return false;
        }
        try {
            // Cancel the execution
            await this.executor.cancelExecution(pipelineId);
            execution.status = pipeline_js_1.PipelineStatus.CANCELLED;
            this.runningPipelines.delete(pipelineId);
            this.logger.info(`Pipeline cancelled: ${pipelineId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to cancel pipeline: ${error.message}`, {
                pipelineId,
                error: error.stack,
            });
            return false;
        }
    }
    /**
     * Validate pipeline configuration
     */
    async validatePipeline(pipeline) {
        return await this.validator.validatePipeline(pipeline);
    }
    /**
     * Get pipeline metrics
     */
    async getPipelineMetrics(timeRange) {
        return await this.metricsCollector.getPipelineMetrics(timeRange);
    }
    // Private helper methods
    setupEventHandlers() {
        this.on('pipeline:start', (data) => {
            this.logger.info(`Pipeline started: ${data.pipeline.name}`, {
                executionId: data.executionId,
                pipelineId: data.pipeline.id,
            });
        });
        this.on('pipeline:complete', (data) => {
            this.logger.info(`Pipeline completed: ${data.pipeline.name}`, {
                executionId: data.executionId,
                status: data.result.status,
                duration: data.result.duration,
            });
        });
        this.on('pipeline:failed', (data) => {
            this.logger.error(`Pipeline failed: ${data.pipeline.name}`, {
                executionId: data.executionId,
                error: data.error.message,
            });
        });
    }
    async findMatchingPipelines(trigger) {
        const allConfigs = await this.storage.getAllPipelineConfigs();
        return allConfigs.filter((config) => {
            return config.definition.triggers.some((pipelineTrigger) => {
                if (pipelineTrigger.type !== trigger.type) {
                    return false;
                }
                // Check filters
                return pipelineTrigger.filters.every((filter) => {
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
    async executeStage(stage, pipeline, executionId) {
        const startTime = new Date();
        try {
            const taskResults = [];
            // Execute tasks in parallel or sequence based on stage configuration
            if (stage.parallel) {
                const taskPromises = stage.tasks.map((task) => this.executeTask(task, stage, pipeline, executionId));
                const results = await Promise.allSettled(taskPromises);
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        taskResults.push(result.value);
                    }
                    else {
                        taskResults.push({
                            id: `task-${Date.now()}-${index}`,
                            taskId: stage.tasks[index].id,
                            name: stage.tasks[index].name,
                            status: pipeline_js_1.PipelineStatus.FAILED,
                            startTime: new Date(),
                            endTime: new Date(),
                            duration: 0,
                            logs: [result.reason.message],
                            artifacts: [],
                            error: result.reason.message,
                        });
                    }
                });
            }
            else {
                // Execute tasks sequentially
                for (const task of stage.tasks) {
                    const taskResult = await this.executeTask(task, stage, pipeline, executionId);
                    taskResults.push(taskResult);
                    // Stop if task failed and stage doesn't continue on error
                    if (taskResult.status === pipeline_js_1.PipelineStatus.FAILED && !stage.continueOnError) {
                        break;
                    }
                }
            }
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            // Determine stage status
            const stageStatus = this.determineStageStatus(taskResults);
            return {
                id: `stage-${Date.now()}`,
                stageId: stage.id,
                name: stage.name,
                status: stageStatus,
                startTime,
                endTime,
                duration,
                tasks: taskResults,
                logs: this.collectTaskLogs(taskResults),
            };
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            return {
                id: `stage-${Date.now()}`,
                stageId: stage.id,
                name: stage.name,
                status: pipeline_js_1.PipelineStatus.FAILED,
                startTime,
                endTime,
                duration,
                tasks: [],
                logs: [error.message],
                error: error.message,
            };
        }
    }
    async executeTask(task, stage, pipeline, executionId) {
        return await this.executor.executeTask(task, stage, pipeline, executionId);
    }
    async evaluateStageConditions(stage, previousStages) {
        for (const condition of stage.conditions) {
            const result = await this.evaluateCondition(condition, previousStages);
            if (!result) {
                return false;
            }
        }
        return true;
    }
    async evaluateCondition(condition, context) {
        // Implementation depends on condition type
        // This is a simplified version
        switch (condition.type) {
            case 'branch':
                return condition.operator === 'equals'
                    ? context.branch === condition.value
                    : context.branch !== condition.value;
            case 'previous_stage':
                const previousStage = context.find((s) => s.name === condition.value);
                return previousStage?.status === pipeline_js_1.PipelineStatus.SUCCESS;
            default:
                return true;
        }
    }
    async evaluateQualityGates(_qualityGates, _stageResult) {
        // Implementation for quality gate evaluation
        // This would check various metrics and thresholds
    }
    determinePipelineStatus(stageResults) {
        if (stageResults.length === 0) {
            return pipeline_js_1.PipelineStatus.PENDING;
        }
        const hasFailures = stageResults.some((s) => s.status === pipeline_js_1.PipelineStatus.FAILED);
        const hasCancelled = stageResults.some((s) => s.status === pipeline_js_1.PipelineStatus.CANCELLED);
        const allCompleted = stageResults.every((s) => s.status === pipeline_js_1.PipelineStatus.SUCCESS ||
            s.status === pipeline_js_1.PipelineStatus.SKIPPED ||
            s.status === pipeline_js_1.PipelineStatus.FAILED);
        if (hasCancelled) {
            return pipeline_js_1.PipelineStatus.CANCELLED;
        }
        if (hasFailures) {
            return pipeline_js_1.PipelineStatus.FAILED;
        }
        if (allCompleted) {
            return pipeline_js_1.PipelineStatus.SUCCESS;
        }
        return pipeline_js_1.PipelineStatus.RUNNING;
    }
    determineStageStatus(taskResults) {
        if (taskResults.length === 0) {
            return pipeline_js_1.PipelineStatus.SUCCESS;
        }
        const hasFailures = taskResults.some((t) => t.status === pipeline_js_1.PipelineStatus.FAILED);
        const hasCancelled = taskResults.some((t) => t.status === pipeline_js_1.PipelineStatus.CANCELLED);
        if (hasCancelled) {
            return pipeline_js_1.PipelineStatus.CANCELLED;
        }
        if (hasFailures) {
            return pipeline_js_1.PipelineStatus.FAILED;
        }
        return pipeline_js_1.PipelineStatus.SUCCESS;
    }
    collectArtifacts(stageResults) {
        const artifacts = [];
        stageResults.forEach((stage) => {
            stage.tasks.forEach((task) => {
                artifacts.push(...task.artifacts);
            });
        });
        return artifacts;
    }
    collectLogs(stageResults) {
        const logs = [];
        stageResults.forEach((stage) => {
            logs.push(...stage.logs);
            stage.tasks.forEach((task) => {
                logs.push(...task.logs);
            });
        });
        return logs;
    }
    collectTaskLogs(taskResults) {
        const logs = [];
        taskResults.forEach((task) => {
            logs.push(...task.logs);
        });
        return logs;
    }
    async calculatePipelineMetrics(pipelineId, stageResults, totalDuration, currentStatus) {
        const buildStages = stageResults.filter((s) => s.name.toLowerCase().includes('build'));
        const testStages = stageResults.filter((s) => s.name.toLowerCase().includes('test'));
        const deployStages = stageResults.filter((s) => s.name.toLowerCase().includes('deploy'));
        const buildTime = buildStages.reduce((sum, s) => sum + (s.duration || 0), 0);
        const testTime = testStages.reduce((sum, s) => sum + (s.duration || 0), 0);
        const deployTime = deployStages.reduce((sum, s) => sum + (s.duration || 0), 0);
        // Calculate historical metrics
        const history = await this.getPipelineHistory(pipelineId, 100);
        // Include current run in metrics
        const totalRuns = history.length + 1;
        const historicalSuccess = history.filter((r) => r.status === pipeline_js_1.PipelineStatus.SUCCESS).length;
        const historicalFailures = history.filter((r) => r.status === pipeline_js_1.PipelineStatus.FAILED).length;
        const currentSuccess = currentStatus === pipeline_js_1.PipelineStatus.SUCCESS ? 1 : 0;
        const currentFailure = currentStatus === pipeline_js_1.PipelineStatus.FAILED ? 1 : 0;
        const successRate = ((historicalSuccess + currentSuccess) / totalRuns) * 100;
        const failureRate = ((historicalFailures + currentFailure) / totalRuns) * 100;
        const totalHistoryDuration = history.reduce((sum, r) => sum + r.duration, 0);
        const averageDuration = (totalHistoryDuration + totalDuration) / totalRuns;
        // Calculate throughput (successful runs per day)
        let throughput = 0;
        if (history.length > 0) {
            const oldestRun = history[history.length - 1];
            const timeSpanDays = (new Date().getTime() - oldestRun.startTime.getTime()) / (1000 * 60 * 60 * 24);
            if (timeSpanDays > 0) {
                throughput = (historicalSuccess + currentSuccess) / timeSpanDays;
            }
            else {
                throughput = historicalSuccess + currentSuccess;
            }
        }
        else {
            throughput = currentSuccess;
        }
        return {
            totalDuration,
            queueTime: 0, // TODO: Calculate actual queue time
            buildTime,
            testTime,
            deployTime,
            successRate,
            failureRate,
            averageDuration,
            throughput,
            leadTime: 0, // TODO: Calculate from commit to deployment
            changeFailureRate: 0, // TODO: Calculate from deployment data
            meanTimeToRecovery: 0, // TODO: Calculate from incident data
        };
    }
    convertTouildMetrics(pipelineMetrics) {
        return {
            buildTime: pipelineMetrics.buildTime,
            testCoverage: 0, // TODO: Extract from test results
            codeQualityScore: 0, // TODO: Extract from quality checks
            securityScore: 0, // TODO: Extract from security scans
            artifactSize: 0, // TODO: Calculate from artifacts
            dependencies: 0, // TODO: Extract from dependency analysis
        };
    }
    async waitForApprovals(_deployment) {
        // Implementation for approval workflow
        // This would integrate with approval systems
    }
}
exports.CICDPipeline = CICDPipeline;
//# sourceMappingURL=CICDPipeline.js.map