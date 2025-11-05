var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { ConfigService } from '@nestjs/config';
import { AgentFactory } from './agent.factory';
import { MonitoringService } from '@the-new-fuse/core';
let AgentsService = class AgentsService {
    prisma;
    config;
    monitoring;
    agentFactory;
    constructor(prisma, config, monitoring, agentFactory) {
        this.prisma = prisma;
        this.config = config;
        this.monitoring = monitoring;
        this.agentFactory = agentFactory;
    }
    async create(userId, dto) {
        try {
            const agent = await this.prisma.agent.create({
                data: {
                    ...dto,
                    userId,
                    config: this.agentFactory.getDefaultConfig(dto.type)
                }
            });
            // TODO: Implement monitoring methods
            // this.monitoring.recordMetric('agent.created', 1, {
            //   type: dto.type,
            //   userId
            // });
            return agent;
        }
        catch (error) {
            // TODO: Implement monitoring methods
            // this.monitoring.captureError(error, { userId, dto });
            throw error;
        }
    }
    async findAll(userId) {
        return this.prisma.agent.findMany({
            where: { userId },
            include: {
                chats: {
                    take: 1,
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });
    }
    async update(id, userId, dto) {
        const agent = await this.prisma.agent.findFirst({
            where: { id, userId }
        });
        if (!agent) {
            throw new NotFoundException('Agent not found');
        }
        return this.prisma.agent.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                capabilities: dto.capabilities,
                config: dto.config
            }
        });
    }
};
AgentsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, ConfigService, typeof (_b = typeof MonitoringService !== "undefined" && MonitoringService) === "function" ? _b : Object, typeof (_c = typeof AgentFactory !== "undefined" && AgentFactory) === "function" ? _c : Object])
], AgentsService);
export { AgentsService };
//# sourceMappingURL=agents.service.js.map