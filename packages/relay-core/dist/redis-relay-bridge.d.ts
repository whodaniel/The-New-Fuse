/**
 * Redis-Relay Bridge
 *
 * Bridges the WebSocket Relay to Redis for orchestration
 * Implements the "Data Plane → Control Plane" pattern
 *
 * Flow:
 * 1. Relay receives WS message
 * 2. Emits 'message' event
 * 3. Bridge publishes to Redis 'tnf:bus:ingress'
 * 4. Orchestrator processes via Redis
 * 5. Orchestrator publishes to 'tnf:bus:egress:{agentId}'
 * 6. Bridge subscribes and forwards back to Relay
 */
import { EventEmitter } from 'events';
import { TNFEnvelope } from './protocol/tnf-envelope';
export interface RedisRelayBridgeConfig {
    redisUrl: string;
    ingressChannel: string;
    egressChannelPrefix: string;
    enableLegacyShim: boolean;
}
export declare class RedisRelayBridge extends EventEmitter {
    private redisClient;
    private redisSubscriber;
    private upstashClient;
    private config;
    private connected;
    constructor(config?: Partial<RedisRelayBridgeConfig>);
    private setupErrorHandlers;
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Handle incoming message from Relay
     * Publishes to Redis ingress channel
     */
    handleRelayMessage(rawMessage: any, agentId: string): Promise<void>;
    /**
     * Subscribe to egress channel for a specific agent
     */
    subscribeToAgent(agentId: string, callback: (envelope: TNFEnvelope) => void): Promise<void>;
    /**
     * Unsubscribe from agent's egress channel
     */
    unsubscribeFromAgent(agentId: string): Promise<void>;
    /**
     * Wrap legacy message in TNF Envelope
     */
    private wrapLegacyMessage;
    /**
     * Publish message to ingress (for direct use)
     */
    publishToIngress(envelope: TNFEnvelope): Promise<void>;
    /**
     * Publish message to specific agent's egress
     */
    publishToAgent(agentId: string, envelope: TNFEnvelope): Promise<void>;
    /**
     * Get connection status
     */
    isConnected(): boolean;
}
/**
 * Create and configure bridge
 */
export declare function createRedisRelayBridge(config?: Partial<RedisRelayBridgeConfig>): RedisRelayBridge;
//# sourceMappingURL=redis-relay-bridge.d.ts.map