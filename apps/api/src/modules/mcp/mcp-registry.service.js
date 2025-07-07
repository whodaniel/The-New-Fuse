"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPRegistryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const types_1 = require("@the-new-fuse/types");
let MCPRegistryService = MCPRegistryService_1 = class MCPRegistryService {
    prisma;
    logger = new common_1.Logger(MCPRegistryService_1.name);
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
            description: params.description || null,
            type: params.type,
            capabilities: params.capabilities,
            status: types_1.AgentStatus.ACTIVE,
            userId: 'system', // Replace with actual user
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            config: params.configuration,
        };
        return agent;
    }
    async getAgentById(id) {
        this.logger.log(`Getting agent by ID: ${id}`);
        // Mock implementation
        return null;
    }
    async updateAgentProfile(agentId, updates) {
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
            description: params.description,
            metadata: params.metadata,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return entity;
    }
    async getEntityById(id) {
        this.logger.log(`Getting entity by ID: ${id}`);
        // Mock implementation
        return null;
    }
    async updateEntity(id, updates) {
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
exports.MCPRegistryService = MCPRegistryService;
exports.MCPRegistryService = MCPRegistryService = MCPRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MCPRegistryService);
