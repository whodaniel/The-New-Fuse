/**
 * Agent service implementation
 * Follows the standardized service pattern
 */
import { Logger } from '@nestjs/common';
import { BaseService } from './base.service';
import { Agent as AppAgent, CreateAgentDto } from '@the-new-fuse/types';
import { PrismaService } from '../prisma/prisma.service';
export declare class AgentService extends BaseService<AppAgent> {
    private readonly prisma;
    protected readonly logger: Logger;
    protected readonly repository: any;
    constructor(prisma: PrismaService);
    /**
     * Create a new agent
     * @param data Agent creation data
     * @param userId User ID
     * @returns Created agent
     */
    createAgent(data: CreateAgentDto, userId: string): Promise<AppAgent>;
}
//# sourceMappingURL=agent.service.d.ts.map