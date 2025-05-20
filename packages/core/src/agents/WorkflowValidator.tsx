import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { AgentWorkflow, WorkflowTask, TaskType } from './types.js';

const logger: Logger = getLogger('workflow_validator');

export class WorkflowValidator {
    private readonly supportedTaskTypes: Set<TaskType>;
    
    constructor() {
        this.supportedTaskTypes = new Set([
            'data_processing',
            'ml_inference',
            'api_call',
            'notification',
            'validation',
            'transformation'
        ]);
    }

    async validateWorkflow(): Promise<void> {workflow: AgentWorkflow): Promise<void> {
        logger.debug('Validating workflow', { workflowId: workflow.id });

        this.validateBasicProperties(workflow);
        this.validateTasks(workflow.tasks);
        this.validateDependencies(workflow.tasks);
        this.validateConfiguration(workflow.configuration);
        
        logger.debug('Workflow validation completed successfully');
    }

    private validateBasicProperties(workflow: AgentWorkflow): void {
        if (!workflow.id || !workflow.name) {
            throw new Error('Workflow must have an ID and name');
        }

        if (!workflow.tasks || workflow.tasks.length === 0) {
            throw new Error('Workflow must contain at least one task');
        }

        if (!workflow.metadata || !workflow.metadata.version) {
            throw new Error('Workflow must have metadata with version');
        }
    }

    private validateTasks(tasks: WorkflowTask[]): void {
        const taskIds = new Set<string>();

        for (const task of tasks) {
            if (!task.id || !task.name || !task.type) {
                throw new Error(`Task ${task.id} missing required properties`);
            }

            if (!this.supportedTaskTypes.has(task.type)) {
                throw new Error(`Unsupported task type: ${task.type}`);
            }

            if (taskIds.has(task.id)) {
                throw new Error(`Duplicate task ID: ${task.id}`);
            }

            this.validateTaskConfiguration(task);
            taskIds.add(task.id);
        }
    }

    private validateTaskConfiguration(task: WorkflowTask): void {
        if (!task.configuration) {
            throw new Error(`Task ${task.id} missing configuration`);
        }

        if (!task.configuration.requirements?.capabilities) {
            throw new Error(`Task ${task.id} missing capability requirements`);
        }

        if (task.timeout && task.timeout <= 0) {
            throw new Error(`Task ${task.id} has invalid timeout`);
        }

        if (task.retryPolicy) {
            this.validateRetryPolicy(task);
        }
    }

    private validateDependencies(tasks: WorkflowTask[]): void {
        const taskIds = new Set(tasks.map(t => t.id));
        const visited = new Set<string>();
        const visiting = new Set<string>();

        for (const task of tasks) {
            if (task.dependencies) {
                for (const depId of task.dependencies) {
                    if (!taskIds.has(depId)) {
                        throw new Error(
                            `Task ${task.id} depends on non-existent task ${depId}`
                        );
                    }
                }

                this.detectCycles(task.id, tasks, visited, visiting);
            }
        }
    }

    private detectCycles(
        taskId: string,
        tasks: WorkflowTask[],
        visited: Set<string>,
        visiting: Set<string>
    ): void {
        if (visiting.has(taskId)) {
            throw new Error(`Circular dependency detected involving task ${taskId}`);
        }
        if (visited.has(taskId)) {
            return;
        }

        visiting.add(taskId);
        const task = tasks.find(t => t.id === taskId);
        
        if (task?.dependencies) {
            for (const depId of task.dependencies) {
                this.detectCycles(depId, tasks, visited, visiting);
            }
        }

        visiting.delete(taskId);
        visited.add(taskId);
    }

    private validateConfiguration(config: WorkflowConfiguration): void {
        if (config.maxConcurrentTasks <= 0) {
            throw new Error('maxConcurrentTasks must be greater than 0');
        }

        if (config.timeout <= 0) {
            throw new Error('timeout must be greater than 0');
        }

        if (config.retryPolicy) {
            this.validateRetryPolicy({ retryPolicy: config.retryPolicy } as WorkflowTask);
        }

        if (config.notificationConfig) {
            this.validateNotificationConfig(config.notificationConfig);
        }
    }

    private validateRetryPolicy(task: WorkflowTask): void {
        const policy = task.retryPolicy!;
        
        if (policy.maxAttempts <= 0) {
            throw new Error(`Task ${task.id} retry policy has invalid maxAttempts`);
        }

        if (policy.backoffMultiplier <= 1) {
            throw new Error(`Task ${task.id} retry policy has invalid backoffMultiplier`);
        }

        if (policy.initialDelay <= 0) {
            throw new Error(`Task ${task.id} retry policy has invalid initialDelay`);
        }

        if (policy.maxDelay <= policy.initialDelay) {
            throw new Error(`Task ${task.id} retry policy has invalid maxDelay`);
        }
    }

    private validateNotificationConfig(config: NotificationConfig): void {
        if (!config.endpoints || config.endpoints.length === 0) {
            throw new Error('Notification config must have at least one endpoint');
        }

        if (!config.events || config.events.length === 0) {
            throw new Error('Notification config must have at least one event');
        }

        for (const endpoint of config.endpoints) {
            try {
                new URL(endpoint);
            } catch {
                throw new Error(`Invalid notification endpoint URL: ${endpoint}`);
            }
        }
    }
}