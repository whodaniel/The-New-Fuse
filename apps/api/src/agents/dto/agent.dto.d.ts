import { AgentType, AgentStatus } from '@the-new-fuse/types';
export declare class CreateAgentDto {
    name: string;
    description?: string;
    type: AgentType;
    capabilities?: string[];
    config?: Record<string, any>;
    systemPrompt?: string;
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    capabilities?: string[];
    config?: Record<string, any>;
    systemPrompt?: string;
    status?: AgentStatus;
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    description?: string;
    type: AgentType;
    status: AgentStatus;
    capabilities: string[];
    config: Record<string, any>;
    systemPrompt?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=agent.dto.d.ts.map