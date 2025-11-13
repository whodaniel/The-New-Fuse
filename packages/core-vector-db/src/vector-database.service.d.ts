import { OnModuleInit } from '@nestjs/common';
import type { VectorDocument, VectorQuery, VectorSearchResult, CollectionConfig, VectorDatabaseConfig, EmbeddingConfig } from './interface/vector-database.interface';
export declare class VectorDatabaseService implements OnModuleInit {
    private readonly dbConfig;
    private readonly embeddingConfig;
    private readonly logger;
    private vectorDb;
    private embeddingProvider;
    constructor(dbConfig: VectorDatabaseConfig, embeddingConfig: EmbeddingConfig);
    onModuleInit(): Promise<void>;
    private initializeProviders;
    createCollection(config: CollectionConfig): Promise<void>;
    deleteCollection(name: string): Promise<void>;
    listCollections(): Promise<string[]>;
    collectionExists(name: string): Promise<boolean>;
    addDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
    updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
    deleteDocument(collection: string, id: string): Promise<void>;
    getDocument(collection: string, id: string): Promise<VectorDocument | null>;
    searchByText(collection: string, query: string, options?: Partial<Omit<VectorQuery, 'query' | 'embedding'>>): Promise<VectorSearchResult[]>;
    searchByEmbedding(collection: string, embedding: number[], options?: Partial<Omit<VectorQuery, 'embedding'>>): Promise<VectorSearchResult[]>;
    hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    batchAddDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
    batchDeleteDocuments(collection: string, ids: string[]): Promise<void>;
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    getEmbeddingDimension(): number;
    getEmbeddingModel(): string;
    isHealthy(): Promise<boolean>;
    getStats(collection?: string): Promise<Record<string, any>>;
    semanticSearch(collection: string, query: string, options?: {
        limit?: number;
        threshold?: number;
        metadata_filter?: Record<string, any>;
        include_scores?: boolean;
    }): Promise<VectorSearchResult[]>;
    findSimilarDocuments(collection: string, documentId: string, options?: {
        limit?: number;
        threshold?: number;
        metadata_filter?: Record<string, any>;
    }): Promise<VectorSearchResult[]>;
}
//# sourceMappingURL=vector-database.service.d.ts.map