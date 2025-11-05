import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { PrismaService } from '@the-new-fuse/database';
export declare class AgentService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private mapPrismaStatusToType;
    private mapTypeStatusToPrisma;
    private transformPrismaAgent;
    createAgent(data: CreateAgentDto, userId: string): Promise<Agent>;
    getAgents(userId: string): Promise<Agent[]>;
    getAgentById(id: string, userId: string): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent>;
    deleteAgent(id: string, _userId: string): Promise<void>;
    getAgentsByCapability(capability: string, userId: string): Promise<Agent[]>;
    getActiveAgents(userId: string): Promise<Agent[]>;
    updateAgentStatus(id: string, status: AgentStatus, _userId: string): Promise<Agent>;
}
//# sourceMappingURL=agent.service.d.ts.map