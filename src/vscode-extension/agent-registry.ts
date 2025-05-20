export interface Agent {
    id: string;
    name: string;
    capabilities: string[];
    status: 'active' | 'inactive';
}

export class AgentRegistry {
    private agents: Map<string, Agent> = new Map();

    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
    }

    unregisterAgent(agentId: string): void {
        this.agents.delete(agentId);
    }

    getAgent(agentId: string): Agent | undefined {
        return this.agents.get(agentId);
    }

    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    getAgentsByCapability(capability: string): Agent[] {
        return this.getAllAgents().filter(agent => 
            agent.capabilities.includes(capability) && agent.status === 'active'
        );
    }
}