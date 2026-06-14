/**
 * Communication Bridge - Inter-agent communication
 *
 * Provides communication capabilities between agents:
 * - Direct messaging
 * - Broadcast messaging
 * - Request/Response patterns
 * - Event streaming
 * - Channel subscriptions
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface Message {
    id: string;
    from: string;
    to: string | 'broadcast';
    channel?: string;
    type: MessageType;
    priority: Priority;
    payload: unknown;
    timestamp: Date;
    correlationId?: string;
    replyTo?: string;
    ttl?: number;
}
export interface Channel {
    name: string;
    subscribers: Set<string>;
    messageCount: number;
    createdAt: Date;
}
export interface PendingRequest {
    messageId: string;
    resolve: (response: Message) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}
export declare class CommunicationBridge extends BaseBridge {
    private channels;
    private subscribers;
    private pendingRequests;
    private messageHistory;
    private maxHistorySize;
    private defaultTimeout;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Create a message
     */
    createMsg(from: string, to: string | 'broadcast', payload: unknown, type?: MessageType, priority?: Priority): Message;
    /**
     * Send a message
     */
    send(message: Message): Promise<void>;
    /**
     * Send and wait for response
     */
    request(message: Message, timeout?: number): Promise<Message>;
    /**
     * Reply to a message
     */
    reply(originalMessage: Message, payload: unknown): Promise<void>;
    /**
     * Broadcast a message to all subscribers
     */
    private broadcast;
    /**
     * Subscribe to messages
     */
    subscribe(agentId: string, handler: (message: Message) => void): void;
    /**
     * Unsubscribe from messages
     */
    unsubscribe(agentId: string): void;
    /**
     * Create a channel
     */
    createChannel(name: string): Channel;
    /**
     * Delete a channel
     */
    deleteChannel(name: string): void;
    /**
     * Join a channel
     */
    joinChannel(channelName: string, agentId: string): void;
    /**
     * Leave a channel
     */
    leaveChannel(channelName: string, agentId: string): void;
    /**
     * Send to a channel
     */
    private sendToChannel;
    /**
     * Get channel info
     */
    getChannel(name: string): Channel | undefined;
    /**
     * List all channels
     */
    listChannels(): Channel[];
    /**
     * Add message to history
     */
    private addToHistory;
    /**
     * Get message history
     */
    getHistory(agentId?: string, limit?: number): Message[];
    getStatistics(): {
        connected: boolean;
        subscribers: number;
        channels: number;
        pendingRequests: number;
        historySize: number;
    };
}
export default CommunicationBridge;
//# sourceMappingURL=communication.d.ts.map