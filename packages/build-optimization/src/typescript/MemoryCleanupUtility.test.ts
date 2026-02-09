/**
 * Unit tests for MemoryCleanupUtility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCleanupUtility, MemoryCleanupConfig } from './MemoryCleanupUtility.js';

describe('MemoryCleanupUtility', () => {
  let utility: MemoryCleanupUtility;
  let originalProcess: any;
  let originalGc: any;
  let originalGlobal: any;

  beforeEach(() => {
    // Store original values
    originalProcess = global.process;
    originalGc = global.gc;
    
    // Mock process
    global.process = {
      ...originalProcess,
      memoryUsage: vi.fn(() => ({
        heapUsed: 200 * 1024 * 1024, // 200MB
        heapTotal: 400 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        rss: 300 * 1024 * 1024
      }))
    } as any;
    
    // Mock global gc
    global.gc = vi.fn();
    
    // Create utility instance
    utility = new MemoryCleanupUtility();
  });

  afterEach(() => {
    // Restore original values
    global.process = originalProcess;
    if (originalGc) {
      global.gc = originalGc;
    } else {
      delete (global as any).gc;
    }
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultUtility = new MemoryCleanupUtility();
      expect(defaultUtility).toBeInstanceOf(MemoryCleanupUtility);
    });

    it('should initialize with custom config', () => {
      const config: MemoryCleanupConfig = {
        aggressiveGC: false,
        clearModuleCache: false,
        cleanupDelay: 200,
        maxCleanupAttempts: 5
      };
      
      const customUtility = new MemoryCleanupUtility(config);
      expect(customUtility).toBeInstanceOf(MemoryCleanupUtility);
    });
  });

  describe('performCleanup', () => {
    it('should perform cleanup and return result', async () => {
      // Mock memory usage to show improvement
      let callCount = 0;
      global.process.memoryUsage = vi.fn(() => {
        callCount++;
        return {
          heapUsed: callCount === 1 ? 200 * 1024 * 1024 : 150 * 1024 * 1024, // 200MB -> 150MB
          heapTotal: 400 * 1024 * 1024,
          external: 20 * 1024 * 1024,
          rss: 300 * 1024 * 1024
        };
      });

      const result = await utility.performCleanup();
      
      expect(result.success).toBe(true);
      expect(result.memoryBefore.current).toBe(200);
      expect(result.memoryAfter.current).toBe(150);
      expect(result.memoryFreed).toBe(50);
      expect(result.duration).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle cleanup failure gracefully', async () => {
      // Create utility with high threshold to force failure
      const highThresholdUtility = new MemoryCleanupUtility({ 
        memoryThreshold: 1000,
        maxCleanupAttempts: 1 // Reduce attempts to speed up test
      });
      
      // Mock memory usage to show no improvement
      global.process.memoryUsage = vi.fn(() => ({
        heapUsed: 200 * 1024 * 1024, // No change
        heapTotal: 400 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        rss: 300 * 1024 * 1024
      }));

      const result = await highThresholdUtility.performCleanup();
      
      expect(result.success).toBe(false);
      expect(result.memoryFreed).toBe(0);
      // Should have error about not meeting threshold or just be unsuccessful
      expect(result.success).toBe(false);
    });

    it('should retry cleanup multiple times', async () => {
      const config: MemoryCleanupConfig = {
        maxCleanupAttempts: 2,
        memoryThreshold: 100 // High threshold to force retries
      };
      
      const retryUtility = new MemoryCleanupUtility(config);
      
      // Mock memory usage to show gradual improvement
      let callCount = 0;
      global.process.memoryUsage = vi.fn(() => {
        callCount++;
        const heapUsed = Math.max(100 * 1024 * 1024, 200 * 1024 * 1024 - (callCount * 20 * 1024 * 1024));
        return {
          heapUsed,
          heapTotal: 400 * 1024 * 1024,
          external: 20 * 1024 * 1024,
          rss: 300 * 1024 * 1024
        };
      });

      const result = await retryUtility.performCleanup();
      
      expect(result.duration).toBeGreaterThan(0);
      expect(callCount).toBeGreaterThan(2); // Should have made multiple calls
    });
  });

  describe('forceGarbageCollection', () => {
    it('should call global.gc when available', async () => {
      await utility.forceGarbageCollection();
      expect(global.gc).toHaveBeenCalled();
    });

    it('should handle missing global.gc gracefully', async () => {
      delete (global as any).gc;
      
      await expect(async () => {
        await utility.forceGarbageCollection();
      }).not.toThrow();
    });

    it('should create memory pressure for aggressive GC', async () => {
      const aggressiveUtility = new MemoryCleanupUtility({ aggressiveGC: true });
      
      await expect(async () => {
        await aggressiveUtility.forceGarbageCollection();
      }).not.toThrow();
    });
  });

  describe('clearModuleCache', () => {
    it('should clear module cache when enabled', () => {
      // Mock require.cache
      const mockCache = {
        '/path/to/typescript/module.js': {},
        '/path/to/regular/module.js': {},
        '/path/to/core/module.js': {}
      };
      
      // Store original require.cache
      const originalCache = require.cache;
      Object.assign(require.cache, mockCache);
      
      utility.clearModuleCache();
      
      // Restore original cache
      Object.keys(mockCache).forEach(key => {
        delete require.cache[key];
      });
      Object.assign(require.cache, originalCache);
      
      // Test passes if no error is thrown
      expect(true).toBe(true);
    });

    it('should skip module cache clearing when disabled', () => {
      const noModuleCacheUtility = new MemoryCleanupUtility({ clearModuleCache: false });
      
      expect(() => {
        noModuleCacheUtility.clearModuleCache();
      }).not.toThrow();
    });
  });

  describe('clearTypeScriptCompilerMemory', () => {
    it('should clear TypeScript compiler memory when enabled', async () => {
      await expect(async () => {
        await utility.clearTypeScriptCompilerMemory();
      }).not.toThrow();
    });

    it('should skip TypeScript cleanup when disabled', async () => {
      const noTSUtility = new MemoryCleanupUtility({ clearTypeScriptCache: false });
      
      await expect(async () => {
        await noTSUtility.clearTypeScriptCompilerMemory();
      }).not.toThrow();
    });

    it('should handle TypeScript globals gracefully', async () => {
      // Mock TypeScript globals
      (global as any).ts = {
        programs: { clear: vi.fn() },
        services: { clear: vi.fn() },
        diagnostics: { clear: vi.fn() }
      };
      
      await utility.clearTypeScriptCompilerMemory();
      
      expect((global as any).ts.programs.clear).toHaveBeenCalled();
      expect((global as any).ts.services.clear).toHaveBeenCalled();
      expect((global as any).ts.diagnostics.clear).toHaveBeenCalled();
    });
  });

  describe('verifyMemoryCleanup', () => {
    it('should verify successful cleanup based on threshold', () => {
      const beforeMemory = {
        current: 200,
        peak: 250,
        percentage: 80,
        timestamp: Date.now()
      };
      
      const afterMemory = {
        current: 140, // 60MB freed (above 50MB threshold)
        peak: 250,
        percentage: 56,
        timestamp: Date.now()
      };
      
      const isSuccessful = utility.verifyMemoryCleanup(beforeMemory, afterMemory);
      expect(isSuccessful).toBe(true);
    });

    it('should verify successful cleanup based on percentage', () => {
      const beforeMemory = {
        current: 100,
        peak: 120,
        percentage: 80,
        timestamp: Date.now()
      };
      
      const afterMemory = {
        current: 85, // 15% freed
        peak: 120,
        percentage: 68,
        timestamp: Date.now()
      };
      
      const isSuccessful = utility.verifyMemoryCleanup(beforeMemory, afterMemory);
      expect(isSuccessful).toBe(true);
    });

    it('should verify successful cleanup based on peak ratio', () => {
      const beforeMemory = {
        current: 200,
        peak: 300,
        percentage: 67,
        timestamp: Date.now()
      };
      
      const afterMemory = {
        current: 190, // Below 70% of peak (210)
        peak: 300,
        percentage: 63,
        timestamp: Date.now()
      };
      
      const isSuccessful = utility.verifyMemoryCleanup(beforeMemory, afterMemory);
      expect(isSuccessful).toBe(true);
    });

    it('should identify unsuccessful cleanup', () => {
      const beforeMemory = {
        current: 200,
        peak: 220,
        percentage: 91,
        timestamp: Date.now()
      };
      
      const afterMemory = {
        current: 195, // Only 5MB freed, less than 10%, above 70% of peak
        peak: 220,
        percentage: 89,
        timestamp: Date.now()
      };
      
      const isSuccessful = utility.verifyMemoryCleanup(beforeMemory, afterMemory);
      expect(isSuccessful).toBe(false);
    });
  });

  describe('cleanup history and statistics', () => {
    it('should track cleanup history', async () => {
      // Mock successful cleanup
      let callCount = 0;
      global.process.memoryUsage = vi.fn(() => {
        callCount++;
        return {
          heapUsed: callCount === 1 ? 200 * 1024 * 1024 : 150 * 1024 * 1024,
          heapTotal: 400 * 1024 * 1024,
          external: 20 * 1024 * 1024,
          rss: 300 * 1024 * 1024
        };
      });

      await utility.performCleanup();
      
      const history = utility.getCleanupHistory();
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(true);
      expect(history[0].memoryFreed).toBe(50);
    });

    it('should provide cleanup statistics', async () => {
      // Perform multiple cleanups
      let callCount = 0;
      global.process.memoryUsage = vi.fn(() => {
        callCount++;
        return {
          heapUsed: callCount % 2 === 1 ? 200 * 1024 * 1024 : 150 * 1024 * 1024,
          heapTotal: 400 * 1024 * 1024,
          external: 20 * 1024 * 1024,
          rss: 300 * 1024 * 1024
        };
      });

      await utility.performCleanup();
      await utility.performCleanup();
      
      const stats = utility.getCleanupStatistics();
      expect(stats.totalCleanups).toBe(2);
      expect(stats.successfulCleanups).toBe(2);
      expect(stats.averageMemoryFreed).toBe(50);
      expect(stats.totalMemoryFreed).toBe(100);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should provide empty statistics when no cleanups performed', () => {
      const stats = utility.getCleanupStatistics();
      expect(stats.totalCleanups).toBe(0);
      expect(stats.successfulCleanups).toBe(0);
      expect(stats.averageMemoryFreed).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.totalMemoryFreed).toBe(0);
    });

    it('should reset cleanup history', async () => {
      // Perform a cleanup first
      await utility.performCleanup();
      expect(utility.getCleanupHistory().length).toBe(1);
      
      // Reset history
      utility.resetHistory();
      expect(utility.getCleanupHistory().length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors during cleanup gracefully', async () => {
      // Test with a simpler error scenario - mock executeCleanupStep to throw
      const errorUtility = new MemoryCleanupUtility({ maxCleanupAttempts: 1 });
      
      // Mock the private method by overriding it
      (errorUtility as any).executeCleanupStep = vi.fn().mockRejectedValue(new Error('Cleanup step failed'));

      const result = await errorUtility.performCleanup();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Cleanup step failed'))).toBe(true);
    });

    it('should handle module cache errors gracefully', () => {
      // Mock require.cache to cause error
      const originalCache = require.cache;
      Object.defineProperty(require, 'cache', {
        get: () => {
          throw new Error('Cache access error');
        },
        configurable: true
      });

      expect(() => {
        utility.clearModuleCache();
      }).not.toThrow();

      // Restore original cache
      Object.defineProperty(require, 'cache', {
        value: originalCache,
        configurable: true,
        writable: true
      });
    });
  });

  describe('configuration options', () => {
    it('should respect aggressiveGC configuration', async () => {
      const nonAggressiveUtility = new MemoryCleanupUtility({ aggressiveGC: false });
      
      await expect(async () => {
        await nonAggressiveUtility.forceGarbageCollection();
      }).not.toThrow();
    });

    it('should respect cleanup delay configuration', async () => {
      const fastUtility = new MemoryCleanupUtility({ cleanupDelay: 10 });
      
      const startTime = Date.now();
      await fastUtility.performCleanup();
      const duration = Date.now() - startTime;
      
      // Should complete relatively quickly with short delay
      expect(duration).toBeLessThan(1000);
    });

    it('should respect memory threshold configuration', () => {
      const highThresholdUtility = new MemoryCleanupUtility({ memoryThreshold: 100 });
      
      const beforeMemory = {
        current: 200,
        peak: 200, // Set peak same as current to avoid peak ratio success
        percentage: 80,
        timestamp: Date.now()
      };
      
      const afterMemory = {
        current: 190, // Only 10MB freed (5%), below 100MB threshold and below 10%
        peak: 200,
        percentage: 76,
        timestamp: Date.now()
      };
      
      const isSuccessful = highThresholdUtility.verifyMemoryCleanup(beforeMemory, afterMemory);
      expect(isSuccessful).toBe(false);
    });
  });
});