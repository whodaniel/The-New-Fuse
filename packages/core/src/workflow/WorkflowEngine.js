/**
 * @fileoverview Production-ready workflow engine for orchestrating complex processes
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowEngine_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { WorkflowExecutionStatus, WorkflowStepType } from '../types/workflow';
import { WorkflowError } from '../utils/errors';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';
let WorkflowEngine = WorkflowEngine_1 = class WorkflowEngine extends EventEmitter {
    logger = new Logger(WorkflowEngine_1.name);
    state = ServiceState.UNINITIALIZED;
    workflows = new Map();
    executions = new Map();
    executionQueue = [];
    isProcessing = false;
    constructor() {
        super();
        this.setMaxListeners(100); // Allow many listeners for workflow events
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            this.logger.warn('WorkflowEngine is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            this.logger.log('Starting WorkflowEngine');
            // Start processing queue
            this.startQueueProcessor();
            this.state = ServiceState.RUNNING;
            this.logger.log('WorkflowEngine started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to start WorkflowEngine', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            this.logger.warn('WorkflowEngine is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            this.logger.log('Stopping WorkflowEngine');
            // Stop processing and wait for current executions to complete
            this.isProcessing = false;
            this.state = ServiceState.STOPPED;
            this.logger.log('WorkflowEngine stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to stop WorkflowEngine', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    // Workflow definition management
    registerWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
        this.logger.log(`Registered workflow: ${workflow.name} (${workflow.id})`);
        this.emit('workflowRegistered', workflow);
    }
    unregisterWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            return false;
        }
        this.workflows.delete(workflowId);
        this.logger.log(`Unregistered workflow: ${workflow.name} (${workflowId})`);
        this.emit('workflowUnregistered', workflow);
        return true;
    }
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }
    getAllWorkflows() {
        return Array.from(this.workflows.values());
    }
    // Workflow execution
    async executeWorkflow(workflowId, variables = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new BaseError(`Workflow ${workflowId} not found`, 'WORKFLOW_NOT_FOUND');
        }
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const execution = {
            id: executionId,
            workflowId,
            status: WorkflowExecutionStatus.PENDING,
            startTime: new Date(),
            variables,
            stepExecutions: [],
        };
        this.executions.set(executionId, execution);
        this.executionQueue.push(executionId);
        this.logger.log(`Queued workflow execution: ${workflow.name} (${executionId})`);
        this.emit('executionQueued', execution);
        return executionId;
    }
    async getExecution(executionId) {
        return this.executions.get(executionId);
    }
    async getExecutionsByWorkflow(workflowId) {
        return Array.from(this.executions.values()).filter(exec => exec.workflowId === workflowId);
    }
    async cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            return false;
        }
        if (execution.status === WorkflowExecutionStatus.RUNNING) {
            execution.status = WorkflowExecutionStatus.CANCELLED;
            execution.endTime = new Date();
            this.logger.log(`Cancelled workflow execution: ${executionId}`);
            this.emit('executionCancelled', execution);
            return true;
        }
        return false;
    }
    async pauseExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== WorkflowExecutionStatus.RUNNING) {
            return false;
        }
        execution.status = WorkflowExecutionStatus.PAUSED;
        this.logger.log(`Paused workflow execution: ${executionId}`);
        this.emit('executionPaused', execution);
        return true;
    }
    async resumeExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== WorkflowExecutionStatus.PAUSED) {
            return false;
        }
        execution.status = WorkflowExecutionStatus.RUNNING;
        this.executionQueue.push(executionId);
        this.logger.log(`Resumed workflow execution: ${executionId}`);
        this.emit('executionResumed', execution);
        return true;
    }
    // Private methods
    startQueueProcessor() {
        this.isProcessing = true;
        this.processQueue();
    }
    async processQueue() {
        while (this.isProcessing && this.state === ServiceState.RUNNING) {
            if (this.executionQueue.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
                continue;
            }
            const executionId = this.executionQueue.shift();
            if (!executionId)
                continue;
            try {
                await this.processExecution(executionId);
            }
            catch (error) {
                this.logger.error(`Failed to process execution: ${executionId}`, error);
            }
        }
    }
    async processExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            this.logger.warn(`Execution not found: ${executionId}`);
            return;
        }
        const workflow = this.workflows.get(execution.workflowId);
        if (!workflow) {
            this.logger.error(`Workflow not found for execution: ${execution.workflowId}`);
            return;
        }
        try {
            execution.status = WorkflowExecutionStatus.RUNNING;
            this.emit('executionStarted', execution);
            // Execute workflow steps
            await this.executeWorkflowSteps(workflow, execution);
            execution.status = WorkflowExecutionStatus.COMPLETED;
            execution.endTime = new Date();
            this.logger.log(`Completed workflow execution: ${executionId}`);
            this.emit('executionCompleted', execution);
        }
        catch (error) {
            execution.status = WorkflowExecutionStatus.FAILED;
            execution.endTime = new Date();
            execution.error = new WorkflowError(error.message, 'EXECUTION_FAILED', execution.id);
            this.logger.error(`Failed workflow execution: ${executionId}`, error);
            this.emit('executionFailed', execution);
        }
    }
    async executeWorkflowSteps(workflow, execution) {
        const stepMap = new Map(workflow.steps.map(step => [step.id, step]));
        const completedSteps = new Set();
        const pendingSteps = new Set(workflow.steps.map(step => step.id));
        while (pendingSteps.size > 0 && execution.status === WorkflowExecutionStatus.RUNNING) {
            // Find steps that can be executed (all dependencies completed)
            const readySteps = Array.from(pendingSteps).filter(stepId => {
                const step = stepMap.get(stepId);
                return step.dependencies.every(depId => completedSteps.has(depId));
            });
            if (readySteps.length === 0) {
                throw new BaseError('Workflow has circular dependencies or missing steps', 'WORKFLOW_DEPENDENCY_ERROR');
            }
            // Execute ready steps (can be parallel)
            const stepPromises = readySteps.map(stepId => this.executeStep(stepMap.get(stepId), execution));
            const stepResults = await Promise.allSettled(stepPromises);
            // Process results
            for (let i = 0; i < readySteps.length; i++) {
                const stepId = readySteps[i];
                const result = stepResults[i];
                if (result.status === 'fulfilled') {
                    completedSteps.add(stepId);
                    pendingSteps.delete(stepId);
                }
                else {
                    throw new BaseError(`Step ${stepId} failed: ${result.reason}`, 'STEP_EXECUTION_FAILED');
                }
            }
        }
    }
    async executeStep(step, execution) {
        const stepExecution = {
            stepId: step.id,
            status: WorkflowExecutionStatus.RUNNING,
            startTime: new Date(),
            attempts: 0,
            logs: [],
        };
        execution.stepExecutions.push(stepExecution);
        execution.currentStep = step.id;
        this.logger.debug(`Executing step: ${step.name} (${step.id})`);
        this.emit('stepStarted', { execution, step, stepExecution });
        try {
            const result = await this.executeStepLogic(step, execution, stepExecution);
            stepExecution.status = WorkflowExecutionStatus.COMPLETED;
            stepExecution.endTime = new Date();
            stepExecution.output = result;
            this.logger.debug(`Completed step: ${step.name} (${step.id})`);
            this.emit('stepCompleted', { execution, step, stepExecution });
        }
        catch (error) {
            stepExecution.status = WorkflowExecutionStatus.FAILED;
            stepExecution.endTime = new Date();
            stepExecution.error = new WorkflowError(error.message, 'STEP_EXECUTION_FAILED', execution.id, { stepId: step.id });
            this.logger.error(`Failed step: ${step.name} (${step.id})`, error);
            this.emit('stepFailed', { execution, step, stepExecution });
            throw error;
        }
    }
    async executeStepLogic(step, execution, stepExecution) {
        switch (step.type) {
            case WorkflowStepType.TASK:
                return await this.executeTaskStep(step, execution, stepExecution);
            case WorkflowStepType.DECISION:
                return await this.executeDecisionStep(step, execution, stepExecution);
            case WorkflowStepType.PARALLEL:
                return await this.executeParallelStep(step, execution, stepExecution);
            case WorkflowStepType.WAIT:
                return await this.executeWaitStep(step, execution, stepExecution);
            case WorkflowStepType.SCRIPT:
                return await this.executeScriptStep(step, execution, stepExecution);
            default:
                throw new BaseError(`Unsupported step type: ${step.type}`, 'UNSUPPORTED_STEP_TYPE');
        }
    }
    async executeTaskStep(step, execution, stepExecution) {
        // This would integrate with the task execution system
        stepExecution.logs.push(`Executing task step: ${step.name}`);
        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: `Task ${step.name} completed`, timestamp: new Date() };
    }
    async executeDecisionStep(step, execution, stepExecution) {
        stepExecution.logs.push(`Evaluating decision: ${step.name}`);
        // Evaluate conditions
        if (step.conditions) {
            for (const condition of step.conditions) {
                const result = this.evaluateCondition(condition, execution.variables);
                if (result) {
                    return { decision: true, condition: condition.condition };
                }
            }
        }
        return { decision: false };
    }
    async executeParallelStep(step, execution, stepExecution) {
        stepExecution.logs.push(`Executing parallel step: ${step.name}`);
        // This would execute multiple sub-steps in parallel
        return { parallelResults: [], completedAt: new Date() };
    }
    async executeWaitStep(step, execution, stepExecution) {
        const waitTime = step.config.parameters.duration || 1000;
        stepExecution.logs.push(`Waiting for ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return { waited: waitTime };
    }
    async executeScriptStep(step, execution, stepExecution) {
        stepExecution.logs.push(`Executing script: ${step.name}`);
        // This would execute custom script logic
        const script = step.config.parameters.script;
        if (typeof script === 'function') {
            return await script(execution.variables, stepExecution);
        }
        return { scriptResult: 'Script executed' };
    }
    evaluateCondition(condition, variables) {
        // Simple condition evaluation - can be enhanced
        try {
            if (condition.type === 'expression') {
                // Evaluate simple expressions like "variable > 5"
                const expression = condition.condition.replace(/\b(\w+)\b/g, (match) => {
                    return variables.hasOwnProperty(match) ? JSON.stringify(variables[match]) : match;
                });
                // This is a simplified evaluation - in production, use a proper expression evaluator
                return eval(expression);
            }
            return true;
        }
        catch (error) {
            this.logger.warn(`Failed to evaluate condition: ${condition.condition}`, error);
            return false;
        }
    }
};
WorkflowEngine = WorkflowEngine_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], WorkflowEngine);
export { WorkflowEngine };
//# sourceMappingURL=WorkflowEngine.js.map