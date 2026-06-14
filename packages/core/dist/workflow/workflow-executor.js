var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowExecutor_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let WorkflowExecutor = WorkflowExecutor_1 = class WorkflowExecutor {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(WorkflowExecutor_1.name);
    }
    async execute(workflow) {
        const startTime = Date.now();
        const results = {};
        const errors = [];
        try {
            this.eventEmitter.emit('workflow.started', workflow);
            this.logger.log(`Executing workflow: ${workflow.name}`);
            for (const step of workflow.steps) {
                try {
                    this.eventEmitter.emit('workflow.step.started', { workflow, step });
                    const result = await this.executeStep(step, results);
                    results[step.id] = result;
                    this.eventEmitter.emit('workflow.step.completed', { workflow, step, result });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Step ${step.id} failed: ${errorMessage}`);
                    this.eventEmitter.emit('workflow.step.failed', { workflow, step, error });
                }
            }
            const duration = Date.now() - startTime;
            const executionResult = {
                workflowId: workflow.id,
                status: errors.length > 0 ? 'failure' : 'success',
                results,
                errors: errors.length > 0 ? errors : undefined,
                duration
            };
            this.eventEmitter.emit('workflow.completed', executionResult);
            return executionResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`Workflow execution failed: ${workflow.name}`, error);
            return {
                workflowId: workflow.id,
                status: 'failure',
                results,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                duration
            };
        }
    }
    async executeStep(step, context) {
        this.logger.debug(`Executing step: ${step.name}`);
        // Placeholder implementation
        return {
            stepId: step.id,
            completed: true,
            timestamp: new Date()
        };
    }
    async validateWorkflow(workflow) {
        const errors = [];
        if (!workflow.id) {
            errors.push('Workflow ID is required');
        }
        if (!workflow.steps || workflow.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        }
        // Check for circular dependencies
        const stepIds = new Set(workflow.steps.map(s => s.id));
        workflow.steps.forEach(step => {
            if (step.dependencies) {
                step.dependencies.forEach(dep => {
                    if (!stepIds.has(dep)) {
                        errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
                    }
                });
            }
        });
        return {
            valid: errors.length === 0,
            errors
        };
    }
};
WorkflowExecutor = WorkflowExecutor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], WorkflowExecutor);
export { WorkflowExecutor };
//# sourceMappingURL=workflow-executor.js.map