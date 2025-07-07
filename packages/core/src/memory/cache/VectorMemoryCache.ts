import { Injectable, Logger } from '@nestjs/common';
import { MemoryItem, Vector, SearchResult, MemoryQuery } from '../MemoryTypes';

export interface VectorCacheEntry {
  item: MemoryItem;
  embedding: Vector;
  lastAccessed: number;
  accessCount: number;
}

export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  filterByType?: string;
  includeMetadata?: boolean;
}

@Injectable()
export class VectorMemoryCache {
  private readonly logger = new Logger(VectorMemoryCache.name);
  private readonly cache = new Map<string, VectorCacheEntry>();
  private readonly maxSize: number;
  private readonly embeddingDimension: number;
  private readonly similarityThreshold: number;

  constructor() {
    this.maxSize = parseInt(process.env.VECTOR_CACHE_SIZE || '1000');
    this.embeddingDimension = parseInt(process.env.EMBEDDING_DIMENSION || '1536');
    this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
  }

  async store(item: MemoryItem): Promise<void> {
    if (!item.embedding) {
      throw new Error('Item must have an embedding to be cached');
    }

    if (item.embedding.length !== this.embeddingDimension) {
      throw new Error(`Embedding dimension mismatch. Expected ${this.embeddingDimension}, got ${item.embedding.length}`);
    }

    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(item.id)) {
      this.evictLRU();
    }

    const entry: VectorCacheEntry = {
      item,
      embedding: item.embedding,
      lastAccessed: Date.now(),
      accessCount: 0,
    };

    this.cache.set(item.id, entry);
    this.logger.debug(`Stored vector in cache: ${item.id}`);
  }

  async get(id: string): Promise<MemoryItem | null> {
    const entry = this.cache.get(id);
    if (!entry) {
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    return entry.item;
  }

  async search(query: MemoryQuery, options: VectorSearchOptions = {}): Promise<SearchResult[]> {
    if (!query.embedding) {
      throw new Error('Query must have an embedding for vector search');
    }

    const results: SearchResult[] = [];
    const limit = options.limit || 10;
    const minSimilarity = options.minSimilarity || this.similarityThreshold;

    for (const [id, entry] of Array.from(this.cache.entries())) {
      // Apply type filter if specified
      if (options.filterByType && entry.item.metadata?.type !== options.filterByType) {
        continue;
      }

      const similarity = this.calculateCosineSimilarity(query.embedding, entry.embedding);
      
      if (similarity >= minSimilarity) {
        entry.lastAccessed = Date.now();
        entry.accessCount++;

        results.push({
          item: entry.item,
          similarity,
          relevanceScore: similarity,
        });
      }
    }

    // Sort by similarity (descending) and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  async getVectorsByType(type: string): Promise<VectorCacheEntry[]> {
    const results: VectorCacheEntry[] = [];
    
    for (const entry of Array.from(this.cache.values())) {
      if (entry.item.metadata?.type === type) {
        results.push(entry);
      }
    }
    
    return results;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.cache.delete(id);
    if (deleted) {
      this.logger.debug(`Deleted vector from cache: ${id}`);
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cleared vector cache');
  }

  async has(id: string): Promise<boolean> {
    return this.cache.has(id);
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async getStats(): Promise<{
    size: number;
    maxSize: number;
    memoryUsage: string;
    averageAccessCount: number;
  }> {
    const size = this.cache.size;
    const totalAccessCount = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const memoryUsage = this.formatBytes(size * this.embeddingDimension * 4); // 4 bytes per float32

    return {
      size,
      maxSize: this.maxSize,
      memoryUsage,
      averageAccessCount: size > 0 ? totalAccessCount / size : 0,
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

  private evictLRU(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.cache.delete(oldestId);
      this.logger.debug(`Evicted vector from cache: ${oldestId}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}