import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;
  private subClient: RedisClientType;
  
  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({ url });
    this.subClient = createClient({ url });
    
    this.connect();
  }
  
  private async connect() {
    try {
      await this.client.connect();
      await this.subClient.connect();
      console.log('Redis connected successfully');
    } catch (err) {
      console.error('Redis connection error:', err);
    }
  }
  
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }
  
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
  
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }
  
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subClient.subscribe(channel, callback);
  }
  
  // Public method to access subscription functionality
  async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscribe(channel, callback);
  }
  
  async unsubscribe(channel: string): Promise<void> {
    await this.subClient.unsubscribe(channel);
  }
  
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    await this.subClient.disconnect();
  }
  
  async getTasks(): Promise<any[]> {
    // Implementation needed
    return [];
  }
}
