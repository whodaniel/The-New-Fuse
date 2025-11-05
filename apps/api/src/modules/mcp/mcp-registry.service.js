var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPRegistryService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentStatus } from '@the-new-fuse/types';
let MCPRegistryService = MCPRegistryService_1 = class MCPRegistryService {
    prisma;
    logger = new Logger(MCPRegistryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Agent management
    async registerAgent(params) {
        this.logger.log(`Registering agent: ${params.name}`);
        // Mock implementation - replace with actual Prisma logic
        const agent = {
            id: `agent-${Date.now()}`,
            name: params.name,
            description: params.description || undefined,
            type: params.type,
            capabilities: params.capabilities,
            status: AgentStatus.ACTIVE,
            // userId: 'system', // Removed as Agent type from @the-new-fuse/types does not have userId
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return agent;
    }
    async getAgentById(id) {
        this.logger.log(`Getting agent by ID: ${id}`);
        // Mock implementation
        return null;
    }
    async updateAgentProfile(agentId, _updates) {
        this.logger.log(`Updating agent profile: ${agentId}`);
        // Mock implementation
        return null;
    }
    async deleteAgent(id) {
        this.logger.log(`Deleting agent: ${id}`);
        // Mock implementation
        return true;
    }
    // Entity management
    async registerEntity(params) {
        this.logger.log(`Registering entity: ${params.name}`);
        const entity = {
            id: `entity-${Date.now()}`,
            name: params.name,
            type: params.type,
            // description: params.description, // Removed as RegisteredEntity type from @the-new-fuse/types does not have description
            metadata: params.metadata,
            createdAt: new Date(),
        };
        return entity;
    }
    async getEntityById(id) {
        this.logger.log(`Getting entity by ID: ${id}`);
        // Mock implementation
        return null;
    }
    async updateEntity(id, _updates) {
        this.logger.log(`Updating entity: ${id}`);
        // Mock implementation
        return null;
    }
    async deleteEntity(id) {
        this.logger.log(`Deleting entity: ${id}`);
        // Mock implementation
        return true;
    }
    // List operations
    async listAgents() {
        this.logger.log('Listing all agents');
        // Mock implementation
        return [];
    }
    async listEntities() {
        this.logger.log('Listing all entities');
        // Mock implementation
        return [];
    }
    // Utility methods
    handleError(error, context) {
        this.logger.error(`Error in ${context}:`, error);
        throw new Error(`${context} failed`);
    }
};
MCPRegistryService = MCPRegistryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], MCPRegistryService);
export { MCPRegistryService };
//# sourceMappingURL=mcp-registry.service.js.map