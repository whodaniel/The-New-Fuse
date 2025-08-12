/**
 * @fileoverview Memory manager that coordinates multiple memory systems
 */

import { Injectable, Logger } from '@nestjs/common';
import { MemorySystem } from './MemorySystem';
import { MemoryContent, MemoryQuery, MemoryQueryResult, MemoryContentType } from '../types/memory';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';

@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private memorySystems: Map<string, MemorySystem> = new Map();
  private defaultSystem: MemorySystem;

  constructor() {
    // Initialize default memory system
    this.defaultSystem = new MemorySystem();
    this.memorySystems.set('default', this.defaultSystem);
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      this.logger.warn('MemoryManager is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.log('Starting MemoryManager');

      // Start all memory systems
      for (const [name, system] of this.memorySystems) {
        await system.start();
        this.logger.debug(`Started memory system: ${name}`);
      }

      this.state = ServiceState.RUNNING;
      this.logger.log('MemoryManager started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to start MemoryManager', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      this.logger.warn('MemoryManager is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      this.logger.log('Stopping MemoryManager');

      // Stop all memory systems
      for (const [name, system] of this.memorySystems) {
        await system.stop();
        this.logger.debug(`Stopped memory system: ${name}`);
      }

      this.state = ServiceState.STOPPED;
      this.logger.log('MemoryManager stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to stop MemoryManager', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  // Memory operations that delegate to appropriate systems
  async store(content: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>, systemName?: string): Promise<string> {
    const system = this.getMemorySystem(systemName);
    return await system.store(content);
  }

  async retrieve(id: string, systemName?: string): Promise<MemoryContent | null> {
    const system = this.getMemorySystem(systemName);
    return await system.retrieve(id);
  }

  async update(id: string, updates: Partial<Omit<MemoryContent, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>>, systemName?: string): Promise<MemoryContent | null> {
    const system = this.getMemorySystem(systemName);
    return await system.update(id, updates);
  }

  async delete(id: string, systemName?: string): Promise<boolean> {
    const system = this.getMemorySystem(systemName);
    return await system.delete(id);
  }

  async search(query: MemoryQuery, systemName?: string): Promise<MemoryQueryResult> {
    const system = this.getMemorySystem(systemName);
    return await system.search(query);
  }

  // Cross-system search
  async searchAll(query: MemoryQuery): Promise<MemoryQueryResult> {
    const allResults: MemoryQueryResult[] = [];
    let totalQueryTime = 0;

    for (const [name, system] of this.memorySystems) {
      try {
        const result = await system.search(query);
        allResults.push(result);
        totalQueryTime += result.queryTime;
      } catch (error) {
        this.logger.warn(`Search failed in memory system: ${name}`, error as Error);
      }
    }

    // Combine and sort results
    const combinedResults = allResults.flatMap(result => result.results);
    combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply limit across all results
    const limitedResults = query.limit ? combinedResults.slice(0, query.limit) : combinedResults;

    return {
      results: limitedResults,
      totalCount: combinedResults.length,
      queryTime: totalQueryTime,
      suggestions: this.combineSuggestions(allResults.map(r => r.suggestions || [])),
    };
  }

  // Agent-specific memory operations
  async storeAgentMemory(agentId: string, content: string, type: MemoryContentType, metadata?: Record<string, any>): Promise<string> {
    const memoryContent: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'> = {
      content,
      type,
      metadata: unknown;
        source: 'agent',
        agentId,
        tags: [`agent:${agentId}`, type],
        importance: 0.5,
        isPrivate: false,
        ...metadata,
      },
    };

    return await this.store(memoryContent);
  }

  async getAgentMemories(agentId: string, limit?: number): Promise<MemoryContent[]> {
    const query: MemoryQuery = {
      query: '',
      agentId,
      limit,
    };

    const result = await this.search(query);
    return result.results.map(r => r.content);
  }

  async storeConversation(agentId: string, conversation: string, metadata?: Record<string, any>): Promise<string> {
    return await this.storeAgentMemory(agentId, conversation, MemoryContentType.CONVERSATION, {
      ...metadata,
      tags: ['conversation', `agent:${agentId}`],
    });
  }

  async storeTaskResult(agentId: string, taskId: string, result: any, metadata?: Record<string, any>): Promise<string> {
    const content = typeof result === 'string' ? result : JSON.stringify(result);
    return await this.storeAgentMemory(agentId, content, MemoryContentType.TASK_RESULT, {
      ...metadata,
      taskId,
      tags: ['task_result', `agent:${agentId}`, `task:${taskId}`],
    });
  }

  async storeKnowledge(content: string, tags: string[], metadata?: Record<string, any>): Promise<string> {
    const memoryContent: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'> = {
      content,
      type: MemoryContentType.KNOWLEDGE,
      metadata: unknown;
        source: 'knowledge_base',
        tags: ['knowledge', ...tags],
        importance: 0.8,
        isPrivate: false,
        ...metadata,
      },
    };

    return await this.store(memoryContent);
  }

  // Memory system management
  addMemorySystem(name: string, system: MemorySystem): void {
    this.memorySystems.set(name, system);
    this.logger.log(`Added memory system: ${name}`);
  }

  removeMemorySystem(name: string): boolean {
    if (name === 'default') {
      throw new BaseError('Cannot remove default memory system', 'INVALID_OPERATION');
    }

    const removed = this.memorySystems.delete(name);
    if (removed) {
      this.logger.log(`Removed memory system: ${name}`);
    }
    return removed;
  }

  getMemorySystemNames(): string[] {
    return Array.from(this.memorySystems.keys());
  }

  async getSystemStats(systemName?: string): Promise<Record<string, any>> {
    if (systemName) {
      const system = this.getMemorySystem(systemName);
      return { [systemName]: await system.getStats() };
    }

    const stats: Record<string, any> = {};
    for (const [name, system] of this.memorySystems) {
      try {
        stats[name] = await system.getStats();
      } catch (error) {
        this.logger.warn(`Failed to get stats for memory system: ${name}`, error as Error);
        stats[name] = { error: (error as Error).message };
      }
    }

    return stats;
  }

  // Utility methods
  async findSimilarMemories(content: string, limit: number = 5): Promise<MemoryContent[]> {
    const query: MemoryQuery = {
      query: content,
      limit,
      minRelevance: 0.3,
    };

    const result = await this.searchAll(query);
    return result.results.map(r => r.content);
  }

  async getRecentMemories(agentId?: string, limit: number = 10): Promise<MemoryContent[]> {
    const query: MemoryQuery = {
      query: '',
      agentId,
      limit,
    };

    const result = await this.searchAll(query);
    
    // Sort by creation date (most recent first)
    const sortedResults = result.results.sort((a, b) => 
      b.content.createdAt.getTime() - a.content.createdAt.getTime()
    );

    return sortedResults.map(r => r.content);
  }

  async getMemoriesByTag(tag: string, limit?: number): Promise<MemoryContent[]> {
    const query: MemoryQuery = {
      query: '',
      tags: [tag],
      limit,
    };

    const result = await this.searchAll(query);
    return result.results.map(r => r.content);
  }

  private getMemorySystem(systemName?: string): MemorySystem {
    const name = systemName || 'default';
    const system = this.memorySystems.get(name);
    
    if (!system) {
      throw new BaseError(`Memory system not found: ${name}`, 'MEMORY_SYSTEM_NOT_FOUND');
    }

    return system;
  }

  private combineSuggestions(suggestionArrays: string[][]): string[] {
    const suggestionCounts = new Map<string, number>();
    
    for (const suggestions of suggestionArrays) {
      for (const suggestion of suggestions) {
        suggestionCounts.set(suggestion, (suggestionCounts.get(suggestion) || 0) + 1);
      }
    }

    // Sort by frequency and return top suggestions
    return Array.from(suggestionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([suggestion]) => suggestion);
  }
}