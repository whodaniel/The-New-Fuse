import { AgentType, AgentStatus } from '@the-new-fuse/types';
export declare class AgentProfileDto {
    about?: string;
    personality?: string;
    avatar?: string;
    emoji?: string;
    tags?: string[];
    creator?: string;
    version?: string;
}
export declare class CreateAgentDto {
    name: string;
    description?: string;
    type: AgentType;
    capabilities?: string[];
    config?: Record<string, any>;
    systemPrompt?: string;
    profile?: AgentProfileDto;
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    capabilities?: string[];
    config?: Record<string, any>;
    systemPrompt?: string;
    status?: AgentStatus;
    profile?: AgentProfileDto;
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
    profile?: AgentProfileDto;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=agent.dto.d.ts.map