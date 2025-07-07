import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { MemoryItem, SearchResult, MemoryQuery, VectorMemoryConfig, Vector } from './MemoryTypes';

export enum VectorMemoryEventType {
  ITEM_ADDED = 'item_added',
  ITEM_UPDATED = 'item_updated',
  ITEM_REMOVED = 'item_removed',
  MEMORY_PRUNED = 'memory_pruned',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
}

export interface VectorStoreConfig {
  apiEndpoint: string;
  apiKey: string;
  embeddingModel: string;
  dimensions: number;
  maxItems: number;
  similarityThreshold: number;
}

@Injectable()
export class VectorMemoryStore extends EventEmitter {
  private readonly logger = new Logger(VectorMemoryStore.name);
  private readonly config: VectorStoreConfig;
  private readonly memoryItems: Map<string, MemoryItem> = new Map();
  private readonly embeddings: Map<string, Vector> = new Map();

  constructor() {
    super();
    
    this.config = {
      apiEndpoint: process.env.VECTOR_STORE_API_ENDPOINT || 'http://localhost:3000/api/vector-store',
      apiKey: process.env.VECTOR_STORE_API_KEY || '',
      embeddingModel: process.env.EMBEDDING_MODEL || 'universal-sentence-encoder',
      dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536'),
      maxItems: parseInt(process.env.MAX_VECTOR_ITEMS || '10000'),
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
    };

    this.logger.log('VectorMemoryStore initialized');
  }

  async addItem(item: MemoryItem): Promise<void> {
    try {
      this.logger.debug(`Adding item to vector store: ${item.id}`);

      // Validate embedding
      if (!item.embedding || item.embedding.length !== this.config.dimensions) {
        throw new Error(`Invalid embedding dimensions. Expected ${this.config.dimensions}, got ${item.embedding?.length}`);
      }

      // Store item and embedding
      this.memoryItems.set(item.id, item);
      this.embeddings.set(item.id, item.embedding);

      // Emit event
      this.emit(VectorMemoryEventType.ITEM_ADDED, item);

      this.logger.debug(`Successfully added item: ${item.id}`);
    } catch (error) {
      this.logger.error(`Failed to add item to vector store: ${item.id}`, error);
      throw error;
    }
  }

  async updateItem(item: MemoryItem): Promise<void> {
    try {
      this.logger.debug(`Updating item in vector store: ${item.id}`);

      if (!this.memoryItems.has(item.id)) {
        throw new Error(`Item not found: ${item.id}`);
      }

      // Update item and embedding
      this.memoryItems.set(item.id, item);
      this.embeddings.set(item.id, item.embedding);

      // Emit event
      this.emit(VectorMemoryEventType.ITEM_UPDATED, item);

      this.logger.debug(`Successfully updated item: ${item.id}`);
    } catch (error) {
      this.logger.error(`Failed to update item in vector store: ${item.id}`, error);
      throw error;
    }
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      this.logger.debug(`Removing item from vector store: ${itemId}`);

      const item = this.memoryItems.get(itemId);
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }

      // Remove item and embedding
      this.memoryItems.delete(itemId);
      this.embeddings.delete(itemId);

      // Emit event
      this.emit(VectorMemoryEventType.ITEM_REMOVED, item);

      this.logger.debug(`Successfully removed item: ${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to remove item from vector store: ${itemId}`, error);
      throw error;
    }
  }

  async findSimilarItems(query: MemoryQuery): Promise<SearchResult[]> {
    try {
      this.logger.debug('Finding similar items');

      let queryEmbedding: Vector;

      // Get query embedding
      if (query.embedding) {
        queryEmbedding = query.embedding;
      } else if (query.text) {
        queryEmbedding = await this.generateEmbedding(query.text);
      } else {
        throw new Error('Query must contain either text or embedding');
      }

      // Find similar items
      const similarities: Array<{ item: MemoryItem; similarity: number }> = [];

      for (const [itemId, item] of this.memoryItems.entries()) {
        const embedding = this.embeddings.get(itemId);
        if (!embedding) continue;

        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        
        // Apply filters
        if (similarity >= (query.minSimilarity || this.config.similarityThreshold)) {
          if (this.passesFilters(item, query)) {
            similarities.push({ item, similarity });
          }
        }
      }

      // Sort by similarity (descending)
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Apply limit
      const limit = query.limit || 10;
      const limitedResults = similarities.slice(0, limit);

      // Convert to SearchResult format
      const results: SearchResult[] = limitedResults.map(({ item, similarity }) => ({
        item,
        similarity,
        relevanceScore: similarity,
      }));

      this.logger.debug(`Found ${results.length} similar items`);
      return results;
    } catch (error) {
      this.logger.error('Failed to find similar items', error);
      throw error;
    }
  }

  async getAllItems(): Promise<MemoryItem[]> {
    return Array.from(this.memoryItems.values());
  }

  async getItem(itemId: string): Promise<MemoryItem | undefined> {
    return this.memoryItems.get(itemId);
  }

  async clear(): Promise<void> {
    try {
      this.logger.debug('Clearing vector store');

      this.memoryItems.clear();
      this.embeddings.clear();

      this.logger.debug('Vector store cleared');
    } catch (error) {
      this.logger.error('Failed to clear vector store', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalItems: number;
    memoryUsage: number;
    dimensions: number;
    maxItems: number;
  }> {
    const totalItems = this.memoryItems.size;
    const memoryUsage = totalItems * this.config.dimensions * 4; // 4 bytes per float32

    return {
      totalItems,
      memoryUsage,
      dimensions: this.config.dimensions,
      maxItems: this.config.maxItems,
    };
  }

  private async generateEmbedding(text: string): Promise<Vector> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would call an embedding service
      const mockEmbedding = new Float32Array(this.config.dimensions);
      
      // Simple hash-based mock embedding
      const hash = this.simpleHash(text);
      for (let i = 0; i < this.config.dimensions; i++) {
        mockEmbedding[i] = Math.sin(hash + i) * 0.1;
      }

      return mockEmbedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', error);
      throw error;
    }
  }

  private calculateCosineSimilarity(vecA: Vector, vecB: Vector): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private passesFilters(item: MemoryItem, query: MemoryQuery): boolean {
    // Apply metadata filters
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (item.metadata[key] !== value) {
          return false;
        }
      }
    }

    // Apply tag filters
    if (query.tags && query.tags.length > 0) {
      const itemTags = item.tags || [];
      const hasAllTags = query.tags.every(tag => itemTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Apply cluster filter
    if (query.clusterId && item.clusterId !== query.clusterId) {
      return false;
    }

    // Apply date range filter
    if (query.dateRange) {
      const itemTime = item.timestamp;
      if (itemTime < query.dateRange.start || itemTime > query.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Event handling helpers
  onItemAdded(callback: (item: MemoryItem) => void): void {
    this.on(VectorMemoryEventType.ITEM_ADDED, callback);
  }

  onItemUpdated(callback: (item: MemoryItem) => void): void {
    this.on(VectorMemoryEventType.ITEM_UPDATED, callback);
  }

  onItemRemoved(callback: (item: MemoryItem) => void): void {
    this.on(VectorMemoryEventType.ITEM_REMOVED, callback);
  }

  onMemoryPruned(callback: (prunedItems: MemoryItem[]) => void): void {
    this.on(VectorMemoryEventType.MEMORY_PRUNED, callback);
  }

  onCacheHit(callback: (query: MemoryQuery) => void): void {
    this.on(VectorMemoryEventType.CACHE_HIT, callback);
  }

  onCacheMiss(callback: (query: MemoryQuery) => void): void {
    this.on(VectorMemoryEventType.CACHE_MISS, callback);
  }
}