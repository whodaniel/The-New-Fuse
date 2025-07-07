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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const config_1 = require("@nestjs/config");
const agent_factory_1 = require("./agent.factory");
const core_1 = require("@the-new-fuse/core");
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
            this.monitoring.recordMetric('agent.created', 1, {
                type: dto.type,
                userId
            });
            return agent;
        }
        catch (error) {
            this.monitoring.captureError(error, { userId, dto });
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
            throw new common_1.NotFoundException('Agent not found');
        }
        return this.prisma.agent.update({
            where: { id },
            data: dto
        });
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        config_1.ConfigService,
        core_1.UnifiedMonitorService,
        agent_factory_1.AgentFactory])
], AgentsService);
