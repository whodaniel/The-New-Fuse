import { ApiClient } from './api-client.js';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';
export declare class AgentsClient extends ApiClient {
    private readonly basePath;
    createAgent(data: CreateAgentDto): Promise<AgentResponseDto>;
    getAgents(params?: {
        type?: AgentType;
        status?: AgentStatus;
        search?: string;
    }): Promise<AgentResponseDto[]>;
    getAgent(id: string): Promise<AgentResponseDto>;
    updateAgent(id: string, data: UpdateAgentDto): Promise<AgentResponseDto>;
    deleteAgent(id: string): Promise<void>;
    getActiveAgents(): Promise<AgentResponseDto[]>;
    getAgentTypeCounts(): Promise<Record<string, number>>;
    getAgentStats(id: string): Promise<any>;
    activateAgent(id: string): Promise<AgentResponseDto>;
    deactivateAgent(id: string): Promise<AgentResponseDto>;
    pauseAgent(id: string): Promise<AgentResponseDto>;
    markAgentBusy(id: string): Promise<AgentResponseDto>;
    markAgentError(id: string): Promise<AgentResponseDto>;
}
//# sourceMappingURL=agents.client.d.ts.map