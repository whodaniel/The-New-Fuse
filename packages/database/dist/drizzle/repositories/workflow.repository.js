/**
 * Workflow Repository - Drizzle ORM Implementation
 * Provides data access for Workflow entities and executions
 */
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { workflowExecutions, workflows, workflowSteps, workflowTemplates } from '../schema.js';
/**
 * Workflow Repository - provides data access for Workflow entities
 */
export class DrizzleWorkflowRepository {
    /**
     * Create a new workflow
     */
    async createWorkflow(data) {
        const [workflow] = await db.insert(workflows).values(data).returning();
        return workflow;
    }
    /**
     * Find workflow by ID
     */
    async findWorkflowById(id) {
        const [workflow] = await db
            .select()
            .from(workflows)
            .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)));
        return workflow ?? null;
    }
    /**
     * Find workflow with steps
     */
    async findWorkflowWithSteps(id) {
        const workflow = await this.findWorkflowById(id);
        if (!workflow)
            return null;
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
    async findWorkflowsByCreatorId(creatorId) {
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
    async findActiveWorkflows(creatorId) {
        return db
            .select()
            .from(workflows)
            .where(and(eq(workflows.isActive, true), eq(workflows.creatorId, creatorId), isNull(workflows.deletedAt)))
            .orderBy(desc(workflows.updatedAt));
    }
    /**
     * Find workflows by status
     */
    /**
     * Find workflows by status for a creator
     */
    async findWorkflowsByStatus(status, creatorId) {
        return db
            .select()
            .from(workflows)
            .where(and(eq(workflows.status, status), eq(workflows.creatorId, creatorId), isNull(workflows.deletedAt)))
            .orderBy(desc(workflows.updatedAt));
    }
    /**
     * Find workflows by agent ID
     */
    /**
     * Find workflows by agent ID (must check creator ownership)
     */
    async findWorkflowsByAgentId(agentId, creatorId) {
        return db
            .select()
            .from(workflows)
            .where(and(eq(workflows.agentId, agentId), eq(workflows.creatorId, creatorId), isNull(workflows.deletedAt)))
            .orderBy(desc(workflows.updatedAt));
    }
    /**
     * Update workflow
     */
    async updateWorkflow(id, data) {
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
    async incrementExecutionCount(id) {
        await db
            .update(workflows)
            .set({
            executionCount: sql `${workflows.executionCount} + 1`,
            lastExecutedAt: new Date(),
            updatedAt: new Date(),
        })
            .where(eq(workflows.id, id));
    }
    /**
     * Activate workflow
     */
    async activateWorkflow(id) {
        const [workflow] = await db
            .update(workflows)
            .set({ isActive: true, status: 'ACTIVE', updatedAt: new Date() })
            .where(eq(workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Deactivate workflow
     */
    async deactivateWorkflow(id) {
        const [workflow] = await db
            .update(workflows)
            .set({ isActive: false, status: 'INACTIVE', updatedAt: new Date() })
            .where(eq(workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Soft delete workflow
     */
    async softDeleteWorkflow(id) {
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
    async createStep(data) {
        const [step] = await db.insert(workflowSteps).values(data).returning();
        return step;
    }
    /**
     * Find step by ID
     */
    async findStepById(id) {
        const [step] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, id));
        return step ?? null;
    }
    /**
     * Find steps by workflow ID
     */
    async findStepsByWorkflowId(workflowId) {
        return db
            .select()
            .from(workflowSteps)
            .where(and(eq(workflowSteps.workflowId, workflowId), eq(workflowSteps.isActive, true)))
            .orderBy(workflowSteps.order);
    }
    /**
     * Update step
     */
    async updateStep(id, data) {
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
    async deleteStep(id) {
        const result = await db.delete(workflowSteps).where(eq(workflowSteps.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Reorder steps
     */
    async reorderSteps(workflowId, stepIds) {
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
    async createExecution(data) {
        const [execution] = await db.insert(workflowExecutions).values(data).returning();
        return execution;
    }
    /**
     * Find execution by ID
     */
    async findExecutionById(id) {
        const [execution] = await db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.id, id));
        return execution ?? null;
    }
    /**
     * Find executions by workflow ID
     */
    async findExecutionsByWorkflowId(workflowId, limit = 50) {
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
    async findExecutionsByStatus(status, limit = 50) {
        return db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.status, status))
            .orderBy(desc(workflowExecutions.startedAt))
            .limit(limit);
    }
    /**
     * Update execution
     */
    async updateExecution(id, data) {
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
    async completeExecution(id, output) {
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
    async failExecution(id, error) {
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
    async createTemplate(data) {
        const [template] = await db.insert(workflowTemplates).values(data).returning();
        return template;
    }
    /**
     * Find template by ID
     */
    async findTemplateById(id) {
        const [template] = await db
            .select()
            .from(workflowTemplates)
            .where(eq(workflowTemplates.id, id));
        return template ?? null;
    }
    /**
     * Find public templates
     */
    async findPublicTemplates(category, limit = 20) {
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
    async findTemplatesByCreatorId(creatorId) {
        return db
            .select()
            .from(workflowTemplates)
            .where(eq(workflowTemplates.creatorId, creatorId))
            .orderBy(desc(workflowTemplates.updatedAt));
    }
    /**
     * Increment template usage count
     */
    async incrementTemplateUsage(id) {
        await db
            .update(workflowTemplates)
            .set({
            usageCount: sql `${workflowTemplates.usageCount} + 1`,
            updatedAt: new Date(),
        })
            .where(eq(workflowTemplates.id, id));
    }
    /**
     * Update template
     */
    async updateTemplate(id, data) {
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
    async deleteTemplate(id) {
        const result = await db
            .delete(workflowTemplates)
            .where(eq(workflowTemplates.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Count executions by status for a workflow
     */
    async countExecutionsByStatus(workflowId) {
        const result = await db
            .select({
            status: workflowExecutions.status,
            count: sql `cast(count(*) as integer)`,
        })
            .from(workflowExecutions)
            .where(eq(workflowExecutions.workflowId, workflowId))
            .groupBy(workflowExecutions.status);
        return result;
    }
    /**
     * Count total workflows
     */
    async count() {
        const result = await db
            .select({ count: db.$count(workflows) })
            .from(workflows)
            .where(isNull(workflows.deletedAt));
        return result[0]?.count ?? 0;
    }
}
// Export singleton instance
export const drizzleWorkflowRepository = new DrizzleWorkflowRepository();
//# sourceMappingURL=workflow.repository.js.map