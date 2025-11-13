import { AgentStatus } from '@the-new-fuse/database/generated/prisma';
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
}
//# sourceMappingURL=agent.dto.d.ts.map