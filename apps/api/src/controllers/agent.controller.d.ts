import { AgentService } from '../services/agent.service';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    createAgent(createAgentDto: CreateAgentDto, user: User): Promise<AgentResponseDto>;
    getAgents(user: User, type?: AgentType, status?: AgentStatus, search?: string): Promise<AgentResponseDto[]>;
    getActiveAgents(): Promise<AgentResponseDto[]>;
    getAgentTypeCounts(): Promise<Record<string, number>>;
    getAgentById(id: string): Promise<AgentResponseDto>;
    getAgentStats(id: string): Promise<any>;
    updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto>;
    activateAgent(id: string): Promise<AgentResponseDto>;
    deactivateAgent(id: string): Promise<AgentResponseDto>;
    pauseAgent(id: string): Promise<AgentResponseDto>;
    markAgentBusy(id: string): Promise<AgentResponseDto>;
    markAgentError(id: string): Promise<AgentResponseDto>;
    deleteAgent(id: string): Promise<void>;
}
//# sourceMappingURL=agent.controller.d.ts.map