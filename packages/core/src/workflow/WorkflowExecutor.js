/**
 * @fileoverview Workflow executor that handles individual workflow step execution
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
var WorkflowExecutor_1;
import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStepType } from '../types/workflow';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';
let WorkflowExecutor = WorkflowExecutor_1 = class WorkflowExecutor {
    logger = new Logger(WorkflowExecutor_1.name);
    state = ServiceState.UNINITIALIZED;
    stepExecutors = new Map();
    constructor() {
        this.initializeDefaultExecutors();
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            this.logger.warn('WorkflowExecutor is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            this.logger.log('Starting WorkflowExecutor');
            this.state = ServiceState.RUNNING;
            this.logger.log('WorkflowExecutor started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to start WorkflowExecutor', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            this.logger.warn('WorkflowExecutor is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            this.logger.log('Stopping WorkflowExecutor');
            this.state = ServiceState.STOPPED;
            this.logger.log('WorkflowExecutor stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to stop WorkflowExecutor', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    async executeStep(step, context) {
        const executor = this.stepExecutors.get(step.type);
        if (!executor) {
            throw new BaseError(`No executor found for step type: ${step.type}`, 'EXECUTOR_NOT_FOUND');
        }
        if (!executor.canExecute(step)) {
            throw new BaseError(`Executor cannot handle step: ${step.id}`, 'EXECUTOR_CANNOT_HANDLE_STEP');
        }
        this.logger.debug(`Executing step: ${step.name} (${step.type})`);
        try {
            const result = await executor.execute(step, context);
            this.logger.debug(`Step execution completed: ${step.name}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Step execution failed: ${step.name}`, error);
            throw error;
        }
    }
    registerStepExecutor(stepType, executor) {
        this.stepExecutors.set(stepType, executor);
        this.logger.log(`Registered step executor for type: ${stepType}`);
    }
    unregisterStepExecutor(stepType) {
        const removed = this.stepExecutors.delete(stepType);
        if (removed) {
            this.logger.log(`Unregistered step executor for type: ${stepType}`);
        }
        return removed;
    }
    initializeDefaultExecutors() {
        // Task Step Executor
        this.registerStepExecutor(WorkflowStepType.TASK, new TaskStepExecutor());
        // Decision Step Executor
        this.registerStepExecutor(WorkflowStepType.DECISION, new DecisionStepExecutor());
        // Wait Step Executor
        this.registerStepExecutor(WorkflowStepType.WAIT, new WaitStepExecutor());
        // Script Step Executor
        this.registerStepExecutor(WorkflowStepType.SCRIPT, new ScriptStepExecutor());
        // Parallel Step Executor
        this.registerStepExecutor(WorkflowStepType.PARALLEL, new ParallelStepExecutor());
        this.logger.log('Initialized default step executors');
    }
};
WorkflowExecutor = WorkflowExecutor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], WorkflowExecutor);
export { WorkflowExecutor };
// Default Step Executors
class TaskStepExecutor {
    logger = new Logger(TaskStepExecutor.name);
    canExecute(step) {
        return step.type === WorkflowStepType.TASK;
    }
    async execute(step, context) {
        const { config } = step;
        const { variables } = context;
        // Apply input mapping
        const taskInput = this.applyInputMapping(config.inputMapping, variables);
        // Execute the task (this would integrate with actual task execution system)
        const taskResult = await this.executeTask(config, taskInput, context);
        // Apply output mapping
        const mappedOutput = this.applyOutputMapping(config.outputMapping, taskResult);
        // Update execution variables
        Object.assign(context.variables, mappedOutput);
        return taskResult;
    }
    applyInputMapping(mapping, variables) {
        if (!mapping)
            return variables;
        const mapped = {};
        for (const [targetKey, sourceKey] of Object.entries(mapping)) {
            if (variables.hasOwnProperty(sourceKey)) {
                mapped[targetKey] = variables[sourceKey];
            }
        }
        return mapped;
    }
    applyOutputMapping(mapping, result) {
        if (!mapping)
            return result;
        const mapped = {};
        for (const [targetKey, sourceKey] of Object.entries(mapping)) {
            if (result && result.hasOwnProperty(sourceKey)) {
                mapped[targetKey] = result[sourceKey];
            }
        }
        return mapped;
    }
    async executeTask(config, input, context) {
        // This would integrate with the actual task execution system
        // For now, simulate task execution
        context.stepExecution.logs.push(`Executing task with parameters: ${JSON.stringify(config.parameters)}`);
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        return {
            success: true,
            result: `Task completed with input: ${JSON.stringify(input)}`,
            timestamp: new Date(),
            ...config.parameters,
        };
    }
}
class DecisionStepExecutor {
    logger = new Logger(DecisionStepExecutor.name);
    canExecute(step) {
        return step.type === WorkflowStepType.DECISION;
    }
    async execute(step, context) {
        const { conditions } = step;
        const { variables } = context;
        if (!conditions || conditions.length === 0) {
            return { decision: true, reason: 'No conditions specified' };
        }
        for (const condition of conditions) {
            const result = this.evaluateCondition(condition, variables);
            context.stepExecution.logs.push(`Condition "${condition.condition}" evaluated to: ${result}`);
            if (result) {
                return {
                    decision: true,
                    condition: condition.condition,
                    matchedCondition: condition
                };
            }
        }
        return {
            decision: false,
            reason: 'No conditions matched',
            evaluatedConditions: conditions.length
        };
    }
    evaluateCondition(condition, variables) {
        try {
            switch (condition.type) {
                case 'expression':
                    return this.evaluateExpression(condition.condition, variables);
                case 'script':
                    return this.evaluateScript(condition.condition, variables);
                case 'value':
                    return this.evaluateValue(condition, variables);
                default:
                    this.logger.warn(`Unknown condition type: ${condition.type}`);
                    return false;
            }
        }
        catch (error) {
            this.logger.error(`Failed to evaluate condition: ${condition.condition}`, error);
            return false;
        }
    }
    evaluateExpression(expression, variables) {
        // Simple expression evaluation - replace variables and evaluate
        let evaluableExpression = expression;
        // Replace variable references
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
        }
        // This is simplified - in production, use a proper expression evaluator
        try {
            return Boolean(eval(evaluableExpression));
        }
        catch (error) {
            this.logger.warn(`Failed to evaluate expression: ${evaluableExpression}`, error);
            return false;
        }
    }
    evaluateScript(script, variables) {
        // Execute custom script logic
        try {
            const func = new Function('variables', script);
            return Boolean(func(variables));
        }
        catch (error) {
            this.logger.warn(`Failed to evaluate script: ${script}`, error);
            return false;
        }
    }
    evaluateValue(condition, variables) {
        const { operator, value } = condition;
        const variableValue = variables[condition.variable];
        switch (operator) {
            case 'equals':
                return variableValue === value;
            case 'not_equals':
                return variableValue !== value;
            case 'greater':
                return variableValue > value;
            case 'less':
                return variableValue < value;
            case 'contains':
                return String(variableValue).includes(String(value));
            default:
                return false;
        }
    }
}
class WaitStepExecutor {
    canExecute(step) {
        return step.type === WorkflowStepType.WAIT;
    }
    async execute(step, context) {
        const duration = step.config.parameters.duration || 1000;
        const reason = step.config.parameters.reason || 'Workflow wait step';
        context.stepExecution.logs.push(`Waiting for ${duration}ms - ${reason}`);
        await new Promise(resolve => setTimeout(resolve, duration));
        return {
            waited: duration,
            reason,
            completedAt: new Date(),
        };
    }
}
class ScriptStepExecutor {
    logger = new Logger(ScriptStepExecutor.name);
    canExecute(step) {
        return step.type === WorkflowStepType.SCRIPT;
    }
    async execute(step, context) {
        const { script, language = 'javascript' } = step.config.parameters;
        if (!script) {
            throw new BaseError('No script provided for script step', 'MISSING_SCRIPT');
        }
        context.stepExecution.logs.push(`Executing ${language} script`);
        try {
            switch (language.toLowerCase()) {
                case 'javascript':
                case 'js':
                    return await this.executeJavaScript(script, context);
                default:
                    throw new BaseError(`Unsupported script language: ${language}`, 'UNSUPPORTED_SCRIPT_LANGUAGE');
            }
        }
        catch (error) {
            context.stepExecution.logs.push(`Script execution failed: ${error.message}`);
            throw error;
        }
    }
    async executeJavaScript(script, context) {
        try {
            // Create a safe execution context
            const func = new Function('context', 'variables', 'console', script);
            // Provide limited console for logging
            const safeConsole = {
                log: (...args) => {
                    context.stepExecution.logs.push(`Script: ${args.join(' ')}`);
                },
                error: (...args) => {
                    context.stepExecution.logs.push(`Script Error: ${args.join(' ')}`);
                },
            };
            const result = await func(context, context.variables, safeConsole);
            return {
                scriptResult: result,
                executedAt: new Date(),
                language: 'javascript',
            };
        }
        catch (error) {
            this.logger.error('JavaScript execution failed', error);
            throw new BaseError(`Script execution failed: ${error.message}`, 'SCRIPT_EXECUTION_FAILED');
        }
    }
}
class ParallelStepExecutor {
    logger = new Logger(ParallelStepExecutor.name);
    canExecute(step) {
        return step.type === WorkflowStepType.PARALLEL;
    }
    async execute(step, context) {
        const { parallelSteps = [] } = step.config.parameters;
        if (parallelSteps.length === 0) {
            return { parallelResults: [], message: 'No parallel steps to execute' };
        }
        context.stepExecution.logs.push(`Executing ${parallelSteps.length} parallel steps`);
        // Execute all parallel steps concurrently
        const promises = parallelSteps.map((parallelStep, index) => this.executeParallelStep(parallelStep, context, index));
        const results = await Promise.allSettled(promises);
        // Process results
        const parallelResults = results.map((result, index) => ({
            stepIndex: index,
            status: result.status,
            result: result.status === 'fulfilled' ? result.value : undefined,
            error: result.status === 'rejected' ? result.reason : undefined,
        }));
        const successCount = parallelResults.filter(r => r.status === 'fulfilled').length;
        const failureCount = parallelResults.length - successCount;
        context.stepExecution.logs.push(`Parallel execution completed: ${successCount} succeeded, ${failureCount} failed`);
        return {
            parallelResults,
            summary: {
                total: parallelResults.length,
                succeeded: successCount,
                failed: failureCount,
            },
            completedAt: new Date(),
        };
    }
    async executeParallelStep(parallelStep, context, index) {
        // This would execute a sub-step in parallel
        // For now, simulate parallel work
        const duration = Math.random() * 2000; // Random duration up to 2 seconds
        await new Promise(resolve => setTimeout(resolve, duration));
        return {
            stepIndex: index,
            stepName: parallelStep.name || `Parallel Step ${index}`,
            duration,
            result: `Parallel step ${index} completed`,
            completedAt: new Date(),
        };
    }
}
//# sourceMappingURL=WorkflowExecutor.js.map