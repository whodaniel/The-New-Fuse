import { DatabaseService } from '@the-new-fuse/database';
import { AgentResponseDto, AgentStatus, AgentType, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
export declare class AgentService {
    private db;
    constructor(db: DatabaseService);
    private get agentRepository();
    createAgent(createAgentDto: CreateAgentDto, userId: string): Promise<AgentResponseDto>;
    findAllAgents(userId?: string, _filters?: any, page?: number, limit?: number): Promise<{
        data: AgentResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findAgentById(id: string, userId: string): Promise<AgentResponseDto>;
    updateAgent(id: string, updateAgentDto: UpdateAgentDto, userId: string): Promise<AgentResponseDto>;
    deleteAgent(id: string, userId: string): Promise<void>;
    findAgentsByType(type: AgentType, userId: string, _page?: number, _limit?: number): Promise<{
        data: AgentResponseDto[];
        total: number;
    }>;
    findAgentsByStatus(status: AgentStatus, userId: string): Promise<AgentResponseDto[]>;
    findAgentsByUserId(userId: string, page?: number, limit?: number): Promise<{
        data: AgentResponseDto[];
        total: number;
    }>;
    updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<AgentResponseDto>;
    getActiveAgents(userId: string): Promise<AgentResponseDto[]>;
    getAgentStats(id: string, userId: string): Promise<any>;
    getAgentTypeCounts(_userId: string): Promise<Record<string, number>>;
    activateAgent(id: string, userId: string): Promise<AgentResponseDto>;
    deactivateAgent(id: string, userId: string): Promise<AgentResponseDto>;
    pauseAgent(id: string, userId: string): Promise<AgentResponseDto>;
    markAgentBusy(id: string, userId: string): Promise<AgentResponseDto>;
    markAgentError(id: string, userId: string): Promise<AgentResponseDto>;
    deployAgent(id: string, userId: string, target?: 'cloud' | 'local' | 'hybrid'): Promise<{
        agent: AgentResponseDto;
        deployment: {
            status: 'deployed';
            target: 'cloud' | 'local' | 'hybrid';
            orchestrator: 'kubernetes' | 'docker' | 'hybrid';
            deployedAt: string;
        };
    }>;
    searchAgents(userId: string, query: string, _page?: number, _limit?: number): Promise<{
        data: AgentResponseDto[];
        total: number;
    }>;
    /**
     * Update agent profile (self-identification)
     * Allows agents to update their own profile information
     */
    updateAgentProfile(id: string, profileDto: any, userId: string): Promise<AgentResponseDto>;
    private mapAgentToResponse;
    private normalizeMetadataInput;
    private extractMetadataValue;
    private attachMetadata;
}
//# sourceMappingURL=agent.service.d.ts.map