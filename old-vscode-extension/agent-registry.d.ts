export interface Agent {
    id: string;
    name: string;
    capabilities: string[];
    status: 'active' | 'inactive';
}
export declare class AgentRegistry {
    private agents;
    registerAgent(agent: Agent): void;
    unregisterAgent(agentId: string): void;
    getAgent(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    getAgentsByCapability(capability: string): Agent[];
}
//# sourceMappingURL=agent-registry.d.ts.map