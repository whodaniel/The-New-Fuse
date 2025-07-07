import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './MetricsService.ts';
export interface AgentMetadata {
    id: string;
    name: string;
    version: string;
    capabilities: string[];
    status: 'active' | 'inactive' | 'error';
    lastSeen?: Date;
    config?: Record<string, unknown>;
    error?: string;
}
export declare class AgentMetadataManager {
    private readonly prisma;
    private readonly metrics;
    private readonly logger;
    constructor(prisma: PrismaService, metrics: MetricsService);
    registerAgent(data: Omit<AgentMetadata, 'id'>): Promise<AgentMetadata>;
    updateAgentStatus(id: string, status: AgentMetadata['status'], error?: string): Promise<AgentMetadata>;
    getAgent(id: string): Promise<AgentMetadata | null>;
    listAgents(status?: AgentMetadata['status'], capability?: string): Promise<AgentMetadata[]>;
    deleteAgent(id: string): Promise<void>;
    updateAgentConfig(id: string, config: Record<string, unknown>): Promise<AgentMetadata>;
}
