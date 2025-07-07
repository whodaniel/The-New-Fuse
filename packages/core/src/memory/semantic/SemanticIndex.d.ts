import { MemoryItem, SearchResult, MemoryQuery } from '../MemoryTypes';
export interface SemanticIndexConfig {
    dimension: number;
    maxElements: number;
    efConstruction: number;
    efSearch: number;
    M: number;
}
export declare class SemanticIndex {
    private readonly logger;
    private readonly config;
    private readonly items;
    constructor();
    addItem(item: MemoryItem): Promise<void>;
    removeItem(itemId: string): Promise<boolean>;
    search(query: MemoryQuery): Promise<SearchResult[]>;
    getStats(): Promise<{
        totalItems: number;
        dimension: number;
        memoryUsage: string;
    }>;
    private calculateCosineSimilarity;
    private matchesFilters;
    private formatBytes;
}
//# sourceMappingURL=SemanticIndex.d.ts.map