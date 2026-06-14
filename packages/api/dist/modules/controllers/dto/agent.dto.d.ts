import { AgentStatus } from '@the-new-fuse/types';
/**
 * DTO class for Agent model to be used with Swagger
 */
export declare class AgentDto {
    id?: string;
    name: string;
    type?: string;
    status?: AgentStatus;
    userId?: string;
    capabilities?: string[];
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    provider?: string;
    lastActive?: Date;
    metadata?: any;
    systemPrompt?: string;
    model?: string;
    version?: string;
    config?: Record<string, any>;
    configuration?: Record<string, any>;
    profile?: Record<string, any>;
}
//# sourceMappingURL=agent.dto.d.ts.map