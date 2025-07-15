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
exports.AgentRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../generated/prisma");
const prisma_service_1 = require("../prisma.service");
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
            description: prismaAgent.description,
            type: prismaAgent.type,
            status: prismaAgent.status,
            userId: prismaAgent.userId,
            config: prismaAgent.config,
            createdAt: prismaAgent.createdAt,
            updatedAt: prismaAgent.updatedAt,
            capabilities: prismaAgent.capabilities,
            provider: prismaAgent.provider,
            nft: prismaAgent.nft || null,
            workflows: prismaAgent.workflows || [],
            user: prismaAgent.user || null
        };
    }
    async findById(id) {
        const result = await this.prisma.agent.findUnique({
            where: { id },
            include: {
                user: true,
                workflows: true,
                nft: true
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const results = await this.prisma.agent.findMany({
            where: filters,
            include: {
                user: true,
                workflows: true,
                nft: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(agent => this.convertPrismaToApp(agent));
    }
    async create(data) {
        const result = await this.prisma.agent.create({
            data
        });
        return this.convertPrismaToApp(result);
    }
    async update(id, data) {
        const result = await this.prisma.agent.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
        return this.convertPrismaToApp(result);
    }
    async delete(id) {
        const result = await this.prisma.agent.delete({
            where: { id }
        });
        return this.convertPrismaToApp(result);
    }
    async findByStatus(status) {
        const results = await this.prisma.agent.findMany({
            where: { status: status },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(agent => this.convertPrismaToApp(agent));
    }
    async findByType(type) {
        const results = await this.prisma.agent.findMany({
            where: { type: type },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(agent => this.convertPrismaToApp(agent));
    }
    async findByUserId(userId) {
        const results = await this.prisma.agent.findMany({
            where: { userId },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(agent => this.convertPrismaToApp(agent));
    }
    async updateStatus(id, status) {
        const result = await this.prisma.agent.update({
            where: { id },
            data: {
                status: status,
                updatedAt: new Date()
            }
        });
        return this.convertPrismaToApp(result);
    }
    async findActiveAgents() {
        return this.findByStatus(prisma_1.AgentStatus.IDLE);
    }
    async countByType() {
        const counts = await this.prisma.agent.groupBy({
            by: ['type'],
            _count: {
                id: true
            }
        });
        return counts.reduce((acc, { type, _count }) => {
            acc[type] = _count.id;
            return acc;
        }, {});
    }
    async getAgentStats(id) {
        const agent = await this.prisma.agent.findUnique({
            where: { id }
        });
        if (!agent)
            return null;
        const convertedAgent = this.convertPrismaToApp(agent);
        return convertedAgent;
    }
};
exports.AgentRepository = AgentRepository;
exports.AgentRepository = AgentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentRepository);
