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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AgentService = class AgentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAgent(data, userId) {
        // Add userId to the data
        const agentData = {
            ...data,
            userId,
        };
        const agent = await this.prisma.agent.create({
            data: agentData
        });
        return agent;
    }
    async getAgents(userId) {
        const agents = await this.prisma.agent.findMany({
            where: {
                userId
            }
        });
        return agents;
    }
    async getAgentById(id, userId) {
        const agent = await this.prisma.agent.findFirst({
            where: {
                id,
                userId
            }
        });
        return agent;
    }
    async createAgentsInTransaction(agents) {
        return await this.prisma.$transaction(async (tx) => {
            const createdAgents = [];
            for (const agent of agents) {
                const createdAgent = await tx.agent.create({
                    data: agent
                });
                createdAgents.push(createdAgent);
            }
            return createdAgents;
        });
    }
    async updateAgentStatus(id, status, userId) {
        await this.prisma.agent.update({
            where: {
                id,
                userId
            },
            data: {
                status
            }
        });
        return this.getAgentById(id, userId);
    }
    async getActiveAgents(userId) {
        const agents = await this.prisma.agent.findMany({
            where: {
                userId,
                status: 'ACTIVE'
            }
        });
        return agents;
    }
    async getAgentsByCapability(capability, userId) {
        const agents = await this.prisma.agent.findMany({
            where: {
                userId,
                capabilities: {
                    has: capability
                }
            }
        });
        return agents;
    }
    async updateAgent(id, data, userId) {
        const agent = await this.prisma.agent.update({
            where: {
                id,
                userId
            },
            data
        });
        return agent;
    }
    async deleteAgent(id, userId) {
        try {
            await this.prisma.agent.delete({
                where: {
                    id,
                    userId
                }
            });
            return true;
        }
        catch (error) {
            console.error(`Error deleting agent: ${error}`);
            return false;
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AgentService);
//# sourceMappingURL=agentService.js.map