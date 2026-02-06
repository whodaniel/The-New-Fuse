import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from "@the-new-fuse/types";
import { DatabaseService } from '../lib/drizzle.service.tsx';
import { ConfigService } from "@nestjs/config";
export declare class AgentService {
    private readonly drizzle;
    private readonly config;
    private readonly logger;
    constructor(drizzle: DatabaseService, config: ConfigService);
    private transformDrizzleAgent;
    createAgent(data: CreateAgentDto, userId: string): Promise<Agent>;
    getAgents(userId: string): Promise<Agent[]>;
    getAgent(id: string, userId: string): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent>;
    deleteAgent(id: string, userId: string): Promise<void>;
    getAgentsByCapability(capability: string, userId: string): Promise<Agent[]>;
    getActiveAgents(userId: string): Promise<Agent[]>;
    updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent>;
}
//# sourceMappingURL=agentService.d.ts.map