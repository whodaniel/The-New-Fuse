import { MemoryItem, MemoryQuery } from './MemoryTypes';
export interface IndexEntry {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    tags: string[];
    timestamp: number;
    embedding: Float32Array;
    importance: number;
}
export interface SearchOptions {
    limit?: number;
    offset?: number;
    sortBy?: 'relevance' | 'timestamp' | 'importance';
    filters?: Record<string, unknown>;
}
export declare class MemoryIndexer {
    private readonly logger;
    private readonly textIndex;
    private readonly metadataIndex;
    private readonly tagIndex;
    private readonly timestampIndex;
    private readonly similarityThreshold;
    constructor();
    indexMemoryItem(item: MemoryItem): Promise<void>;
    removeFromIndex(itemId: string): Promise<void>;
    search(query: MemoryQuery, options?: SearchOptions): Promise<string[]>;
    reindex(items: MemoryItem[]): Promise<void>;
    private indexText;
    private indexMetadata;
    private indexTags;
    private searchText;
    private searchTags;
    private searchMetadata;
    private searchByCluster;
    private searchByDateRange;
    private tokenize;
    private flattenObject;
    private intersectSets;
    private intersectMultipleSets;
    getIndexStats(): {
        textTerms: number;
        metadataKeys: number;
        tags: number;
        totalItems: number;
    };
}
//# sourceMappingURL=MemoryIndexer.d.ts.map