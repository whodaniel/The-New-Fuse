/**
 * Agent-related type definitions
 */
import { UUID, ISODateTime } from './common';
export declare enum AgentType {
    HUMAN = "human",
    AI = "ai",
    ASSISTANT = "assistant",
    WORKER = "worker",
    SUPERVISOR = "supervisor",
    SPECIALIST = "specialist"
}
export declare enum IntegrationLevel {
    STANDALONE = "standalone",
    BASIC = "basic",
    ADVANCED = "advanced",
    FULL = "full"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    LEARNING = "learning",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    TRAINING = "training"
}
export type AgentCapability = 'text-generation' | 'code-generation' | 'image-generation' | 'data-analysis' | 'research' | 'task-planning' | 'task-execution' | 'task-monitoring';
export interface AgentModel {
    id: UUID;
    name: string;
    role: string;
    description?: string;
    type: AgentType;
    channel: string;
    capabilities: AgentCapability[];
    integrationLevel: IntegrationLevel;
    status: AgentStatus;
    isActive: boolean;
    lastSeen?: ISODateTime;
    departmentId?: string;
    taskCount: number;
    successCount: number;
    failureCount: number;
    apiKey?: string;
    modelId?: string;
    settings?: Record<string, any>;
    metadata?: Record<string, any>;
    createdBy?: UUID;
    userId?: UUID;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export interface CreateAgentDto {
    name: string;
    description?: string;
    type: AgentType;
    capabilities: AgentCapability[];
    settings?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface UpdateAgentDto {
    name?: string;
    description?: string;
    type?: AgentType;
    status?: AgentStatus;
    capabilities?: AgentCapability[];
    settings?: Record<string, any>;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=agent.d.ts.map