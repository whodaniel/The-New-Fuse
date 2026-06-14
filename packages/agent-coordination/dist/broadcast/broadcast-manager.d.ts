import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { A2APriority } from '@the-new-fuse/a2a-core';
import { CoordinationChannel, MessageHandler } from '../types/coordination.types';
import { MessageSerializer } from '../serializers/message-serializer.js';
/**
 * Broadcast manager for multi-agent coordination
 */
export declare class BroadcastManager {
    private readonly redisService;
    private readonly logger;
    private readonly keyPrefix;
    private readonly serializer;
    private readonly handlers;
    private readonly subscriptions;
    constructor(redisService: UnifiedRedisService, keyPrefix: string, serializer: MessageSerializer);
    /**
     * Broadcast message to all agents
     */
    broadcast(fromAgent: string, payload: any, options?: {
        channel?: CoordinationChannel;
        topic?: string;
        priority?: A2APriority;
        ttl?: number;
    }): Promise<void>;
    /**
     * Subscribe to broadcast messages
     */
    subscribe(channel: CoordinationChannel, handler: MessageHandler, topic?: string): Promise<void>;
    /**
     * Subscribe to pattern-based channels
     */
    subscribePattern(channelPattern: string, handler: MessageHandler): Promise<void>;
    unsubscribe(channel: CoordinationChannel, topic?: string): Promise<void>;
    unsubscribePattern(channelPattern: string): Promise<void>;
    getSubscriptions(): string[];
    clearAll(): Promise<void>;
    private handleMessage;
    private matchesPattern;
}
//# sourceMappingURL=broadcast-manager.d.ts.map