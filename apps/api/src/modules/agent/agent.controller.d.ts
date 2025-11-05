import { AgentService } from './agent.service';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    createAgent(data: CreateAgentDto, user: any): Promise<Agent>;
    getAgents(user: any, capability?: string): Promise<Agent[]>;
    getActiveAgents(user: any): Promise<Agent[]>;
    getAgentById(id: string, user: any): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto, user: any): Promise<Agent>;
    updateAgentStatus(id: string, status: AgentStatus, user: any): Promise<Agent>;
    deleteAgent(id: string, user: any): Promise<void>;
}
//# sourceMappingURL=agent.controller.d.ts.map