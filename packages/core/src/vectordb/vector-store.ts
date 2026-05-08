import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import { VectorStoreProvider, VectorDocument, SearchResult, VectorQuery } from './types.js';

export class VectorStore extends EventEmitter {
  private logger = new Logger(VectorStore.name);
  private provider: VectorStoreProvider;
  private namespace = 'default';
  
  constructor(provider: VectorStoreProvider) {
    super();
    this.provider = provider;
  }
  
  async search(query: VectorQuery): Promise<SearchResult[]> {
    try {
      const results = await this.provider.search([], query);
      this.emit('search_completed', { query, results });
      return results;
    } catch (error) {
      this.logger.error('Search failed', error);
      this.emit('search_failed', { query, error });
      throw error;
    }
  }
  
  async addDocuments(documents: VectorDocument[]): Promise<string[]> {
    try {
      const ids = await this.provider.storeVectors(documents, this.namespace);
      this.emit('documents_added', { documents });
      return ids;
    } catch (error) {
      this.logger.error('Failed to add documents', error);
      this.emit('documents_add_failed', { documents, error });
      throw error;
    }
  }
  
  async deleteDocuments(ids: string[]): Promise<boolean> {
    try {
      const result = await this.provider.deleteVectors(ids, this.namespace);
      this.emit('documents_deleted', { ids });
      return result;
    } catch (error) {
      this.logger.error('Failed to delete documents', error);
      this.emit('documents_delete_failed', { ids, error });
      throw error;
    }
  }
}