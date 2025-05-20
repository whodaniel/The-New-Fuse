import { createClient } from 'redis';

export class CacheManager {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL
    }): string, value: unknown, ttl?: number) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttl
    });
  }

  async get(): Promise<void> {key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }
}