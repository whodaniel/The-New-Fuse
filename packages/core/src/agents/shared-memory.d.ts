import { RedisService } from '../redis/redis.service';
export interface MemoryItem {
    id: string;
    agentId: string;
    taskId?: string;
    type: 'fact' | 'procedure' | 'event' | 'context';
    content: any;
    metadata: Record<string, any>;
    timestamp: Date;
    expiresAt?: Date;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
}
export interface MemoryFilter {
    agentId?: string;
    taskId?: string;
    type?: MemoryItem['type'];
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
}
export declare class SharedMemory {
    private readonly redisService?;
    private readonly logger;
    private readonly memoryItems;
    constructor(redisService?: RedisService);
    store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string>;
    retrieve(filter: MemoryFilter, limit?: number): Promise<MemoryItem[]>;
    update(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'timestamp'>>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    getById(id: string): Promise<MemoryItem | null>;
    clear(agentId?: string, taskId?: string): Promise<void>;
    search(query: string, filter?: MemoryFilter, limit?: number): Promise<MemoryItem[]>;
    getStats(agentId?: string): Promise<{
        totalItems: number;
        itemsByType: Record<string, number>;
        itemsByPriority: Record<string, number>;
    }>;
    private generateId;
}
//# sourceMappingURL=shared-memory.d.ts.map