import { Redis } from 'ioredis';
import { DatabaseService } from '@the-new-fuse/database';

export class MemoryManager {
  private redis: any;
  private db: DatabaseService;
  
  constructor() {
    this.redis = new (Redis as any)(process.env.REDIS_URL || 'redis://localhost:6379');
    this.db = new DatabaseService();
  }

  async store(key: string, value: unknown): Promise<void> {
    // Short-term memory (Redis)
    await this.redis.set(key, JSON.stringify(value));
    
    // Long-term memory (Database)
    await this.db.memories.create({
      data: {
        key,
        value: JSON.stringify(value),
        timestamp: new Date()
      }
    });
  }
  
  async get(key: string): Promise<any> {
    // Try short-term memory first
    const shortTerm = await this.redis.get(key);
    if (shortTerm) {
      return JSON.parse(shortTerm);
    }
    
    // Fall back to long-term memory
    const longTerm = await this.db.memories.findFirst({
      where: { key },
      orderBy: { timestamp: 'desc' }
    });
    
    return longTerm ? JSON.parse(longTerm.value as string) : null;
  }
  
  async clear(key: string): Promise<void> {
    await this.redis.del(key);
    await this.db.memories.deleteMany({
      where: { key }
    });
  }
  
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    await this.db.$disconnect();
  }
}
