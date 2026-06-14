interface SearchResult {
    id: bigint;
    filePath: string;
    entityType: string;
    entityName: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
    startLine?: number;
}
interface RelatedCode {
    entity: SearchResult;
    relationship: string;
    depth: number;
}
export declare class CodebaseSearch {
    private openai;
    private embeddingModel;
    constructor();
    /**
     * Semantic search: Find code similar to a natural language query
     * Example: "authentication logic", "database connection handling"
     */
    semanticSearch(searchQuery: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Find similar code blocks (for duplicate detection)
     */
    findSimilarCode(filePath: string, entityName: string, threshold?: number): Promise<SearchResult[]>;
    /**
     * Find code that imports/uses a specific entity (knowledge graph traversal)
     */
    findUsages(filePath: string, entityName: string): Promise<RelatedCode[]>;
    /**
     * Find what a specific entity imports/uses (reverse dependencies)
     */
    findDependencies(filePath: string, entityName: string): Promise<RelatedCode[]>;
    /**
     * Hybrid search: Combine semantic search with filters
     */
    hybridSearch(searchQuery: string, filters?: {
        entityType?: string[];
        language?: string[];
        filePath?: string;
    }, limit?: number): Promise<SearchResult[]>;
    /**
     * Get codebase statistics
     */
    getStatistics(): Promise<{
        totalEntities: number;
        totalFiles: number;
        totalRelationships: number;
        byType: Record<string, number>;
        byLanguage: Record<string, number>;
    }>;
    /**
     * Find code clusters (groups of similar code)
     */
    findCodeClusters(minSimilarity?: number): Promise<Array<SearchResult[]>>;
    /**
     * Generate embedding for a query string
     */
    private generateQueryEmbedding;
    /**
     * Log search for analytics
     */
    private logSearch;
    disconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=codebase-search.d.ts.map