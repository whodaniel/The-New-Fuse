import { Injectable, Logger } from '@nestjs/common';
import { MemoryLeakInfo, PerformanceMetrics } from './MemoryTypes';

export interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface MemoryLeakWarning {
  id: string;
  type: 'heap_growth' | 'external_growth' | 'event_listener_leak' | 'timer_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  memoryUsage: number;
  threshold: number;
  stack?: string;
}

export interface LeakDetectionConfig {
  samplingInterval: number;
  memoryThreshold: number;
  growthThreshold: number;
  retentionPeriod: number;
  enabled: boolean;
}

@Injectable()
export class MemoryLeakDetector {
  private readonly logger = new Logger(MemoryLeakDetector.name);
  private readonly config: LeakDetectionConfig;
  private readonly memoryProfiles: MemoryProfile[] = [];
  private readonly warnings: MemoryLeakWarning[] = [];
  private samplingInterval: NodeJS.Timer | null = null;
  private isMonitoring = false;

  constructor() {
    this.config = {
      samplingInterval: parseInt(process.env.MEMORY_SAMPLING_INTERVAL || '30000'), // 30 seconds
      memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || '1073741824'), // 1GB
      growthThreshold: parseFloat(process.env.MEMORY_GROWTH_THRESHOLD || '1.5'), // 50% growth
      retentionPeriod: parseInt(process.env.MEMORY_RETENTION_PERIOD || '3600000'), // 1 hour
      enabled: process.env.MEMORY_LEAK_DETECTION !== 'false',
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }

    this.logger.log('MemoryLeakDetector initialized');
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Memory monitoring is already running');
      return;
    }

    this.logger.log('Starting memory leak monitoring');
    this.isMonitoring = true;

    this.samplingInterval = setInterval(() => {
      this.sampleMemoryUsage();
    }, this.config.samplingInterval);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      this.logger.warn('Memory monitoring is not running');
      return;
    }

    this.logger.log('Stopping memory leak monitoring');
    this.isMonitoring = false;

    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
  }

  private sampleMemoryUsage(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const profile: MemoryProfile = {
        timestamp: Date.now(),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        arrayBuffers: memoryUsage.arrayBuffers || 0,
      };

      this.memoryProfiles.push(profile);
      this.cleanupOldProfiles();
      this.analyzeMemoryTrends(profile);

      this.logger.debug(`Memory sample: Heap ${Math.round(profile.heapUsed / 1024 / 1024)}MB, RSS ${Math.round(profile.rss / 1024 / 1024)}MB`);
    } catch (error) {
      this.logger.error('Failed to sample memory usage:', error);
    }
  }

  private analyzeMemoryTrends(currentProfile: MemoryProfile): void {
    if (this.memoryProfiles.length < 2) {
      return;
    }

    // Check for heap growth leak
    this.checkHeapGrowthLeak(currentProfile);

    // Check for external memory leak
    this.checkExternalMemoryLeak(currentProfile);

    // Check absolute memory thresholds
    this.checkAbsoluteThresholds(currentProfile);
  }

  private checkHeapGrowthLeak(currentProfile: MemoryProfile): void {
    const recentProfiles = this.memoryProfiles.slice(-10); // Last 10 samples
    
    if (recentProfiles.length < 5) {
      return;
    }

    const firstProfile = recentProfiles[0];
    const growthRatio = currentProfile.heapUsed / firstProfile.heapUsed;

    if (growthRatio > this.config.growthThreshold) {
      const warning: MemoryLeakWarning = {
        id: `heap_growth_${Date.now()}`,
        type: 'heap_growth',
        severity: this.calculateSeverity(growthRatio),
        description: `Heap memory has grown ${Math.round((growthRatio - 1) * 100)}% over recent samples`,
        timestamp: currentProfile.timestamp,
        memoryUsage: currentProfile.heapUsed,
        threshold: firstProfile.heapUsed * this.config.growthThreshold,
        stack: this.captureStackTrace(),
      };

      this.addWarning(warning);
    }
  }

  private checkExternalMemoryLeak(currentProfile: MemoryProfile): void {
    const recentProfiles = this.memoryProfiles.slice(-5);
    
    if (recentProfiles.length < 3) {
      return;
    }

    const firstProfile = recentProfiles[0];
    const growthRatio = currentProfile.external / Math.max(firstProfile.external, 1);

    if (growthRatio > 2.0 && currentProfile.external > 100 * 1024 * 1024) { // 100MB
      const warning: MemoryLeakWarning = {
        id: `external_growth_${Date.now()}`,
        type: 'external_growth',
        severity: 'high',
        description: `External memory has grown significantly to ${Math.round(currentProfile.external / 1024 / 1024)}MB`,
        timestamp: currentProfile.timestamp,
        memoryUsage: currentProfile.external,
        threshold: 100 * 1024 * 1024,
      };

      this.addWarning(warning);
    }
  }

  private checkAbsoluteThresholds(currentProfile: MemoryProfile): void {
    if (currentProfile.heapUsed > this.config.memoryThreshold) {
      const warning: MemoryLeakWarning = {
        id: `threshold_exceeded_${Date.now()}`,
        type: 'heap_growth',
        severity: 'critical',
        description: `Heap memory exceeded threshold: ${Math.round(currentProfile.heapUsed / 1024 / 1024)}MB`,
        timestamp: currentProfile.timestamp,
        memoryUsage: currentProfile.heapUsed,
        threshold: this.config.memoryThreshold,
      };

      this.addWarning(warning);
    }
  }

  private calculateSeverity(growthRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (growthRatio > 3.0) return 'critical';
    if (growthRatio > 2.5) return 'high';
    if (growthRatio > 2.0) return 'medium';
    return 'low';
  }

  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(2, 8).join('\n') : '';
  }

  private addWarning(warning: MemoryLeakWarning): void {
    this.warnings.push(warning);
    this.logger.warn(`Memory leak warning: ${warning.description}`, {
      type: warning.type,
      severity: warning.severity,
      memoryUsage: Math.round(warning.memoryUsage / 1024 / 1024),
    });

    // Keep only recent warnings
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.warnings.splice(0, this.warnings.findIndex(w => w.timestamp > cutoff));
  }

  private cleanupOldProfiles(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    const startIndex = this.memoryProfiles.findIndex(profile => profile.timestamp > cutoff);
    
    if (startIndex > 0) {
      this.memoryProfiles.splice(0, startIndex);
    }
  }

  getMemoryLeaks(): MemoryLeakInfo[] {
    return this.warnings.map(warning => ({
      id: warning.id,
      type: 'memory',
      severity: warning.severity,
      description: warning.description,
      location: 'MemoryLeakDetector',
      timestamp: warning.timestamp,
      size: warning.memoryUsage,
      stack: warning.stack,
    }));
  }

  getCurrentMemoryProfile(): MemoryProfile | null {
    return this.memoryProfiles.length > 0 
      ? this.memoryProfiles[this.memoryProfiles.length - 1] 
      : null;
  }

  getMemoryTrend(minutes: number = 30): MemoryProfile[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.memoryProfiles.filter(profile => profile.timestamp > cutoff);
  }

  getWarnings(severity?: 'low' | 'medium' | 'high' | 'critical'): MemoryLeakWarning[] {
    if (severity) {
      return this.warnings.filter(warning => warning.severity === severity);
    }
    return [...this.warnings];
  }

  clearWarnings(): void {
    this.warnings.length = 0;
    this.logger.log('Memory leak warnings cleared');
  }

  async forceGarbageCollection(): Promise<void> {
    if (global.gc) {
      this.logger.log('Forcing garbage collection');
      global.gc();
    } else {
      this.logger.warn('Garbage collection not exposed. Run with --expose-gc flag.');
    }
  }

  getStats(): {
    profileCount: number;
    warningCount: number;
    isMonitoring: boolean;
    memoryThreshold: number;
    currentMemoryUsage: number;
  } {
    const currentProfile = this.getCurrentMemoryProfile();
    
    return {
      profileCount: this.memoryProfiles.length,
      warningCount: this.warnings.length,
      isMonitoring: this.isMonitoring,
      memoryThreshold: this.config.memoryThreshold,
      currentMemoryUsage: currentProfile ? currentProfile.heapUsed : 0,
    };
  }

  onDestroy(): void {
    this.stopMonitoring();
    this.logger.log('MemoryLeakDetector destroyed');
  }
}