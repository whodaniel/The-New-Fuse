import { Injectable, Logger } from '@nestjs/common';

export interface WorkflowTask {
  id: string;
  name: string;
  type: 'data_processing' | 'ml_inference' | 'api_call' | 'notification' | 'validation' | 'transformation' | 'custom';
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
        this.logger.debug('Workflow validation completed successfully', { 
          workflowId: workflow.id,
          warningCount: warnings.length 
        });
      } else {
        this.logger.warn('Workflow validation failed', { 
          workflowId: workflow.id,
          errorCount: errors.length,
          warningCount: warnings.length 
        });
      }

      return { isValid, errors, warnings };
      
    } catch (error) {
      const errorMessage = `Unexpected error during workflow validation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage, { workflowId: workflow.id });
      return {
        isValid: false,
        errors: [errorMessage],
        warnings
      };
    }
  }

  private validateBasicStructure(workflow: AgentWorkflow, errors: string[]): void {
    if (!workflow.id || !workflow.name) {
      errors.push('Workflow must have an ID and name');
    }

    if (!workflow.tasks || workflow.tasks.length === 0) {
      errors.push('Workflow must contain at least one task');
    }

    if (!workflow.metadata) {
      errors.push('Workflow must have metadata');
    }
  }

  private validateTasks(tasks: WorkflowTask[], errors: string[], warnings: string[]): void {
    const taskIds = new Set<string>();

    for (const task of tasks) {
      // Check for required fields
      if (!task.id || !task.name || !task.type) {
        errors.push(`Task ${task.id || 'UNKNOWN'} must have id, name, and type`);
        continue;
      }

      // Check for duplicate task IDs
      if (taskIds.has(task.id)) {
        errors.push(`Duplicate task ID found: ${task.id}`);
      } else {
        taskIds.add(task.id);
      }

      // Validate task type
      const validTypes = ['data_processing', 'ml_inference', 'api_call', 'notification', 'validation', 'transformation', 'custom'];
      if (!validTypes.includes(task.type)) {
        errors.push(`Invalid task type '${task.type}' for task ${task.id}`);
      }

      // Validate retry policy if present
      if (task.retryPolicy) {
        this.validateRetryPolicy(task, errors);
      }

      // Validate timeout
      if (task.timeout !== undefined && task.timeout <= 0) {
        errors.push(`Task ${task.id} timeout must be greater than 0`);
      }

      // Check for missing config
      if (!task.config) {
        warnings.push(`Task ${task.id} has no configuration`);
      }
    }
  }

  private validateDependencies(tasks: WorkflowTask[], errors: string[]): void {
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
    if (this.hasCircularDependencies(tasks)) {
      errors.push('Circular dependencies detected in workflow');
    }
  }

  private validateConfiguration(config: WorkflowConfig, errors: string[], warnings: string[]): void {
    if (config.maxConcurrentTasks !== undefined && config.maxConcurrentTasks <= 0) {
      errors.push('maxConcurrentTasks must be greater than 0');
    }

    if (config.defaultTimeout !== undefined && config.defaultTimeout <= 0) {
      errors.push('defaultTimeout must be greater than 0');
    }

    if (config.retryPolicy) {
      this.validateRetryPolicy({ retryPolicy: config.retryPolicy } as WorkflowTask, errors);
    }

    if (config.notificationConfig) {
      this.validateNotificationConfig(config.notificationConfig, errors, warnings);
    }
  }

  private validateMetadata(metadata: WorkflowMetadata, errors: string[], warnings: string[]): void {
    if (!metadata.version) {
      errors.push('Workflow metadata must have a version');
    }

    if (!metadata.created) {
      warnings.push('Workflow metadata should have a created date');
    }

    if (!metadata.lastModified) {
      warnings.push('Workflow metadata should have a lastModified date');
    }
  }

  private validateRetryPolicy(task: WorkflowTask, errors: string[]): void {
    const retryPolicy = task.retryPolicy!;
    
    if (retryPolicy.maxRetries < 0) {
      errors.push(`Task ${task.id} retry policy maxRetries must be >= 0`);
    }

    if (retryPolicy.delayMs <= 0) {
      errors.push(`Task ${task.id} retry policy delayMs must be > 0`);
    }
  }

  private validateNotificationConfig(config: NotificationConfig, errors: string[], warnings: string[]): void {
    if (config.enabled && (!config.endpoints || config.endpoints.length === 0)) {
      errors.push('Notification config must have at least one endpoint when enabled');
    }

    if (!config.events || config.events.length === 0) {
      warnings.push('Notification config should specify which events to notify on');
    }

    const validEvents = ['started', 'completed', 'failed', 'cancelled'];
    if (config.events) {
      for (const event of config.events) {
        if (!validEvents.includes(event)) {
          errors.push(`Invalid notification event: ${event}`);
        }
      }
    }
  }

  private hasCircularDependencies(tasks: WorkflowTask[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const task of tasks) {
      if (this.hasCycleDFS(task.id, tasks, visited, recursionStack)) {
        return true;
      }
    }
    
    return false;
  }

  private hasCycleDFS(
    taskId: string, 
    tasks: WorkflowTask[], 
    visited: Set<string>, 
    recursionStack: Set<string>
  ): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.dependencies) {
      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (this.hasCycleDFS(depId, tasks, visited, recursionStack)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  }

  validateTaskExecution(task: WorkflowTask, context: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate task is ready for execution
    if (!task.config) {
      errors.push(`Task ${task.id} has no configuration for execution`);
    }

    // Validate context if required
    if (task.type === 'data_processing' && !context.data) {
      errors.push(`Task ${task.id} requires data in context for processing`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}