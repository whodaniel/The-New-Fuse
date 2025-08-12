import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface MemoryItem {
  id: string;
  agentId: string;
  taskId?: string;
  type: 'fact' | 'procedure' | 'event' | 'context';
  content: any;
  metadata: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface MemoryFilter {
  agentId?: string;
  taskId?: string;
  type?: MemoryItem['type'];
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
}

export interface MemorySearchOptions {
  filter?: MemoryFilter;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class SharedMemory {
  private readonly logger = new Logger(SharedMemory.name);
  private readonly memoryItems = new Map<string, MemoryItem>();

  constructor(private readonly redisService?: RedisService) {
    this.logger.log('SharedMemory service initialized');
    this.startCleanupSchedule();
  }

  async store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = this.generateId();
      const memoryItem: MemoryItem = {
        ...item,
        id,
        timestamp: new Date()
      };

      this.memoryItems.set(id, memoryItem);
      this.logger.debug(`Stored memory item: ${id} for agent: ${item.agentId}`);

      // Store in Redis if available
      if (this.redisService) {
        const key = `memory:${id}`;
        await this.redisService.set(key, JSON.stringify(memoryItem));
        
        // Set expiration if specified
        if (memoryItem.expiresAt) {
          const ttl = Math.floor((memoryItem.expiresAt.getTime() - Date.now()) / 1000);
          if (ttl > 0) {
            await this.redisService.expire(key, ttl);
          }
        }
      }

      return id;
    } catch (error) {
      this.logger.error('Failed to store memory item', error);
      throw error;
    }
  }

  async retrieve(id: string): Promise<MemoryItem | null> {
    try {
      // Try local memory first
      let memoryItem = this.memoryItems.get(id);

      // If not found locally, try Redis
      if (!memoryItem && this.redisService) {
        const key = `memory:${id}`;
        const cached = await this.redisService.get(key);
        if (cached) {
          memoryItem = JSON.parse(cached);
          if (memoryItem) {
            // Restore dates
            memoryItem.timestamp = new Date(memoryItem.timestamp);
            if (memoryItem.expiresAt) {
              memoryItem.expiresAt = new Date(memoryItem.expiresAt);
            }
            // Cache locally
            this.memoryItems.set(id, memoryItem);
          }
        }
      }

      // Check if item has expired
      if (memoryItem && this.isExpired(memoryItem)) {
        await this.delete(id);
        return null;
      }

      return memoryItem || null;
    } catch (error) {
      this.logger.error(`Failed to retrieve memory item: ${id}`, error);
      return null;
    }
  }

  async search(options: MemorySearchOptions = {}): Promise<MemoryItem[]> {
    try {
      let items = Array.from(this.memoryItems.values());

      // Apply filters
      if (options.filter) {
        items = this.applyFilters(items, options.filter);
      }

      // Remove expired items
      items = items.filter(item => !this.isExpired(item));

      // Sort items
      if (options.sortBy) {
        items = this.sortItems(items, options.sortBy, options.sortOrder || 'desc');
      }

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || items.length;
      items = items.slice(offset, offset + limit);

      this.logger.debug(`Found ${items.length} memory items matching criteria`);
      return items;
    } catch (error) {
      this.logger.error('Failed to search memory items', error);
      return [];
    }
  }

  private applyFilters(items: MemoryItem[], filter: MemoryFilter): MemoryItem[] {
    return items.filter(item => {
      if (filter.agentId && item.agentId !== filter.agentId) return false;
      if (filter.taskId && item.taskId !== filter.taskId) return false;
      if (filter.type && item.type !== filter.type) return false;
      if (filter.fromDate && item.timestamp < filter.fromDate) return false;
      if (filter.toDate && item.timestamp > filter.toDate) return false;
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every(tag => item.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    });
  }

  private sortItems(items: MemoryItem[], sortBy: 'timestamp' | 'priority', order: 'asc' | 'desc'): MemoryItem[] {
    return items.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'timestamp') {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  async update(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'timestamp'>>): Promise<boolean> {
    try {
      const existingItem = await this.retrieve(id);
      if (!existingItem) {
        return false;
      }

      const updatedItem: MemoryItem = {
        ...existingItem,
        ...updates,
        id: existingItem.id, // Ensure ID is not changed
        timestamp: existingItem.timestamp // Preserve original timestamp
      };

      this.memoryItems.set(id, updatedItem);

      // Update in Redis if available
      if (this.redisService) {
        const key = `memory:${id}`;
        await this.redisService.set(key, JSON.stringify(updatedItem));
      }

      this.logger.debug(`Updated memory item: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update memory item: ${id}`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const deleted = this.memoryItems.delete(id);

      // Delete from Redis if available
      if (this.redisService) {
        const key = `memory:${id}`;
        await this.redisService.del(key);
      }

      if (deleted) {
        this.logger.debug(`Deleted memory item: ${id}`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete memory item: ${id}`, error);
      return false;
    }
  }

  async clear(agentId?: string): Promise<number> {
    try {
      let deletedCount = 0;

      if (agentId) {
        // Clear memory for specific agent
        const itemsToDelete = Array.from(this.memoryItems.entries())
          .filter(([_, item]) => item.agentId === agentId);

        for (const [id, _] of itemsToDelete) {
          if (await this.delete(id)) {
            deletedCount++;
          }
        }
      } else {
        // Clear all memory
        const allIds = Array.from(this.memoryItems.keys());
        
        for (const id of allIds) {
          if (await this.delete(id)) {
            deletedCount++;
          }
        }
      }

      this.logger.log(`Cleared ${deletedCount} memory items${agentId ? ` for agent ${agentId}` : ''}`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to clear memory', error);
      return 0;
    }
  }

  async getStats(agentId?: string): Promise<{
    totalItems: number;
    byType: Record<MemoryItem['type'], number>;
    byPriority: Record<MemoryItem['priority'], number>;
    expiredItems: number;
  }> {
    try {
      let items = Array.from(this.memoryItems.values());

      if (agentId) {
        items = items.filter(item => item.agentId === agentId);
      }

      const stats = {
        totalItems: items.length,
        byType: { fact: 0, procedure: 0, event: 0, context: 0 } as Record<MemoryItem['type'], number>,
        byPriority: { low: 0, medium: 0, high: 0 } as Record<MemoryItem['priority'], number>,
        expiredItems: 0
      };

      for (const item of items) {
        stats.byType[item.type]++;
        stats.byPriority[item.priority]++;
        
        if (this.isExpired(item)) {
          stats.expiredItems++;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get memory stats', error);
      return {
        totalItems: 0,
        byType: { fact: 0, procedure: 0, event: 0, context: 0 },
        byPriority: { low: 0, medium: 0, high: 0 },
        expiredItems: 0
      };
    }
  }

  async share(fromAgentId: string, toAgentId: string, itemId: string): Promise<boolean> {
    try {
      const item = await this.retrieve(itemId);
      if (!item || item.agentId !== fromAgentId) {
        return false;
      }

      // Create a new memory item for the target agent
      const sharedItem: Omit<MemoryItem, 'id' | 'timestamp'> = {
        ...item,
        agentId: toAgentId,
        metadata: {
          ...item.metadata,
          sharedFrom: fromAgentId,
          sharedAt: new Date()
        }
      };

      const newId = await this.store(sharedItem);
      this.logger.debug(`Shared memory item ${itemId} from ${fromAgentId} to ${toAgentId} as ${newId}`);
      
      return true;
    } catch (error) {
      this.logger.error('Failed to share memory item', error);
      return false;
    }
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isExpired(item: MemoryItem): boolean {
    return item.expiresAt ? new Date() > item.expiresAt : false;
  }

  private startCleanupSchedule(): void {
    // Clean up expired items every 5 minutes
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000);
  }

  private async cleanupExpiredItems(): Promise<void> {
    try {
      const expiredItems = Array.from(this.memoryItems.entries())
        .filter(([_, item]) => this.isExpired(item));

      let cleanedCount = 0;
      for (const [id, _] of expiredItems) {
        if (await this.delete(id)) {
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleaned up ${cleanedCount} expired memory items`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired items', error);
    }
  }
}