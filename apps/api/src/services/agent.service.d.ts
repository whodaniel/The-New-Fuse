import { AgentRepository } from '@the-new-fuse/database';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';
export declare class AgentService {
    private agentRepository;
    constructor(agentRepository: AgentRepository);
    createAgent(createAgentDto: CreateAgentDto, userId: string): Promise<AgentResponseDto>;
    findAllAgents(userId?: string, filters?: any): Promise<AgentResponseDto[]>;
    findAgentById(id: string): Promise<AgentResponseDto>;
    updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto>;
    deleteAgent(id: string): Promise<void>;
    findAgentsByType(type: AgentType): Promise<AgentResponseDto[]>;
    findAgentsByStatus(status: AgentStatus): Promise<AgentResponseDto[]>;
    findAgentsByUserId(userId: string): Promise<AgentResponseDto[]>;
    updateAgentStatus(id: string, status: AgentStatus): Promise<AgentResponseDto>;
    getActiveAgents(): Promise<AgentResponseDto[]>;
    getAgentStats(id: string): Promise<any>;
    getAgentTypeCounts(): Promise<Record<string, number>>;
    activateAgent(id: string): Promise<AgentResponseDto>;
    deactivateAgent(id: string): Promise<AgentResponseDto>;
    pauseAgent(id: string): Promise<AgentResponseDto>;
    markAgentBusy(id: string): Promise<AgentResponseDto>;
    markAgentError(id: string): Promise<AgentResponseDto>;
    searchAgents(userId: string, query: string): Promise<AgentResponseDto[]>;
}
//# sourceMappingURL=agent.service.d.ts.map