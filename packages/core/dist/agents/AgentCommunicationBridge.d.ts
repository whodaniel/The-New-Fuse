import { Observable } from 'rxjs';
export interface AgentMessage {
    id: string;
    sender: string;
    recipient: string;
    content: unknown;
    metadata?: Record<string, unknown>;
    timestamp: string;
    type: 'direct' | 'broadcast' | 'task_request' | 'task_response' | 'status_update' | 'error';
    priority: 'low' | 'medium' | 'high';
}
export declare class AgentCommunicationBridge {
    private readonly channels;
    private readonly logger;
    private readonly messageQueue;
    private circuitBreaker?;
    constructor();
    sendMessage(message: AgentMessage): Promise<void>;
    subscribeToMessages(agentId: string): Observable<AgentMessage>;
    sendDirectMessage(message: AgentMessage): Promise<void>;
    broadcastMessage(message: Omit<AgentMessage, 'recipient'>): Promise<void>;
    validateMessage(message: AgentMessage): Promise<boolean>;
    private getOrCreateChannel;
    getActiveChannels(): string[];
    closeChannel(agentId: string): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AgentCommunicationBridge.d.ts.map