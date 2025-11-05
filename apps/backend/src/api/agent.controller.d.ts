interface CreateAgentDto {
    name: string;
    type: string;
    description?: string;
    capabilities: string[];
    systemPrompt?: string;
}
interface UpdateAgentDto {
    name?: string;
    description?: string;
    capabilities?: string[];
    systemPrompt?: string;
}
interface Agent {
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    capabilities: string[];
    systemPrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AgentController {
    createAgent(data: CreateAgentDto): Promise<Agent>;
    getAgents(): Promise<Agent[]>;
    getActiveAgents(): Promise<Agent[]>;
    getAgentById(id: string): Promise<Agent>;
    updateAgent(id: string, updates: UpdateAgentDto): Promise<Agent>;
    updateAgentStatus(id: string, status: string): Promise<Agent>;
    deleteAgent(id: string): Promise<{
        message: string;
    }>;
}
export {};
//# sourceMappingURL=agent.controller.d.ts.map