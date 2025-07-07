import { MemoryItem } from './types';
  async retrieve(filter: Partial<MemoryItem>, limit: number = 100): Promise<MemoryItem[]> { // If vector store exists and there';
          .filter(([key]) => !['agentId', 'taskId', 'timestamp', 'type';
          .reduce((obj, [key, value]) => ({ ...obj, [key]: '';
      this.logger.info('Cleared all memory items'
      `Cleared memory items for ${agentId ? `agent ${agentId}` : ''} ${taskId ? `task ${taskId}` : ''``;