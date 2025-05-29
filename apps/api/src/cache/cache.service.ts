import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache = new Map<string, any>();
  private logger = new Logger(CacheService.name);

  async get(key: string): Promise<string | null> {
    const value = this.cache.get(key);
    return value || null;
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl * 1000);
    }
    return 'OK';
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    return this.set(key, value, ttl);
  }

  async del(key: string): Promise<number> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }

  async sadd(key: string, member: string): Promise<number> {
    const set = this.cache.get(key) || new Set();
    const wasNew = !set.has(member);
    set.add(member);
    this.cache.set(key, set);
    return wasNew ? 1 : 0;
  }

  async srem(key: string, member: string): Promise<number> {
    const set = this.cache.get(key);
    if (!set) return 0;
    const existed = set.has(member);
    set.delete(member);
    return existed ? 1 : 0;
  }

  async scard(key: string): Promise<number> {
    const set = this.cache.get(key);
    return set ? set.size : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.cache.get(key);
    return set ? Array.from(set) : [];
  }

  async exists(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key: string, ttl: number): Promise<number> {
    if (!this.cache.has(key)) return 0;
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
    return 1;
  }
}