import type { Agent } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
export declare class AgentLoader {
    private readonly db;
    private readonly request;
    private readonly batchAgents;
    private readonly batchAgentsByUser;
    constructor(db: DatabaseService, request: any);
    load(agentId: string): Promise<Agent | null>;
    loadMany(agentIds: string[]): Promise<(Agent | null)[]>;
    loadByUserId(userId: string): Promise<Agent[]>;
}
//# sourceMappingURL=agent.loader.d.ts.map