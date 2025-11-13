/**
 * Context management for agent operations
 * Handles context storage, retrieval, and synchronization
 */
import { Redis } from 'ioredis';
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
    private redisClient?;
    private localContext;
    constructor(contextType: ContextType, entityId: string, redisClient?: Redis);
    /**
     * Store context entry
     */
    store(key: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void>;
}
//# sourceMappingURL=manager.d.ts.map