import { AgentStatus } from '@the-new-fuse/database/generated/prisma';
export declare class CreateAgentDto {
    name: string;
    description?: string;
    type: string;
    status?: AgentStatus;
    capabilities?: string[];
    provider: string;
    lastActive?: string;
    metadata?: any;
}
export declare class UpdateAgentDto {
    name?: string;
    description?: string;
    type?: string;
    status?: AgentStatus;
    capabilities?: string[];
    provider?: string;
    lastActive?: string;
    metadata?: any;
}
export declare class AgentResponseDto {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: AgentStatus;
    capabilities: string[];
    provider: string;
    lastActive: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=agent.dto.d.ts.map