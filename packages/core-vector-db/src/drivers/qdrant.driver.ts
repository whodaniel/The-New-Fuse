import { Inject, Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type {
  CollectionConfig,
  IVectorDatabase,
  VectorDatabaseConfig,
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
} from '../interface/vector-database.interface';

@Injectable()
export class QdrantDriver implements IVectorDatabase {
  private readonly logger = new Logger(QdrantDriver.name);
  private client: QdrantClient;

  constructor(
    @Inject('VECTOR_DB_CONFIG')
    private readonly config: VectorDatabaseConfig
  ) {
    this.client = new QdrantClient({
      url: config.host || 'http://localhost:6333',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    });

    // Avoid startup crash loops from async constructor side effects.
    void this.initializeConnection().catch((error) => {
      this.logger.error('Deferred Qdrant initialization failed', error);
    });
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.client.getCollections();
      this.logger.log('Qdrant connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Qdrant', error);
      throw error;
    }
  }

  async createCollection(config: CollectionConfig): Promise<void> {
    try {
      const collectionConfig = {
        vectors: {
          size: config.dimension,
          distance: this.mapDistanceMetric(config.metric),
        },
        optimizers_config: {
          default_segment_number: 2,
          memmap_threshold: 20000,
        },
        replication_factor: 1,
      };

      await this.client.createCollection(config.name, collectionConfig);
      this.logger.log(`Collection "${config.name}" created successfully`);
    } catch (error) {
      if (error instanceof Error && error.message?.includes('already exists')) {
        this.logger.warn(`Collection "${config.name}" already exists`);
        return;
      }
      this.logger.error(`Failed to create collection "${config.name}"`, error);
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<void> {
    try {
      await this.client.deleteCollection(name);
      this.logger.log(`Collection "${name}" deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete collection "${name}"`, error);
      throw error;
    }
  }

  async listCollections(): Promise<string[]> {
    try {
      const response = await this.client.getCollections();
      return response.collections.map((collection) => collection.name);
    } catch (error) {
      this.logger.error('Failed to list collections', error);
      throw error;
    }
  }

  async collectionExists(name: string): Promise<boolean> {
    try {
      await this.client.getCollection(name);
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as any).status === 404
      ) {
        return false;
      }
      this.logger.error(`Failed to check if collection "${name}" exists`, error);
      throw error;
    }
  }

  async addDocuments(collection: string, documents: VectorDocument[]): Promise<void> {
    try {
      const points = documents.map((doc) => ({
        id: doc.id || this.generateId(),
        vector: doc.embedding || [],
        payload: {
          content: doc.content,
          metadata: doc.metadata || {},
          created_at: new Date().toISOString(),
        },
      }));

      await this.client.upsert(collection, {
        wait: true,
        points,
      });

      this.logger.log(`Added ${documents.length} documents to collection "${collection}"`);
    } catch (error) {
      this.logger.error(`Failed to add documents to collection "${collection}"`, error);
      throw error;
    }
  }

  async updateDocument(
    collection: string,
    id: string,
    document: Partial<VectorDocument>
  ): Promise<void> {
    try {
      // First, get the existing document
      const existing = await this.getDocument(collection, id);
      if (!existing) {
        throw new Error(`Document with id "${id}" not found in collection "${collection}"`);
      }

      // Merge the updates
      const updatedDocument: VectorDocument = {
        id,
        content: document.content !== undefined ? document.content : existing.content,
        metadata:
          document.metadata !== undefined
            ? { ...existing.metadata, ...document.metadata }
            : existing.metadata,
        embedding: document.embedding !== undefined ? document.embedding : existing.embedding,
      };

      // Upsert the updated document
      await this.addDocuments(collection, [updatedDocument]);
      this.logger.log(`Updated document "${id}" in collection "${collection}"`);
    } catch (error) {
      this.logger.error(`Failed to update document "${id}" in collection "${collection}"`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        points: [id],
      });
      this.logger.log(`Deleted document "${id}" from collection "${collection}"`);
    } catch (error) {
      this.logger.error(`Failed to delete document "${id}" from collection "${collection}"`, error);
      throw error;
    }
  }

  async getDocument(collection: string, id: string): Promise<VectorDocument | null> {
    try {
      const response = await this.client.retrieve(collection, {
        ids: [id],
        with_payload: true,
        with_vector: true,
      });

      if (response.length === 0) {
        return null;
      }

      const point = response[0];
      return {
        id: point.id as string,
        content: point.payload?.content as string,
        metadata: point.payload?.metadata as Record<string, any>,
        embedding: point.vector as number[],
      };
    } catch (error) {
      this.logger.error(`Failed to get document "${id}" from collection "${collection}"`, error);
      throw error;
    }
  }

  async similaritySearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]> {
    try {
      if (!query.embedding) {
        throw new Error('Embedding is required for similarity search');
      }

      const searchParams: any = {
        vector: query.embedding,
        limit: query.limit || 10,
        with_payload: true,
        with_vector: false,
        score_threshold: query.threshold || 0.0,
      };

      // Add metadata filtering if provided
      if (query.metadata_filter) {
        searchParams.filter = {
          must: Object.entries(query.metadata_filter).map(([key, value]) => ({
            key: `metadata.${key}`,
            match: { value },
          })),
        };
      }

      const response = await this.client.search(collection, searchParams);

      return response.map((point) => ({
        id: point.id as string,
        content: point.payload?.content as string,
        metadata: point.payload?.metadata as Record<string, any>,
        score: point.score,
        distance: 1 - point.score, // Convert score to distance
      }));
    } catch (error) {
      this.logger.error(`Failed to perform similarity search in collection "${collection}"`, error);
      throw error;
    }
  }

  async hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]> {
    // For now, hybrid search is the same as similarity search
    // In the future, this could combine vector similarity with full-text search
    return this.similaritySearch(collection, query);
  }

  async batchAdd(collection: string, documents: VectorDocument[]): Promise<void> {
    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await this.addDocuments(collection, batch);
    }
  }

  async batchDelete(collection: string, ids: string[]): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        points: ids,
      });
      this.logger.log(`Deleted ${ids.length} documents from collection "${collection}"`);
    } catch (error) {
      this.logger.error(`Failed to batch delete documents from collection "${collection}"`, error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

  async getStats(collection?: string): Promise<Record<string, any>> {
    try {
      if (collection) {
        const info = await this.client.getCollection(collection);
        return {
          collection,
          vectors_count: info.indexed_vectors_count || 0, // Fixed: API changed from vectors_count to indexed_vectors_count
          indexed_vectors_count: info.indexed_vectors_count || 0,
          points_count: info.points_count || 0,
          segments_count: info.segments_count || 0,
          config: info.config,
          status: info.status,
        };
      } else {
        const collections = await this.listCollections();
        const stats: Record<string, any> = {
          total_collections: collections.length,
          collections: {},
        };

        for (const coll of collections) {
          stats.collections[coll] = await this.getStats(coll);
        }

        return stats;
      }
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      throw error;
    }
  }

  private mapDistanceMetric(metric: string): 'Cosine' | 'Euclid' | 'Dot' {
    switch (metric.toLowerCase()) {
      case 'cosine':
        return 'Cosine';
      case 'euclidean':
        return 'Euclid';
      case 'dot':
      case 'dot_product':
      case 'dotproduct':
        return 'Dot';
      default:
        return 'Cosine';
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
