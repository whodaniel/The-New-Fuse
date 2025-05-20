import { Agent, CreateAgentDto, UpdateAgentDto } from '@/types/api';
export declare const agentService: {
    createAgent(agent: CreateAgentDto): Promise<Agent>;
    getAgents(): Promise<Agent[]>;
    getAgentById(id: string): Promise<Agent | undefined>;
    updateAgent(id: string, updates: UpdateAgentDto): Promise<Agent | undefined>;
    deleteAgent(id: string): Promise<boolean>;
};
