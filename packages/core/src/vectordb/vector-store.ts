import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import { VectorProvider, Document, SearchResult, VectorQuery } from './types';

export class VectorStore extends EventEmitter {
  private logger = new Logger(VectorStore.name);
  private provider: VectorProvider;
  private namespace = 'default';
  
  constructor(provider: VectorProvider) {
    super();
    this.provider = provider;
  }
  
  async search(query: VectorQuery): Promise<SearchResult[]> {
    try {
      const results = await this.provider.search(query);
      this.emit('search_completed', { query, results });
      return results;
    } catch (error) {
      this.logger.error('Search failed', error);
      this.emit('search_failed', { query, error });
      throw error;
    }
  }
  
  async addDocuments(documents: Document[]): Promise<void> {
    try {
      await this.provider.addDocuments(documents);
      this.emit('documents_added', { documents });
    } catch (error) {
      this.logger.error('Failed to add documents', error);
      this.emit('documents_add_failed', { documents, error });
      throw error;
    }
  }
  
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.provider.deleteDocuments(ids);
      this.emit('documents_deleted', { ids });
    } catch (error) {
      this.logger.error('Failed to delete documents', error);
      this.emit('documents_delete_failed', { ids, error });
      throw error;
    }
  }
}