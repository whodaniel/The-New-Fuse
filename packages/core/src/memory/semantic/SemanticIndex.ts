import { Injectable, Logger } from '@nestjs/common';
import { MemoryItem, Vector, SearchResult, MemoryQuery } from '../MemoryTypes';

export interface SemanticIndexConfig {
  dimension: number;
  maxElements: number;
  efConstruction: number;
  efSearch: number;
  M: number;
}

@Injectable()
export class SemanticIndex {
  private readonly logger = new Logger(SemanticIndex.name);
  private readonly config: SemanticIndexConfig;
  private readonly items: Map<string, MemoryItem> = new Map();

  constructor() {
    this.config = {
      dimension: parseInt(process.env.EMBEDDING_DIMENSION || '1536'),
      maxElements: parseInt(process.env.MAX_INDEX_ELEMENTS || '10000'),
      efConstruction: parseInt(process.env.EF_CONSTRUCTION || '200'),
      efSearch: parseInt(process.env.EF_SEARCH || '50'),
      M: parseInt(process.env.INDEX_M || '16'),
    };

    this.logger.log('SemanticIndex initialized');
  }

  async addItem(item: MemoryItem): Promise<void> {
    try {
      if (!item.embedding || item.embedding.length !== this.config.dimension) {
        throw new Error(`Invalid embedding dimension. Expected ${this.config.dimension}`);
      }

      this.items.set(item.id, item);
      this.logger.debug(`Added item to semantic index: ${item.id}`);
    } catch (error) {
      this.logger.error(`Failed to add item to semantic index: ${item.id}`, error);
      throw error;
    }
  }

  async removeItem(itemId: string): Promise<boolean> {
    const removed = this.items.delete(itemId);
    if (removed) {
      this.logger.debug(`Removed item from semantic index: ${itemId}`);
    }
    return removed;
  }

  async search(query: MemoryQuery): Promise<SearchResult[]> {
    try {
      if (!query.embedding) {
        throw new Error('Query must have an embedding for semantic search');
      }

      const results: SearchResult[] = [];
      const limit = query.limit || 10;
      const minSimilarity = query.minSimilarity || 0.7;

      for (const [id, item] of this.items.entries()) {
        const similarity = this.calculateCosineSimilarity(query.embedding, item.embedding);
        
        if (similarity >= minSimilarity && this.matchesFilters(item, query)) {
          results.push({
            item,
            similarity,
            relevanceScore: similarity,
          });
        }
      }

      // Sort by similarity (descending) and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, limit);
    } catch (error) {
      this.logger.error('Semantic search failed:', error);
      return [];
    }
  }

  async getStats(): Promise<{
    totalItems: number;
    dimension: number;
    memoryUsage: string;
  }> {
    const memoryUsage = this.items.size * this.config.dimension * 4; // 4 bytes per float32
    
    return {
      totalItems: this.items.size,
      dimension: this.config.dimension,
      memoryUsage: this.formatBytes(memoryUsage),
    };
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

  private matchesFilters(item: MemoryItem, query: MemoryQuery): boolean {
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}