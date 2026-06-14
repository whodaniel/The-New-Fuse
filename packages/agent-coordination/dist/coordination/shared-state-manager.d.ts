import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SharedState, StateLock } from '../types/coordination.types';
import { MessageSerializer } from '../serializers/message-serializer.js';
/**
 * Shared state manager for collaborative agent tasks
 */
export declare class SharedStateManager {
    private readonly redisService;
    private readonly logger;
    private readonly keyPrefix;
    private readonly serializer;
    private readonly defaultTTL;
    private readonly lockTTL;
    constructor(redisService: UnifiedRedisService, keyPrefix: string, serializer: MessageSerializer);
    /**
     * Set shared state
     */
    setState(key: string, value: any, ownerId: string, options?: {
        ttl?: number;
        version?: number;
    }): Promise<SharedState>;
    /**
     * Get shared state
     */
    getState(key: string): Promise<SharedState | null>;
    /**
     * Update shared state with optimistic locking
     */
    updateState(key: string, updater: (currentValue: any) => any, ownerId: string): Promise<SharedState | null>;
    /**
     * Delete shared state
     */
    deleteState(key: string): Promise<boolean>;
    /**
     * Acquire lock on state
     */
    acquireLock(key: string, agentId: string, ttl?: number): Promise<StateLock | null>;
    /**
     * Release lock on state
     */
    releaseLock(key: string, lockId: string): Promise<boolean>;
    /**
     * Renew lock
     */
    renewLock(key: string, lockId: string, ttl?: number): Promise<boolean>;
    /**
     * Check if state is locked
     */
    isLocked(key: string): Promise<boolean>;
    /**
     * Get lock info
     */
    getLockInfo(key: string): Promise<StateLock | null>;
    /**
     * List all state keys
     */
    listStates(pattern?: string): Promise<string[]>;
    /**
     * Batch get states
     */
    batchGetStates(keys: string[]): Promise<Map<string, SharedState>>;
    /**
     * Batch set states
     */
    batchSetStates(states: Array<{
        key: string;
        value: any;
        ownerId: string;
        ttl?: number;
    }>): Promise<SharedState[]>;
    /**
     * Safely release locks held by specific agents
     * Scans all locks and deletes them if they belong to any of the provided agents.
     * Uses Lua script to ensure atomicity.
     */
    releaseLocksForAgents(redisService: UnifiedRedisService, agentIds: string[]): Promise<number>;
}
//# sourceMappingURL=shared-state-manager.d.ts.map