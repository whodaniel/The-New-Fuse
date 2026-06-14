import { BaseEntity } from './core/base-types.js';
import { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel } from './core/enums.js';
export { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel };
export declare enum AgentType {
    BASIC = "BASIC",
    CHAT = "CHAT",
    WORKFLOW = "WORKFLOW",
    TASK = "TASK",
    ASSISTANT = "ASSISTANT",
    ANALYSIS = "ANALYSIS",
    CONVERSATIONAL = "CONVERSATIONAL",
    IDE_EXTENSION = "IDE_EXTENSION",
    API = "API",
    GITHUB_JULES = "GITHUB_JULES",
    DOMAIN_GAMING = "DOMAIN_GAMING"
}
export declare class Agent implements BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: AgentType;
    status: AgentStatus;
    trustLevel: AgentTrustLevel;
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
    trustLevel?: AgentTrustLevel;
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
    trustLevel?: AgentTrustLevel;
    constructor(data?: Partial<UpdateAgentDto>);
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    type: AgentType;
    description?: string;
    status: AgentStatus;
    trustLevel: AgentTrustLevel;
    capabilities?: AgentCapability[];
    provider?: string;
    lastActive?: Date;
    metadata?: unknown;
    profile?: AgentProfileDto;
    createdAt: Date;
    updatedAt: Date;
    constructor(data: Partial<AgentResponseDto>);
}
/**
 * Agent Profile DTO
 * Used for agent self-identification and discovery
 */
export declare class AgentProfileDto {
    about?: string;
    personality?: string;
    avatar?: string;
    emoji?: string;
    tags?: string[];
    creator?: string;
    version?: string;
    constructor(data?: Partial<AgentProfileDto>);
}
//# sourceMappingURL=agent.d.ts.map