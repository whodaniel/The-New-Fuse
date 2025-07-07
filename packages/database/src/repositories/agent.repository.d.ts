import { Agent, AgentStatus, AgentType } from '../types';
import { PrismaService } from '../prisma.service';
import { IRepository } from './base.repository';
export declare class AgentRepository implements IRepository<Agent> {
    private prisma;
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<Agent | null>;
    findMany(filters?: any): Promise<Agent[]>;
    create(data: any): Promise<Agent>;
    update(id: string, data: any): Promise<Agent>;
    delete(id: string): Promise<Agent>;
    findByStatus(status: AgentStatus): Promise<Agent[]>;
    findByType(type: AgentType): Promise<Agent[]>;
    findByUserId(userId: string): Promise<Agent[]>;
    updateStatus(id: string, status: AgentStatus): Promise<Agent>;
    findActiveAgents(): Promise<Agent[]>;
    countByType(): Promise<Record<string, number>>;
    getAgentStats(id: string): Promise<any>;
}
//# sourceMappingURL=agent.repository.d.ts.map