import { CreateAgentDto, UpdateAgentDto } from "@the-new-fuse/types";
import { DatabaseService } from '../lib/drizzle.service.tsx';
import { ConfigService } from "@nestjs/config";
import { Request } from 'express';
export declare class AgentController {
    private readonly drizzleService;
    private readonly configService;
    private readonly agentService;
    constructor(drizzleService: DatabaseService, configService: ConfigService);
    createAgent(data: CreateAgentDto, req: Request): Promise<Agent>;
    getAgentById(id: string, req: Request): Promise<any>;
    updateAgent(id: string, updates: UpdateAgentDto, req: Request): Promise<Agent>;
    deleteAgent(id: string, req: Request): Promise<void>;
}
//# sourceMappingURL=agentController.d.ts.map