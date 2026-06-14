import { UserType } from './user.type';
export declare enum AgentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PROCESSING = "PROCESSING",
    ERROR = "ERROR"
}
export declare class AgentType {
    id: string;
    name: string;
    type: string;
    description?: string;
    instanceId?: string;
    isActive: boolean;
    capabilities?: string[];
    owner?: UserType;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date;
    config?: string;
    metadata?: string;
    status: AgentStatus;
}
//# sourceMappingURL=agent.type.d.ts.map