import { z } from 'zod';
export declare const VectorDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}, {
    id: string;
    content: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}>;
export declare const VectorQuerySchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    limit: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodNumber>;
    metadata_filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    threshold: number;
    query?: string | undefined;
    embedding?: number[] | undefined;
    metadata_filter?: Record<string, any> | undefined;
}, {
    query?: string | undefined;
    limit?: number | undefined;
    embedding?: number[] | undefined;
    threshold?: number | undefined;
    metadata_filter?: Record<string, any> | undefined;
}>;
export declare const VectorSearchResultSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    score: z.ZodNumber;
    distance: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    score: number;
    distance: number;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    content: string;
    score: number;
    distance: number;
    metadata?: Record<string, any> | undefined;
}>;
export declare const CollectionConfigSchema: z.ZodObject<{
    name: z.ZodString;
    dimension: z.ZodNumber;
    metric: z.ZodDefault<z.ZodEnum<["cosine", "euclidean", "dot_product"]>>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    metric: "cosine" | "euclidean" | "dot_product";
    dimension: number;
    description?: string | undefined;
}, {
    name: string;
    dimension: number;
    description?: string | undefined;
    metric?: "cosine" | "euclidean" | "dot_product" | undefined;
}>;
export type VectorDocument = z.infer<typeof VectorDocumentSchema>;
export type VectorQuery = z.infer<typeof VectorQuerySchema>;
export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;
/**
 * Core Vector Database Interface
 * Defines the contract for all vector database implementations
 */
export interface IVectorDatabase {
    createCollection(config: CollectionConfig): Promise<void>;
    deleteCollection(name: string): Promise<void>;
    listCollections(): Promise<string[]>;
    collectionExists(name: string): Promise<boolean>;
    addDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
    updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
    deleteDocument(collection: string, id: string): Promise<void>;
    getDocument(collection: string, id: string): Promise<VectorDocument | null>;
    similaritySearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    batchAdd(collection: string, documents: VectorDocument[]): Promise<void>;
    batchDelete(collection: string, ids: string[]): Promise<void>;
    isHealthy(): Promise<boolean>;
    getStats(collection?: string): Promise<Record<string, any>>;
}
/**
 * Vector Database Provider Configuration
 */
export interface VectorDatabaseConfig {
    provider: 'chroma' | 'pgvector' | 'weaviate' | 'pinecone';
    host?: string;
    port?: number;
    database?: string;
    apiKey?: string;
    connectionString?: string;
    ssl?: boolean;
    poolSize?: number;
    timeout?: number;
}
/**
 * Embedding Provider Interface
 */
export interface IEmbeddingProvider {
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    getDimension(): number;
    getModelName(): string;
}
/**
 * Embedding Provider Configuration
 */
export interface EmbeddingConfig {
    provider: 'openai' | 'huggingface' | 'custom';
    model: string;
    apiKey?: string;
    dimension?: number;
    baseUrl?: string;
}
//# sourceMappingURL=vector-database.interface.d.ts.map