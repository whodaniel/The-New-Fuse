export declare const agentService: {
    createAgent(agent: any): Promise<any>;
    getAgents(): Promise<any>;
    getAgentById(id: any): Promise<any>;
    updateAgent(id: any, updates: any): Promise<any>;
    deleteAgent(id: any): Promise<boolean>;
};
