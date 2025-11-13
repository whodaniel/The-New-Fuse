import { PrismaService } from '../prisma/prisma.service';
import { AgentCapability, AgentRole, AgentStatus, Agent as AppAgent } from '@the-new-fuse/types';
export interface AgentWithCapabilities {
    id: string;
    name: string;
    description?: string;
    status: AgentStatus;
    type: string;
    role: AgentRole;
    capabilities: AgentCapability[];
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, unknown>;
}
export declare class AgentRepository {
    protected readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<AppAgent | null>;
    findMany(filters?: any): Promise<AppAgent[]>;
    create(data: any): Promise<AppAgent>;
    update(id: string, data: any): Promise<AppAgent>;
    delete(id: string): Promise<AppAgent>;
    findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<AppAgent[]>;
    findOne(filter?: any, include?: any): Promise<AppAgent | null>;
    count(filter?: any): Promise<number>;
    protected countTotal(where: any): Promise<number>;
    findByCapability(capability: AgentCapability): Promise<AppAgent[]>;
    findActiveAgents(): Promise<AppAgent[]>;
}
//# sourceMappingURL=agent.repository.d.ts.map