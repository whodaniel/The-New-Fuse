import { LoggingService } from '../services/LoggingService';
export interface AgentMessage {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    type: 'request' | 'response' | 'notification' | 'broadcast';
    payload: any;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'acknowledged' | 'failed';
    metadata?: Record<string, any>;
}
export interface MessageHandler {
    (message: AgentMessage): Promise<void>;
}
export declare class AgentCommunicationManager {
    private readonly logger;
    private messages;
    private messageHandlers;
    private agentSubscriptions;
    constructor(logger: LoggingService);
    /**
     * Send message from one agent to another
     */
    sendMessage(fromAgentId: string, toAgentId: string, type: AgentMessage['type'], payload: any, metadata?: Record<string, any>): Promise<string>;
    /**
     * Broadcast message to all subscribed agents
     */
    broadcastMessage(fromAgentId: string, type: string, payload: any, metadata?: Record<string, any>): Promise<string[]>;
}
//# sourceMappingURL=AgentCommunicationManager.d.ts.map