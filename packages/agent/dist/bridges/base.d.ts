/**
 * Base Bridge - Abstract base class for all bridges
 *
 * Provides common functionality and interface for all bridge implementations.
 * All bridges should extend this class for consistent behavior.
 */
import { EventEmitter } from 'events';
import { MessageType, Priority } from './index.js';
export interface BridgeMessage {
    id: string;
    type: MessageType;
    priority: Priority;
    payload: unknown;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface BridgeConfig {
    name: string;
    autoConnect?: boolean;
    reconnectOnFailure?: boolean;
    reconnectDelayMs?: number;
    maxReconnectAttempts?: number;
    heartbeatIntervalMs?: number;
}
export interface BridgeStats {
    connected: boolean;
    messagesSent: number;
    messagesReceived: number;
    errors: number;
    uptime: number;
    lastActivity: Date | null;
}
export declare abstract class Bridge extends EventEmitter {
    protected name: string;
    protected config: BridgeConfig;
    protected isConnected: boolean;
    protected stats: BridgeStats;
    protected startTime: Date | null;
    protected heartbeatInterval: ReturnType<typeof setInterval> | null;
    protected reconnectAttempts: number;
    constructor(config: BridgeConfig);
    /**
     * Connect to the bridge endpoint
     */
    abstract connect(): Promise<void>;
    /**
     * Disconnect from the bridge endpoint
     */
    abstract disconnect(): Promise<void>;
    /**
     * Send a message through the bridge
     */
    abstract send(message: BridgeMessage): Promise<void>;
    /**
     * Handle an incoming message
     */
    abstract handleMessage(message: BridgeMessage): Promise<void>;
    /**
     * Get bridge name
     */
    getName(): string;
    /**
     * Check if connected
     */
    getConnected(): boolean;
    /**
     * Get bridge statistics
     */
    getStats(): BridgeStats;
    /**
     * Create a message with standard fields
     */
    createMessage(type: MessageType, payload: unknown, priority?: Priority): BridgeMessage;
    /**
     * Send a message with tracking
     */
    sendMessage(message: Record<string, unknown>, type?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Process received message
     */
    protected processMessage(message: BridgeMessage): Promise<void>;
    /**
     * Start heartbeat
     */
    protected startHeartbeat(): void;
    /**
     * Stop heartbeat
     */
    protected stopHeartbeat(): void;
    /**
     * Send heartbeat
     */
    protected sendHeartbeat(): Promise<void>;
    /**
     * Handle connection established
     */
    protected onConnected(): void;
    /**
     * Handle disconnection
     */
    protected onDisconnected(): void;
    /**
     * Attempt reconnection
     */
    protected attemptReconnect(): Promise<void>;
    /**
     * Handle error
     */
    protected onError(error: Error): void;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export default Bridge;
//# sourceMappingURL=base.d.ts.map