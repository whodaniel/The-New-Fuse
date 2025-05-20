import { Agent, AgentStatus, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from '@nestjs/config';
export declare class AgentService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    private transformPrismaAgent;
    createAgent(data: CreateAgentDto, userId: string): Promise<Agent>;
    getAgents(userId: string): Promise<Agent[]>;
    getAgentById(id: string, userId: string): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent>;
    deleteAgent(id: string, userId: string): Promise<void>;
    getAgentsByCapability(capability: string, userId: string): Promise<Agent[]>;
    getActiveAgents(userId: string): Promise<Agent[]>;
    updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent>;
}
