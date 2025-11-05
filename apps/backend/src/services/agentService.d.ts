import { PrismaService } from '../../prisma/prisma.service';
export declare class AgentService {
    private prisma;
    constructor(prisma: PrismaService);
    createAgent(data: any, userId: string): Promise<any>;
    getAgents(userId: string): Promise<any>;
    getAgentById(id: string, userId: string): Promise<any>;
    createAgentsInTransaction(agents: any[]): Promise<any>;
    updateAgentStatus(id: string, status: string, userId: string): Promise<any>;
    getActiveAgents(userId: string): Promise<any>;
    getAgentsByCapability(capability: string, userId: string): Promise<any>;
    updateAgent(id: string, data: any, userId: string): Promise<any>;
    deleteAgent(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=agentService.d.ts.map