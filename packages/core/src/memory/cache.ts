import { Injectable } from '@nestjs/common';

export interface CacheOptions {
  keyPrefix?: string;
  ttl?: number;
  maxSize?: number;
}

@Injectable()
export class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();
  private keyPrefix: string;
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'cache:';
    this.defaultTTL = options.ttl || 3600000; // 1 hour
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, value: T, ttl?: number): void {
    const prefixedKey = this.keyPrefix + key;
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(prefixedKey, { value, expires });
  }

  get(key: string): T | null {
    const prefixedKey = this.keyPrefix + key;
    const item = this.cache.get(prefixedKey);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(prefixedKey);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): boolean {
    const prefixedKey = this.keyPrefix + key;
    return this.cache.delete(prefixedKey);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const prefixedKey = this.keyPrefix + key;
    const item = this.cache.get(prefixedKey);
    
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(prefixedKey);
      return false;
    }
    
    return true;
  }

  keys(): string[] {
    const keys: string[] = [];
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() <= item.expires) {
        keys.push(key.replace(this.keyPrefix, ''));
      } else {
        this.cache.delete(key);
      }
    }
    return keys;
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  static createWithDefaults<T>(type: 'memory' = 'memory'): MemoryCache<T> {
    switch (type) {
      case 'memory':
      default:
        return new MemoryCache<T>({
          keyPrefix: 'mem:',
          ttl: 3600000,
          maxSize: 1000,
        });
    }
  }
}