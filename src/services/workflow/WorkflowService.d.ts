import { BaseService } from '../core/BaseService.js';
import { AgentService } from '../agent/AgentService.js';
import { Workflow } from "@the-new-fuse/types";
export declare class WorkflowService extends BaseService {
  private readonly prisma;
  private readonly agentService;
  constructor(prisma: PrismaService, agentService: AgentService);
  protected doInitialize(): Promise<void>;
  private initializeExecutionEngine;
  createWorkflow(data: unknown, userId: string): Promise<Workflow>;
  executeWorkflow(id: string, userId: string): Promise<void>;
  private executeStep;
  private handleStepCompletion;
  private handleWorkflowError;
  private updateWorkflowStatus;
  private validateWorkflowSteps;
}
