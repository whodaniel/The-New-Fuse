/**
 * Universal Bridge - Unified Agent Communication Layer
 *
 * Provides a single interface for agent-to-agent communication regardless
 * of the underlying transport (WebSocket, HTTP, Redis, MCP).
 *
 * CONNECTS TO:
 * - BaseBridge: Base class for bridges (from index.ts)
 * - EventEmitter: For pub/sub communication
 * - Relay transports: WebSocket, HTTP, Redis (from relay-core)
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface UniversalMessage {
    id: string;
    type: MessageType;
    priority: Priority;
    source: {
        agentId: string;
        bridgeType: string;
    };
    target: {
        agentId: string;
        broadcastGroup?: string;
    };
    payload: any;
    metadata: {
        timestamp: Date;
        correlationId?: string;
        replyTo?: string;
        ttl?: number;
        encrypted?: boolean;
    };
}
export type TransportType = 'websocket' | 'http' | 'redis' | 'memory' | 'mcp';
export interface TransportAdapter {
    type: TransportType;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: UniversalMessage): Promise<void>;
    subscribe(pattern: string, handler: (message: UniversalMessage) => void): void;
    unsubscribe(pattern: string): void;
    isConnected(): boolean;
}
export interface TransportConfig {
    type: TransportType;
    options: Record<string, any>;
}
export interface UniversalBridgeConfig {
    agentId: string;
    agentName?: string;
    transports: TransportConfig[];
    defaultTransport?: TransportType;
    retryAttempts?: number;
    retryDelayMs?: number;
    messageTimeout?: number;
}
/**
 * Universal Bridge - Main implementation
 */
export declare class UniversalBridge extends BaseBridge {
    private config;
    private transports;
    private pendingReplies;
    private messageHandlers;
    constructor(config: UniversalBridgeConfig);
    /**
     * Connect all configured transports
     */
    connect(): Promise<void>;
    /**
     * Disconnect all transports
     */
    disconnect(): Promise<void>;
    /**
     * Send a message (implements BaseBridge)
     */
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Send a universal message with more control
     */
    send(message: UniversalMessage, transportType?: TransportType): Promise<void>;
    /**
     * Send and wait for a reply
     */
    sendAndWaitForReply(targetAgentId: string, payload: any, options?: {
        timeout?: number;
        priority?: Priority;
        transportType?: TransportType;
    }): Promise<UniversalMessage>;
    /**
     * Broadcast a message to all agents in a group
     */
    broadcast(groupId: string, payload: any, messageType?: MessageType): Promise<void>;
    /**
     * Register a message handler
     */
    onMessage(handler: (message: UniversalMessage) => void | Promise<void>): void;
    /**
     * Register a handler for specific message types
     */
    onMessageType(type: MessageType, handler: (message: UniversalMessage) => void | Promise<void>): void;
    /**
     * Reply to a message
     */
    reply(originalMessage: UniversalMessage, payload: any): Promise<void>;
    /**
     * Get a specific transport
     */
    private getTransport;
    /**
     * Create a transport adapter based on configuration
     */
    private createTransportAdapter;
    /**
     * Handle incoming messages
     */
    private handleIncomingMessage;
    /**
     * Generate a unique message ID
     */
    private generateMessageId;
    /**
     * Get bridge statistics
     */
    getStats(): {
        agentId: string;
        connectedTransports: TransportType[];
        pendingReplies: number;
        handlerCount: number;
    };
}
export default UniversalBridge;
//# sourceMappingURL=universal_bridge.d.ts.map