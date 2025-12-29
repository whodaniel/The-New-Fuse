/**
 * Workflow Repository - Drizzle ORM Implementation
 * 
 * This repository provides data access for Workflow entities using Drizzle ORM.
 * It replaces the legacy Prisma-based repository.
 */

import { Inject, Injectable } from '@nestjs/common';
import { 
  DRIZZLE_CLIENT, 
  type DrizzleClient,
  drizzleSchema,
  eq,
  and,
  isNull,
  desc,
} from '@the-new-fuse/database';

// Destructure the schema tables we need
const { workflows, workflowExecutions } = drizzleSchema;

// Type aliases
type Workflow = typeof workflows.$inferSelect;
type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// Custom insert types that include all optional fields
interface WorkflowInsert {
  name: string;
  description?: string | null;
  definition?: any;
  status?: string;
  creatorId?: string | null;
  agentId?: string | null;
  metadata?: any;
  isActive?: boolean;
  variables?: any;
  triggers?: any;
  deletedAt?: Date | null;
}

interface WorkflowExecutionInsert {
  workflowId: string;
  status?: string;
  input?: any;
  output?: any;
  error?: string | null;
  completedAt?: Date | null;
  projectId?: string | null;
}

export interface IWorkflowRepository {
  create(data: WorkflowInsert): Promise<Workflow>;
  findById(id: string): Promise<Workflow | null>;
  findByUserId(userId: string): Promise<Workflow[]>;
  findAll(filter?: Partial<Workflow>): Promise<Workflow[]>;
  findOne(filter: Partial<Workflow>): Promise<Workflow | null>;
  update(id: string, data: Partial<WorkflowInsert>): Promise<Workflow | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class WorkflowRepository implements IWorkflowRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient
  ) {}

  /**
   * Create a new workflow
   */
  async create(data: WorkflowInsert): Promise<Workflow> {
    const [workflow] = await this.db.insert(workflows).values(data as any).returning();
    return workflow;
  }

  /**
   * Find workflow by ID
   */
  async findById(id: string): Promise<Workflow | null> {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)));

    return workflow ?? null;
  }

  /**
   * Find all workflows for a user
   */
  async findByUserId(userId: string): Promise<Workflow[]> {
    return this.db
      .select()
      .from(workflows)
      .where(and(eq(workflows.creatorId, userId), isNull(workflows.deletedAt)))
      .orderBy(desc(workflows.createdAt));
  }

  /**
   * Find all workflows with optional filter
   */
  async findAll(filter?: Partial<Workflow>): Promise<Workflow[]> {
    const conditions = [isNull(workflows.deletedAt)];

    if (filter?.creatorId) {
      conditions.push(eq(workflows.creatorId, filter.creatorId));
    }
    if (filter?.status) {
      conditions.push(eq(workflows.status, filter.status));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(workflows.isActive, filter.isActive));
    }

    return this.db
      .select()
      .from(workflows)
      .where(and(...conditions))
      .orderBy(desc(workflows.createdAt));
  }

  /**
   * Find one workflow matching filter
   */
  async findOne(filter: Partial<Workflow>): Promise<Workflow | null> {
    const conditions = [isNull(workflows.deletedAt)];

    if (filter.id) {
      conditions.push(eq(workflows.id, filter.id));
    }
    if (filter.creatorId) {
      conditions.push(eq(workflows.creatorId, filter.creatorId));
    }
    if (filter.name) {
      conditions.push(eq(workflows.name, filter.name));
    }

    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(and(...conditions))
      .limit(1);

    return workflow ?? null;
  }

  /**
   * Update a workflow
   */
  async update(id: string, data: Partial<WorkflowInsert>): Promise<Workflow | null> {
    const updateData = { ...data, updatedAt: new Date() };
    const [workflow] = await this.db
      .update(workflows)
      .set(updateData as any)
      .where(eq(workflows.id, id))
      .returning();

    return workflow ?? null;
  }

  /**
   * Soft delete a workflow
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(workflows)
      .set({ deletedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(workflows.id, id))
      .returning();

    return result.length > 0;
  }
}

/**
 * Workflow Execution Repository
 */
@Injectable()
export class WorkflowExecutionRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient
  ) {}

  /**
   * Create a new workflow execution
   */
  async create(data: WorkflowExecutionInsert): Promise<WorkflowExecution> {
    const [execution] = await this.db
      .insert(workflowExecutions)
      .values(data as any)
      .returning();
    return execution;
  }

  /**
   * Find execution by ID
   */
  async findById(id: string): Promise<WorkflowExecution | null> {
    const [execution] = await this.db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, id));

    return execution ?? null;
  }

  /**
   * Find all executions for a workflow
   */
  async findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    return this.db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt));
  }

  /**
   * Find one execution matching filter
   */
  async findOne(filter: Partial<WorkflowExecution>): Promise<WorkflowExecution | null> {
    const conditions = [];

    if (filter.id) {
      conditions.push(eq(workflowExecutions.id, filter.id));
    }
    if (filter.workflowId) {
      conditions.push(eq(workflowExecutions.workflowId, filter.workflowId));
    }

    if (conditions.length === 0) {
      return null;
    }

    const [execution] = await this.db
      .select()
      .from(workflowExecutions)
      .where(and(...conditions))
      .limit(1);

    return execution ?? null;
  }

  /**
   * Find all executions matching filter
   */
  async findAll(filter: Partial<WorkflowExecution>): Promise<WorkflowExecution[]> {
    const conditions = [];

    if (filter.workflowId) {
      conditions.push(eq(workflowExecutions.workflowId, filter.workflowId));
    }
    if (filter.status) {
      conditions.push(eq(workflowExecutions.status, filter.status));
    }

    if (conditions.length === 0) {
      return this.db
        .select()
        .from(workflowExecutions)
        .orderBy(desc(workflowExecutions.startedAt));
    }

    return this.db
      .select()
      .from(workflowExecutions)
      .where(and(...conditions))
      .orderBy(desc(workflowExecutions.startedAt));
  }

  /**
   * Update an execution
   */
  async update(id: string, data: Partial<WorkflowExecutionInsert>): Promise<WorkflowExecution | null> {
    const [execution] = await this.db
      .update(workflowExecutions)
      .set(data as any)
      .where(eq(workflowExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Delete an execution
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(workflowExecutions)
      .where(eq(workflowExecutions.id, id))
      .returning();

    return result.length > 0;
  }
}

// Re-export types for consumers
export type { 
  Workflow, 
  WorkflowInsert as NewWorkflow, 
  WorkflowExecution, 
  WorkflowExecutionInsert as NewWorkflowExecution 
};
