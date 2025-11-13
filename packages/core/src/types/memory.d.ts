/**
 * @fileoverview Memory system type definitions
 */
export interface MemoryContent {
    id: string;
    content: string;
    type: MemoryContentType;
    metadata: MemoryMetadata;
    embedding?: number[];
    createdAt: Date;
    updatedAt: Date;
    accessCount: number;
    lastAccessed: Date;
}
export declare enum MemoryContentType {
    TEXT = "TEXT",
    CODE = "CODE",
    CONVERSATION = "CONVERSATION",
    TASK_RESULT = "TASK_RESULT",
    KNOWLEDGE = "KNOWLEDGE",
    CONTEXT = "CONTEXT",
    INSTRUCTION = "INSTRUCTION"
}
export interface MemoryMetadata {
    source: string;
    agentId?: string;
    taskId?: string;
    workflowId?: string;
    tags: string[];
    importance: number;
    relevanceScore?: number;
    expiresAt?: Date;
    isPrivate: boolean;
}
export interface MemoryQuery {
    query: string;
    type?: MemoryContentType;
    agentId?: string;
    tags?: string[];
    limit?: number;
    minRelevance?: number;
    timeRange?: {
        start: Date;
        end: Date;
    };
    includeMetadata?: boolean;
}
export interface MemorySearchResult {
    content: MemoryContent;
    relevanceScore: number;
    matchedTerms: string[];
}
export interface MemoryQueryResult {
    results: MemorySearchResult[];
    totalCount: number;
    queryTime: number;
    suggestions?: string[];
}
export interface MemoryStorageConfig {
    provider: 'redis' | 'chromadb' | 'pinecone' | 'local';
    connectionString: string;
    maxMemorySize: number;
    retentionPolicy: MemoryRetentionPolicy;
    embeddingModel?: string;
    indexingStrategy: 'immediate' | 'batch' | 'lazy';
}
export interface MemoryRetentionPolicy {
    defaultTTL: number;
    maxAge: number;
    maxItems: number;
    cleanupInterval: number;
    priorityBased: boolean;
}
export interface MemoryOperation {
    type: 'store' | 'retrieve' | 'update' | 'delete' | 'search';
    contentId?: string;
    query?: MemoryQuery;
    content?: Partial<MemoryContent>;
    timestamp: Date;
    agentId: string;
    success: boolean;
    duration: number;
    error?: string;
}
export interface MemoryStats {
    totalItems: number;
    totalSize: number;
    averageRelevance: number;
    mostAccessedItems: MemoryContent[];
    recentOperations: MemoryOperation[];
    storageUtilization: number;
    indexingStatus: 'up-to-date' | 'indexing' | 'stale';
}
//# sourceMappingURL=memory.d.ts.map