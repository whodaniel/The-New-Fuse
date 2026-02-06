import { Injectable, Logger } from '@nestjs/common';

export interface WorkflowTask {
  id: string;
  name: string;
  type:
    | 'data_processing'
    | 'ml_inference'
    | 'api_call'
    | 'notification'
    | 'validation'
    | 'transformation'
    | 'custom';
  dependencies?: string[];
  config: any;
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  delayMs: number;
  exponentialBackoff?: boolean;
  retryOnErrors?: string[];
}

export interface WorkflowMetadata {
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
  created: Date;
  lastModified: Date;
}

export interface WorkflowConfig {
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  retryPolicy?: RetryPolicy;
  notificationConfig?: NotificationConfig;
}

export interface NotificationConfig {
  enabled: boolean;
  endpoints: string[];
  events: ('started' | 'completed' | 'failed' | 'cancelled')[];
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description?: string;
  tasks: WorkflowTask[];
  metadata: WorkflowMetadata;
  config?: WorkflowConfig;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class WorkflowValidator {
  private readonly logger = new Logger(WorkflowValidator.name);

  validateWorkflow(workflow: AgentWorkflow): ValidationResult {
    this.logger.debug('Validating workflow', { workflowId: workflow.id });
    const errors: string[] = [];
    const warnings: string[] = [];

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
      } else {
        this.logger.warn('Workflow validation failed', {
          workflowId: workflow.id,
          errors: errors.length,
          warnings: warnings.length,
        });
      }

      return { isValid, errors, warnings };
    } catch (error) {
      const errorMessage = `Unexpected error during workflow validation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage, { workflowId: workflow.id });
      return {
        isValid: false,
        errors: [errorMessage],
        warnings,
      };
    }
  }

  private validateBasicStructure(workflow: AgentWorkflow, errors: string[]): void {
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

  private validateTasks(tasks: WorkflowTask[], errors: string[], warnings: string[]): void {
    if (!tasks || tasks.length === 0) {
      errors.push('Workflow must contain at least one task');
      return;
    }

    const taskIds = new Set<string>();
    const validTaskTypes = [
      'data_processing',
      'ml_inference',
      'api_call',
      'notification',
      'validation',
      'transformation',
      'custom',
    ];

    for (const task of tasks) {
      // Validate task ID uniqueness
      if (!task.id) {
        errors.push('Task ID is required');
        continue;
      }

      if (taskIds.has(task.id)) {
        errors.push(`Duplicate task ID: ${task.id}`);
      } else {
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

  private validateDependencies(tasks: WorkflowTask[], errors: string[]): void {
    const taskIds = new Set(tasks.map((t) => t.id));

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

  private detectCircularDependencies(tasks: WorkflowTask[], errors: string[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const hasCycle = (taskId: string): boolean => {
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

  private validateConfiguration(
    config: WorkflowConfig,
    errors: string[],
    warnings: string[],
  ): void {
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

  private validateRetryPolicy(
    retryPolicy: RetryPolicy,
    context: string,
    errors: string[],
    warnings: string[],
  ): void {
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

  private validateNotificationConfig(
    config: NotificationConfig,
    errors: string[],
    warnings: string[],
  ): void {
    if (typeof config.enabled !== 'boolean') {
      errors.push('notificationConfig.enabled must be a boolean');
    }

    if (!Array.isArray(config.endpoints)) {
      errors.push('notificationConfig.endpoints must be an array');
    } else if (config.enabled && config.endpoints.length === 0) {
      warnings.push('Notifications are enabled but no endpoints are configured');
    }

    if (!Array.isArray(config.events)) {
      errors.push('notificationConfig.events must be an array');
    } else {
      const validEvents = ['started', 'completed', 'failed', 'cancelled'];
      for (const event of config.events) {
        if (!validEvents.includes(event)) {
          errors.push(`Invalid notification event: ${event}`);
        }
      }
    }
  }

  private validateMetadata(metadata: WorkflowMetadata, errors: string[], warnings: string[]): void {
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
}
