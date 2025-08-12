/**
 * @fileoverview Production-ready memory system for agent knowledge management
 */

import { Injectable, Logger } from '@nestjs/common';
import { MemoryContent, MemoryQuery, MemoryQueryResult, MemoryStorageConfig, MemoryStats } from '../types/memory';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';

@Injectable()
export class MemorySystem {
  private readonly logger = new Logger(MemorySystem.name);
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private memories: Map<string, MemoryContent> = new Map();
  private memoryIndex: Map<string, Set<string>> = new Map(); // keyword -> memory IDs
  private config: MemoryStorageConfig;

  constructor(config?: Partial<MemoryStorageConfig>) {
    this.config = {
      provider: 'local',
      connectionString: 'memory://local',
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      retentionPolicy: unknown;
        defaultTTL: 24 * 60 * 60, // 24 hours
        maxAge: 7 * 24 * 60 * 60, // 7 days
        maxItems: 10000,
        cleanupInterval: 60 * 60, // 1 hour
        priorityBased: true,
      },
      indexingStrategy: 'immediate',
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      this.logger.warn('MemorySystem is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.log('Starting MemorySystem');

      // Start cleanup interval
      setInterval(() => {
        this.performCleanup().catch(error => {
          this.logger.error('Memory cleanup failed', error as Error);
        });
      }, this.config.retentionPolicy.cleanupInterval * 1000);

      this.state = ServiceState.RUNNING;
      this.logger.log('MemorySystem started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to start MemorySystem', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      this.logger.warn('MemorySystem is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      this.logger.log('Stopping MemorySystem');

      this.state = ServiceState.STOPPED;
      this.logger.log('MemorySystem stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to stop MemorySystem', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  async store(content: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): Promise<string> {
    const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const memoryContent: MemoryContent = {
      ...content,
      id,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.memories.set(id, memoryContent);
    
    // Index the content for search
    await this.indexContent(memoryContent);

    this.logger.debug(`Stored memory: ${id}`, {
      type: content.type,
      contentLength: content.content.length,
      tags: content.metadata.tags,
    });

    return id;
  }

  async retrieve(id: string): Promise<MemoryContent | null> {
    const memory = this.memories.get(id);
    if (!memory) {
      return null;
    }

    // Update access statistics
    memory.accessCount++;
    memory.lastAccessed = new Date();

    this.logger.debug(`Retrieved memory: ${id}`, {
      accessCount: memory.accessCount,
    });

    return memory;
  }

  async update(id: string, updates: Partial<Omit<MemoryContent, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>>): Promise<MemoryContent | null> {
    const memory = this.memories.get(id);
    if (!memory) {
      return null;
    }

    const updatedMemory: MemoryContent = {
      ...memory,
      ...updates,
      updatedAt: new Date(),
    };

    this.memories.set(id, updatedMemory);

    // Re-index if content changed
    if (updates.content || updates.metadata) {
      await this.reindexContent(memory, updatedMemory);
    }

    this.logger.debug(`Updated memory: ${id}`);
    return updatedMemory;
  }

  async delete(id: string): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) {
      return false;
    }

    this.memories.delete(id);
    await this.removeFromIndex(memory);

    this.logger.debug(`Deleted memory: ${id}`);
    return true;
  }

  async search(query: MemoryQuery): Promise<MemoryQueryResult> {
    const startTime = Date.now();
    const results: MemoryContent[] = [];

    // Get all memories that match the basic criteria
    let candidateMemories = Array.from(this.memories.values());

    // Filter by type
    if (query.type) {
      candidateMemories = candidateMemories.filter(m => m.type === query.type);
    }

    // Filter by agent ID
    if (query.agentId) {
      candidateMemories = candidateMemories.filter(m => m.metadata.agentId === query.agentId);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      candidateMemories = candidateMemories.filter(m =>
        query.tags!.some(tag => m.metadata.tags.includes(tag))
      );
    }

    // Filter by time range
    if (query.timeRange) {
      candidateMemories = candidateMemories.filter(m =>
        m.createdAt >= query.timeRange!.start && m.createdAt <= query.timeRange!.end
      );
    }

    // Perform text search and calculate relevance scores
    const searchResults = candidateMemories.map(memory => {
      const relevanceScore = this.calculateRelevanceScore(memory, query.query);
      return {
        content: memory,
        relevanceScore,
        matchedTerms: this.getMatchedTerms(memory, query.query),
      };
    });

    // Filter by minimum relevance
    const filteredResults = searchResults.filter(result =>
      result.relevanceScore >= (query.minRelevance || 0)
    );

    // Sort by relevance score
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply limit
    const limitedResults = query.limit ? filteredResults.slice(0, query.limit) : filteredResults;

    const queryTime = Date.now() - startTime;

    this.logger.debug(`Memory search completed`, {
      query: query.query,
      totalResults: filteredResults.length,
      returnedResults: limitedResults.length,
      queryTime,
    });

    return {
      results: limitedResults,
      totalCount: filteredResults.length,
      queryTime,
      suggestions: this.generateSearchSuggestions(query.query),
    };
  }

  async getStats(): Promise<MemoryStats> {
    const memories = Array.from(this.memories.values());
    const totalSize = memories.reduce((size, memory) => size + memory.content.length, 0);
    const averageRelevance = memories.reduce((sum, memory) => sum + (memory.metadata.relevanceScore || 0), 0) / memories.length;
    const mostAccessedItems = memories
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalItems: memories.length,
      totalSize,
      averageRelevance: averageRelevance || 0,
      mostAccessedItems,
      recentOperations: [], // Would be populated from operation log
      storageUtilization: (totalSize / this.config.maxMemorySize) * 100,
      indexingStatus: 'up-to-date',
    };
  }

  private async indexContent(memory: MemoryContent): Promise<void> {
    const keywords = this.extractKeywords(memory.content);
    
    for (const keyword of keywords) {
      if (!this.memoryIndex.has(keyword)) {
        this.memoryIndex.set(keyword, new Set());
      }
      this.memoryIndex.get(keyword)!.add(memory.id);
    }

    // Index tags
    for (const tag of memory.metadata.tags) {
      if (!this.memoryIndex.has(tag)) {
        this.memoryIndex.set(tag, new Set());
      }
      this.memoryIndex.get(tag)!.add(memory.id);
    }
  }

  private async reindexContent(oldMemory: MemoryContent, newMemory: MemoryContent): Promise<void> {
    await this.removeFromIndex(oldMemory);
    await this.indexContent(newMemory);
  }

  private async removeFromIndex(memory: MemoryContent): Promise<void> {
    const keywords = this.extractKeywords(memory.content);
    
    for (const keyword of keywords) {
      const memorySet = this.memoryIndex.get(keyword);
      if (memorySet) {
        memorySet.delete(memory.id);
        if (memorySet.size === 0) {
          this.memoryIndex.delete(keyword);
        }
      }
    }

    // Remove from tag index
    for (const tag of memory.metadata.tags) {
      const memorySet = this.memoryIndex.get(tag);
      if (memorySet) {
        memorySet.delete(memory.id);
        if (memorySet.size === 0) {
          this.memoryIndex.delete(tag);
        }
      }
    }
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    ]);
    return stopWords.has(word);
  }

  private calculateRelevanceScore(memory: MemoryContent, query: string): number {
    const queryTerms = this.extractKeywords(query);
    const contentTerms = this.extractKeywords(memory.content);
    
    if (queryTerms.length === 0) return 0;

    let matchCount = 0;
    for (const term of queryTerms) {
      if (contentTerms.includes(term)) {
        matchCount++;
      }
    }

    const baseScore = matchCount / queryTerms.length;
    
    // Boost score based on importance and access count
    const importanceBoost = memory.metadata.importance || 0.5;
    const accessBoost = Math.min(memory.accessCount / 10, 0.2); // Max 20% boost
    
    return Math.min(baseScore + importanceBoost * 0.3 + accessBoost, 1.0);
  }

  private getMatchedTerms(memory: MemoryContent, query: string): string[] {
    const queryTerms = this.extractKeywords(query);
    const contentTerms = this.extractKeywords(memory.content);
    
    return queryTerms.filter(term => contentTerms.includes(term));
  }

  private generateSearchSuggestions(query: string): string[] {
    // Simple suggestion generation based on indexed keywords
    const queryTerms = this.extractKeywords(query);
    const suggestions: string[] = [];
    
    for (const [keyword, memoryIds] of this.memoryIndex) {
      if (memoryIds.size > 0 && !queryTerms.includes(keyword)) {
        // Check if this keyword appears with query terms
        const relatedMemories = Array.from(memoryIds).map(id => this.memories.get(id)).filter(Boolean);
        const hasRelation = relatedMemories.some(memory => 
          queryTerms.some(term => memory!.content.toLowerCase().includes(term))
        );
        
        if (hasRelation) {
          suggestions.push(keyword);
        }
      }
    }
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const memories = Array.from(this.memories.values());
    const policy = this.config.retentionPolicy;
    
    let deletedCount = 0;

    // Remove expired memories
    for (const memory of memories) {
      const age = (now - memory.createdAt.getTime()) / 1000;
      const ttl = memory.metadata.expiresAt 
        ? (memory.metadata.expiresAt.getTime() - memory.createdAt.getTime()) / 1000
        : policy.defaultTTL;

      if (age > ttl || age > policy.maxAge) {
        await this.delete(memory.id);
        deletedCount++;
      }
    }

    // Remove excess memories if over limit
    if (this.memories.size > policy.maxItems) {
      const sortedMemories = Array.from(this.memories.values())
        .sort((a, b) => {
          if (policy.priorityBased) {
            // Sort by importance and access count
            const scoreA = (a.metadata.importance || 0) + (a.accessCount / 100);
            const scoreB = (b.metadata.importance || 0) + (b.accessCount / 100);
            return scoreA - scoreB; // Ascending (least important first)
          } else {
            // Sort by age (oldest first)
            return a.createdAt.getTime() - b.createdAt.getTime();
          }
        });

      const excessCount = this.memories.size - policy.maxItems;
      for (let i = 0; i < excessCount; i++) {
        await this.delete(sortedMemories[i].id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`Memory cleanup completed`, { deletedCount });
    }
  }
}