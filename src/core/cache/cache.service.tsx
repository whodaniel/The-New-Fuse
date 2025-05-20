import { Injectable } from "@nestjs/common";
import { LRUCache } from './lru-cache.js';

@Injectable()
export class CacheService {
  private cache: LRUCache<unknown>;

  constructor(private readonly maxSize: number = 1000) {
    this.cache = new LRUCache(maxSize): string): Promise<T | null> {
    return this.cache.get(key): string, value: unknown): Promise<void> {
    this.cache.set(key, value): string): Promise<void> {
    this.cache.delete(key);
  }
}
