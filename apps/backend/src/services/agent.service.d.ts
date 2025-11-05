import { PrismaService } from '../prisma/prisma.service';
import { Agent, AgentStatus } from '@prisma/client';
import { CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
export declare class AgentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAgent(data: CreateAgentDto, userId: string): Promise<Agent>;
    getAgents(userId: string): Promise<Agent[]>;
    getAgentById(id: string, userId: string): Promise<Agent | null>;
    updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent | null>;
    updateAgent(id: string, data: UpdateAgentDto, userId: string): Promise<Agent>;
    deleteAgent(id: string, userId: string): Promise<Agent>;
    private transformToDto;
}
//# sourceMappingURL=agent.service.d.ts.map