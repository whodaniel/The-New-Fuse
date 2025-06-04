import { AgentType, AgentStatus, AgentCapability } from '@the-new-fuse/types';
export declare class CreateAgentDto {
    name: string;
    type: AgentType;
    capabilities?: AgentCapability[];
    config?: Record<string, any>;
    description?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateAgentDto {
    name?: string;
    type?: AgentType;
    capabilities?: AgentCapability[];
    config?: Record<string, any>;
    description?: string;
    status?: AgentStatus;
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    capabilities: AgentCapability[];
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
