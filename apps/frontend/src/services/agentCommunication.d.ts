interface AgentMessage {
    id?: string;
    type: string;
    message: string;
    timestamp?: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    targetAgent?: string;
    metadata?: Record<string, any>;
}
declare class AgentCommunicationService {
    private currentAgentId;
    constructor();
    private setupListeners;
    setCurrentAgent(agentId: string): void;
    getCurrentAgent(): string;
    /**
     * Send a broadcast message to all agents
     */
    broadcastMessage(message: Omit<AgentMessage, 'senderId'>): void;
    /**
     * Send a direct message to a specific agent
     */
    sendDirectMessage(targetAgent: string, message: Omit<AgentMessage, 'senderId' | 'targetAgent'>): void;
    /**
     * Subscribe to a direct channel for the current agent
     */
    subscribeToDirectChannel(): void;
    /**
     * Subscribe to broadcast channel
     */
    subscribeToBroadcastChannel(): void;
}
export declare const agentCommunicationService: AgentCommunicationService;
export {};
