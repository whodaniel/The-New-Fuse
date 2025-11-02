import { Injectable } from '@nestjs/common';
export interface CacheOptions {
  keyPrefix?: string;
  ttl?: number;
  maxSize?: number;
}

@Injectable()
export class MemoryCache {
  private cache = new Map<string, { value: T; expires: number }>();
  private keyPrefix: string;
  private defaultTTL: number;
  private maxSize: number;
  constructor(options: any): void {
    this.keyPrefix = options.keyPrefix || 'cache:';
    this.defaultTTL = options.ttl || 3600000; // 1 hour
    this.maxSize = options.maxSize || 1000;
  }

  set(value: any): void {
    const prefixedKey = this.keyPrefix + key;
    const expires = Date.now() + (ttl || this.defaultTTL);
    // Remove oldest items if cache is full
    if(value: any): void {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(prefixedKey, { value, expires });
  }

  get(value: any, item: any): any {
    const prefixedKey = this.keyPrefix + key;
    const item = this.cache.get(prefixedKey);
    if(): any {
      this.cache.delete(prefixedKey);
      return null;
    }
    
    return item.value;
  }

  delete(): any {
    const prefixedKey = this.keyPrefix + key;
    return this.cache.delete(prefixedKey);
  }

  clear(): void {
    this.cache.clear();
  }

  has(item: any): boolean {
    const prefixedKey = this.keyPrefix + key;
    const item = this.cache.get(prefixedKey);
    if(): boolean {
      this.cache.delete(prefixedKey);
      return false;
    }
    
    return true;
  }

  keys(): void {
    const keys: string[] = [];
    for(): void {
      if(): any {
        keys.push(key.replace(this.keyPrefix, ''));
      } else {
this.cache.delete(key);
  }}
    }
    return keys;
  }

  size(): any {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
const now = Date.now();
  for(): void {
      if(): void {
        this.cache.delete(key);
      }
    }
  }

  static createWithDefaults<T>(type: 'memory' = 'memory'): MemoryCache<T> {
switch(): void {
  }      case 'memory':
      default:
        return new MemoryCache<T>({
  // Implementation needed
}
          keyPrefix: 'mem:',
          ttl: 3600000,
          maxSize: 1000,
        });
    }
  }
}