/**
 * Memory Cleanup Utility
 * 
 * Provides utilities for cleaning up memory between TypeScript compilation stages:
 * - Garbage collection hints
 * - TypeScript compiler memory release
 * - Memory usage monitoring and verification
 * - Module cache cleanup
 */

import { MemoryUsage } from '../types/index.js';

/**
 * Memory cleanup configuration
 */
export interface MemoryCleanupConfig {
  /** Enable aggressive garbage collection */
  aggressiveGC?: boolean;
  /** Clear Node.js module cache */
  clearModuleCache?: boolean;
  /** Clear TypeScript-specific caches */
  clearTypeScriptCache?: boolean;
  /** Wait time after cleanup in milliseconds */
  cleanupDelay?: number;
  /** Maximum cleanup attempts */
  maxCleanupAttempts?: number;
  /** Memory threshold for cleanup verification (MB) */
  memoryThreshold?: number;
}

/**
 * Memory cleanup result
 */
export interface MemoryCleanupResult {
  /** Whether cleanup was successful */
  success: boolean;
  /** Memory usage before cleanup */
  memoryBefore: MemoryUsage;
  /** Memory usage after cleanup */
  memoryAfter: MemoryUsage;
  /** Amount of memory freed in MB */
  memoryFreed: number;
  /** Cleanup duration in milliseconds */
  duration: number;
  /** Any errors encountered during cleanup */
  errors: string[];
}

/**
 * Memory cleanup utility implementation
 */
export class MemoryCleanupUtility {
  private config: Required<MemoryCleanupConfig>;
  private cleanupHistory: MemoryCleanupResult[] = [];

  constructor(config: MemoryCleanupConfig = {}) {
    this.config = {
      aggressiveGC: true,
      clearModuleCache: true,
      clearTypeScriptCache: true,
      cleanupDelay: 100,
      maxCleanupAttempts: 3,
      memoryThreshold: 50, // 50MB threshold for successful cleanup
      ...config
    };
  }

  /**
   * Perform comprehensive memory cleanup
   */
  async performCleanup(): Promise<MemoryCleanupResult> {
    const startTime = Date.now();
    const memoryBefore = this.getCurrentMemoryUsage();
    const errors: string[] = [];

    try {
      // Attempt cleanup multiple times if needed
      for (let attempt = 1; attempt <= this.config.maxCleanupAttempts; attempt++) {
        await this.executeCleanupStep(errors);
        
        // Check if cleanup was effective
        const currentMemory = this.getCurrentMemoryUsage();
        const memoryFreed = memoryBefore.current - currentMemory.current;
        
        if (memoryFreed >= this.config.memoryThreshold || attempt === this.config.maxCleanupAttempts) {
          const result: MemoryCleanupResult = {
            success: memoryFreed >= this.config.memoryThreshold,
            memoryBefore,
            memoryAfter: currentMemory,
            memoryFreed,
            duration: Date.now() - startTime,
            errors
          };
          
          this.cleanupHistory.push(result);
          return result;
        }
        
        // Wait before next attempt
        await this.delay(this.config.cleanupDelay);
      }

      // If we reach here, cleanup didn't meet threshold
      const memoryAfter = this.getCurrentMemoryUsage();
      const result: MemoryCleanupResult = {
        success: false,
        memoryBefore,
        memoryAfter,
        memoryFreed: memoryBefore.current - memoryAfter.current,
        duration: Date.now() - startTime,
        errors: [...errors, 'Cleanup did not meet memory threshold after maximum attempts']
      };
      
      this.cleanupHistory.push(result);
      return result;

    } catch (error) {
      const memoryAfter = this.getCurrentMemoryUsage();
      const result: MemoryCleanupResult = {
        success: false,
        memoryBefore,
        memoryAfter,
        memoryFreed: Math.max(0, memoryBefore.current - memoryAfter.current),
        duration: Date.now() - startTime,
        errors: [...errors, `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`]
      };
      
      this.cleanupHistory.push(result);
      return result;
    }
  }

  /**
   * Force garbage collection with multiple strategies
   */
  async forceGarbageCollection(): Promise<void> {
    try {
      // Strategy 1: Use global.gc if available
      if (global.gc) {
        global.gc();
        await this.delay(50);
      }

      // Strategy 2: Create memory pressure to trigger GC
      if (this.config.aggressiveGC) {
        await this.createMemoryPressure();
      }

      // Strategy 3: Use setImmediate to allow GC opportunity
      await new Promise(resolve => setImmediate(resolve));

    } catch (error) {
      console.warn('Garbage collection warning:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Clear Node.js module cache
   */
  clearModuleCache(): void {
    try {
      if (!this.config.clearModuleCache) return;

      const moduleKeys = Object.keys(require.cache);
      let clearedCount = 0;

      for (const key of moduleKeys) {
        // Clear TypeScript-related modules
        if (this.config.clearTypeScriptCache && this.isTypeScriptRelated(key)) {
          delete require.cache[key];
          clearedCount++;
        }
        // Clear other non-core modules
        else if (this.isSafeToDelete(key)) {
          delete require.cache[key];
          clearedCount++;
        }
      }

      console.debug(`Cleared ${clearedCount} modules from cache`);

    } catch (error) {
      console.warn('Module cache cleanup warning:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Clear TypeScript compiler-specific memory
   */
  async clearTypeScriptCompilerMemory(): Promise<void> {
    try {
      if (!this.config.clearTypeScriptCache) return;

      // Clear TypeScript program cache
      this.clearTypeScriptProgramCache();

      // Clear TypeScript service cache
      this.clearTypeScriptServiceCache();

      // Clear TypeScript diagnostic cache
      this.clearTypeScriptDiagnosticCache();

      // Allow time for cleanup
      await this.delay(this.config.cleanupDelay);

    } catch (error) {
      console.warn('TypeScript compiler memory cleanup warning:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Monitor memory usage and verify cleanup effectiveness
   */
  verifyMemoryCleanup(beforeMemory: MemoryUsage, afterMemory: MemoryUsage): boolean {
    const memoryFreed = beforeMemory.current - afterMemory.current;
    const percentageFreed = (memoryFreed / beforeMemory.current) * 100;

    // Consider cleanup successful if:
    // 1. At least threshold amount of memory was freed, OR
    // 2. At least 10% of memory was freed, OR
    // 3. Memory usage is now below 70% of peak
    return (
      memoryFreed >= this.config.memoryThreshold ||
      percentageFreed >= 10 ||
      afterMemory.current < (beforeMemory.peak * 0.7)
    );
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory(): MemoryCleanupResult[] {
    return [...this.cleanupHistory];
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStatistics() {
    if (this.cleanupHistory.length === 0) {
      return {
        totalCleanups: 0,
        successfulCleanups: 0,
        averageMemoryFreed: 0,
        averageDuration: 0,
        totalMemoryFreed: 0
      };
    }

    const successful = this.cleanupHistory.filter(r => r.success);
    const totalMemoryFreed = this.cleanupHistory.reduce((sum, r) => sum + r.memoryFreed, 0);
    const totalDuration = this.cleanupHistory.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalCleanups: this.cleanupHistory.length,
      successfulCleanups: successful.length,
      averageMemoryFreed: totalMemoryFreed / this.cleanupHistory.length,
      averageDuration: totalDuration / this.cleanupHistory.length,
      totalMemoryFreed
    };
  }

  /**
   * Reset cleanup history
   */
  resetHistory(): void {
    this.cleanupHistory = [];
  }

  /**
   * Execute a single cleanup step
   */
  private async executeCleanupStep(errors: string[]): Promise<void> {
    try {
      // Step 1: Clear module cache
      this.clearModuleCache();

      // Step 2: Clear TypeScript compiler memory
      await this.clearTypeScriptCompilerMemory();

      // Step 3: Force garbage collection
      await this.forceGarbageCollection();

      // Step 4: Additional cleanup delay
      await this.delay(this.config.cleanupDelay);

    } catch (error) {
      errors.push(`Cleanup step failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    const current = Math.round(usage.heapUsed / 1024 / 1024);
    
    return {
      current,
      peak: current, // For this context, current is the peak we're measuring
      percentage: 0, // Would need system total memory to calculate
      timestamp: Date.now()
    };
  }

  /**
   * Create memory pressure to encourage garbage collection
   */
  private async createMemoryPressure(): Promise<void> {
    try {
      // Create temporary arrays to trigger GC
      const arrays: any[] = [];
      for (let i = 0; i < 10; i++) {
        arrays.push(new Array(1000).fill(null));
      }
      
      // Allow GC opportunity
      await this.delay(10);
      
      // Clear references
      arrays.length = 0;
      
    } catch (error) {
      // Ignore errors in memory pressure creation
    }
  }

  /**
   * Check if a module key is TypeScript-related
   */
  private isTypeScriptRelated(key: string): boolean {
    return (
      key.includes('typescript') ||
      key.includes('.ts') ||
      key.includes('tsc') ||
      key.includes('@typescript-eslint') ||
      key.includes('ts-node')
    );
  }

  /**
   * Check if a module is safe to delete from cache
   */
  private isSafeToDelete(key: string): boolean {
    // Don't delete core Node.js modules or critical dependencies
    const unsafePatterns = [
      'node_modules/vitest',
      'node_modules/bun',
      'node_modules/@vitest',
      '/node:',
      'internal/',
      'bootstrap_'
    ];

    return !unsafePatterns.some(pattern => key.includes(pattern));
  }

  /**
   * Clear TypeScript program cache
   */
  private clearTypeScriptProgramCache(): void {
    try {
      // Clear any global TypeScript program references
      if (typeof global !== 'undefined') {
        const globalAny = global as any;
        if (globalAny.ts && globalAny.ts.programs) {
          globalAny.ts.programs.clear?.();
        }
      }
    } catch (error) {
      // Ignore errors - this is best-effort cleanup
    }
  }

  /**
   * Clear TypeScript service cache
   */
  private clearTypeScriptServiceCache(): void {
    try {
      // Clear any global TypeScript service references
      if (typeof global !== 'undefined') {
        const globalAny = global as any;
        if (globalAny.ts && globalAny.ts.services) {
          globalAny.ts.services.clear?.();
        }
      }
    } catch (error) {
      // Ignore errors - this is best-effort cleanup
    }
  }

  /**
   * Clear TypeScript diagnostic cache
   */
  private clearTypeScriptDiagnosticCache(): void {
    try {
      // Clear any global TypeScript diagnostic references
      if (typeof global !== 'undefined') {
        const globalAny = global as any;
        if (globalAny.ts && globalAny.ts.diagnostics) {
          globalAny.ts.diagnostics.clear?.();
        }
      }
    } catch (error) {
      // Ignore errors - this is best-effort cleanup
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}