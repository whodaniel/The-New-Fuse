/**
 * ConcurrencyController - Manages build process concurrency based on system resources and memory usage
 */

import { IConcurrencyController } from '../interfaces/index.js';
import { SystemResources, MemoryUsage } from '../types/index.js';
import { SystemResourceDetector } from '../system/SystemResourceDetector.js';

export class ConcurrencyController implements IConcurrencyController {
  private currentConcurrency: number;
  private maxConcurrency: number;
  private minConcurrency: number = 1;
  private defaultConcurrency: number;
  private memoryThreshold: number = 0.8; // 80% memory threshold
  private adjustmentFactor: number = 0.25; // 25% adjustment per step

  constructor(initialConcurrency?: number, maxConcurrency?: number) {
    this.currentConcurrency = initialConcurrency || 2;
    this.maxConcurrency = maxConcurrency || 8;
    this.defaultConcurrency = this.currentConcurrency;
  }

  /**
   * Get current concurrency level
   */
  getCurrentConcurrency(): number {
    return this.currentConcurrency;
  }

  /**
   * Set maximum concurrency
   */
  setMaxConcurrency(max: number): void {
    if (max < 1) {
      throw new Error('Maximum concurrency must be at least 1');
    }
    this.maxConcurrency = max;
    
    // Adjust current concurrency if it exceeds new maximum
    if (this.currentConcurrency > max) {
      this.currentConcurrency = max;
    }
  }

  /**
   * Adjust concurrency based on memory usage
   */
  async adjustConcurrency(memoryUsage: MemoryUsage): Promise<void> {
    const detector = SystemResourceDetector.getInstance();
    const resources = await detector.getSystemResources();
    const totalMemory = resources.totalMemory;
    const memoryUtilization = memoryUsage.current / totalMemory;

    if (memoryUtilization > this.memoryThreshold) {
      // Memory usage is high, reduce concurrency
      this.reduceConcurrency();
    } else if (memoryUtilization < (this.memoryThreshold - 0.2)) {
      // Memory usage is low, potentially increase concurrency
      this.increaseConcurrency();
    }
  }

  /**
   * Calculate optimal initial concurrency based on system resources
   */
  calculateOptimalConcurrency(systemResources: SystemResources): number {
    const { cpuCores, totalMemory, availableMemory } = systemResources;
    
    // Base concurrency on CPU cores, but limit based on memory
    let optimalConcurrency = Math.max(1, Math.floor(cpuCores / 2));
    
    // Adjust based on available memory (assume each build process needs ~512MB)
    const memoryBasedConcurrency = Math.floor(availableMemory / 512);
    optimalConcurrency = Math.min(optimalConcurrency, memoryBasedConcurrency);
    
    // Ensure it doesn't exceed maximum
    optimalConcurrency = Math.min(optimalConcurrency, this.maxConcurrency);
    
    // Ensure it's at least minimum
    optimalConcurrency = Math.max(optimalConcurrency, this.minConcurrency);
    
    return optimalConcurrency;
  }

  /**
   * Reset concurrency to default
   */
  resetConcurrency(): void {
    this.currentConcurrency = this.defaultConcurrency;
  }

  /**
   * Set memory threshold for concurrency adjustments
   */
  setMemoryThreshold(threshold: number): void {
    if (threshold <= 0 || threshold > 1) {
      throw new Error('Memory threshold must be between 0 and 1');
    }
    this.memoryThreshold = threshold;
  }

  /**
   * Set adjustment factor for concurrency changes
   */
  setAdjustmentFactor(factor: number): void {
    if (factor <= 0 || factor > 1) {
      throw new Error('Adjustment factor must be between 0 and 1');
    }
    this.adjustmentFactor = factor;
  }

  /**
   * Get concurrency statistics
   */
  getStats(): {
    current: number;
    max: number;
    min: number;
    default: number;
    memoryThreshold: number;
  } {
    return {
      current: this.currentConcurrency,
      max: this.maxConcurrency,
      min: this.minConcurrency,
      default: this.defaultConcurrency,
      memoryThreshold: this.memoryThreshold
    };
  }

  /**
   * Reduce concurrency by adjustment factor
   */
  private reduceConcurrency(): void {
    const reduction = Math.max(1, Math.floor(this.currentConcurrency * this.adjustmentFactor));
    const newConcurrency = Math.max(this.minConcurrency, this.currentConcurrency - reduction);
    
    if (newConcurrency !== this.currentConcurrency) {
      this.currentConcurrency = newConcurrency;
    }
  }

  /**
   * Increase concurrency by 1 (conservative approach)
   */
  private increaseConcurrency(): void {
    if (this.currentConcurrency < this.maxConcurrency) {
      this.currentConcurrency += 1;
    }
  }

  /**
   * Force set concurrency (for testing or emergency situations)
   */
  forceConcurrency(concurrency: number): void {
    if (concurrency < this.minConcurrency || concurrency > this.maxConcurrency) {
      throw new Error(`Concurrency must be between ${this.minConcurrency} and ${this.maxConcurrency}`);
    }
    this.currentConcurrency = concurrency;
  }

  /**
   * Check if concurrency adjustment is needed based on memory usage
   */
  async shouldAdjustConcurrency(memoryUsage: MemoryUsage): Promise<{
    shouldAdjust: boolean;
    direction: 'increase' | 'decrease' | 'none';
    reason: string;
  }> {
    const detector = SystemResourceDetector.getInstance();
    const resources = await detector.getSystemResources();
    const totalMemory = resources.totalMemory;
    const memoryUtilization = memoryUsage.current / totalMemory;

    if (memoryUtilization > this.memoryThreshold) {
      return {
        shouldAdjust: true,
        direction: 'decrease',
        reason: `Memory utilization (${(memoryUtilization * 100).toFixed(1)}%) exceeds threshold (${(this.memoryThreshold * 100).toFixed(1)}%)`
      };
    } else if (memoryUtilization < (this.memoryThreshold - 0.2) && this.currentConcurrency < this.maxConcurrency) {
      return {
        shouldAdjust: true,
        direction: 'increase',
        reason: `Memory utilization (${(memoryUtilization * 100).toFixed(1)}%) is low, can increase concurrency`
      };
    }

    return {
      shouldAdjust: false,
      direction: 'none',
      reason: `Memory utilization (${(memoryUtilization * 100).toFixed(1)}%) is within acceptable range`
    };
  }
}