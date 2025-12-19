import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { VectorDatabaseService } from '@the-new-fuse/core-vector-db';
import {
  MemoryContent,
  MemoryQuery,
  MemoryQueryResult,
  MemoryStorageConfig,
  MemoryStats,
  MemoryContentType,
} from '../types/memory';
import { ServiceState } from '../constants/types';
import { MemorySystem } from './MemorySystem';
import { BaseError } from '../utils/errors';

/**
 * Vector-based Memory System using the shared VectorDatabaseService
 * Stores memories as vectors for semantic search
 */
@Injectable()
export class VectorMemorySystem {
  private readonly logger = new Logger(VectorMemorySystem.name);
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private readonly COLLECTION_NAME = 'agent_memory';

  constructor(@Inject(VectorDatabaseService) private readonly vectorDb: VectorDatabaseService) {}

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      this.logger.warn('VectorMemorySystem is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.log('Starting VectorMemorySystem');

      // Ensure collection exists
      const exists = await this.vectorDb.collectionExists(this.COLLECTION_NAME);
      if (!exists) {
        this.logger.log(`Creating collection ${this.COLLECTION_NAME}`);
        await this.vectorDb.createCollection({
          name: this.COLLECTION_NAME,
          dimension: 1536, // Default for text-embedding-3-small
          metric: 'cosine',
          description: 'Agent long-term memory',
        });
      }

      this.state = ServiceState.RUNNING;
      this.logger.log('VectorMemorySystem started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to start VectorMemorySystem', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.state = ServiceState.STOPPED;
    this.logger.log('VectorMemorySystem stopped');
  }

  async store(
    content: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>,
  ): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const memoryContent: MemoryContent = {
      ...content,
      id,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    await this.vectorDb.addDocuments(this.COLLECTION_NAME, [
      {
        id,
        content: content.content,
        metadata: {
          ...content.metadata,
          type: content.type,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          accessCount: 0,
          lastAccessed: now.toISOString(),
        },
      },
    ]);

    this.logger.debug(`Stored vector memory: ${id}`);
    return id;
  }

  async retrieve(id: string): Promise<MemoryContent | null> {
    const doc = await this.vectorDb.getDocument(this.COLLECTION_NAME, id);
    if (!doc) {
      return null;
    }

    // Convert metadata back to types
    const metadata = doc.metadata || {};

    // Update access count (fire and forget update)
    const newAccessCount = (metadata.accessCount || 0) + 1;
    this.vectorDb
      .updateDocument(this.COLLECTION_NAME, id, {
        metadata: {
          ...metadata,
          accessCount: newAccessCount,
          lastAccessed: new Date().toISOString(),
        },
      })
      .catch((err) => this.logger.warn(`Failed to update access metrics for ${id}`, err));

    return {
      id: doc.id,
      content: doc.content,
      type: (metadata.type as MemoryContentType) || MemoryContentType.TEXT,
      metadata: {
        source: metadata.source || 'unknown',
        agentId: metadata.agentId,
        taskId: metadata.taskId,
        tags: metadata.tags || [],
        importance: metadata.importance || 0.5,
        isPrivate: metadata.isPrivate || false,
        ...metadata, // Keep other metadata
      },
      createdAt: new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
      accessCount: newAccessCount,
      lastAccessed: new Date(),
    };
  }

  async update(
    id: string,
    updates: Partial<Omit<MemoryContent, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>>,
  ): Promise<MemoryContent | null> {
    const existing = await this.retrieve(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date() };

    await this.vectorDb.updateDocument(this.COLLECTION_NAME, id, {
      content: updates.content,
      metadata: {
        ...merged.metadata,
        updatedAt: merged.updatedAt.toISOString(),
        type: merged.type,
      },
    });

    return merged;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.vectorDb.deleteDocument(this.COLLECTION_NAME, id);
      return true;
    } catch {
      return false;
    }
  }

  async search(query: MemoryQuery): Promise<MemoryQueryResult> {
    const startTime = Date.now();

    // Convert MemoryQuery filters to vector DB metadata filters
    const filter: Record<string, any> = {};
    if (query.type) filter.type = query.type;
    if (query.agentId) filter.agentId = query.agentId;
    // Note: Complex filters like 'tags contains' or 'time ranges' might need driver-specific support
    // For now we map direct equality.

    const results = await this.vectorDb.semanticSearch(this.COLLECTION_NAME, query.query, {
      limit: query.limit || 10,
      threshold: query.minRelevance || 0.6,
      metadata_filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    const memoryResults = results.map((r) => {
      const metadata = r.metadata || {};
      return {
        content: {
          id: r.id,
          content: r.content || '',
          type: (metadata.type as MemoryContentType) || MemoryContentType.TEXT,
          metadata: {
            source: metadata.source || 'unknown',
            tags: metadata.tags || [],
            importance: metadata.importance || 0.5,
            isPrivate: metadata.isPrivate || false,
            ...metadata,
          },
          createdAt: new Date(metadata.createdAt || Date.now()),
          updatedAt: new Date(metadata.updatedAt || Date.now()),
          accessCount: metadata.accessCount || 0,
          lastAccessed: new Date(metadata.lastAccessed || Date.now()),
        },
        relevanceScore: r.score,
        matchedTerms: [], // Vector search doesn't return matched terms easily
      };
    });

    // Post-filter logic for complex queries not handled by vector DB
    let filtered = memoryResults;
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter((m) =>
        query.tags!.some((tag) => m.content.metadata.tags.includes(tag)),
      );
    }
    if (query.timeRange) {
      filtered = filtered.filter(
        (m) =>
          m.content.createdAt >= query.timeRange!.start &&
          m.content.createdAt <= query.timeRange!.end,
      );
    }

    return {
      results: filtered,
      totalCount: filtered.length,
      queryTime: Date.now() - startTime,
      suggestions: [],
    };
  }

  async getStats(): Promise<MemoryStats> {
    const stats = await this.vectorDb.getStats(this.COLLECTION_NAME);
    return {
      totalItems: stats.document_count || 0,
      totalSize: stats.size_bytes || 0,
      averageRelevance: 0,
      mostAccessedItems: [], // Not efficiently queryable without specialized index
      recentOperations: [],
      storageUtilization: 0,
      indexingStatus: 'up-to-date',
    };
  }
}
