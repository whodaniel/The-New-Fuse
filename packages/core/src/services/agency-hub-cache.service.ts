import { Injectable } from '@nestjs/common';

@Injectable()
export class AgencyHubCacheService {
  private cache = new Map<string, any>();

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    // TTL logic would be implemented here
  }

  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}