/**
 * Real-time memory monitoring for build optimization
 */

import { IMemoryMonitor } from '../interfaces/index.js';
import { MemoryUsage, MemoryCallback } from '../types/index.js';
import { SystemResourceDetector } from './SystemResourceDetector.js';

/**
 * Monitors system memory usage with configurable polling and threshold detection
 */
export class MemoryMonitor implements IMemoryMonitor {
  private static instance: MemoryMonitor;
  private resourceDetector: SystemResourceDetector;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private pollingIntervalMs: number = 2000; // Default 2 seconds
  private memoryThreshold: number = 80; // Default 80%
  private thresholdCallbacks: MemoryCallback[] = [];
  private memoryHistory: MemoryUsage[] = [];
  private maxHistorySize: number = 100; // Keep last 100 readings
  private peakMemoryUsage: number = 0;
  private isMonitoring: boolean = false;
  private lastThresholdExceededTime: number = 0;
  private thresholdCooldownMs: number = 5000; // 5 second cooldown between threshold alerts

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  private constructor() {
    this.resourceDetector = SystemResourceDetector.getInstance();
  }

  /**
   * Start monitoring memory usage
   */
  public startMonitoring(interval: number = 2000): void {
    if (this.isMonitoring) {
      return; // Already monitoring
    }

    this.pollingIntervalMs = interval;
    this.isMonitoring = true;
    this.peakMemoryUsage = 0;
    this.memoryHistory = [];

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.pollingIntervalMs);

    // Take initial reading
    this.checkMemoryUsage();
  }

  /**
   * Stop monitoring memory usage
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Get current memory usage
   */
  public getCurrentUsage(): MemoryUsage {
    return this.resourceDetector.getCurrentMemoryUsage();
  }

  /**
   * Set memory threshold percentage
   */
  public setThreshold(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Memory threshold must be between 0 and 100');
    }
    this.memoryThreshold = percentage;
  }

  /**
   * Register callback for threshold exceeded events
   */
  public onThresholdExceeded(callback: MemoryCallback): void {
    this.thresholdCallbacks.push(callback);
  }

  /**
   * Remove threshold exceeded callback
   */
  public removeThresholdCallback(callback: MemoryCallback): void {
    const index = this.thresholdCallbacks.indexOf(callback);
    if (index > -1) {
      this.thresholdCallbacks.splice(index, 1);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.thresholdCallbacks = [];
    this.memoryHistory = [];
    this.peakMemoryUsage = 0;
  }

  /**
   * Get memory usage history
   */
  public getMemoryHistory(): MemoryUsage[] {
    return [...this.memoryHistory];
  }

  /**
   * Get peak memory usage since monitoring started
   */
  public getPeakMemoryUsage(): number {
    return this.peakMemoryUsage;
  }

  /**
   * Get average memory usage from history
   */
  public getAverageMemoryUsage(): number {
    if (this.memoryHistory.length === 0) {
      return 0;
    }

    const sum = this.memoryHistory.reduce((acc, usage) => acc + usage.current, 0);
    return Math.round(sum / this.memoryHistory.length);
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStatistics(): {
    current: number;
    peak: number;
    average: number;
    threshold: number;
    historyCount: number;
    isMonitoring: boolean;
  } {
    const current = this.getCurrentUsage();
    return {
      current: current.current,
      peak: this.peakMemoryUsage,
      average: this.getAverageMemoryUsage(),
      threshold: this.memoryThreshold,
      historyCount: this.memoryHistory.length,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Check if memory usage is above threshold
   */
  public isAboveThreshold(): boolean {
    const current = this.getCurrentUsage();
    return current.percentage >= this.memoryThreshold;
  }

  /**
   * Get memory trend (increasing, decreasing, stable)
   */
  public getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
    if (this.memoryHistory.length < 3) {
      return 'unknown';
    }

    const recent = this.memoryHistory.slice(-3);
    const first = recent[0].current;
    const last = recent[recent.length - 1].current;
    const diff = last - first;
    const threshold = first * 0.05; // 5% change threshold

    if (Math.abs(diff) < threshold) {
      return 'stable';
    }

    return diff > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Force garbage collection if available
   */
  public forceGarbageCollection(): boolean {
    if (global.gc) {
      try {
        global.gc();
        return true;
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get memory pressure level
   */
  public getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const current = this.getCurrentUsage();
    const percentage = current.percentage;

    if (percentage >= 95) return 'critical';
    if (percentage >= 85) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  }

  /**
   * Check memory usage and trigger callbacks if needed
   */
  private checkMemoryUsage(): void {
    const usage = this.getCurrentUsage();
    
    // Update peak memory usage
    if (usage.current > this.peakMemoryUsage) {
      this.peakMemoryUsage = usage.current;
    }

    // Add to history
    this.memoryHistory.push(usage);
    
    // Trim history if too large
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Check threshold with cooldown
    if (usage.percentage >= this.memoryThreshold) {
      const now = Date.now();
      if (now - this.lastThresholdExceededTime > this.thresholdCooldownMs) {
        this.lastThresholdExceededTime = now;
        this.triggerThresholdCallbacks(usage);
      }
    }
  }

  /**
   * Trigger threshold exceeded callbacks
   */
  private triggerThresholdCallbacks(usage: MemoryUsage): void {
    this.thresholdCallbacks.forEach(callback => {
      try {
        callback(usage);
      } catch (error) {
        console.error('Error in memory threshold callback:', error);
      }
    });
  }

  /**
   * Set maximum history size
   */
  public setMaxHistorySize(size: number): void {
    if (size < 1) {
      throw new Error('Max history size must be at least 1');
    }
    this.maxHistorySize = size;
    
    // Trim current history if needed
    if (this.memoryHistory.length > size) {
      this.memoryHistory = this.memoryHistory.slice(-size);
    }
  }

  /**
   * Set threshold cooldown period
   */
  public setThresholdCooldown(cooldownMs: number): void {
    if (cooldownMs < 0) {
      throw new Error('Cooldown must be non-negative');
    }
    this.thresholdCooldownMs = cooldownMs;
  }

  /**
   * Reset monitoring state
   */
  public reset(): void {
    this.stopMonitoring();
    this.memoryHistory = [];
    this.peakMemoryUsage = 0;
    this.lastThresholdExceededTime = 0;
  }

  /**
   * Get monitoring configuration
   */
  public getConfiguration(): {
    pollingInterval: number;
    threshold: number;
    maxHistorySize: number;
    cooldownMs: number;
    callbackCount: number;
  } {
    return {
      pollingInterval: this.pollingIntervalMs,
      threshold: this.memoryThreshold,
      maxHistorySize: this.maxHistorySize,
      cooldownMs: this.thresholdCooldownMs,
      callbackCount: this.thresholdCallbacks.length
    };
  }
}