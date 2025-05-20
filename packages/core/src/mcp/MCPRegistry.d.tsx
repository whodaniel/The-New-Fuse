export declare class MCPRegistry {
    private static instance;
    private agents;
    private capabilities;
    static getInstance(): MCPRegistry;
    registerCapabilityProvider(agentId: string, capability: string): void;
    findCapabilityProviders(): Promise<void>;
}
