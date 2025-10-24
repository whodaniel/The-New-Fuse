export class MCPRegistry {
    private static instance: MCPRegistry;
    private agents: Map<string, MCPAgent>;
    private capabilities: Map<string, Set<string>>;

    public static getInstance(): MCPRegistry {
        if (!MCPRegistry.instance) {
            MCPRegistry.instance = new MCPRegistry();
        }
        return MCPRegistry.instance;
    }

    public registerCapabilityProvider(agentId: string, capability: string): void {
        if (!this.capabilities.has(capability)) {
            this.capabilities.set(capability, new Set());
        }
        this.capabilities.get(capability)?.add(agentId);
    }

    public async findCapabilityProviders(): Promise<void> {capability: string): Promise<string[]> {
        return Array.from(this.capabilities.get(capability) || []);
    }
}