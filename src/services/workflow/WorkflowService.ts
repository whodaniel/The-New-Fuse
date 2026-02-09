import { Injectable } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service.js';
import { BaseService } from '../base.service.js';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Workflow, WorkflowStep, WorkflowStatus } from "@the-new-fuse/types";

@Injectable()
export class WorkflowService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super("WorkflowService");
    // Set up workflow execution engine
    this.initialize();
    // Initialize workflow execution components
    this.on("workflow:step_complete", this.handleStepCompletion.bind(this));
    this.on("workflow:error", this.handleWorkflowError.bind(this));
  }

  async createWorkflow(data: unknown, userId: string): Promise<Workflow> {
    const workflow = await this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          ...data,
          userId,
          status: WorkflowStatus.DRAFT,
        },
      });
      await this.validateWorkflowSteps(workflow.steps);
      return workflow;
    });
    return workflow;
  }

  async executeWorkflow(id: string, userId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
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

  private async executeStep(
    workflowId: string,
    step: WorkflowStep,
  ): Promise<void> {
    try {
      // Execute step logic with input/output handling
      const stepResult = await this.executeAgentAction(
        workflowId,
        step,
        { /* Add context/parameters here */ }
      );
      
      // Emit completion event with results
      this.emit("workflow:step_complete", {
        workflowId,
        stepId: step.id,
        result: {},
      });
    } catch (error) {
      this.emit("workflow:error", {
        workflowId,
        stepId: step.id,
        error,
      });
      throw error;
    }
  }

  private async handleStepCompletion(event: any): Promise<void> {
    const { workflowId, stepId } = event;
    await this.prisma.workflowStep.update({
      where: { id: stepId },
      data: { status: "completed", completedAt: new Date() },
    });
  }

  private async handleWorkflowError(
    workflowId: string,
    error: unknown,
  ): Promise<void> {
    await this.updateWorkflowStatus(workflowId, WorkflowStatus.ERROR);
    this.logger.error(`Workflow ${workflowId} failed:`, error);
  }

  private async updateWorkflowStatus(
    id: string,
    status: WorkflowStatus,
  ): Promise<void> {
    await this.prisma.workflow.update({
      where: { id },
      data: { status },
    });
    this.emit("workflow:status_changed", { workflowId: id, status });
  }

  private async validateWorkflowSteps(steps: WorkflowStep[]): Promise<void> {
    for (const step of steps) {
      // Validate agent exists and can perform the action
      const agent = await this.prisma.agent.findUnique({
        where: { id: step.agentId },
      });

      if (!agent) {
        throw new Error(`Invalid agent ID in workflow step: ${step.id}`);
      }

      if (!agent.capabilities.includes(step.action)) {
        throw new Error(
          `Agent ${agent.id} does not support action: ${step.action}`,
        );
      }
    }
  }

  private initialize(): void {
    // Initialize workflow execution engine with configuration
    this.logger.log("Initializing workflow execution engine with config:", {
      maxConcurrentWorkflows: this.config.maxConcurrent,
      retryPolicy: this.config.retrySettings
    });
    
    // Initialize monitoring metrics
    this.setupMonitoring();
  }
}
