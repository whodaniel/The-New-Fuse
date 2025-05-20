import { Injectable } from '@nestjs/common';
import {
  WorkflowStep,
  WorkflowStepType,
  Workflow,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowTemplate,
  WorkflowContext
} from '../types/workflow.js';
import { WorkflowError } from './types.js';
import { WorkflowResult } from '@the-new-fuse/types';
import { Logger } from '@the-new-fuse/utils';
import { WorkflowExecutor } from './executor.js';
import { WorkflowValidator } from './validator.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly executor: WorkflowExecutor,
    private readonly validator: WorkflowValidator,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async startWorkflow(template: WorkflowTemplate, input: Record<string, unknown>): Promise<WorkflowResult> {
    try {
      // Validate the workflow template
      await this.validator.validateTemplate(template);

      // Create workflow steps from tasks
      const steps: WorkflowStep[] = template.tasks.map((task) => ({
        id: task.id,
        type: WorkflowStepType.TASK,
        status: WorkflowStatus.PENDING,
        startTime: null,
        endTime: null,
        error: null,
        metadata: task.metadata
      }));

      const instance: WorkflowInstance = {
        id: `wf-${Date.now()}`,
        templateId: template.id,
        status: WorkflowStatus.STARTED,
        steps: template.steps.map(step => ({
          ...step,
          status: WorkflowStatus.PENDING,
          startTime: null,
          endTime: null,
          error: null
        })),
        input,
        output: {},
        startTime: new Date(),
        endTime: null,
        error: null,
        metadata: {},
        version: '1.0.0'
      };

      this.eventEmitter.emit('workflow.started', { instanceId: instance.id });

      const result = await this.executor.execute(instance);

      return {
        id: result.id,
        workflowId: result.id,
        status: result.status,
        output: result.output,
        error: null,
        metadata: result.metadata,
        data: result.output,
        timestamp: new Date()
      };
    } catch (error) {
      const workflowError = new WorkflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'WORKFLOW_START_ERROR',
        template.id,
        undefined,
        error instanceof Error ? {
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date()
        } : undefined
      );

      this.logger.error(`Failed to start workflow: ${workflowError.message}`, workflowError.details);
      throw workflowError;
    }
  }

  async pauseWorkflow(instanceId: string): Promise<WorkflowResult> {
    try {
      const instance = await this.executor.getWorkflow(instanceId);
      await this.executor.pauseWorkflow(instanceId);
      this.eventEmitter.emit('workflow.paused', { instanceId });

      return {
        id: instance.id,
        workflowId: instance.id,
        status: WorkflowStatus.PAUSED,
        output: instance.output,
        error: null,
        metadata: instance.metadata,
        data: {},
        timestamp: new Date()
      };
    } catch (error) {
      const workflowError = new WorkflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'WORKFLOW_PAUSE_ERROR',
        instanceId,
        undefined,
        error instanceof Error ? {
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        } : undefined
      );

      this.logger.error(`Failed to pause workflow: ${workflowError.message}`, workflowError.details);
      throw workflowError;
    }
  }

  async resumeWorkflow(instanceId: string): Promise<WorkflowResult> {
    try {
      const instance = await this.executor.getWorkflow(instanceId);
      await this.executor.resumeWorkflow(instanceId);
      this.eventEmitter.emit('workflow.resumed', { instanceId });

      return {
        id: instance.id,
        workflowId: instance.id,
        status: WorkflowStatus.RUNNING,
        output: instance.output,
        error: null,
        metadata: instance.metadata,
        data: {},
        timestamp: new Date()
      };
    } catch (error) {
      const workflowError = new WorkflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'WORKFLOW_RESUME_ERROR',
        instanceId,
        undefined,
        error instanceof Error ? {
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date()
        } : undefined
      );

      this.logger.error(`Failed to resume workflow: ${workflowError.message}`, workflowError.details);
      throw workflowError;
    }
  }

  async stopWorkflow(instanceId: string): Promise<WorkflowResult> {
    try {
      const instance = await this.executor.getWorkflow(instanceId);
      await this.executor.stopWorkflow(instanceId);
      this.eventEmitter.emit('workflow.stopped', { instanceId });

      return {
        id: instance.id,
        workflowId: instance.id,
        status: WorkflowStatus.STOPPED,
        output: instance.output,
        error: null,
        metadata: instance.metadata,
        data: {},
        timestamp: new Date()
      };
    } catch (error) {
      const workflowError = new WorkflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'WORKFLOW_STOP_ERROR',
        instanceId,
        undefined,
        error instanceof Error ? {
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        } : undefined
      );

      this.logger.error(`Failed to stop workflow: ${workflowError.message}`, workflowError.details);
      throw workflowError;
    }
  }

  async getWorkflowStatus(instanceId: string): Promise<WorkflowStatus> {
    try {
      return await this.executor.getWorkflowStatus(instanceId);
    } catch (error) {
      const workflowError = new WorkflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'WORKFLOW_STATUS_ERROR',
        instanceId,
        undefined,
        error instanceof Error ? {
          stack: error.stack,
          type: error.constructor.name,
          timestamp: new Date()
        } : undefined
      );

      this.logger.error(`Failed to get workflow status: ${workflowError.message}`, workflowError.details);
      throw workflowError;
    }
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    try {
      step.startTime = new Date();

      if (!step.action) {
        throw new Error(`No action defined for step ${step.id}`);
      }

      // Execute step action logic here

      step.status = WorkflowStatus.COMPLETED;
      step.endTime = new Date();
    } catch (error) {
      step.status = WorkflowStatus.FAILED;
      step.error = error instanceof Error ? error.message : 'Unknown error occurred';
      step.endTime = new Date();
      throw error;
    }
  }

  private hasParameters(step: WorkflowStep): boolean {
    return step.parameters !== undefined;
  }
}
