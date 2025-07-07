import { EventEmitter } from 'events';
import { MemoryItem, SearchResult, MemoryQuery } from './MemoryTypes';
export declare enum VectorMemoryEventType {
    ITEM_ADDED = "item_added",
    ITEM_UPDATED = "item_updated",
    ITEM_REMOVED = "item_removed",
    MEMORY_PRUNED = "memory_pruned",
    CACHE_HIT = "cache_hit",
    CACHE_MISS = "cache_miss"
}
export interface VectorStoreConfig {
    apiEndpoint: string;
    apiKey: string;
    embeddingModel: string;
    dimensions: number;
    maxItems: number;
    similarityThreshold: number;
}
export declare class VectorMemoryStore extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly memoryItems;
    private readonly embeddings;
    constructor();
    addItem(item: MemoryItem): Promise<void>;
    updateItem(item: MemoryItem): Promise<void>;
    removeItem(itemId: string): Promise<void>;
    findSimilarItems(query: MemoryQuery): Promise<SearchResult[]>;
    getAllItems(): Promise<MemoryItem[]>;
    getItem(itemId: string): Promise<MemoryItem | undefined>;
    clear(): Promise<void>;
    getStats(): Promise<{
        totalItems: number;
        memoryUsage: number;
        dimensions: number;
        maxItems: number;
    }>;
    private generateEmbedding;
    private calculateCosineSimilarity;
    private passesFilters;
    private simpleHash;
    onItemAdded(callback: (item: MemoryItem) => void): void;
    onItemUpdated(callback: (item: MemoryItem) => void): void;
    onItemRemoved(callback: (item: MemoryItem) => void): void;
    onMemoryPruned(callback: (prunedItems: MemoryItem[]) => void): void;
    onCacheHit(callback: (query: MemoryQuery) => void): void;
    onCacheMiss(callback: (query: MemoryQuery) => void): void;
}
//# sourceMappingURL=VectorMemoryStore.d.ts.map