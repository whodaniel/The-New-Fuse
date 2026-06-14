/**
 * Redis Pub/Sub Transport Adapter
 *
 * ORCHESTRATOR IMPROVEMENT: Architecture enhancement from federated intelligence
 * - Enables true distributed agent federation across containers/servers
 * - Replaces ad-hoc file-based queues with scalable event bus
 * - Supports horizontal scaling of relay servers
 */
import { EventEmitter } from 'events';
import { TransportAdapter, TransportType, UniversalMessage } from '../universal_bridge.js';
export interface RedisTransportConfig {
    redisUrl?: string;
    serialization?: 'json' | 'msgpack';
    reconnectOnError?: boolean;
    maxReconnectAttempts?: number;
}
export declare class RedisTransportAdapter extends EventEmitter implements TransportAdapter {
    type: TransportType;
    private publisher;
    private subscriber;
    private upstash;
    private messageHandlers;
    private config;
    private reconnectAttempts;
    private connected;
    constructor(config?: RedisTransportConfig);
    connect(): Promise<void>;
    private createRedisClient;
    private setupSubscriberHandlers;
    /**
     * Send a message
     */
    send(message: UniversalMessage): Promise<void>;
    /**
     * Subscribe to a pattern
     */
    subscribe(pattern: string, handler: (msg: UniversalMessage) => void): Promise<void>;
    /**
     * Unsubscribe from a pattern
     */
    unsubscribe(pattern: string): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Get connection status
     */
    isConnected(): boolean;
    /**
     * Get subscribed channels
     */
    getSubscribedChannels(): string[];
    /**
     * Serialize message based on config
     */
    private serialize;
    /**
     * Deserialize message based on config
     */
    private deserialize;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=RedisTransportAdapter.d.ts.map