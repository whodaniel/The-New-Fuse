import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowTemplate, WorkflowExecution, WorkflowStatus } from './types';
import { WorkflowExecutor } from './executor';
import { WorkflowValidator } from './validator';
import { WorkflowVersionManager } from './versioning';

export interface WorkflowEngineOptions {
  maxConcurrentExecutions?: number;
  defaultTimeout?: number;
  enableMonitoring?: boolean;
}

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);
  private readonly options: WorkflowEngineOptions;
  private activeExecutions = new Map<string, WorkflowExecution>();

  constructor(
    private readonly executor: WorkflowExecutor,
    private readonly validator: WorkflowValidator,
    private readonly versionManager: WorkflowVersionManager,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.options = {
      maxConcurrentExecutions: 10,
      defaultTimeout: 300000, // 5 minutes
      enableMonitoring: true,
      ...this.options,
    };
  }

  async createWorkflow(template: WorkflowTemplate): Promise<string> {
    this.logger.log(`Creating workflow: ${template.id}`);
    
    // Validate template
    const validation = this.validator.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid workflow template: ${validation.errors.join(', ')}`);
    }

    // Emit event for workflow creation
    this.eventEmitter.emit('workflow.created', {
      templateId: template.id,
      templateName: template.name,
      timestamp: new Date().toISOString(),
    });

    return template.id;
  }

  async startWorkflow(
    template: WorkflowTemplate,
    context: Record<string, any> = {},
    userId: string = 'system',
  ): Promise<WorkflowExecution> {
    this.logger.log(`Starting workflow: ${template.id}`);

    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions!) {
      throw new Error('Maximum concurrent executions reached');
    }

    try {
      // Check if template needs migration
      const currentVersion = template.version;
      const latestVersion = this.versionManager.getSupportedVersions().pop();
      
      if (latestVersion && currentVersion !== latestVersion) {
        this.logger.log(`Migrating workflow from ${currentVersion} to ${latestVersion}`);
        template = await this.versionManager.migrateWorkflow(template, latestVersion);
      }

      const execution = await this.executor.executeWorkflow(template, context, userId);
      
      this.activeExecutions.set(execution.id, execution);
      
      this.eventEmitter.emit('workflow.started', {
        executionId: execution.id,
        templateId: template.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      return execution;
    } catch (error) {
      this.logger.error(`Failed to start workflow: ${template.id}`, error);
      this.eventEmitter.emit('workflow.start.error', {
        templateId: template.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    this.logger.log(`Pausing workflow execution: ${executionId}`);
    
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.RUNNING) {
      throw new Error(`Cannot pause workflow in status: ${execution.status}`);
    }

    execution.status = WorkflowStatus.PAUSED;
    
    this.eventEmitter.emit('workflow.paused', {
      executionId,
      timestamp: new Date().toISOString(),
    });
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    this.logger.log(`Resuming workflow execution: ${executionId}`);
    
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow in status: ${execution.status}`);
    }

    execution.status = WorkflowStatus.RUNNING;
    
    this.eventEmitter.emit('workflow.resumed', {
      executionId,
      timestamp: new Date().toISOString(),
    });
  }

  async stopWorkflow(executionId: string): Promise<void> {
    this.logger.log(`Stopping workflow execution: ${executionId}`);
    
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status === WorkflowStatus.COMPLETED || 
        execution.status === WorkflowStatus.FAILED || 
        execution.status === WorkflowStatus.CANCELLED) {
      throw new Error(`Cannot stop workflow in status: ${execution.status}`);
    }

    execution.status = WorkflowStatus.STOPPED;
    execution.completedAt = new Date().toISOString();
    
    this.activeExecutions.delete(executionId);
    
    this.eventEmitter.emit('workflow.stopped', {
      executionId,
      timestamp: new Date().toISOString(),
    });
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    this.logger.log(`Cancelling workflow execution: ${executionId}`);
    
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = WorkflowStatus.CANCELLED;
    execution.completedAt = new Date().toISOString();
    
    this.activeExecutions.delete(executionId);
    
    this.eventEmitter.emit('workflow.cancelled', {
      executionId,
      timestamp: new Date().toISOString(),
    });
  }

  getWorkflowStatus(executionId: string): WorkflowExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecutionHistory(): WorkflowExecution[] {
    // In a real implementation, this would fetch from a database
    return Array.from(this.activeExecutions.values());
  }

  async validateTemplate(template: WorkflowTemplate): Promise<boolean> {
    const validation = this.validator.validateTemplate(template);
    return validation.valid;
  }

  async migrateTemplate(
    template: WorkflowTemplate,
    targetVersion: string,
  ): Promise<WorkflowTemplate> {
    return await this.versionManager.migrateWorkflow(template, targetVersion);
  }

  getSupportedVersions(): string[] {
    return this.versionManager.getSupportedVersions();
  }

  getEngineStats(): {
    activeExecutions: number;
    totalExecutions: number;
    supportedVersions: string[];
  } {
    return {
      activeExecutions: this.activeExecutions.size,
      totalExecutions: this.activeExecutions.size, // In real implementation, this would be from database
      supportedVersions: this.getSupportedVersions(),
    };
  }
}