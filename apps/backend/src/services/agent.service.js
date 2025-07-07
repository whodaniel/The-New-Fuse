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
            ...data,
            userId,
            capabilities: data.capabilities || [],
            status: data.status || client_1.AgentStatus.INACTIVE,
            lastActive: data.lastActive ? new Date(data.lastActive) : new Date(),
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
                status,
                lastActive: new Date()
            }
        });
        return updatedAgent;
    }
    async updateAgent(id, data, userId) {
        const updateData = {
            ...data,
        };
        if (data.lastActive) {
            updateData.lastActive = new Date(data.lastActive);
        }
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
            type: agent.type,
            status: agent.status,
            capabilities: agent.capabilities,
            provider: agent.provider,
            lastActive: agent.lastActive,
            metadata: agent.metadata,
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
