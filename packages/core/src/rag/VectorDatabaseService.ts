import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supported vector database providers
 */
export enum VectorDatabaseProvider {
  PINECONE = 'pinecone',
  CHROMA = 'chroma',
  REDIS = 'redis',
  SUPABASE = 'supabase',
  WEAVIATE = 'weaviate',
  MILVUS = 'milvus',
  QDRANT = 'qdrant',
}

/**
 * Vector search result interface
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  content?: string;
}

/**
 * Document interface for vector storage
 */
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

/**
 * VectorDatabaseService handles vector database operations for RAG and semantic search
 * Supports multiple vector database providers including Supabase
 */
@Injectable()
export class VectorDatabaseService implements OnModuleInit {
  private provider: VectorDatabaseProvider;
  private client: any;
  private embeddingModel: string;
  private namespace: string;
  private dimensions: number;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.getProvider();
    this.embeddingModel = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'text-embedding-3-small'
    );
    this.namespace = this.configService.get<string>(
      'VECTOR_DB_NAMESPACE',
      'the-new-fuse'
    );
    this.dimensions = this.configService.get<number>('VECTOR_DIMENSIONS', 1536);
  }

  /**
   * Initialize the vector database client on module initialization
   */
  async onModuleInit() {
    await this.initializeClient();
  }

  /**
   * Get the configured vector database provider
   */
  private getProvider(): VectorDatabaseProvider {
    const provider = this.configService.get<string>(
      'VECTOR_DB_PROVIDER',
      VectorDatabaseProvider.SUPABASE
    );
    return provider as VectorDatabaseProvider;
  }

  /**
   * Initialize the appropriate vector database client based on the provider
   */
  private async initializeClient(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      switch (this.provider) {
        case VectorDatabaseProvider.SUPABASE:
          await this.initializeSupabase();
          break;
        case VectorDatabaseProvider.PINECONE:
          await this.initializePinecone();
          break;
        case VectorDatabaseProvider.CHROMA:
          await this.initializeChroma();
          break;
        case VectorDatabaseProvider.REDIS:
          await this.initializeRedis();
          break;
        case VectorDatabaseProvider.WEAVIATE:
          await this.initializeWeaviate();
          break;
        case VectorDatabaseProvider.MILVUS:
          await this.initializeMilvus();
          break;
        case VectorDatabaseProvider.QDRANT:
          await this.initializeQdrant();
          break;
        default:
          console.warn(
            `Vector database provider ${this.provider} not implemented. Falling back to Supabase.`
          );
          await this.initializeSupabase();
      }

      this.initialized = true;
      console.log(
        `Vector database initialized successfully with provider: ${this.provider}`
      );
    } catch (error) {
      console.error('Failed to initialize vector database:', error);
      throw error;
    }
  }

  /**
   * Initialize Supabase client for vector operations
   */
  private async initializeSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY'
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Initialize Pinecone client (placeholder implementation)
   */
  private async initializePinecone(): Promise<void> {
    // Placeholder: Implement Pinecone initialization
    throw new Error('Pinecone provider not yet implemented');
  }

  /**
   * Initialize Chroma client (placeholder implementation)
   */
  private async initializeChroma(): Promise<void> {
    // Placeholder: Implement Chroma initialization
    throw new Error('Chroma provider not yet implemented');
  }

  /**
   * Initialize Redis client for vector search (placeholder implementation)
   */
  private async initializeRedis(): Promise<void> {
    // Placeholder: Implement Redis vector search initialization
    throw new Error('Redis vector search provider not yet implemented');
  }

  /**
   * Initialize Weaviate client (placeholder implementation)
   */
  private async initializeWeaviate(): Promise<void> {
    // Placeholder: Implement Weaviate initialization
    throw new Error('Weaviate provider not yet implemented');
  }

  /**
   * Initialize Milvus client (placeholder implementation)
   */
  private async initializeMilvus(): Promise<void> {
    // Placeholder: Implement Milvus initialization
    throw new Error('Milvus provider not yet implemented');
  }

  /**
   * Initialize Qdrant client (placeholder implementation)
   */
  private async initializeQdrant(): Promise<void> {
    // Placeholder: Implement Qdrant initialization
    throw new Error('Qdrant provider not yet implemented');
  }

  /**
   * Store a vector embedding with associated content and metadata
   */
  async storeEmbedding(
    id: string,
    embedding: number[],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
    }

    switch (this.provider) {
      case VectorDatabaseProvider.SUPABASE:
        await this.storeEmbeddingSupabase(id, embedding, content, metadata);
        break;
      default:
        throw new Error(`Store operation not implemented for ${this.provider}`);
    }
  }

  /**
   * Store embedding in Supabase
   */
  private async storeEmbeddingSupabase(
    id: string,
    embedding: number[],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data, error } = await this.client
      .from('vector_embeddings')
      .upsert({
        id,
        embedding,
        content,
        metadata: metadata || {},
        namespace: this.namespace,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to store embedding in Supabase: ${error.message}`);
    }
  }

  /**
   * Perform similarity search to find similar vectors
   */
  async similaritySearch(
    queryEmbedding: number[],
    limit: number = 10,
    threshold?: number
  ): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      await this.initializeClient();
    }

    switch (this.provider) {
      case VectorDatabaseProvider.SUPABASE:
        return await this.similaritySearchSupabase(queryEmbedding, limit, threshold);
      default:
        throw new Error(`Similarity search not implemented for ${this.provider}`);
    }
  }

  /**
   * Perform similarity search using Supabase's vector extension
   */
  private async similaritySearchSupabase(
    queryEmbedding: number[],
    limit: number,
    threshold?: number
  ): Promise<VectorSearchResult[]> {
    // Using Supabase's match_documents RPC function for vector similarity search
    // This assumes you have created the appropriate RPC function in Supabase
    const { data, error } = await this.client.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold || 0.7,
      match_count: limit,
      filter_namespace: this.namespace,
    });

    if (error) {
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    return data.map((result: any) => ({
      id: result.id,
      score: result.similarity,
      metadata: result.metadata,
      content: result.content,
    }));
  }

  /**
   * Delete a vector embedding by ID
   */
  async deleteEmbedding(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
    }

    switch (this.provider) {
      case VectorDatabaseProvider.SUPABASE:
        await this.deleteEmbeddingSupabase(id);
        break;
      default:
        throw new Error(`Delete operation not implemented for ${this.provider}`);
    }
  }

  /**
   * Delete embedding from Supabase
   */
  private async deleteEmbeddingSupabase(id: string): Promise<void> {
    const { error } = await this.client
      .from('vector_embeddings')
      .delete()
      .eq('id', id)
      .eq('namespace', this.namespace);

    if (error) {
      throw new Error(`Failed to delete embedding: ${error.message}`);
    }
  }

  /**
   * Delete all embeddings in the current namespace
   */
  async clearNamespace(): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
    }

    switch (this.provider) {
      case VectorDatabaseProvider.SUPABASE:
        await this.clearNamespaceSupabase();
        break;
      default:
        throw new Error(`Clear namespace operation not implemented for ${this.provider}`);
    }
  }

  /**
   * Clear all embeddings in namespace from Supabase
   */
  private async clearNamespaceSupabase(): Promise<void> {
    const { error } = await this.client
      .from('vector_embeddings')
      .delete()
      .eq('namespace', this.namespace);

    if (error) {
      throw new Error(`Failed to clear namespace: ${error.message}`);
    }
  }

  /**
   * Get the current provider
   */
  getProvider(): VectorDatabaseProvider {
    return this.provider;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
