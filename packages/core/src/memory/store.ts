import { Injectable, Logger } from '@nestjs/common';
import { MemoryItem, MemoryQuery, SearchResult } from './MemoryTypes';

export interface MemoryStore {
  store(item: MemoryItem): Promise<void>;
  retrieve(id: string): Promise<MemoryItem | null>;
  query(query: MemoryQuery): Promise<MemoryItem[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

@Injectable()
export class InMemoryStore implements MemoryStore {
  private readonly logger = new Logger(InMemoryStore.name);
  private readonly items: Map<string, MemoryItem> = new Map();

  constructor() {
    this.logger.log('InMemoryStore initialized');
  }

  async store(item: MemoryItem): Promise<void> {
    this.items.set(item.id, item);
    this.logger.debug(`Stored memory item: ${item.id}`);
  }

  async retrieve(id: string): Promise<MemoryItem | null> {
    const item = this.items.get(id);
    if (item) {
      this.logger.debug(`Retrieved memory item: ${id}`);
      return item;
    }
    return null;
  }

  async query(query: MemoryQuery): Promise<MemoryItem[]> {
    const results: MemoryItem[] = [];
    
    for (const item of this.items.values()) {
      if (this.matchesQuery(item, query)) {
        results.push(item);
      }
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if specified
    if (query.limit) {
      return results.slice(0, query.limit);
    }
    
    return results;
  }

  async delete(id: string): Promise<void> {
    if (this.items.delete(id)) {
      this.logger.debug(`Deleted memory item: ${id}`);
    }
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.logger.debug('Cleared all memory items');
  }

  async getStats(): Promise<{
    totalItems: number;
    memoryUsage: string;
  }> {
    return {
      totalItems: this.items.size,
      memoryUsage: this.formatBytes(this.items.size * 1024), // Rough estimate
    };
  }

  private matchesQuery(item: MemoryItem, query: MemoryQuery): boolean {
    // Text search
    if (query.text && !item.content.toLowerCase().includes(query.text.toLowerCase())) {
      return false;
    }

    // Metadata filters
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (item.metadata[key] !== value) {
          return false;
        }
      }
    }

    // Tag filters
    if (query.tags && query.tags.length > 0) {
      const itemTags = item.tags || [];
      const hasAllTags = query.tags.every(tag => itemTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Cluster filter
    if (query.clusterId && item.clusterId !== query.clusterId) {
      return false;
    }

    // Date range filter
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