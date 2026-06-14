/**
 * Context management for agent operations
 * Handles context storage, retrieval, and synchronization
 */
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare enum ContextType {
    AGENT = "agent",
    SESSION = "session",
    TASK = "task",
    WORKFLOW = "workflow",
    USER = "user"
}
export interface ContextEntry {
    id: string;
    type: ContextType;
    data: Record<string, unknown>;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export declare class ContextManager {
    private contextType;
    private entityId;
    private redisService?;
    private localContext;
    constructor(contextType: ContextType, entityId: string, redisService?: UnifiedRedisService);
    /**
     * Store context entry
     */
    store(key: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Retrieve context entry
     */
    retrieve(key: string): Promise<ContextEntry | null>;
    /**
     * Update context entry
     */
    update(key: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Remove context entry
     */
    remove(key: string): Promise<void>;
    /**
     * Clear all context entries
     */
    clear(): Promise<void>;
    /**
     * Get all context keys
     */
    getKeys(): Promise<string[]>;
    /**
     * Get context statistics
     */
    getStats(): {
        localCount: number;
        type: ContextType;
        entityId: string;
    };
}
//# sourceMappingURL=manager.d.ts.map