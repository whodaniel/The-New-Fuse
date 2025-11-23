import { PrismaService } from '@the-new-fuse/database';
import { ConfigService } from '@nestjs/config';
import { AgentFactory } from './agent.factory';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { MonitoringService } from '../types/core';
export declare class AgentsService {
    private prisma;
    private config;
    private monitoring;
    private agentFactory;
    constructor(prisma: PrismaService, config: ConfigService, monitoring: MonitoringService, agentFactory: AgentFactory);
    create(userId: string, dto: CreateAgentDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    update(id: string, userId: string, dto: UpdateAgentDto): Promise<any>;
}
//# sourceMappingURL=agents.service.d.ts.map