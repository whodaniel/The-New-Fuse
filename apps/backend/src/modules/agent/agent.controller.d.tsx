import { AgentService } from './agent.service.js';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database/client';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    createAgent(data: CreateAgentDto, user: User): Promise<Agent>;
    getAgents(user: User, capability?: string): Promise<Agent[]>;
    getActiveAgents(user: User): Promise<Agent[]>;
    getAgentById(id: string, user: User): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto, user: User): Promise<Agent>;
    updateAgentStatus(id: string, status: AgentStatus, user: User): Promise<Agent>;
    deleteAgent(id: string, user: User): Promise<void>;
}
