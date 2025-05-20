import { EventEmitter } from 'events';
import { Logger } from '../logging.js';
import { VectorStoreProvider, EmbeddingFunction, VectorDocument, VectorQuery, SearchResult } from './types.js';

export class VectorStore extends EventEmitter {
  private provider: VectorStoreProvider;
  private embeddingFunction: EmbeddingFunction;
  private logger: Logger;
  private namespace: string;

  constructor(provider: VectorStoreProvider, embeddingFunction: EmbeddingFunction, namespace: string, logger: Logger) {
    super();
    this.provider = provider;
    this.embeddingFunction = embeddingFunction;
    this.namespace = namespace;
    this.logger = logger;
  }

  /**
   * Store documents in the vector store
   */
  async storeDocuments(documents: VectorDocument[]): Promise<string[]> {
    try {
      // Generate embeddings for documents
      const documentWithEmbeddings = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          embedding: doc.embedding || await this.embeddingFunction(doc.content)
        }))
      );

      // Store in vector database
      const ids = await this.provider.storeVectors(documentWithEmbeddings, this.namespace);
      this.logger.info(`Stored ${ids.length} documents in vector store (${this.provider.name})`);
      this.emit('documents:stored', { count: ids.length, namespace: this.namespace });
      return ids;
    } catch (error) {
      this.logger.error('Error storing documents in vector store', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(query: string | number[], options: VectorQuery = {}): Promise<SearchResult[]> {
    try {
      // If query is a string, convert to embedding
      const queryEmbedding = Array.isArray(query) ? query : await this.embeddingFunction(query);
      
      // Search the vector store
      const results = await this.provider.search(queryEmbedding, {
        ...options,
        namespace: options.namespace || this.namespace
      });
      
      this.logger.debug(`Vector search found ${results.length} results for query`);
      return results;
    } catch (error) {
      this.logger.error('Error searching vector store', error);
      throw error;
    }
  }

  /**
   * Delete documents from the vector store
   */
  async deleteDocuments(ids: string[]): Promise<boolean> {
    try {
      await this.provider.deleteVectors(ids, this.namespace);
      this.logger.info(`Deleted ${ids.length} documents from vector store`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting documents from vector store', error);
      throw error;
    }
  }

  /**
   * Clear all documents in the namespace
   */
  async clearNamespace(): Promise<boolean> {
    try {
      await this.provider.clearNamespace(this.namespace);
      this.logger.info(`Cleared namespace ${this.namespace} in vector store`);
      return true;
    } catch (error) {
      this.logger.error('Error clearing namespace in vector store', error);
      throw error;
    }
  }
}
