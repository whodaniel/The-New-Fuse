import { Logger } from 'winston';
import { injectable, inject } from 'inversify';
import TYPES from '../types.js';

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export interface CacheOptions<K, V> {
  maxSize: number;
  ttl?: number;
  onEvict?: (key: K, value: V) => void;
}

@injectable()
export class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private stats: CacheStats;

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    private options: CacheOptions<K, V>
  ) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
  }

  public get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update timestamp on access to make it "recently used"
    entry.timestamp = Date.now();
    this.stats.hits++;
    return entry.value;
  }

  public set(key: K, value: V): void {
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    this.stats.size = this.cache.size;
  }

  public delete(key: K): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  private isExpired(entry: { timestamp: number }): boolean {
    if (!this.options.ttl) {
      return false;
    }
    return Date.now() - entry.timestamp > this.options.ttl;
  }

  private evictOldest(): void {
    let oldestKey: K | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const evictedValue = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      
      if (evictedValue && this.options.onEvict) {
        try {
          this.options.onEvict(oldestKey, evictedValue.value);
        } catch (error) {
          this.logger.error('Cache eviction error', { error, key: oldestKey });
        }
      }
    }
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
  }
}
