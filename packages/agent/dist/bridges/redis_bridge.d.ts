/**
 * Redis Transport Adapter for UniversalBridge
 *
 * Provides Redis pub/sub transport for distributed agent communication.
 *
 * CONNECTS TO:
 * - UniversalBridge: Parent bridge system
 * - Redis: Via ioredis for pub/sub
 * - EventEmitter: For local event handling
 */
import { EventEmitter } from 'events';
import type { TransportAdapter, TransportType, UniversalMessage } from './universal_bridge.js';
export interface RedisTransportConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    channelPrefix?: string;
    retryStrategy?: (times: number) => number | null;
}
/**
 * Redis Transport Adapter
 * Uses Redis pub/sub for distributed agent messaging
 */
export declare class RedisTransportAdapter extends EventEmitter implements TransportAdapter {
    type: TransportType;
    private publisher;
    private subscriber;
    private config;
    private subscriptions;
    private connected;
    private channelPrefix;
    constructor(config?: RedisTransportConfig);
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Send a message via Redis pub/sub
     */
    send(message: UniversalMessage): Promise<void>;
    /**
     * Subscribe to messages for a specific agent
     */
    subscribe(pattern: string, handler: (message: UniversalMessage) => void): void;
    /**
     * Unsubscribe from messages
     */
    unsubscribe(pattern: string): void;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Handle incoming Redis messages
     */
    private handleRedisMessage;
    /**
     * Get Redis channel name for an agent
     */
    private getChannel;
    /**
     * Attempt to load Redis client dynamically
     */
    private loadRedisClient;
    /**
     * Get transport statistics
     */
    getStats(): {
        connected: boolean;
        subscriptionCount: number;
        channelPrefix: string;
    };
}
export default RedisTransportAdapter;
//# sourceMappingURL=redis_bridge.d.ts.map