export interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: string;
    capabilities: string[];
    status: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    config?: Record<string, unknown>;
}
export declare enum AgentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    DELETED = "DELETED"
}
export interface CreateAgentDto {
    name: string;
    description?: string;
    type: string;
    capabilities: string[];
    systemPrompt?: string;
    status?: AgentStatus;
    configuration?: Record<string, unknown>;
}
export interface UpdateAgentDto {
    name?: string;
    description?: string;
    systemPrompt?: string;
    capabilities?: string[];
    status?: AgentStatus;
    configuration?: Record<string, unknown>;
}
//# sourceMappingURL=agent.d.d.ts.map