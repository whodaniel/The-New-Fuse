import { Message } from '@the-new-fuse/types';
import { BaseService } from '../core/BaseService';
type UUID = string;
export interface ChatMessage extends Message {
    senderAgentId: UUID;
    recipientAgentId: UUID;
    conversationId?: UUID;
}
export interface BroadcastMessage extends Message {
    senderAgentId: UUID;
    topic?: string;
}
export interface ChatTransport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: ChatMessage): Promise<void>;
    broadcastMessage(message: BroadcastMessage): Promise<void>;
    onMessage(handler: (message: ChatMessage | BroadcastMessage) => void): void;
    subscribeToAgent(agentId: UUID): Promise<void>;
    unsubscribeFromAgent(agentId: UUID): Promise<void>;
    subscribeToTopic?(topic: string): Promise<void>;
    unsubscribeFromTopic?(topic: string): Promise<void>;
}
/**
 * Service responsible for facilitating communication between different agents.
 */
export declare class InterAgentChatService extends BaseService {
    private logger;
    private transport;
    private currentAgentId;
    constructor(transport: ChatTransport, agentId: UUID);
    private initializeTransport;
    /**
     * Sends a direct message to another agent.
     * @param recipientAgentId The ID of the recipient agent.
     * @param content The message content.
     * @param type The type of the message (defaults to 'chat').
     * @param conversationId Optional conversation ID.
     */
    sendMessage(recipientAgentId: UUID, content: string | Record<string, unknown>, _type?: any, conversationId?: UUID): Promise<void>;
    /**
     * Broadcasts a message to all subscribed agents (or a specific topic).
     * @param content The message content.
     * @param type The type of the message (defaults to 'broadcast').
     * @param topic Optional topic for targeted broadcast.
     */
    broadcast(content: string | Record<string, unknown>, topic?: string): Promise<void>;
    /**
     * Handles incoming messages from the transport layer.
     * @param message The received message.
     */
    private handleIncomingMessage;
    /**
     * Subscribe to a specific topic for broadcast messages.
     * Requires transport support.
     * @param topic The topic name.
     */
    subscribeToTopic(topic: string): Promise<void>;
    /**
     * Unsubscribe from a specific topic.
     * Requires transport support.
     * @param topic The topic name.
     */
    unsubscribeFromTopic(topic: string): Promise<void>;
    disconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=InterAgentChatService.d.ts.map