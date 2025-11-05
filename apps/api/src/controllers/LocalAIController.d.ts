/**
 * Local AI Controller
 * Handles detection and registration of local AI providers as Agents
 */
import { AgentService } from '@the-new-fuse/api-core';
interface AuthenticatedRequest {
    user?: {
        id: string;
    };
}
export declare class LocalAIController {
    private agentService;
    private readonly logger;
    constructor(agentService: AgentService);
    detectLocalAIs(): Promise<void>;
    registerLocalAIs(req: AuthenticatedRequest): Promise<void>;
    refreshLocalAIs(req: AuthenticatedRequest): Promise<void>;
    getLocalAIAgents(req: AuthenticatedRequest): Promise<void>;
    getLocalAIAgentStatus(agentId: string, req: AuthenticatedRequest): Promise<void>;
    createSystemAgents(): Promise<void>;
}
export {};
//# sourceMappingURL=LocalAIController.d.ts.map