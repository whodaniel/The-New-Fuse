import { z } from 'zod';

// Vector operation schemas
export const VectorDocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  embedding: z.array(z.number()).optional(),
});

export const VectorQuerySchema = z.object({
  query: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  limit: z.number().default(10),
  threshold: z.number().default(0.7),
  metadata_filter: z.record(z.string(), z.any()).optional(),
});

export const VectorSearchResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  score: z.number(),
  distance: z.number(),
});

export const CollectionConfigSchema = z.object({
  name: z.string(),
  dimension: z.number(),
  metric: z.enum(['cosine', 'euclidean', 'dot_product']).default('cosine'),
  description: z.string().optional(),
});

// Type exports
export type VectorDocument = z.infer<typeof VectorDocumentSchema>;
export type VectorQuery = z.infer<typeof VectorQuerySchema>;
export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;

/**
 * Core Vector Database Interface
 * Defines the contract for all vector database implementations
 */
export interface IVectorDatabase {
  // Collection Management
  createCollection(config: CollectionConfig): Promise<void>;
  deleteCollection(name: string): Promise<void>;
  listCollections(): Promise<string[]>;
  collectionExists(name: string): Promise<boolean>;

  // Document Operations
  addDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
  updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  getDocument(collection: string, id: string): Promise<VectorDocument | null>;

  // Vector Operations
  similaritySearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
  hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
  
  // Batch Operations
  batchAdd(collection: string, documents: VectorDocument[]): Promise<void>;
  batchDelete(collection: string, ids: string[]): Promise<void>;

  // Health & Metrics
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