var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentWorkflowService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
let AgentWorkflowService = AgentWorkflowService_1 = class AgentWorkflowService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(AgentWorkflowService_1.name);
        this.workflows = new Map();
        this.executions = new Map();
        this.logger.log('AgentWorkflowService initialized');
        this.setupWorkflowEventListeners();
    }
    setupWorkflowEventListeners() {
        this.eventEmitter.on('workflow.started', (data) => {
            this.logger.log(`Workflow started: ${data.workflowId}`);
        });
        this.eventEmitter.on('workflow.completed', (data) => {
            this.logger.log(`Workflow completed: ${data.workflowId}`);
        });
        this.eventEmitter.on('workflow.failed', (data) => {
            this.logger.error(`Workflow failed: ${data.workflowId} - ${data.error}`);
        });
        this.eventEmitter.on('workflow.cancelled', (data) => {
            this.logger.log(`Workflow cancelled: ${data.workflowId}`);
        });
    }
    async createWorkflow(definition) {
        const workflow = {
            id: uuidv4(),
            ...definition
        };
        this.workflows.set(workflow.id, workflow);
        this.logger.log(`Created workflow: ${workflow.id} - ${workflow.name}`);
        return workflow;
    }
    async executeWorkflow(workflowId, variables) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        const execution = {
            id: uuidv4(),
            workflowId,
            status: 'running',
            startTime: new Date(),
            results: {},
            currentStep: workflow.steps[0]?.id
        };
        this.executions.set(execution.id, execution);
        try {
            this.eventEmitter.emit('workflow.started', { workflowId, executionId: execution.id });
            // Execute workflow steps
            await this.executeSteps(workflow, execution, variables || {});
            execution.status = 'completed';
            execution.endTime = new Date();
            this.eventEmitter.emit('workflow.completed', { workflowId, executionId: execution.id });
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            this.eventEmitter.emit('workflow.failed', {
                workflowId,
                executionId: execution.id,
                error: execution.error
            });
            throw error;
        }
        return execution;
    }
    async executeSteps(workflow, execution, variables) {
        for (const step of workflow.steps) {
            // Check if step dependencies are satisfied
            if (step.dependencies) {
                const unsatisfiedDeps = step.dependencies.filter(depId => !execution.results[depId]);
                if (unsatisfiedDeps.length > 0) {
                    throw new Error(`Unsatisfied dependencies for step ${step.id}: ${unsatisfiedDeps.join(', ')}`);
                }
            }
            execution.currentStep = step.id;
            this.logger.debug(`Executing step: ${step.id} - ${step.name}`);
            try {
                const stepResult = await this.executeStep(step, execution.results, variables);
                execution.results[step.id] = stepResult;
                this.eventEmitter.emit('workflow.step.completed', {
                    workflowId: workflow.id,
                    executionId: execution.id,
                    stepId: step.id,
                    result: stepResult
                });
            }
            catch (error) {
                this.logger.error(`Step execution failed: ${step.id}`, error);
                throw new Error(`Step ${step.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    async executeStep(step, previousResults, variables) {
        const context = {
            step,
            previousResults,
            variables
        };
        switch (step.type) {
            case 'task':
                return await this.executeTaskStep(context);
            case 'decision':
                return await this.executeDecisionStep(context);
            case 'parallel':
                return await this.executeParallelStep(context);
            case 'sequential':
                return await this.executeSequentialStep(context);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    async executeTaskStep(context) {
        // Implementation for task execution
        this.logger.debug(`Executing task step: ${context.step.id}`);
        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            stepId: context.step.id,
            status: 'completed',
            timestamp: new Date(),
            output: context.step.config
        };
    }
    async executeDecisionStep(context) {
        // Implementation for decision logic
        this.logger.debug(`Executing decision step: ${context.step.id}`);
        const condition = context.step.config.condition || true;
        return {
            stepId: context.step.id,
            decision: condition,
            timestamp: new Date()
        };
    }
    async executeParallelStep(context) {
        // Implementation for parallel execution
        this.logger.debug(`Executing parallel step: ${context.step.id}`);
        const tasks = context.step.config.tasks || [];
        const results = await Promise.all(tasks.map((task) => this.executeTaskStep({ ...context, step: { ...context.step, config: task } })));
        return {
            stepId: context.step.id,
            results,
            timestamp: new Date()
        };
    }
    async executeSequentialStep(context) {
        // Implementation for sequential execution
        this.logger.debug(`Executing sequential step: ${context.step.id}`);
        const tasks = context.step.config.tasks || [];
        const results = [];
        for (const task of tasks) {
            const result = await this.executeTaskStep({ ...context, step: { ...context.step, config: task } });
            results.push(result);
        }
        return {
            stepId: context.step.id,
            results,
            timestamp: new Date()
        };
    }
    async pauseWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution not found: ${executionId}`);
        }
        execution.status = 'pending'; // Paused state
        this.logger.log(`Workflow paused: ${execution.workflowId}`);
        this.eventEmitter.emit('workflow.paused', {
            workflowId: execution.workflowId,
            executionId
        });
    }
    async cancelWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution not found: ${executionId}`);
        }
        execution.status = 'cancelled';
        execution.endTime = new Date();
        this.eventEmitter.emit('workflow.cancelled', {
            workflowId: execution.workflowId,
            executionId
        });
        this.logger.log(`Workflow cancelled: ${execution.workflowId}`);
    }
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
    getAllWorkflows() {
        return Array.from(this.workflows.values());
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
    getExecutionsForWorkflow(workflowId) {
        return Array.from(this.executions.values()).filter(execution => execution.workflowId === workflowId);
    }
    async deleteWorkflow(workflowId) {
        const deleted = this.workflows.delete(workflowId);
        if (deleted) {
            this.logger.log(`Deleted workflow: ${workflowId}`);
        }
        return deleted;
    }
    async deleteExecution(executionId) {
        const deleted = this.executions.delete(executionId);
        if (deleted) {
            this.logger.log(`Deleted execution: ${executionId}`);
        }
        return deleted;
    }
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows.get(workflowId);
        const executions = this.getExecutionsForWorkflow(workflowId);
        const activeExecutions = executions.filter(e => e.status === 'running' || e.status === 'pending').length;
        return {
            workflow,
            executions,
            activeExecutions
        };
    }
};
AgentWorkflowService = AgentWorkflowService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], AgentWorkflowService);
export { AgentWorkflowService };
//# sourceMappingURL=agent-workflow.service.js.map