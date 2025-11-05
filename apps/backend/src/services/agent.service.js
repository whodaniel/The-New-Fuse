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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AgentService = class AgentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAgent(data, userId) {
        const agentData = {
            name: data.name,
            type: data.type,
            description: data.description,
            systemPrompt: data.systemPrompt,
            capabilities: data.capabilities || [],
            config: data.configuration || {},
            provider: data.provider || 'default',
            userId,
            status: client_1.AgentStatus.INACTIVE,
        };
        return this.prisma.agent.create({
            data: agentData
        });
    }
    async getAgents(userId) {
        return this.prisma.agent.findMany({
            where: { userId }
        });
    }
    async getAgentById(id, userId) {
        return this.prisma.agent.findFirst({
            where: {
                id,
                userId
            }
        });
    }
    async updateAgentStatus(id, status, userId) {
        const updatedAgent = await this.prisma.agent.update({
            where: {
                id,
                userId
            },
            data: {
                status
            }
        });
        return updatedAgent;
    }
    async updateAgent(id, data, userId) {
        const updateData = {
            ...data,
        };
        return this.prisma.agent.update({
            where: {
                id,
                userId
            },
            data: updateData
        });
    }
    async deleteAgent(id, userId) {
        return this.prisma.agent.delete({
            where: {
                id,
                userId
            }
        });
    }
    transformToDto(agent) {
        return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            type: agent.type, // Type conversion needed between Prisma and types package
            status: agent.status, // Type conversion needed between Prisma and types package
            capabilities: agent.capabilities, // Type conversion needed between Prisma and types package
            provider: agent.provider,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
        };
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentService);
//# sourceMappingURL=agent.service.js.map