// src/workflow/executor.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowDefinition, WorkflowInstance, WorkflowStatus, WorkflowStep, WorkflowContext, WorkflowOutput } from './workflow.types.js';

@Injectable()
export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);
  private readonly activeWorkflows = new Map<string, WorkflowInstance>();

  constructor(
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger.debug('WorkflowExecutor initialized');
  }

  async executeWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowInstance> {
    const instance: WorkflowInstance = {
      id: `workflow-instance-${Date.now()}`,
      workflowId: workflow.id,
      status: WorkflowStatus.RUNNING,
      startTime: new Date()
    };
    
    this.activeWorkflows.set(instance.id, instance);
    this.logger.debug(`Starting workflow execution for ${workflow.name}`, { instanceId: instance.id });

    try {
      const firstStep = workflow.steps[0];
      if (!firstStep) {
        throw new Error('Workflow has no steps');
      }

      instance.currentStep = firstStep.id;
      let currentStep = firstStep;
      let stepOutput = {};

      while (currentStep && instance.status === WorkflowStatus.RUNNING) {
        const stepInput = this.prepareStepInput(currentStep, stepOutput, instance);
        const output = await this.executeStep(currentStep, stepInput);
        stepOutput = output.result;

        if (currentStep.next) {
          const nextStep = workflow.steps.find(step => step.id === currentStep.next);
          if (nextStep) {
            instance.currentStep = nextStep.id;
            currentStep = nextStep;
          } else {
            currentStep = undefined;
          }
        } else {
          currentStep = undefined;
        }
      }

      if (instance.status === WorkflowStatus.RUNNING) {
        instance.status = WorkflowStatus.COMPLETED;
        instance.endTime = new Date();
      }
    } catch (error) {
      this.logger.error('Error executing workflow', error);
      throw error;
    } finally {
      this.activeWorkflows.delete(instance.id);
    }

    return instance;
  }

  private prepareStepInput(step: WorkflowStep, currentOutput: Record<string, unknown>, instance: WorkflowInstance): Record<string, unknown> {
    return {
      ...currentOutput,
      stepId: step.id,
      workflowInstanceId: instance.id
    };
  }

  private async executeStep(step: WorkflowStep, input: Record<string, unknown>): Promise<WorkflowOutput> {
    this.logger.debug(`Executing step: ${step.id}`, { type: step.type });
    
    return {
      stepId: step.id,
      result: { executed: true, ...input }
    };
  }

  private updateWorkflowInstance(instance: WorkflowInstance): void {
    this.activeWorkflows.set(instance.id, instance);
    this.eventEmitter.emit('workflow.instance.updated', instance);
  }
}
