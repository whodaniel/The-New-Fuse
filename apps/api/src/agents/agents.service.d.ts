import { PrismaService } from '@the-new-fuse/database/src/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AgentFactory } from './agent.factory.js';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto.js';
import { UnifiedMonitorService } from '@the-new-fuse/core';
export declare class AgentsService {
    private prisma;
    private config;
    private monitoring;
    private agentFactory;
    constructor(prisma: PrismaService, config: ConfigService, monitoring: UnifiedMonitorService, agentFactory: AgentFactory);
    create(userId: string, dto: CreateAgentDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    update(id: string, userId: string, dto: UpdateAgentDto): Promise<any>;
}
