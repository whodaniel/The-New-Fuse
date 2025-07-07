import { MemoryItem, Vector, SearchResult, MemoryQuery } from '../MemoryTypes';
export interface VectorCacheEntry {
    item: MemoryItem;
    embedding: Vector;
    lastAccessed: number;
    accessCount: number;
}
export interface VectorSearchOptions {
    limit?: number;
    minSimilarity?: number;
    filterByType?: string;
    includeMetadata?: boolean;
}
export declare class VectorMemoryCache {
    private readonly logger;
    private readonly cache;
    private readonly maxSize;
    private readonly embeddingDimension;
    private readonly similarityThreshold;
    constructor();
    store(item: MemoryItem): Promise<void>;
    get(id: string): Promise<MemoryItem | null>;
    search(query: MemoryQuery, options?: VectorSearchOptions): Promise<SearchResult[]>;
    getVectorsByType(type: string): Promise<VectorCacheEntry[]>;
    delete(id: string): Promise<boolean>;
    clear(): Promise<void>;
    has(id: string): Promise<boolean>;
    size(): Promise<number>;
    getStats(): Promise<{
        size: number;
        maxSize: number;
        memoryUsage: string;
        averageAccessCount: number;
    }>;
    private calculateCosineSimilarity;
    private evictLRU;
    private formatBytes;
}
//# sourceMappingURL=VectorMemoryCache.d.ts.map