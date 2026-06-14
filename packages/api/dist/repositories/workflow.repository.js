/**
 * Workflow Repository - Drizzle ORM Implementation
 *
 * This repository provides data access for Workflow entities using Drizzle ORM.
 * It replaces the legacy Drizzle-based repository.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT, drizzleSchema, eq, and, isNull, desc, } from '@the-new-fuse/database';
// Destructure the schema tables we need
const { workflows, workflowExecutions } = drizzleSchema;
let WorkflowRepository = class WorkflowRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Create a new workflow
     */
    async create(data) {
        const [workflow] = await this.db.insert(workflows).values(data).returning();
        return workflow;
    }
    /**
     * Find workflow by ID
     */
    async findById(id) {
        const [workflow] = await this.db
            .select()
            .from(workflows)
            .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)));
        return workflow ?? null;
    }
    /**
     * Find all workflows for a user
     */
    async findByUserId(userId) {
        return this.db
            .select()
            .from(workflows)
            .where(and(eq(workflows.creatorId, userId), isNull(workflows.deletedAt)))
            .orderBy(desc(workflows.createdAt));
    }
    /**
     * Find all workflows with optional filter
     */
    async findAll(filter) {
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
    async findOne(filter) {
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
    async update(id, data) {
        const updateData = { ...data, updatedAt: new Date() };
        const [workflow] = await this.db
            .update(workflows)
            .set(updateData)
            .where(eq(workflows.id, id))
            .returning();
        return workflow ?? null;
    }
    /**
     * Soft delete a workflow
     */
    async delete(id) {
        const result = await this.db
            .update(workflows)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(workflows.id, id))
            .returning();
        return result.length > 0;
    }
};
WorkflowRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], WorkflowRepository);
export { WorkflowRepository };
/**
 * Workflow Execution Repository
 */
let WorkflowExecutionRepository = class WorkflowExecutionRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Create a new workflow execution
     */
    async create(data) {
        const [execution] = await this.db
            .insert(workflowExecutions)
            .values(data)
            .returning();
        return execution;
    }
    /**
     * Find execution by ID
     */
    async findById(id) {
        const [execution] = await this.db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.id, id));
        return execution ?? null;
    }
    /**
     * Find all executions for a workflow
     */
    async findByWorkflowId(workflowId) {
        return this.db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.workflowId, workflowId))
            .orderBy(desc(workflowExecutions.startedAt));
    }
    /**
     * Find one execution matching filter
     */
    async findOne(filter) {
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
    async findAll(filter) {
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
    async update(id, data) {
        const [execution] = await this.db
            .update(workflowExecutions)
            .set(data)
            .where(eq(workflowExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Delete an execution
     */
    async delete(id) {
        const result = await this.db
            .delete(workflowExecutions)
            .where(eq(workflowExecutions.id, id))
            .returning();
        return result.length > 0;
    }
};
WorkflowExecutionRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], WorkflowExecutionRepository);
export { WorkflowExecutionRepository };
//# sourceMappingURL=workflow.repository.js.map