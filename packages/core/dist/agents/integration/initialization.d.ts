export interface InitializationPayload {
    action: string;
    capabilities: string[];
    workspace: string;
    status: string;
}
export interface InitializationMessage {
    type: 'initialization';
    source: string;
    target: string;
    timestamp: string;
    payload: InitializationPayload;
    priority: 'low' | 'medium' | 'high';
}
export interface AgentCapabilities {
    codeAnalysis: boolean;
    pairProgramming: boolean;
    codeReview: boolean;
    architectureDesign: boolean;
    typeSafety: boolean;
    documentation: boolean;
    workflowManagement: boolean;
    testing: boolean;
}
export interface InitializationOptions {
    workspace?: string;
    capabilities?: string[];
    priority?: 'low' | 'medium' | 'high';
    target?: string;
}
export declare const createInitializationMessage: (source: string, options?: InitializationOptions) => InitializationMessage;
export declare const createShutdownMessage: (source: string) => InitializationMessage;
export declare class AgentInitializationService {
    private static readonly logger;
    private static initialized;
    private static agents;
    static initializeAgent(agentId: string, options?: InitializationOptions): Promise<boolean>;
    static isInitialized(agentId: string): boolean;
    static getInitializedAgents(): string[];
    static getAgentInfo(agentId: string): InitializationMessage | undefined;
    static getAllAgentsInfo(): Array<{
        id: string;
        info: InitializationMessage;
    }>;
    static getAgentsByCapability(capability: string): string[];
    static updateAgentCapabilities(agentId: string, capabilities: string[]): boolean;
    static updateAgentStatus(agentId: string, status: string): boolean;
    private static broadcastMessage;
    static shutdown(agentId: string): Promise<boolean>;
    static shutdownAll(): Promise<number>;
    static getStats(): {
        totalAgents: number;
        activeAgents: number;
        capabilitiesDistribution: Record<string, number>;
    };
    static validateInitializationMessage(message: any): message is InitializationMessage;
}
//# sourceMappingURL=initialization.d.ts.map