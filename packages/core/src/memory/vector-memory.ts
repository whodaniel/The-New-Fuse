import { Injectable, Logger } from '@nestjs/common';
import { MemoryItem, Vector, SearchResult, MemoryQuery } from './MemoryTypes';

export interface VectorMemory {
  id: string;
  content: string;
  embedding: Vector;
  metadata: Record<string, unknown>;
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessed: number;
}

@Injectable()
export class VectorMemoryService {
  private readonly logger = new Logger(VectorMemoryService.name);
  private readonly memories: Map<string, VectorMemory> = new Map();
  private readonly maxMemories: number;

  constructor() {
    this.maxMemories = parseInt(process.env.MAX_VECTOR_MEMORIES || '1000');
    this.logger.log('VectorMemoryService initialized');
  }

  async addMemory(memory: Omit<VectorMemory, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>): Promise<string> {
    const id = this.generateId();
    const vectorMemory: VectorMemory = {
      ...memory,
      id,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Optimize memory by removing less important items if at capacity
    if (this.memories.size >= this.maxMemories) {
      await this.optimizeMemory();
    }

    this.memories.set(id, vectorMemory);
    this.logger.debug(`Added vector memory: ${id}`);
    return id;
  }

  async getMemory(id: string): Promise<VectorMemory | null> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = Date.now();
      return memory;
    }
    return null;
  }

  async searchSimilar(query: Vector, limit: number = 10, minSimilarity: number = 0.7): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const memory of this.memories.values()) {
      const similarity = this.calculateCosineSimilarity(query, memory.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({
          item: {
            id: memory.id,
            content: memory.content,
            embedding: memory.embedding,
            metadata: memory.metadata,
            timestamp: memory.timestamp,
            importance: memory.importance,
            type: 'knowledge',
          } as MemoryItem,
          similarity,
          relevanceScore: similarity,
        });
      }
    }

    // Sort by similarity (descending) and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  async deleteMemory(id: string): Promise<boolean> {
    const deleted = this.memories.delete(id);
    if (deleted) {
      this.logger.debug(`Deleted vector memory: ${id}`);
    }
    return deleted;
  }

  async clearMemories(): Promise<void> {
    this.memories.clear();
    this.logger.debug('Cleared all vector memories');
  }

  async getStats(): Promise<{
    totalMemories: number;
    maxMemories: number;
    memoryUsage: string;
  }> {
    return {
      totalMemories: this.memories.size,
      maxMemories: this.maxMemories,
      memoryUsage: this.formatBytes(this.memories.size * 1024), // Rough estimate
    };
  }

  private async optimizeMemory(): Promise<void> {
    const memories = Array.from(this.memories.values());
    
    // Sort by importance and last accessed time
    memories.sort((a, b) => {
      const scoreA = a.importance * 0.7 + (a.accessCount / 100) * 0.3;
      const scoreB = b.importance * 0.7 + (b.accessCount / 100) * 0.3;
      return scoreA - scoreB; // Ascending order (lowest score first)
    });

    // Remove the least important 10%
    const toRemove = Math.floor(memories.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.memories.delete(memories[i].id);
    }

    this.logger.debug(`Optimized memory: removed ${toRemove} memories`);
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

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}