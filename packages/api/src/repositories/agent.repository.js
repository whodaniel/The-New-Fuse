/**
 * Agent Repository Implementation
 * Follows standardized repository pattern
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
var _a;
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
// Enums should be imported from types package to maintain consistency
// This is a temporary definition that should be moved to the types package
export var AgentType;
(function (AgentType) {
    AgentType["ASSISTANT"] = "assistant";
    AgentType["WORKER"] = "worker";
    AgentType["SUPERVISOR"] = "supervisor";
    AgentType["SPECIALIST"] = "specialist";
})(AgentType || (AgentType = {}));
let AgentRepository = class AgentRepository {
    prisma;
    modelName = 'agent';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filter) {
        const where = this.buildWhereClause(filter);
        const agents = await this.prisma.agent.findMany({
            where
        });
        return agents;
    }
    async findById(id) {
        const agent = await this.prisma.agent.findUnique({
            where: { id }
        });
        return agent;
    }
    async findOne(filter) {
        const where = this.buildWhereClause(filter);
        const agent = await this.prisma.agent.findFirst({
            where
        });
        return agent;
    }
    async findByUserId(userId) {
        return this.findAll({ userId });
    }
    async create(data) {
        const agent = await this.prisma.agent.create({
            data: data
        });
        return agent;
    }
    async update(id, data) {
        const agent = await this.prisma.agent.update({
            where: { id },
            data: data
        });
        return agent;
    }
    async delete(id) {
        await this.prisma.agent.delete({
            where: { id }
        });
        return true;
    }
    async count(filter) {
        const where = this.buildWhereClause(filter);
        return this.prisma.agent.count({
            where
        });
    }
    /**
     * Helper method to build a where clause from a filter object
     * This handles type safety by casting the filter to the appropriate type
     */
    buildWhereClause(filter) {
        if (!filter)
            return {};
        // Create a safe copy of the filter
        const safeFilter = {};
        // Handle special case for userId which might not be in the prisma schema
        if (filter.userId) {
            safeFilter.userId = filter.userId;
        }
        // Copy other standard filter properties
        if (filter.id)
            safeFilter.id = filter.id;
        if (filter.name)
            safeFilter.name = filter.name;
        if (filter.type)
            safeFilter.type = filter.type;
        if (filter.status)
            safeFilter.status = filter.status;
        return safeFilter;
    }
};
AgentRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], AgentRepository);
export { AgentRepository };
//# sourceMappingURL=agent.repository.js.map