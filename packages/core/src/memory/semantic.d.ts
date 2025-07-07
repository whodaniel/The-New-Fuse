import { ConfigService } from '@nestjs/config';
import { MemoryItem, SearchResult, MemoryQuery } from './MemoryTypes';
export interface SemanticSearchConfig {
    dimension: number;
    metric: 'l2' | 'ip' | 'cosine';
    maxElements: number;
    ef: number;
    efConstruction: number;
    M: number;
}
export declare class SemanticSearch {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private readonly items;
    constructor(configService: ConfigService);
    addItem(item: MemoryItem): Promise<void>;
    removeItem(itemId: string): Promise<boolean>;
    search(query: MemoryQuery): Promise<SearchResult[]>;
    getSimilarItems(itemId: string, limit?: number): Promise<SearchResult[]>;
    getStats(): Promise<{
        totalItems: number;
        dimension: number;
        metric: string;
        memoryUsage: string;
    }>;
    clear(): Promise<void>;
    private calculateSimilarity;
    private calculateCosineSimilarity;
    private calculateL2Distance;
    private calculateInnerProduct;
    private matchesFilters;
    private formatBytes;
}
//# sourceMappingURL=semantic.d.ts.map