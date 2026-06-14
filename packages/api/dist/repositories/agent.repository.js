/**
 * Agent Repository - Drizzle ORM Implementation
 *
 * This repository provides data access for Agent entities using Drizzle ORM.
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
import { and, desc, DRIZZLE_CLIENT, drizzleSchema, eq, isNull, like, or, sql, } from '@the-new-fuse/database';
// Destructure the schema tables we need
const { agents } = drizzleSchema;
let AgentRepository = class AgentRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Create a new agent
     */
    async create(data) {
        const [agent] = await this.db
            .insert(agents)
            .values(data)
            .returning();
        return agent;
    }
    /**
     * Find agent by ID
     */
    async findById(id) {
        const [agent] = await this.db
            .select()
            .from(agents)
            .where(and(eq(agents.id, id), isNull(agents.deletedAt)));
        return agent ?? null;
    }
    /**
     * Find all agents for a user
     */
    async findByUserId(userId) {
        return this.db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
    }
    /**
     * Find all agents with optional filter
     */
    async findAll(filter) {
        const conditions = [isNull(agents.deletedAt)];
        if (filter?.userId) {
            conditions.push(eq(agents.userId, filter.userId));
        }
        if (filter?.status) {
            conditions.push(eq(agents.status, filter.status));
        }
        if (filter?.type) {
            conditions.push(eq(agents.type, filter.type));
        }
        return this.db
            .select()
            .from(agents)
            .where(and(...conditions))
            .orderBy(desc(agents.createdAt));
    }
    /**
     * Find one agent matching filter
     */
    async findOne(filter) {
        const conditions = [isNull(agents.deletedAt)];
        if (filter.id) {
            conditions.push(eq(agents.id, filter.id));
        }
        if (filter.userId) {
            conditions.push(eq(agents.userId, filter.userId));
        }
        if (filter.name) {
            conditions.push(eq(agents.name, filter.name));
        }
        const [agent] = await this.db
            .select()
            .from(agents)
            .where(and(...conditions))
            .limit(1);
        return agent ?? null;
    }
    /**
     * Update an agent
     */
    async update(id, data) {
        const updateData = { ...data, updatedAt: new Date() };
        const [agent] = await this.db
            .update(agents)
            .set(updateData)
            .where(eq(agents.id, id))
            .returning();
        return agent ?? null;
    }
    /**
     * Soft delete an agent
     */
    async delete(id) {
        const result = await this.db
            .update(agents)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(agents.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Search agents by name or description
     */
    async search(query, userId) {
        const searchPattern = `%${query}%`;
        const conditions = [
            or(like(agents.name, searchPattern), like(agents.description, searchPattern)),
            isNull(agents.deletedAt),
        ];
        if (userId) {
            conditions.push(eq(agents.userId, userId));
        }
        return this.db
            .select()
            .from(agents)
            .where(and(...conditions))
            .orderBy(desc(agents.createdAt))
            .limit(50);
    }
    /**
     * Count agents by status
     */
    async countByStatus() {
        const result = await this.db
            .select({
            status: agents.status,
            count: sql `cast(count(*) as integer)`,
        })
            .from(agents)
            .where(isNull(agents.deletedAt))
            .groupBy(agents.status);
        return result;
    }
    /**
     * Find agents with specific capability
     */
    async findByCapability(capability, userId) {
        return this.db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), isNull(agents.deletedAt), sql `${agents.capabilities} @> ${JSON.stringify([capability])}`))
            .orderBy(desc(agents.createdAt));
    }
    /**
     * Find active agents for a user
     */
    async findActiveByUserId(userId) {
        return this.db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), eq(agents.status, 'ACTIVE'), isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
    }
};
AgentRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], AgentRepository);
export { AgentRepository };
//# sourceMappingURL=agent.repository.js.map