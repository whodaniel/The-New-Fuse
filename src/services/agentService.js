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
var AgentService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const types_1 = require("@the-new-fuse/types");
const common_1 = require("@nestjs/common");
const prisma_service_tsx_1 = require("../lib/prisma.service.tsx");
const config_1 = require("@nestjs/config");
let AgentService = AgentService_1 = class AgentService {
    prisma;
    config;
    logger = new common_1.Logger(AgentService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    transformPrismaAgent(agent) {
        // Explicit type conversion with schema validation
        const transformed = {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            config: agent.config,
            userId: agent.userId,
            createdAt: agent.createdAt.toISOString(),
            updatedAt: agent.updatedAt.toISOString(),
            status: agent.status,
            // Add schema field assertions
            capabilities: agent.capabilities,
            description: agent.description,
            systemPrompt: agent.systemPrompt,
        };
        return transformed;
    }
    async createAgent(data, userId) {
        try {
            // Use transaction to ensure data consistency
            return await this.prisma.client.$transaction(async (tx) => {
                // Check for existing agent with same name
                const existingAgent = await tx.agent.findFirst({
                    where: { name: data.name },
                });
                if (existingAgent) {
                    throw new Error(`Agent with name "${data.name}" already exists`);
                }
                const agent = await tx.agent.create({
                    data: {
                        name: data.name,
                        description: data.description,
                        systemPrompt: data.systemPrompt,
                        capabilities: data.capabilities || [],
                        status: types_1.AgentStatus.INACTIVE,
                        configuration: data.configuration,
                        userId,
                    },
                });
                this.logger.log(`Created agent ${agent.id} (${agent.name})`);
                return this.transformPrismaAgent(agent);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to create agent: ${errorMessage}`);
            throw error;
        }
    }
    async getAgents(userId) {
        try {
            const agents = await this.prisma.client.agent.findMany({
                where: { userId, deletedAt: null },
            });
            return agents.map((agent) => this.transformPrismaAgent(agent));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to get agents: ${errorMessage}`);
            throw error;
        }
    }
    async getAgent(id, userId) {
        try {
            const agent = await this.prisma.client.agent.findFirst({
                where: { id, userId, deletedAt: null },
            });
            if (!agent) {
                throw new Error(`Agent with id "${id}" not found`);
            }
            return this.transformPrismaAgent(agent);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to get agent: ${errorMessage}`);
            throw error;
        }
    }
    async updateAgent(id, updates, userId) {
        try {
            return await this.prisma.client.$transaction(async (tx) => {
                // Check if agent exists
                const existingAgent = await tx.agent.findFirst({
                    where: { id, userId, deletedAt: null },
                });
                if (!existingAgent) {
                    throw new Error(`Agent with id "${id}" not found`);
                }
                // Check if new name conflicts with existing agent
                if (updates.name && updates.name !== existingAgent.name) {
                    const nameExists = await tx.agent.findFirst({
                        where: {
                            name: updates.name,
                            id: { not: id },
                            deletedAt: null,
                        },
                    });
                    if (nameExists) {
                        throw new Error(`Agent with name "${updates.name}" already exists`);
                    }
                }
                const agent = await tx.agent.update({
                    where: { id },
                    data: {
                        ...updates,
                        updatedAt: new Date(),
                    },
                });
                this.logger.log(`Updated agent ${id}`);
                return this.transformPrismaAgent(agent);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to update agent: ${errorMessage}`);
            throw error;
        }
    }
    async deleteAgent(id, userId) {
        try {
            await this.prisma.client.agent.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            this.logger.log(`Deleted agent ${id}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to delete agent: ${errorMessage}`);
            throw error;
        }
    }
    async getAgentsByCapability(capability, userId) {
        try {
            const agents = await this.prisma.client.agent.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    capabilities: {
                        has: capability,
                    },
                },
            });
            return agents.map((agent) => this.transformPrismaAgent(agent));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
            throw error;
        }
    }
    async getActiveAgents(userId) {
        try {
            const agents = await this.prisma.client.agent.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    status: types_1.AgentStatus.ACTIVE,
                },
            });
            return agents.map((agent) => this.transformPrismaAgent(agent));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to get active agents: ${errorMessage}`);
            throw error;
        }
    }
    async updateAgentStatus(id, status, userId) {
        try {
            const agent = await this.prisma.client.agent.update({
                where: { id },
                data: { status },
            });
            this.logger.log(`Updated agent status ${id} -> ${status}`);
            return this.transformPrismaAgent(agent);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Failed to update agent status: ${errorMessage}`);
            throw error;
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_tsx_1.PrismaService !== "undefined" && prisma_service_tsx_1.PrismaService) === "function" ? _a : Object, config_1.ConfigService])
], AgentService);
//# sourceMappingURL=agentService.js.map