import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Workflow, WorkflowStatus, WorkflowStep } from '@the-new-fuse/types';
import { DrizzleWorkflowRepository } from '../../../../packages/database/src/drizzle/repositories/index.js';
import { BaseService } from '../core/BaseService.js';

@Injectable()
export class WorkflowService extends BaseService {
  constructor(
    private readonly workflowRepository: DrizzleWorkflowRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService
  ) {
    super('WorkflowService');
    this.on('workflow:step_complete', this.handleStepCompletion.bind(this));
    this.on('workflow:error', this.handleWorkflowError.bind(this));
  }

  protected async doInitialize(): Promise<void> {
    // Initialize workflow execution engine with configuration
    this.logger.log('Initializing workflow execution engine with config:', {
      maxConcurrentWorkflows: this.configService.get('maxConcurrent') || 10,
      retryPolicy: this.configService.get('retrySettings') || {},
    });

    // Initialize monitoring metrics
    this.setupMonitoring();
  }

  async createWorkflow(data: unknown, userId: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.createWorkflow({
      ...(data as any),
      userId,
      status: WorkflowStatus.DRAFT as any,
    });
    return workflow;
  }

  async executeWorkflow(id: string, userId: string): Promise<void> {
    const workflow = await this.workflowRepository.findWorkflowWithSteps(id);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    try {
      await this.updateWorkflowStatus(id, WorkflowStatus.RUNNING);
      for (const step of workflow.steps) {
        await this.executeStep(workflow.id, step);
      }
      await this.updateWorkflowStatus(id, WorkflowStatus.COMPLETED);
    } catch (error) {
      await this.handleWorkflowError(workflow.id, error);
    }
  }

  private async executeStep(workflowId: string, step: WorkflowStep): Promise<void> {
    try {
      const stepResult = await this.executeAgentAction(workflowId, step, {
        /* Add context/parameters here */
      });

      this.emit('workflow:step_complete', {
        workflowId,
        stepId: step.id,
        result: {},
      });
    } catch (error) {
      this.emit('workflow:error', {
        workflowId,
        stepId: step.id,
        error,
      });
      throw error;
    }
  }

  private async handleStepCompletion(event: any): Promise<void> {
    const { workflowId, stepId } = event;
    // Note: Drizzle workflow step updates need to use the workflow repository
    // This is a placeholder for the step completion logic
  }

  private async handleWorkflowError(workflowId: string, error: unknown): Promise<void> {
    await this.updateWorkflowStatus(workflowId, WorkflowStatus.ERROR);
    this.logger.error(`Workflow ${workflowId} failed:`, error);
  }

  private async updateWorkflowStatus(id: string, status: WorkflowStatus): Promise<void> {
    await this.workflowRepository.updateWorkflow(id, { status: status as any });
    this.emit('workflow:status_changed', { workflowId: id, status });
  }

  private async validateWorkflowSteps(steps: WorkflowStep[]): Promise<void> {
    for (const step of steps) {
      const agent: any = { id: 'mock', capabilities: [step.action] }; // Mock agent lookup

      if (!agent) {
        throw new Error(`Invalid agent ID in workflow step: ${step.id}`);
      }

      if (!agent.capabilities.includes(step.action)) {
        throw new Error(`Agent ${agent.id} does not support action: ${step.action}`);
      }
    }
  }

  private async executeAgentAction(
    workflowId: string,
    step: WorkflowStep,
    context: any
  ): Promise<any> {
    this.logger.info(`Executing action ${step.action} for step ${step.id}`);
    return { success: true };
  }

  private setupMonitoring(): void {
    // Mock implementation
  }
}
