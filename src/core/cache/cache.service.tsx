import { Injectable } from "@nestjs/common";
import { LRUCache } from './lru-cache.tsx';

@Injectable()
export class CacheService {
  private cache: LRUCache<unknown>;

  constructor(private readonly maxSize: number = 1000) {
    this.cache = new LRUCache(maxSize);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) as T | null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async size(): Promise<number> {
    return this.cache.size();
  }
}