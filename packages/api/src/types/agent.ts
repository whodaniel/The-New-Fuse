export enum AgentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    DELETED = 'DELETED'
}

export interface Agent {
    id: string;
    name: string;
    type: string;
    description?: string;
    capabilities?: string[];
    status?: AgentStatus;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}