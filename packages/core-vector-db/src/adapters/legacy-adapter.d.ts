import type { VectorDatabaseService } from '../vector-database.service';
import type { VectorDocument, VectorSearchResult } from '../interface/vector-database.interface';
interface LegacyVectorDocument {
    id?: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
}
interface LegacyVectorQuery {
    namespace?: string;
    filter?: Record<string, any>;
    limit?: number;
    includeVectors?: boolean;
    includeMetadata?: boolean;
}
interface LegacySearchResult {
    id: string;
    score: number;
    content: string;
    metadata: Record<string, any>;
    embedding?: number[];
}
interface LegacyVectorStoreProvider {
    name: string;
    storeVectors: (documents: LegacyVectorDocument[], namespace: string) => Promise<string[]>;
    search: (queryEmbedding: number[], options: LegacyVectorQuery) => Promise<LegacySearchResult[]>;
    deleteVectors: (ids: string[], namespace: string) => Promise<boolean>;
    clearNamespace: (namespace: string) => Promise<boolean>;
}
/**
 * Legacy Adapter for Core Vector Database Service
 *
 * This adapter provides backward compatibility with the existing vector database
 * implementations in packages/core while using the new core-vector-db service.
 */
export declare class LegacyVectorAdapter implements LegacyVectorStoreProvider {
    private readonly vectorService;
    private readonly defaultCollection;
    readonly name = "CoreVectorDBAdapter";
    constructor(vectorService: VectorDatabaseService, defaultCollection?: string);
    /**
     * Store vectors using legacy interface
     */
    storeVectors(documents: LegacyVectorDocument[], namespace: string): Promise<string[]>;
}
/**
 * Factory function to create legacy adapter
 */
export declare function createLegacyAdapter(vectorService: VectorDatabaseService, defaultCollection?: string): LegacyVectorStoreProvider;
/**
 * Utility functions for type conversion between legacy and new formats
 */
export declare class TypeConverter {
    /**
     * Convert legacy VectorDocument to new format
     */
    static legacyToNew(legacy: LegacyVectorDocument): VectorDocument;
    /**
     * Convert new VectorDocument to legacy format
     */
    static newToLegacy(doc: VectorDocument): LegacyVectorDocument;
    /**
     * Convert legacy search result to new format
     */
    static legacySearchToNew(legacy: LegacySearchResult): VectorSearchResult;
    /**
     * Convert new search result to legacy format
     */
    static newSearchToLegacy(result: VectorSearchResult): LegacySearchResult;
    private static generateId;
}
export {};
//# sourceMappingURL=legacy-adapter.d.ts.map