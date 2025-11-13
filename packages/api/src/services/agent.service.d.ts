import { Agent } from '../types/agent';
import { BaseService } from './base.service';
import { AgentRepository } from '../repositories/agent.repository';
declare class LocalAIDetectionService {
    detectAndCreateAgents(userId: string): Promise<any[]>;
    getAvailableProviders(): Promise<string[]>;
}
export declare class AgentService extends BaseService<Agent> {
    private readonly agentRepository;
    private readonly localAIDetectionService;
    protected readonly repository: AgentRepository;
    constructor(agentRepository: AgentRepository, localAIDetectionService: LocalAIDetectionService);
    /**
     * Handle errors consistently
     */
    private handleError;
    const agentData: any;
    const updatedAgent: any;
}
export {};
//# sourceMappingURL=agent.service.d.ts.map