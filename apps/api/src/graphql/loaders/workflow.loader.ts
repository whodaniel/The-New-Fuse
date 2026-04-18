/**
 * Workflow DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of workflows for GraphQL resolvers
 */
import { Injectable, Scope } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import type { Workflow } from '@the-new-fuse/database';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import DataLoader from 'dataloader';

// WorkflowStep type from the database types
type WorkflowStep = any; // Since WorkflowStep might not be directly exported

@Injectable({ scope: Scope.REQUEST })
export class WorkflowLoader {
  private readonly batchWorkflows: DataLoader<string, Workflow | null>;
  private readonly batchWorkflowsByUser: DataLoader<string, Workflow[]>;
  private readonly batchStepsByWorkflow: DataLoader<string, WorkflowStep[]>;

  constructor(private readonly db: DatabaseService) {
    this.batchWorkflows = new DataLoader<string, Workflow | null>(
      async (workflowIds: readonly string[]) => {
        // Load each workflow individually since there's no batch method
        const results = await Promise.all(
          workflowIds.map((id) => this.db.workflows.findWorkflowById(id))
        );
        return results;
      }
    );

    this.batchWorkflowsByUser = new DataLoader<string, Workflow[]>(
      async (userIds: readonly string[]) => {
        const workflowsByUser = new Map<string, Workflow[]>();

        for (const userId of userIds) {
          const workflows = await this.db.workflows.findWorkflowsByCreatorId(userId);
          workflowsByUser.set(userId, workflows);
        }

        return userIds.map((userId) => workflowsByUser.get(userId) || []);
      }
    );

    this.batchStepsByWorkflow = new DataLoader<string, WorkflowStep[]>(
      async (workflowIds: readonly string[]) => {
        const stepsByWorkflow = new Map<string, WorkflowStep[]>();

        for (const workflowId of workflowIds) {
          const steps = await this.db.workflows.findStepsByWorkflowId(workflowId);
          stepsByWorkflow.set(workflowId, steps);
        }

        return workflowIds.map((workflowId) => stepsByWorkflow.get(workflowId) || []);
      }
    );
  }

  async load(workflowId: string): Promise<Workflow | null> {
    return this.batchWorkflows.load(workflowId);
  }

  async loadMany(workflowIds: string[]): Promise<(Workflow | null)[]> {
    return this.batchWorkflows.loadMany(workflowIds) as Promise<(Workflow | null)[]>;
  }

  async loadByUserId(userId: string): Promise<Workflow[]> {
    return this.batchWorkflowsByUser.load(userId);
  }

  async loadStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]> {
    return this.batchStepsByWorkflow.load(workflowId);
  }
}
