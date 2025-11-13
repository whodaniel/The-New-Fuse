/**
 * Agent Repository Implementation
 * Follows standardized repository pattern
 */
import { PrismaService } from '../services/prisma.service';
import { AgentCapability } from '@the-new-fuse/types/src/core/enums';
import { AgentStatus } from '../types/agent';
export interface Agent {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: AgentStatus;
    role?: string;
    capabilities: AgentCapability[];
    metadata: Record<string, unknown>;
    configuration?: Record<string, unknown>;
    userId?: string;
    provider: string;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
import { IBaseRepository } from '../services/base.service';
export declare enum AgentType {
    ASSISTANT = "assistant",
    WORKER = "worker",
    SUPERVISOR = "supervisor",
    SPECIALIST = "specialist"
}
export declare class AgentRepository implements IBaseRepository<Agent> {
    private prisma;
    protected readonly modelName: string;
    constructor(prisma: PrismaService);
    findAll(filter?: Record<string, any>): Promise<Agent[]>;
    findById(id: string): Promise<Agent | null>;
    findOne(filter: Record<string, any>): Promise<Agent | null>;
    findByUserId(userId: string): Promise<Agent[]>;
    create(data: Partial<Agent>): Promise<Agent>;
    update(id: string, data: Partial<Agent>): Promise<Agent | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: Record<string, any>): Promise<number>;
    /**
     * Helper method to build a where clause from a filter object
     * This handles type safety by casting the filter to the appropriate type
     */
    private buildWhereClause;
}
//# sourceMappingURL=agent.repository.d.ts.map