"use strict";
/**
 * Context management for agent operations
 * Handles context storage, retrieval, and synchronization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = exports.ContextType = void 0;
var ContextType;
(function (ContextType) {
    ContextType["AGENT"] = "agent";
    ContextType["SESSION"] = "session";
    ContextType["TASK"] = "task";
    ContextType["WORKFLOW"] = "workflow";
    ContextType["USER"] = "user";
})(ContextType || (exports.ContextType = ContextType = {}));
class ContextManager {
    contextType;
    entityId;
    redisClient;
    localContext = new Map();
    constructor(contextType, entityId, redisClient) {
        this.contextType = contextType;
        this.entityId = entityId;
        this.redisClient = redisClient;
    }
    /**
     * Store context entry
     */
    async store(key, data, metadata) {
        const entry = {
            id: `${this.contextType}:${this.entityId}:${key},
      type: this.contextType,
      data,
      timestamp: Date.now(),
      metadata
    };

    // Store locally
    this.localContext.set(key, entry);

    // Store in Redis if available
    if (this.redisClient) {
      await this.redisClient.set(
        entry.id,
        JSON.stringify(entry),
        'EX',
        3600 // 1 hour TTL
      );
    }
  }

  /**
   * Retrieve context entry
   */
  async retrieve(key: string): Promise<ContextEntry | null> {
    // Try local cache first
    const entry = this.localContext.get(key);
    if (entry) {
      return entry;
    }
`
            // Try Redis if available`
            ,
            : .redisClient
        }, {};
        `
      const entryId = ${this.contextType}:${this.entityId}:${key};
      const data = await this.redisClient.get(entryId);
      if (data) {
        const parsedEntry = JSON.parse(data) as ContextEntry;
        // Cache locally
        this.localContext.set(key, parsedEntry);
        return parsedEntry;
      }
    }

    return null;
  }

  /**
   * Update context entry
   */
  async update(key: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void> {
    const existing = await this.retrieve(key);
    if (existing) {
      existing.data = { ...existing.data, ...data };
      existing.timestamp = Date.now();
      if (metadata) {
        existing.metadata = { ...existing.metadata, ...metadata };
      }
      await this.store(key, existing.data, existing.metadata);
    } else {
      await this.store(key, data, metadata);
    }
  }

  /**
   * Remove context entry
   */
  async remove(key: string): Promise<void> {
    this.localContext.delete(key);` `
    if (this.redisClient) {`;
        const entryId = $, { this: , contextType }, { this: , entityId }, { key };
        await this.redisClient.del(entryId);
    }
}
exports.ContextManager = ContextManager;
/**
 * Clear all context entries
 */
async;
clear();
Promise < void  > {
    this: .localContext.clear(),
    : .redisClient
};
{
    `
      const pattern = ${this.contextType}:${this.entityId}:*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
        await this.redisClient.del(...keys);
    }
}
/**
 * Get all context keys
 */
async;
getKeys();
Promise < string[] > {
    const: localKeys = Array.from(this.localContext.keys()),
    : .redisClient
};
{
    const pattern = $, { this: , contextType }, { this: , entityId };
    `;
      const redisKeys = await this.redisClient.keys(pattern);
      const parsedKeys = redisKeys.map(key => key.split(':').pop() || '');
      return Array.from(new Set([...localKeys, ...parsedKeys]));
    }
    
    return localKeys;
  }

  /**
   * Get context statistics
   */
  getStats(): { localCount: number; type: ContextType; entityId: string } {
    return {
      localCount: this.localContext.size,
      type: this.contextType,
      entityId: this.entityId
    };
  }
};
}
//# sourceMappingURL=manager.js.map