import { Injectable } from '@nestjs/common';
import { RedisManager } from '../redis_manager.js';
import { Logger } from '../utils/logger.js';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MemoryCache {
  private readonly logger = new Logger(MemoryCache.name): ;

  constructor(private readonly redisManager: RedisManager) {}

  async set<T>(): Promise<void> {key: string, value: T, ttl?: number, metadata?: Record<string, unknown>): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      metadata,
      expiresAt: ttl ? Date.now(): undefined
    };

    try {
      await this.redisManager.set(
        this.getKey(key): $ {key}`);
    } catch (error: unknown){
      this.logger.error(`Error caching value for key ${key}:`, error): string): Promise<T | null> {
    try {
      const data: ${key}`);
      return entry.value;
    } catch (error: unknown){
      this.logger.error(`Error retrieving cached value for key ${key}:`, error): string): Promise<void> {
    try {
      await this.redisManager.del(this.getKey(key): $ {key}`);
    } catch (error: unknown){
      this.logger.error(`Error deleting cached value for key ${key}:`, error): string): Promise<boolean> {
    try {
      const exists): void {
        return null;
      }

      const entry  = await this.redisManager.get(this.getKey(key));
      if(!data JSON.parse(data) as CacheEntry<T>;
      
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        await this.delete(key)): void {
      this.logger.error(`Error checking existence of key ${key}:`, error): string): string {
    return `${this.keyPrefix}${key}`;
  }
}
