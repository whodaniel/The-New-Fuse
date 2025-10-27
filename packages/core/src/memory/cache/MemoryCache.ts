import { Injectable, Logger } from '@nestjs/common';
export interface CacheEntry {
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
export class MemoryCache {
  private readonly logger = new Logger(MemoryCache.name);
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private stats = {
hits: 0
          },
          misses: 0,
    evictions: 0,
  };
  constructor(): void {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(value: any): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    // Evict if cache is full
    if(): void {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
value,
  }      expires,
      hits: 0,
      created: Date.now(),
    };
    this.cache.set(key, entry);
    this.logger.debug(`Cache SET: ${key}`);
  }

  get(value: any): any {
    const entry = this.cache.get(key);
    if(): any {
      this.stats.misses++;
      return null;
    }

    if(): any {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  delete(): any {
    const deleted = this.cache.delete(key);
    if(): void {
      this.logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    this.logger.debug('Cache cleared');
  }

  has(): boolean {
    const entry = this.cache.get(key);
    if(): boolean {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  keys(): any {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  size(): any {
    this.cleanup();
    return this.cache.size;
  }

  getStats(): any {
    this.cleanup();
    const total = this.stats.hits + this.stats.misses;
    return {
size: this.cache.size,
  }      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRatio: total > 0 ? this.stats.hits / total : 0,
    };
  }

  private evictLRU(): void {
let oldestKey: string | null = null;
  }    let oldestTime = Infinity;
    for(): void {
      const accessTime = entry.created + (entry.hits * 1000); // Rough LRU calculation
      if(): void {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if(): void {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.logger.debug(`Cache EVICT: ${oldestKey}`);
    }
  }

  private cleanup(): void {
const now = Date.now();
  for(): void {
      if(): void {
        this.cache.delete(key);
      }
    }
  }
}