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
import { PrismaService } from '../prisma/prisma.service';
import { AgentRole, AgentStatus } from '@the-new-fuse/types';
let AgentRepository = class AgentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Helper method to convert Prisma Agent to App Agent
    convertPrismaToApp(prismaAgent) {
        return {
            id: prismaAgent.id,
            name: prismaAgent.name,
            description: prismaAgent.description || undefined,
            type: prismaAgent.type, // Type casting needed
            status: prismaAgent.status, // Type casting needed
            role: AgentRole.ASSISTANT, // Default role
            capabilities: (prismaAgent.capabilities || []).map((cap) => cap),
            metadata: prismaAgent.metadata || {},
            createdAt: prismaAgent.createdAt,
            updatedAt: prismaAgent.updatedAt
        };
    }
    // Implement abstract methods from BaseRepository
    async findById(id) {
        const result = await this.prisma.agent.findUnique({ where: { id } });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const results = await this.prisma.agent.findMany({ where: filters || {} });
        return results.map((agent) => this.convertPrismaToApp(agent));
    }
    async create(data) {
        const result = await this.prisma.agent.create({ data });
        return this.convertPrismaToApp(result);
    }
    async update(id, data) {
        const result = await this.prisma.agent.update({ where: { id }, data });
        return this.convertPrismaToApp(result);
    }
    async delete(id) {
        const result = await this.prisma.agent.delete({ where: { id } });
        return this.convertPrismaToApp(result);
    }
    // Additional methods for compatibility with existing services
    async findAll(filter, include, orderBy, skip, take) {
        const results = await this.prisma.agent.findMany({ where: filter, include, orderBy, skip, take });
        return results.map((agent) => this.convertPrismaToApp(agent));
    }
    async findOne(filter, include) {
        const result = await this.prisma.agent.findFirst({ where: filter, include });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async count(filter) {
        return this.prisma.agent.count({ where: filter });
    }
    async countTotal(where) {
        return this.prisma.agent.count({ where });
    }
    // ... custom repository methods ...
    async findByCapability(capability) {
        // Prisma doesn't directly support querying JSON arrays like this easily.
        // Fetch all agents and filter in memory, or use raw SQL if performance is critical.
        const allAgents = await this.findAll();
        return allAgents.filter(agent => agent.capabilities?.some(cap => {
            // Handle both string and object capability types
            if (typeof cap === 'string') {
                return cap === capability || cap === capability.toString();
            }
            else if (typeof cap === 'object' && cap !== null) {
                // If capability is an object, compare with its type or name property
                return cap.type === capability || cap.name === capability;
            }
            return false;
        }));
    }
    async findActiveAgents() {
        return this.findAll({ status: AgentStatus.ACTIVE });
    }
};
AgentRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], AgentRepository);
export { AgentRepository };
//# sourceMappingURL=agent.repository.js.map