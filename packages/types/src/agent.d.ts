import { BaseEntity } from './core/base-types';
import { AgentCapability, AgentStatus, AgentRole } from './core/enums';
export { AgentCapability, AgentStatus, AgentRole };
export declare enum AgentType {
    BASIC = "BASIC",
    CHAT = "CHAT",
    WORKFLOW = "WORKFLOW",
    TASK = "TASK",
    ASSISTANT = "ASSISTANT",
    ANALYSIS = "ANALYSIS",
    CONVERSATIONAL = "CONVERSATIONAL",
    IDE_EXTENSION = "IDE_EXTENSION",
    API = "API"
}
export declare class Agent implements BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: AgentType;
    status: AgentStatus;
    description?: string;
    systemPrompt?: string;
    capabilities?: AgentCapability[];
    configuration?: unknown;
    constructor(data: Partial<Agent>);
}
export declare class CreateAgentDto {
    name: string;
    type: AgentType;
    description?: string;
    systemPrompt?: string;
    capabilities?: AgentCapability[];
    configuration?: unknown;
    metadata?: unknown;
    role?: AgentRole;
    provider?: string;
    constructor(data: Partial<CreateAgentDto>);
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    systemPrompt?: string;
    capabilities?: AgentCapability[];
    configuration?: unknown;
    status?: AgentStatus;
    metadata?: unknown;
    type?: AgentType;
    role?: AgentRole;
    constructor(data?: Partial<UpdateAgentDto>);
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    type: AgentType;
    description?: string;
    status: AgentStatus;
    capabilities?: AgentCapability[];
    provider?: string;
    lastActive?: Date;
    metadata?: unknown;
    createdAt: Date;
    updatedAt: Date;
    constructor(data: Partial<AgentResponseDto>);
}
//# sourceMappingURL=agent.d.ts.map