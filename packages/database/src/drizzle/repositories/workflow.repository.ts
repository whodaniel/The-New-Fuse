/**
 * Workflow Repository - Drizzle ORM Implementation
 * Provides data access for Workflow entities and executions
 */
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { workflowExecutions, workflows, workflowSteps, workflowTemplates } from '../schema/index.js';
import type {
  NewWorkflow,
  NewWorkflowExecution,
  NewWorkflowStep,
  NewWorkflowTemplate,
  Workflow,
  WorkflowExecution,
  WorkflowStep,
  WorkflowTemplate,
} from '../types.js';

/**
 * Workflow Repository - provides data access for Workflow entities
 */
export class DrizzleWorkflowRepository {
  /**
   * Create a new workflow
   */
  async createWorkflow(data: NewWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(data).returning();
    return workflow;
  }

  /**
   * Find workflow by ID
   */
  async findWorkflowById(id: string): Promise<Workflow | null> {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)));

    return workflow ?? null;
  }

  /**
   * Find workflow with steps
   */
  async findWorkflowWithSteps(id: string): Promise<(Workflow & { steps: WorkflowStep[] }) | null> {
    const workflow = await this.findWorkflowById(id);
    if (!workflow) return null;

    const steps = await db
      .select()
      .from(workflowSteps)
      .where(and(eq(workflowSteps.workflowId, id), eq(workflowSteps.isActive, true)))
      .orderBy(workflowSteps.order);

    return {
      ...workflow,
      steps,
    };
  }

  /**
   * Find workflows by creator ID
   */
  async findWorkflowsByCreatorId(creatorId: string): Promise<Workflow[]> {
    return db
      .select()
      .from(workflows)
      .where(and(eq(workflows.creatorId, creatorId), isNull(workflows.deletedAt)))
      .orderBy(desc(workflows.updatedAt));
  }

  /**
   * Find active workflows
   */
  /**
   * Find active workflows for a creator
   */
  async findActiveWorkflows(creatorId: string): Promise<Workflow[]> {
    return db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.isActive, true),
          eq(workflows.creatorId, creatorId),
          isNull(workflows.deletedAt)
        )
      )
      .orderBy(desc(workflows.updatedAt));
  }

  /**
   * Find workflows by status
   */
  /**
   * Find workflows by status for a creator
   */
  async findWorkflowsByStatus(status: string, creatorId: string): Promise<Workflow[]> {
    return db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.status, status as any),
          eq(workflows.creatorId, creatorId),
          isNull(workflows.deletedAt)
        )
      )
      .orderBy(desc(workflows.updatedAt));
  }

  /**
   * Find workflows by agent ID
   */
  /**
   * Find workflows by agent ID (must check creator ownership)
   */
  async findWorkflowsByAgentId(agentId: string, creatorId: string): Promise<Workflow[]> {
    return db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.agentId, agentId),
          eq(workflows.creatorId, creatorId),
          isNull(workflows.deletedAt)
        )
      )
      .orderBy(desc(workflows.updatedAt));
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, data: Partial<NewWorkflow>): Promise<Workflow | null> {
    const [workflow] = await db
      .update(workflows)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    return workflow ?? null;
  }

  /**
   * Increment workflow execution count
   */
  async incrementExecutionCount(id: string): Promise<void> {
    await db
      .update(workflows)
      .set({
        executionCount: sql`${workflows.executionCount} + 1`,
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, id));
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(id: string): Promise<Workflow | null> {
    const [workflow] = await db
      .update(workflows)
      .set({ isActive: true, status: 'ACTIVE' as any, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    return workflow ?? null;
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow | null> {
    const [workflow] = await db
      .update(workflows)
      .set({ isActive: false, status: 'INACTIVE' as any, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    return workflow ?? null;
  }

  /**
   * Soft delete workflow
   */
  async softDeleteWorkflow(id: string): Promise<boolean> {
    const result = await db
      .update(workflows)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Create workflow step
   */
  async createStep(data: NewWorkflowStep): Promise<WorkflowStep> {
    const [step] = await db.insert(workflowSteps).values(data).returning();
    return step;
  }

  /**
   * Find step by ID
   */
  async findStepById(id: string): Promise<WorkflowStep | null> {
    const [step] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, id));

    return step ?? null;
  }

  /**
   * Find steps by workflow ID
   */
  async findStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]> {
    return db
      .select()
      .from(workflowSteps)
      .where(and(eq(workflowSteps.workflowId, workflowId), eq(workflowSteps.isActive, true)))
      .orderBy(workflowSteps.order);
  }

  /**
   * Update step
   */
  async updateStep(id: string, data: Partial<NewWorkflowStep>): Promise<WorkflowStep | null> {
    const [step] = await db
      .update(workflowSteps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workflowSteps.id, id))
      .returning();

    return step ?? null;
  }

  /**
   * Delete step
   */
  async deleteStep(id: string): Promise<boolean> {
    const result = await db.delete(workflowSteps).where(eq(workflowSteps.id, id)).returning();

    return result.length > 0;
  }

  /**
   * Reorder steps
   */
  async reorderSteps(workflowId: string, stepIds: string[]): Promise<void> {
    for (let i = 0; i < stepIds.length; i++) {
      await db
        .update(workflowSteps)
        .set({ order: i, updatedAt: new Date() })
        .where(and(eq(workflowSteps.id, stepIds[i]), eq(workflowSteps.workflowId, workflowId)));
    }
  }

  /**
   * Create workflow execution
   */
  async createExecution(data: NewWorkflowExecution): Promise<WorkflowExecution> {
    const [execution] = await db.insert(workflowExecutions).values(data).returning();
    return execution;
  }

  /**
   * Find execution by ID
   */
  async findExecutionById(id: string): Promise<WorkflowExecution | null> {
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, id));

    return execution ?? null;
  }

  /**
   * Find executions by workflow ID
   */
  async findExecutionsByWorkflowId(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    return db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(limit);
  }

  /**
   * Find executions by status
   */
  async findExecutionsByStatus(status: string, limit = 50): Promise<WorkflowExecution[]> {
    return db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.status, status as any))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(limit);
  }

  /**
   * Update execution
   */
  async updateExecution(
    id: string,
    data: Partial<NewWorkflowExecution>
  ): Promise<WorkflowExecution | null> {
    const [execution] = await db
      .update(workflowExecutions)
      .set(data)
      .where(eq(workflowExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Complete execution
   */
  async completeExecution(id: string, output: any): Promise<WorkflowExecution | null> {
    const [execution] = await db
      .update(workflowExecutions)
      .set({
        status: 'COMPLETED',
        output,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Fail execution
   */
  async failExecution(id: string, error: string): Promise<WorkflowExecution | null> {
    const [execution] = await db
      .update(workflowExecutions)
      .set({
        status: 'FAILED',
        error,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Create workflow template
   */
  async createTemplate(data: NewWorkflowTemplate): Promise<WorkflowTemplate> {
    const [template] = await db.insert(workflowTemplates).values(data).returning();
    return template;
  }

  /**
   * Find template by ID
   */
  async findTemplateById(id: string): Promise<WorkflowTemplate | null> {
    const [template] = await db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.id, id));

    return template ?? null;
  }

  /**
   * Find public templates
   */
  async findPublicTemplates(category?: string, limit = 20): Promise<WorkflowTemplate[]> {
    const conditions = [eq(workflowTemplates.isPublic, true)];

    if (category) {
      conditions.push(eq(workflowTemplates.category, category));
    }

    return db
      .select()
      .from(workflowTemplates)
      .where(and(...conditions))
      .orderBy(desc(workflowTemplates.usageCount))
      .limit(limit);
  }

  /**
   * Find templates by creator
   */
  async findTemplatesByCreatorId(creatorId: string): Promise<WorkflowTemplate[]> {
    return db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.creatorId, creatorId))
      .orderBy(desc(workflowTemplates.updatedAt));
  }

  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(id: string): Promise<void> {
    await db
      .update(workflowTemplates)
      .set({
        usageCount: sql`${workflowTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workflowTemplates.id, id));
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: Partial<NewWorkflowTemplate>
  ): Promise<WorkflowTemplate | null> {
    const [template] = await db
      .update(workflowTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workflowTemplates.id, id))
      .returning();

    return template ?? null;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(workflowTemplates)
      .where(eq(workflowTemplates.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Count executions by status for a workflow
   */
  async countExecutionsByStatus(workflowId: string): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: workflowExecutions.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .groupBy(workflowExecutions.status);

    return result;
  }

  /**
   * Count total workflows
   */
  async count(): Promise<number> {
    const result = await db
      .select({ count: db.$count(workflows) })
      .from(workflows)
      .where(isNull(workflows.deletedAt));

    return result[0]?.count ?? 0;
  }
}

// Export singleton instance
export const drizzleWorkflowRepository = new DrizzleWorkflowRepository();
