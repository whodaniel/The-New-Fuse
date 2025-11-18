import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { WorkflowStep } from '../../entities/workflow-step.entity';
import { Workflow } from '../../entities/workflow.entity';

@Injectable({ scope: Scope.REQUEST })
export class WorkflowLoader {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepRepository: Repository<WorkflowStep>
  ) {}

  private readonly batchWorkflows = new DataLoader<string, Workflow>(
    async (workflowIds: readonly string[]) => {
      const workflows = await this.workflowRepository.find({
        where: { id: In([...workflowIds]) },
      });

      const workflowMap = new Map(workflows.map((workflow) => [workflow.id, workflow]));
      return workflowIds.map((id) => workflowMap.get(id) || null) as Workflow[];
    }
  );

  private readonly batchWorkflowsByUser = new DataLoader<string, Workflow[]>(
    async (userIds: readonly string[]) => {
      const workflows = await this.workflowRepository.find({
        where: { creator: { id: In([...userIds]) } },
        relations: ['creator'],
      });

      const workflowsByUser = new Map<string, Workflow[]>();
      workflows.forEach((workflow) => {
        const userId = workflow.creator?.id;
        if (userId) {
          if (!workflowsByUser.has(userId)) {
            workflowsByUser.set(userId, []);
          }
          workflowsByUser.get(userId)!.push(workflow);
        }
      });

      return userIds.map((userId) => workflowsByUser.get(userId) || []);
    }
  );

  private readonly batchStepsByWorkflow = new DataLoader<string, WorkflowStep[]>(
    async (workflowIds: readonly string[]) => {
      const steps = await this.workflowStepRepository.find({
        where: { workflow: { id: In([...workflowIds]) } },
        relations: ['workflow', 'agent'],
      });

      const stepsByWorkflow = new Map<string, WorkflowStep[]>();
      steps.forEach((step) => {
        const workflowId = step.workflow?.id;
        if (workflowId) {
          if (!stepsByWorkflow.has(workflowId)) {
            stepsByWorkflow.set(workflowId, []);
          }
          stepsByWorkflow.get(workflowId)!.push(step);
        }
      });

      return workflowIds.map((workflowId) => stepsByWorkflow.get(workflowId) || []);
    }
  );

  async load(workflowId: string): Promise<Workflow> {
    return this.batchWorkflows.load(workflowId);
  }

  async loadMany(workflowIds: string[]): Promise<Workflow[]> {
    return this.batchWorkflows.loadMany(workflowIds) as Promise<Workflow[]>;
  }

  async loadByUserId(userId: string): Promise<Workflow[]> {
    return this.batchWorkflowsByUser.load(userId);
  }

  async loadStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]> {
    return this.batchStepsByWorkflow.load(workflowId);
  }
}
