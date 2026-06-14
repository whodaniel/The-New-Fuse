var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WorkflowValidator_1;
import { Injectable, Logger } from '@nestjs/common';
let WorkflowValidator = WorkflowValidator_1 = class WorkflowValidator {
    constructor() {
        this.logger = new Logger(WorkflowValidator_1.name);
    }
    validateWorkflow(workflow) {
        this.logger.debug('Validating workflow', { workflowId: workflow.id });
        const errors = [];
        const warnings = [];
        try {
            // Basic workflow validation
            this.validateBasicStructure(workflow, errors);
            // Task validation
            this.validateTasks(workflow.tasks, errors, warnings);
            // Dependencies validation
            this.validateDependencies(workflow.tasks, errors);
            // Configuration validation
            if (workflow.config) {
                this.validateConfiguration(workflow.config, errors, warnings);
            }
            // Metadata validation
            this.validateMetadata(workflow.metadata, errors, warnings);
            const isValid = errors.length === 0;
            if (isValid) {
                this.logger.debug('Workflow validation passed', { workflowId: workflow.id });
            }
            else {
                this.logger.warn('Workflow validation failed', {
                    workflowId: workflow.id,
                    errors: errors.length,
                    warnings: warnings.length
                });
            }
            return { isValid, errors, warnings };
        }
        catch (error) {
            const errorMessage = `Unexpected error during workflow validation: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.logger.error(errorMessage, { workflowId: workflow.id });
            return {
                isValid: false,
                errors: [errorMessage],
                warnings
            };
        }
    }
    validateBasicStructure(workflow, errors) {
        if (!workflow.id || typeof workflow.id !== 'string') {
            errors.push('Workflow ID is required and must be a string');
        }
        if (!workflow.name || typeof workflow.name !== 'string') {
            errors.push('Workflow name is required and must be a string');
        }
        if (!Array.isArray(workflow.tasks)) {
            errors.push('Workflow tasks must be an array');
        }
        if (!workflow.metadata) {
            errors.push('Workflow metadata is required');
        }
    }
    validateTasks(tasks, errors, warnings) {
        if (!tasks || tasks.length === 0) {
            errors.push('Workflow must contain at least one task');
            return;
        }
        const taskIds = new Set();
        const validTaskTypes = ['data_processing', 'ml_inference', 'api_call', 'notification', 'validation', 'transformation', 'custom'];
        for (const task of tasks) {
            // Validate task ID uniqueness
            if (!task.id) {
                errors.push('Task ID is required');
                continue;
            }
            if (taskIds.has(task.id)) {
                errors.push(`Duplicate task ID: ${task.id}`);
            }
            else {
                taskIds.add(task.id);
            }
            // Validate task name
            if (!task.name) {
                errors.push(`Task ${task.id} must have a name`);
            }
            // Validate task type
            if (!validTaskTypes.includes(task.type)) {
                errors.push(`Task ${task.id} has invalid type: ${task.type}`);
            }
            // Validate retry policy if present
            if (task.retryPolicy) {
                this.validateRetryPolicy(task.retryPolicy, task.id, errors, warnings);
            }
            // Validate timeout
            if (task.timeout !== undefined && (typeof task.timeout !== 'number' || task.timeout <= 0)) {
                errors.push(`Task ${task.id} timeout must be a positive number`);
            }
        }
    }
    validateDependencies(tasks, errors) {
        const taskIds = new Set(tasks.map(t => t.id));
        for (const task of tasks) {
            if (task.dependencies) {
                for (const depId of task.dependencies) {
                    if (!taskIds.has(depId)) {
                        errors.push(`Task ${task.id} depends on non-existent task: ${depId}`);
                    }
                }
            }
        }
        // Check for circular dependencies
        this.detectCircularDependencies(tasks, errors);
    }
    detectCircularDependencies(tasks, errors) {
        const visited = new Set();
        const recursionStack = new Set();
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        const hasCycle = (taskId) => {
            if (recursionStack.has(taskId)) {
                return true;
            }
            if (visited.has(taskId)) {
                return false;
            }
            visited.add(taskId);
            recursionStack.add(taskId);
            const task = taskMap.get(taskId);
            if (task?.dependencies) {
                for (const depId of task.dependencies) {
                    if (hasCycle(depId)) {
                        return true;
                    }
                }
            }
            recursionStack.delete(taskId);
            return false;
        };
        for (const task of tasks) {
            if (hasCycle(task.id)) {
                errors.push(`Circular dependency detected involving task: ${task.id}`);
                break; // One detection is enough
            }
        }
    }
    validateConfiguration(config, errors, warnings) {
        if (config.maxConcurrentTasks !== undefined) {
            if (typeof config.maxConcurrentTasks !== 'number' || config.maxConcurrentTasks <= 0) {
                errors.push('maxConcurrentTasks must be a positive number');
            }
        }
        if (config.defaultTimeout !== undefined) {
            if (typeof config.defaultTimeout !== 'number' || config.defaultTimeout <= 0) {
                errors.push('defaultTimeout must be a positive number');
            }
        }
        if (config.retryPolicy) {
            this.validateRetryPolicy(config.retryPolicy, 'workflow default', errors, warnings);
        }
        if (config.notificationConfig) {
            this.validateNotificationConfig(config.notificationConfig, errors, warnings);
        }
    }
    validateRetryPolicy(retryPolicy, context, errors, warnings) {
        if (typeof retryPolicy.maxRetries !== 'number' || retryPolicy.maxRetries < 0) {
            errors.push(`${context}: maxRetries must be a non-negative number`);
        }
        if (typeof retryPolicy.delayMs !== 'number' || retryPolicy.delayMs < 0) {
            errors.push(`${context}: delayMs must be a non-negative number`);
        }
        if (retryPolicy.maxRetries > 10) {
            warnings.push(`${context}: maxRetries > 10 may cause excessive resource usage`);
        }
    }
    validateNotificationConfig(config, errors, warnings) {
        if (typeof config.enabled !== 'boolean') {
            errors.push('notificationConfig.enabled must be a boolean');
        }
        if (!Array.isArray(config.endpoints)) {
            errors.push('notificationConfig.endpoints must be an array');
        }
        else if (config.enabled && config.endpoints.length === 0) {
            warnings.push('Notifications are enabled but no endpoints are configured');
        }
        if (!Array.isArray(config.events)) {
            errors.push('notificationConfig.events must be an array');
        }
        else {
            const validEvents = ['started', 'completed', 'failed', 'cancelled'];
            for (const event of config.events) {
                if (!validEvents.includes(event)) {
                    errors.push(`Invalid notification event: ${event}`);
                }
            }
        }
    }
    validateMetadata(metadata, errors, warnings) {
        if (!metadata.version || typeof metadata.version !== 'string') {
            errors.push('Metadata version is required and must be a string');
        }
        if (metadata.created && !(metadata.created instanceof Date)) {
            errors.push('Metadata created must be a Date object');
        }
        if (metadata.lastModified && !(metadata.lastModified instanceof Date)) {
            errors.push('Metadata lastModified must be a Date object');
        }
        if (metadata.tags && !Array.isArray(metadata.tags)) {
            errors.push('Metadata tags must be an array');
        }
    }
};
WorkflowValidator = WorkflowValidator_1 = __decorate([
    Injectable()
], WorkflowValidator);
export { WorkflowValidator };
//# sourceMappingURL=WorkflowValidator.js.map