/**
 * Cache Strategy Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRUCache, MultiLevelCache, CacheFactory } from './CacheStrategy';

describe('CacheStrategy', () => {
  describe('LRUCache', () => {
    let cache: LRUCache<string, string>;

    beforeEach(() => {
      cache = new LRUCache({
        maxSize: 3,
        defaultTTL: 1000,
        cleanupInterval: 100,
        enableStats: true
      });
    });

    afterEach(() => {
      cache.shutdown();
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should evict least recently used items when at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should respect TTL', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
      
      const deletedAgain = cache.delete('key1');
      expect(deletedAgain).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should track statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });

    it('should clean up expired entries automatically', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      cache.set('key2', 'value2', 200); // 200ms TTL
      
      expect(cache.size()).toBe(2);
      
      // Wait for first key to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.size()).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('MultiLevelCache', () => {
    let l1Cache: LRUCache<string, string>;
    let l2Cache: LRUCache<string, string>;
    let multiCache: MultiLevelCache<string, string>;

    beforeEach(() => {
      l1Cache = new LRUCache({
        maxSize: 2,
        defaultTTL: 1000,
        cleanupInterval: 0,
        enableStats: true
      });

      l2Cache = new LRUCache({
        maxSize: 5,
        defaultTTL: 2000,
        cleanupInterval: 0,
        enableStats: true
      });

      multiCache = new MultiLevelCache([l1Cache, l2Cache]);
    });

    afterEach(() => {
      l1Cache.shutdown();
      l2Cache.shutdown();
    });

    it('should store values in all levels', () => {
      multiCache.set('key1', 'value1');
      
      expect(l1Cache.get('key1')).toBe('value1');
      expect(l2Cache.get('key1')).toBe('value1');
    });

    it('should retrieve from first available level', () => {
      // Set only in L2
      l2Cache.set('key1', 'value1');
      
      const value = multiCache.get('key1');
      expect(value).toBe('value1');
      
      // Should now be promoted to L1
      expect(l1Cache.get('key1')).toBe('value1');
    });

    it('should check existence across all levels', () => {
      l2Cache.set('key1', 'value1');
      expect(multiCache.has('key1')).toBe(true);
      
      expect(multiCache.has('nonexistent')).toBe(false);
    });

    it('should delete from all levels', () => {
      multiCache.set('key1', 'value1');
      
      const deleted = multiCache.delete('key1');
      expect(deleted).toBe(true);
      
      expect(l1Cache.has('key1')).toBe(false);
      expect(l2Cache.has('key1')).toBe(false);
    });

    it('should clear all levels', () => {
      multiCache.set('key1', 'value1');
      multiCache.set('key2', 'value2');
      
      multiCache.clear();
      
      expect(l1Cache.size()).toBe(0);
      expect(l2Cache.size()).toBe(0);
    });

    it('should aggregate statistics', () => {
      multiCache.set('key1', 'value1');
      multiCache.get('key1'); // Hit in L1
      multiCache.get('key2'); // Miss in both
      
      const stats = multiCache.getStats();
      expect(stats.size).toBe(2); // L1: 1, L2: 1
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('CacheFactory', () => {
    it('should create LRU cache with default config', () => {
      const cache = CacheFactory.createLRUCache<string, string>();
      
      expect(cache).toBeInstanceOf(LRUCache);
      
      // Test basic functionality
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      cache.shutdown();
    });

    it('should create LRU cache with custom config', () => {
      const cache = CacheFactory.createLRUCache<string, string>({
        maxSize: 10,
        defaultTTL: 5000
      });
      
      expect(cache).toBeInstanceOf(LRUCache);
      
      cache.shutdown();
    });

    it('should create multi-level cache', () => {
      const cache = CacheFactory.createMultiLevelCache<string, string>([
        { maxSize: 5 },
        { maxSize: 20 }
      ]);
      
      expect(cache).toBeInstanceOf(MultiLevelCache);
      
      // Test basic functionality
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should create resource cache with optimized settings', () => {
      const cache = CacheFactory.createResourceCache<string, string>();
      
      expect(cache).toBeInstanceOf(LRUCache);
      
      cache.shutdown();
    });

    it('should create tool result cache with optimized settings', () => {
      const cache = CacheFactory.createToolResultCache<string, string>();
      
      expect(cache).toBeInstanceOf(LRUCache);
      
      cache.shutdown();
    });
  });

  describe('Cache Performance', () => {
    it('should handle large number of entries efficiently', () => {
      const cache = CacheFactory.createLRUCache<string, string>({
        maxSize: 10000,
        enableStats: true
      });

      const startTime = Date.now();
      
      // Insert many entries
      for (let i = 0; i < 5000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access entries
      for (let i = 0; i < 1000; i++) {
        cache.get(`key${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(cache.size()).toBe(5000);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1000);
      expect(stats.avgAccessTime).toBeLessThan(10); // Average access time < 10ms
      
      cache.shutdown();
    });

    it('should maintain performance under memory pressure', () => {
      const cache = CacheFactory.createLRUCache<string, string>({
        maxSize: 1000,
        maxMemory: 1024 * 1024, // 1MB
        enableStats: true
      });

      // Create large values to trigger memory-based eviction
      const largeValue = 'x'.repeat(2048); // 2KB per value
      
      for (let i = 0; i < 600; i++) { // 600 * 2KB = 1.2MB
        cache.set(`key${i}`, largeValue);
      }
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeLessThan(1024 * 1024 * 1.1); // Within 10% of limit
      expect(stats.evictions).toBeGreaterThan(0);
      
      cache.shutdown();
    });
  });
});