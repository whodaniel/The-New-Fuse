import { ApiClient } from './api-client';
import { CreateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';
export declare class AgentsClient extends ApiClient {
    private readonly basePath;
    createAgent(data: CreateAgentDto): Promise<AgentResponseDto>;
    getAgents(params?: {
        type?: AgentType;
        status?: AgentStatus;
        search?: string;
    }): Promise<AgentResponseDto[]>;
    getAgent(id: string): Promise<AgentResponseDto>;
    deleteAgent(id: string): Promise<void>;
    getActiveAgents(): Promise<AgentResponseDto[]>;
}
//# sourceMappingURL=agents.client.d.ts.map