import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ForgeDriver } from './drivers/forge.driver.js';
import { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider.js';
import { PgVectorDriver } from './drivers/pgvector.driver.js';
import { QdrantDriver } from './drivers/qdrant.driver.js';
import type {
  CollectionConfig,
  EmbeddingConfig,
  IEmbeddingProvider,
  IVectorDatabase,
  VectorDatabaseConfig,
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
} from './interface/vector-database.interface.js';

@Injectable()
export class VectorDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(VectorDatabaseService.name);
  private vectorDb!: IVectorDatabase;
  private embeddingProvider!: IEmbeddingProvider;

  constructor(
    private readonly dbConfig: VectorDatabaseConfig,
    private readonly embeddingConfig: EmbeddingConfig
  ) {}

  async onModuleInit() {
    if (!this.dbConfig?.provider || !this.embeddingConfig?.provider) {
      this.logger.warn(
        'Vector DB configuration is incomplete. Skipping vector provider initialization for this runtime.'
      );
      return;
    }
    await this.initializeProviders();
    this.logger.log('Vector Database Service initialized');
  }

  private async initializeProviders(): Promise<void> {
    // Initialize vector database driver
    switch (this.dbConfig.provider) {
      case 'pgvector':
        this.vectorDb = new PgVectorDriver(this.dbConfig);
        break;
      case 'qdrant':
        this.vectorDb = new QdrantDriver(this.dbConfig);
        break;
      case 'forge':
        this.vectorDb = new ForgeDriver(this.dbConfig);
        break;
      case 'chroma':
      case 'weaviate':
      case 'pinecone':
        throw new Error(`Vector database provider "${this.dbConfig.provider}" not yet implemented`);
      default:
        throw new Error(`Unknown vector database provider: ${this.dbConfig.provider}`);
    }

    // Initialize embedding provider
    switch (this.embeddingConfig.provider) {
      case 'openai':
        this.embeddingProvider = new OpenAIEmbeddingProvider(this.embeddingConfig);
        break;
      case 'huggingface':
      case 'custom':
        throw new Error(
          `Embedding provider "${this.embeddingConfig.provider}" not yet implemented`
        );
      default:
        throw new Error(`Unknown embedding provider: ${this.embeddingConfig.provider}`);
    }
  }

  // Collection Management
  async createCollection(config: CollectionConfig): Promise<void> {
    return this.vectorDb.createCollection(config);
  }

  async deleteCollection(name: string): Promise<void> {
    return this.vectorDb.deleteCollection(name);
  }

  async listCollections(): Promise<string[]> {
    return this.vectorDb.listCollections();
  }

  async collectionExists(name: string): Promise<boolean> {
    return this.vectorDb.collectionExists(name);
  }

  // Document Operations with Automatic Embedding
  async addDocuments(collection: string, documents: VectorDocument[]): Promise<void> {
    const documentsWithEmbeddings = await Promise.all(
      documents.map(async (doc) => {
        if (!doc.embedding && doc.content) {
          doc.embedding = await this.embeddingProvider.generateEmbedding(doc.content);
        }
        return doc;
      })
    );

    return this.vectorDb.addDocuments(collection, documentsWithEmbeddings);
  }

  async updateDocument(
    collection: string,
    id: string,
    document: Partial<VectorDocument>
  ): Promise<void> {
    if (document.content && !document.embedding) {
      document.embedding = await this.embeddingProvider.generateEmbedding(document.content);
    }
    return this.vectorDb.updateDocument(collection, id, document);
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    return this.vectorDb.deleteDocument(collection, id);
  }

  async getDocument(collection: string, id: string): Promise<VectorDocument | null> {
    return this.vectorDb.getDocument(collection, id);
  }

  // Search Operations with Automatic Embedding
  async searchByText(
    collection: string,
    query: string,
    options: Partial<Omit<VectorQuery, 'query' | 'embedding'>> = {}
  ): Promise<VectorSearchResult[]> {
    const embedding = await this.embeddingProvider.generateEmbedding(query);

    const vectorQuery: VectorQuery = {
      query,
      embedding,
      limit: 10,
      threshold: 0.7,
      ...options,
    };

    return this.vectorDb.similaritySearch(collection, vectorQuery);
  }

  async searchByEmbedding(
    collection: string,
    embedding: number[],
    options: Partial<Omit<VectorQuery, 'embedding'>> = {}
  ): Promise<VectorSearchResult[]> {
    const vectorQuery: VectorQuery = {
      embedding,
      limit: 10,
      threshold: 0.7,
      ...options,
    };

    return this.vectorDb.similaritySearch(collection, vectorQuery);
  }

  async hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]> {
    if (query.query && !query.embedding) {
      query.embedding = await this.embeddingProvider.generateEmbedding(query.query);
    }
    return this.vectorDb.hybridSearch(collection, query);
  }

  // Batch Operations
  async batchAddDocuments(collection: string, documents: VectorDocument[]): Promise<void> {
    // Generate embeddings for documents that don't have them
    const textsToEmbed = documents
      .filter((doc) => !doc.embedding && doc.content)
      .map((doc) => doc.content);

    if (textsToEmbed.length > 0) {
      const embeddings = await this.embeddingProvider.generateEmbeddings(textsToEmbed);
      let embeddingIndex = 0;

      documents.forEach((doc) => {
        if (!doc.embedding && doc.content) {
          doc.embedding = embeddings[embeddingIndex++];
        }
      });
    }

    return this.vectorDb.batchAdd(collection, documents);
  }

  async batchDeleteDocuments(collection: string, ids: string[]): Promise<void> {
    return this.vectorDb.batchDelete(collection, ids);
  }

  // Utility Methods
  async generateEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.embeddingProvider.generateEmbeddings(texts);
  }

  getEmbeddingDimension(): number {
    return this.embeddingProvider.getDimension();
  }

  getEmbeddingModel(): string {
    return this.embeddingProvider.getModelName();
  }

  // Health & Metrics
  async isHealthy(): Promise<boolean> {
    try {
      const dbHealthy = await this.vectorDb.isHealthy();
      // Test embedding provider by generating a small embedding
      await this.embeddingProvider.generateEmbedding('health check');
      return dbHealthy;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

  async getStats(collection?: string): Promise<Record<string, any>> {
    const dbStats = await this.vectorDb.getStats(collection);

    return {
      ...dbStats,
      embedding_provider: {
        model: this.getEmbeddingModel(),
        dimension: this.getEmbeddingDimension(),
      },
    };
  }

  // Advanced Search Features
  async semanticSearch(
    collection: string,
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      metadata_filter?: Record<string, any>;
      include_scores?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    return this.searchByText(collection, query, {
      limit: options.limit || 10,
      threshold: options.threshold || 0.7,
      metadata_filter: options.metadata_filter,
    });
  }

  async findSimilarDocuments(
    collection: string,
    documentId: string,
    options: {
      limit?: number;
      threshold?: number;
      metadata_filter?: Record<string, any>;
    } = {}
  ): Promise<VectorSearchResult[]> {
    // Get the document to find its embedding
    const document = await this.getDocument(collection, documentId);
    if (!document || !document.embedding) {
      throw new Error(`Document "${documentId}" not found or has no embedding`);
    }

    return this.searchByEmbedding(collection, document.embedding, {
      limit: options.limit || 10,
      threshold: options.threshold || 0.7,
      metadata_filter: options.metadata_filter,
    });
  }
}
