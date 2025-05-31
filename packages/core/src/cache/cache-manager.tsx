import { createClient } from 'redis';

export class CacheManager {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL
    });
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttl
    });
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }
}