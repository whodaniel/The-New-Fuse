import { Logger } from "winston";
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
export declare class LRUCache<K, V> {
  private logger;
  private options;
  private cache;
  private stats;
  constructor(logger: Logger, options: CacheOptions<K, V>);
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  clear(): void;
  getStats(): CacheStats;
  private isExpired;
  private evictOldest;
  private resetStats;
}
