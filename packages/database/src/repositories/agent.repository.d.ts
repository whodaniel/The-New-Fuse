import { Agent, AgentStatus, AgentType, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
export declare class AgentRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<any | null>;
    findMany(filters?: Prisma.AgentWhereInput): Promise<any[]>;
    create(data: Prisma.AgentCreateInput): Promise<Agent>;
    update(id: string, data: Prisma.AgentUpdateInput): Promise<Agent>;
    delete(id: string): Promise<Agent>;
    findByStatus(status: AgentStatus): Promise<Agent[]>;
    findByType(type: AgentType): Promise<Agent[]>;
    findByUserId(userId: string): Promise<Agent[]>;
    updateStatus(id: string, status: AgentStatus): Promise<Agent>;
    findActiveAgents(): Promise<Agent[]>;
    countByType(): Promise<Record<AgentType, number>>;
    getAgentStats(id: string): Promise<Agent | null>;
}
//# sourceMappingURL=agent.repository.d.ts.map