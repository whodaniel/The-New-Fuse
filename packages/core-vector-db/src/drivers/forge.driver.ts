import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type {
  CollectionConfig,
  IVectorDatabase,
  VectorDatabaseConfig,
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
} from '../interface/vector-database.interface.js';

@Injectable()
export class ForgeDriver implements IVectorDatabase {
  private readonly logger = new Logger(ForgeDriver.name);
  private readonly baseUrl: string;

  constructor(
    @Inject('VECTOR_DB_CONFIG')
    private readonly config: VectorDatabaseConfig
  ) {
    this.baseUrl = config.host || 'http://localhost:3007';
    this.logger.log(`Forge Vector Driver initialized with base URL: ${this.baseUrl}`);
  }

  async createCollection(_config: CollectionConfig): Promise<void> {
    // Forge synapse currently uses a single unified memory store
    return;
  }

  async deleteCollection(_name: string): Promise<void> {
    return;
  }

  async listCollections(): Promise<string[]> {
    return ['default'];
  }

  async collectionExists(_name: string): Promise<boolean> {
    return true;
  }

  async addDocuments(_collection: string, documents: VectorDocument[]): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/vectors`, documents);
      this.logger.log(`Added ${documents.length} documents to Forge Synapse`);
    } catch (error: any) {
      this.logger.error(`Failed to add documents to Forge Synapse: ${error.message}`);
      throw error;
    }
  }

  async updateDocument(
    collection: string,
    id: string,
    document: Partial<VectorDocument>
  ): Promise<void> {
    // For simplicity, just add/overwrite
    const doc = { id, ...document } as VectorDocument;
    return this.addDocuments(collection, [doc]);
  }

  async deleteDocument(_collection: string, _id: string): Promise<void> {
    // TODO: Implement delete in Rust kernel
    return;
  }

  async getDocument(_collection: string, _id: string): Promise<VectorDocument | null> {
    // Forge synapse is currently write-only + search
    return null;
  }

  async similaritySearch(_collection: string, query: VectorQuery): Promise<VectorSearchResult[]> {
    try {
      if (!query.embedding) {
        throw new Error('Embedding is required for Forge similarity search');
      }

      const response = await axios.post(`${this.baseUrl}/search`, {
        embedding: query.embedding,
        limit: query.limit || 10,
        threshold: query.threshold || 0.0,
      });

      return response.data.map((r: any) => ({
        ...r,
        content: r.metadata?.content || '',
        distance: 1 - r.score,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to perform Forge similarity search: ${error.message}`);
      throw error;
    }
  }

  async hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]> {
    return this.similaritySearch(collection, query);
  }

  async batchAdd(collection: string, documents: VectorDocument[]): Promise<void> {
    return this.addDocuments(collection, documents);
  }

  async batchDelete(_collection: string, _ids: string[]): Promise<void> {
    return;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data === 'healthy';
    } catch {
      return false;
    }
  }

  async getStats(_collection?: string): Promise<Record<string, any>> {
    return {
      provider: 'forge',
      status: 'active',
    };
  }
}
