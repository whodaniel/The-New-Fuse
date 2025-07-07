import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  value: T;
  expires: number;
  hits: number;
  created: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRatio: number;
}

@Injectable()
export class MemoryCache<T = any> {
  private readonly logger = new Logger(MemoryCache.name);
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSize = 1000, defaultTTL = 3600000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expires,
      hits: 0,
      created: Date.now(),
    };

    this.cache.set(key, entry);
    this.logger.debug(`Cache SET: ${key}`);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    this.logger.debug('Cache cleared');
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  getStats(): CacheStats {
    this.cleanup();
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRatio: total > 0 ? this.stats.hits / total : 0,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const accessTime = entry.created + (entry.hits * 1000); // Rough LRU calculation
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.logger.debug(`Cache EVICT: ${oldestKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}