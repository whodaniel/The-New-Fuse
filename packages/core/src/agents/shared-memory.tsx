import { Memory, MemoryItem } from './types.js';
import { VectorStore } from '../vectordb/vector-store.js';
import { Logger } from '../logging.js';

export class SharedMemory implements Memory {
  private logger: Logger;
  private vectorStore?: VectorStore;
  private inMemoryItems: MemoryItem[] = [];
  
  constructor(logger: Logger, vectorStore?: VectorStore) {
    this.logger = logger;
    this.vectorStore = vectorStore;
  }
  
  /**
   * Store a memory item
   */
  async store(item: MemoryItem): Promise<void> {
    this.inMemoryItems.push(item);
    this.logger.debug(`Stored memory item: ${item.id}`);
    
    // If vector store is available, also store for semantic search
    if (this.vectorStore) {
      await this.vectorStore.storeDocuments([{
        id: item.id,
        content: item.content,
        metadata: {
          agentId: item.agentId,
          taskId: item.taskId,
          timestamp: item.timestamp,
          type: item.type,
          ...item.metadata
        }
      }]);
    }
  }
  
  /**
   * Retrieve memory items based on filter
   */
  async retrieve(filter: Partial<MemoryItem>, limit: number = 100): Promise<MemoryItem[]> {
    // If vector store exists and there's content to search by, use semantic search
    if (this.vectorStore && filter.content) {
      const searchResults = await this.vectorStore.search(filter.content, { limit });
      
      return searchResults.map(result => ({
        id: result.id,
        agentId: result.metadata.agentId,
        taskId: result.metadata.taskId,
        timestamp: result.metadata.timestamp,
        content: result.content,
        type: result.metadata.type,
        metadata: Object.entries(result.metadata)
          .filter(([key]) => !['agentId', 'taskId', 'timestamp', 'type'].includes(key))
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
      }));
    }
    
    // Otherwise, use simple filtering on in-memory items
    return this.inMemoryItems
      .filter(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) {
            return false;
          }
        }
        return true;
      })
      .slice(0, limit);
  }
  
  /**
   * Clear memory items
   */
  async clear(agentId?: string, taskId?: string): Promise<void> {
    if (!agentId && !taskId) {
      this.inMemoryItems = [];
      this.logger.info('Cleared all memory items');
      return;
    }
    
    this.inMemoryItems = this.inMemoryItems.filter(item => {
      if (agentId && item.agentId === agentId) return false;
      if (taskId && item.taskId === taskId) return false;
      return true;
    });
    
    this.logger.info(`Cleared memory items for ${agentId ? `agent ${agentId}` : ''} ${taskId ? `task ${taskId}` : ''}`);
  }
}
