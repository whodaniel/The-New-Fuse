export interface PersistentMemoryConfig {
    agentId: string;
    maxContextTokens?: number;
    retentionDays?: number;
    autoSummarize?: boolean;
}
export interface MemoryEntry {
    id: string;
    agentId: string;
    category: 'task_history' | 'fact' | 'interaction' | 'decision' | 'error';
    content: string;
    embedding?: number[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    lastAccessedAt: string;
    accessCount: number;
    importance: number;
}
export interface MemoryQueryResult {
    entries: MemoryEntry[];
    total: number;
    queryTime: number;
}
export declare class AgentMemoryIntegration {
    private readonly logger;
    private readonly stores;
    private readonly configs;
    configure(config: PersistentMemoryConfig): void;
    store(agentId: string, category: MemoryEntry['category'], content: string, importance?: number, metadata?: Record<string, unknown>): Promise<string>;
    retrieve(agentId: string, query: string, limit?: number): Promise<MemoryQueryResult>;
    getTaskHistory(agentId: string, limit?: number): Promise<MemoryEntry[]>;
    getFacts(agentId: string): Promise<MemoryEntry[]>;
    getInteractions(agentId: string, limit?: number): Promise<MemoryEntry[]>;
    getContextWindow(agentId: string, maxTokens?: number): Promise<MemoryEntry[]>;
    deleteEntry(agentId: string, memoryId: string): Promise<boolean>;
    pruneExpired(agentId: string): Promise<number>;
    getStats(agentId: string): Record<string, unknown>;
    private ensureStore;
}
//# sourceMappingURL=AgentMemoryIntegration.d.ts.map