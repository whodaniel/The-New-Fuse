import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: 'request' | 'response' | 'broadcast' | 'notification';
    payload: any;
    timestamp: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    requiresAck?: boolean;
    correlationId?: string;
}
export interface AgentConnection {
    id: string;
    name: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy' | 'idle';
    lastSeen: number;
    websocket?: WebSocket;
    metadata: Record<string, any>;
}
export interface CommunicationChannel {
    id: string;
    name: string;
    type: 'direct' | 'group' | 'broadcast';
    participants: string[];
    encrypted: boolean;
    persistent: boolean;
    metadata: Record<string, any>;
}
export interface MessageFilter {
    agentId?: string;
    messageType?: string;
    priority?: string;
    timeRange?: {
        start: number;
        end: number;
    };
    keywords?: string[];
}
export declare class RealtimeCommunicationHub extends EventEmitter {
    private agents;
    private channels;
    private messageHistory;
    private pendingAcks;
    private wsServer?;
    private port;
    private isRunning;
    constructor(port?: number);
    /**
     * Start the communication hub
     */
    start(): Promise<void>;
    /**
     * Stop the communication hub
     */
    stop(): Promise<void>;
    /**
     * Register a new agent
     */
    registerAgent(agent: Omit<AgentConnection, 'lastSeen' | 'status'>): Promise<void>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Send message to specific agent(s)
     */
    sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Create a communication channel
     */
    createChannel(channel: Omit<CommunicationChannel, 'id'>): Promise<string>;
    /**
     * Join a channel
     */
    joinChannel(agentId: string, channelId: string): Promise<void>;
    /**
     * Leave a channel
     */
    leaveChannel(agentId: string, channelId: string): Promise<void>;
    /**
     * Send message to channel
     */
    sendChannelMessage(channelId: string, message: Omit<AgentMessage, 'id' | 'timestamp' | 'to'>): Promise<string>;
    /**
     * Get agent status
     */
    getAgentStatus(agentId: string): AgentConnection | undefined;
    /**
     * Get all online agents
     */
    getOnlineAgents(): AgentConnection[];
    /**
     * Get message history
     */
    getMessageHistory(agentId: string, filter?: MessageFilter): AgentMessage[];
    /**
     * Get channel information
     */
    getChannel(channelId: string): CommunicationChannel | undefined;
    /**
     * Get all channels
     */
    getAllChannels(): CommunicationChannel[];
    /**
     * Handle new WebSocket connection
     */
    private handleNewConnection;
    /**
     * Deliver message to specific agent
     */
    private deliverMessage;
    /**
     * Handle offline message delivery
     */
    private handleOfflineDelivery;
    /**
     * Store message in history
     */
    private storeMessage;
    /**
     * Setup acknowledgment timeout
     */
    private setupAckTimeout;
    /**
     * Handle message acknowledgment
     */
    private handleAcknowledgment;
    /**
     * Setup default channels
     */
    private setupDefaultChannels;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Generate unique channel ID
     */
    private generateChannelId;
    /**
     * Get communication statistics
     */
    getStatistics(): {
        totalAgents: number;
        onlineAgents: number;
        totalChannels: number;
        totalMessages: number;
        messagesPerAgent: Record<string, number>;
    };
}
export default RealtimeCommunicationHub;
//# sourceMappingURL=RealtimeCommunication.d.ts.map