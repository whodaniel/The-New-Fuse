import { AgentMessage, AgentRegistration } from './src/types/agent-communication.js';
export declare class AgentClient {
    private static instance;
    private registeredAgents;
    private messageHandlers;
    private logger;
    private constructor();
    static getInstance(): AgentClient;
    register(name: string, capabilities: string[], version: string): Promise<string>;
    sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void>;
    subscribe(handler: (message: AgentMessage) => Promise<void>, agentId?: string): () => void;
    deactivateAgent(agentId: string): void;
    activateAgent(agentId: string): void;
    getRegisteredAgents(): AgentRegistration[];
}
//# sourceMappingURL=agent-communication.d.ts.map