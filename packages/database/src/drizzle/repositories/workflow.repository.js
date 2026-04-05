"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWorkflowRepository = exports.DrizzleWorkflowRepository = void 0;
/**
 * Workflow Repository - Drizzle ORM Implementation
 * Provides data access for Workflow entities and executions
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Workflow Repository - provides data access for Workflow entities
 */
class DrizzleWorkflowRepository {
    /**
     * Create a new workflow
     */
    async createWorkflow(data) {
        const [workflow] = await client_1.db.insert(schema_1.workflows).values(data).returning();
        return workflow;
    }
    /**
     * Find workflow by ID
     */
    async findWorkflowById(id) {
        const [workflow] = await client_1.db
            .select()
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflows.id, id), (0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt)));
        return workflow ?? null;
    }
    /**
     * Find workflow with steps
     */
    async findWorkflowWithSteps(id) {
        const workflow = await this.findWorkflowById(id);
        if (!workflow)
            return null;
        const steps = await client_1.db
            .select()
            .from(schema_1.workflowSteps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, id), (0, drizzle_orm_1.eq)(schema_1.workflowSteps.isActive, true)))
            .orderBy(schema_1.workflowSteps.order);
        return {
            ...workflow,
            steps,
        };
    }
    /**
     * Find workflows by creator ID
     */
    async findWorkflowsByCreatorId(creatorId) {
        return client_1.db
            .select()
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflows.creatorId, creatorId), (0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflows.updatedAt));
    }
    /**
     * Find active workflows
     */
    /**
     * Find active workflows for a creator
     */
    async findActiveWorkflows(creatorId) {
        return client_1.db
            .select()
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflows.isActive, true), (0, drizzle_orm_1.eq)(schema_1.workflows.creatorId, creatorId), (0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflows.updatedAt));
    }
    /**
     * Find workflows by status
     */
    /**
     * Find workflows by status for a creator
     */
    async findWorkflowsByStatus(status, creatorId) {
        return client_1.db
            .select()
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflows.status, status), (0, drizzle_orm_1.eq)(schema_1.workflows.creatorId, creatorId), (0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflows.updatedAt));
    }
    /**
     * Find workflows by agent ID
     */
    /**
     * Find workflows by agent ID (must check creator ownership)
     */
    async findWorkflowsByAgentId(agentId, creatorId) {
        return client_1.db
            .select()
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflows.agentId, agentId), (0, drizzle_orm_1.eq)(schema_1.workflows.creatorId, creatorId), (0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflows.updatedAt));
    }
    /**
     * Update workflow
     */
    async updateWorkflow(id, data) {
        const [workflow] = await client_1.db
            .update(schema_1.workflows)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Increment workflow execution count
     */
    async incrementExecutionCount(id) {
        await client_1.db
            .update(schema_1.workflows)
            .set({
            executionCount: (0, drizzle_orm_1.sql) `${schema_1.workflows.executionCount} + 1`,
            lastExecutedAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id));
    }
    /**
     * Activate workflow
     */
    async activateWorkflow(id) {
        const [workflow] = await client_1.db
            .update(schema_1.workflows)
            .set({ isActive: true, status: 'ACTIVE', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Deactivate workflow
     */
    async deactivateWorkflow(id) {
        const [workflow] = await client_1.db
            .update(schema_1.workflows)
            .set({ isActive: false, status: 'INACTIVE', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Soft delete workflow
     */
    async softDeleteWorkflow(id) {
        const result = await client_1.db
            .update(schema_1.workflows)
            .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create workflow step
     */
    async createStep(data) {
        const [step] = await client_1.db.insert(schema_1.workflowSteps).values(data).returning();
        return step;
    }
    /**
     * Find step by ID
     */
    async findStepById(id) {
        const [step] = await client_1.db.select().from(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, id));
        return step ?? null;
    }
    /**
     * Find steps by workflow ID
     */
    async findStepsByWorkflowId(workflowId) {
        return client_1.db
            .select()
            .from(schema_1.workflowSteps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, workflowId), (0, drizzle_orm_1.eq)(schema_1.workflowSteps.isActive, true)))
            .orderBy(schema_1.workflowSteps.order);
    }
    /**
     * Update step
     */
    async updateStep(id, data) {
        const [step] = await client_1.db
            .update(schema_1.workflowSteps)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, id))
            .returning();
        return step ?? null;
    }
    /**
     * Delete step
     */
    async deleteStep(id) {
        const result = await client_1.db.delete(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Reorder steps
     */
    async reorderSteps(workflowId, stepIds) {
        for (let i = 0; i < stepIds.length; i++) {
            await client_1.db
                .update(schema_1.workflowSteps)
                .set({ order: i, updatedAt: new Date() })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepIds[i]), (0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, workflowId)));
        }
    }
    /**
     * Create workflow execution
     */
    async createExecution(data) {
        const [execution] = await client_1.db.insert(schema_1.workflowExecutions).values(data).returning();
        return execution;
    }
    /**
     * Find execution by ID
     */
    async findExecutionById(id) {
        const [execution] = await client_1.db
            .select()
            .from(schema_1.workflowExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.id, id));
        return execution ?? null;
    }
    /**
     * Find executions by workflow ID
     */
    async findExecutionsByWorkflowId(workflowId, limit = 50) {
        return client_1.db
            .select()
            .from(schema_1.workflowExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.workflowId, workflowId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflowExecutions.startedAt))
            .limit(limit);
    }
    /**
     * Find executions by status
     */
    async findExecutionsByStatus(status, limit = 50) {
        return client_1.db
            .select()
            .from(schema_1.workflowExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.status, status))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflowExecutions.startedAt))
            .limit(limit);
    }
    /**
     * Update execution
     */
    async updateExecution(id, data) {
        const [execution] = await client_1.db
            .update(schema_1.workflowExecutions)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Complete execution
     */
    async completeExecution(id, output) {
        const [execution] = await client_1.db
            .update(schema_1.workflowExecutions)
            .set({
            status: 'COMPLETED',
            output,
            completedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Fail execution
     */
    async failExecution(id, error) {
        const [execution] = await client_1.db
            .update(schema_1.workflowExecutions)
            .set({
            status: 'FAILED',
            error,
            completedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Create workflow template
     */
    async createTemplate(data) {
        const [template] = await client_1.db.insert(schema_1.workflowTemplates).values(data).returning();
        return template;
    }
    /**
     * Find template by ID
     */
    async findTemplateById(id) {
        const [template] = await client_1.db
            .select()
            .from(schema_1.workflowTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.id, id));
        return template ?? null;
    }
    /**
     * Find public templates
     */
    async findPublicTemplates(category, limit = 20) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.workflowTemplates.isPublic, true)];
        if (category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.category, category));
        }
        return client_1.db
            .select()
            .from(schema_1.workflowTemplates)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflowTemplates.usageCount))
            .limit(limit);
    }
    /**
     * Find templates by creator
     */
    async findTemplatesByCreatorId(creatorId) {
        return client_1.db
            .select()
            .from(schema_1.workflowTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.creatorId, creatorId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workflowTemplates.updatedAt));
    }
    /**
     * Increment template usage count
     */
    async incrementTemplateUsage(id) {
        await client_1.db
            .update(schema_1.workflowTemplates)
            .set({
            usageCount: (0, drizzle_orm_1.sql) `${schema_1.workflowTemplates.usageCount} + 1`,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.id, id));
    }
    /**
     * Update template
     */
    async updateTemplate(id, data) {
        const [template] = await client_1.db
            .update(schema_1.workflowTemplates)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.id, id))
            .returning();
        return template ?? null;
    }
    /**
     * Delete template
     */
    async deleteTemplate(id) {
        const result = await client_1.db
            .delete(schema_1.workflowTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTemplates.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Count executions by status for a workflow
     */
    async countExecutionsByStatus(workflowId) {
        const result = await client_1.db
            .select({
            status: schema_1.workflowExecutions.status,
            count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)`,
        })
            .from(schema_1.workflowExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowExecutions.workflowId, workflowId))
            .groupBy(schema_1.workflowExecutions.status);
        return result;
    }
    /**
     * Count total workflows
     */
    async count() {
        const result = await client_1.db
            .select({ count: client_1.db.$count(schema_1.workflows) })
            .from(schema_1.workflows)
            .where((0, drizzle_orm_1.isNull)(schema_1.workflows.deletedAt));
        return result[0]?.count ?? 0;
    }
}
exports.DrizzleWorkflowRepository = DrizzleWorkflowRepository;
// Export singleton instance
exports.drizzleWorkflowRepository = new DrizzleWorkflowRepository();
//# sourceMappingURL=workflow.repository.js.map