import { Injectable, Logger } from '@nestjs/common';
import { PerformanceMetrics, MemoryLeakInfo } from './MemoryTypes';

export interface ProfilerConfig {
  enableProfiling: boolean;
  sampleInterval: number;
  maxProfileHistory: number;
  memoryWarningThreshold: number;
}

export interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

@Injectable()
export class MemoryPerformanceProfiler {
  private readonly logger = new Logger(MemoryPerformanceProfiler.name);
  private readonly config: ProfilerConfig;
  private readonly profiles: MemoryProfile[] = [];
  private profilingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.config = {
      enableProfiling: process.env.ENABLE_MEMORY_PROFILING !== 'false',
      sampleInterval: parseInt(process.env.PROFILER_SAMPLE_INTERVAL || '30000'), // 30 seconds
      maxProfileHistory: parseInt(process.env.MAX_PROFILE_HISTORY || '100'),
      memoryWarningThreshold: parseInt(process.env.MEMORY_WARNING_THRESHOLD || '500000000'), // 500MB
    };

    this.logger.log('MemoryPerformanceProfiler initialized');
  }

  async startProfiling(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Profiling is already running');
      return;
    }

    if (!this.config.enableProfiling) {
      this.logger.log('Memory profiling is disabled');
      return;
    }

    this.logger.log('Starting memory profiling');
    this.isRunning = true;

    this.profilingInterval = setInterval(() => {
      this.captureMemoryProfile();
    }, this.config.sampleInterval);
  }

  async stopProfiling(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Profiling is not running');
      return;
    }

    this.logger.log('Stopping memory profiling');
    this.isRunning = false;

    if (this.profilingInterval) {
      clearInterval(this.profilingInterval);
      this.profilingInterval = null;
    }
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    const currentMemory = process.memoryUsage();
    
    return this.profiles.map((profile, index) => ({
      operationType: 'memory_sample',
      duration: 0, // Not applicable for memory samples
      memoryUsed: profile.heapUsed,
      timestamp: profile.timestamp,
      success: true,
    }));
  }

  getMemoryLeaks(): MemoryLeakInfo[] {
    const leaks: MemoryLeakInfo[] = [];
    
    if (this.profiles.length < 2) {
      return leaks;
    }

    // Check for memory growth trends
    const recentProfiles = this.profiles.slice(-10); // Last 10 samples
    if (recentProfiles.length >= 5) {
      const firstProfile = recentProfiles[0];
      const lastProfile = recentProfiles[recentProfiles.length - 1];
      
      const growthRatio = lastProfile.heapUsed / firstProfile.heapUsed;
      
      if (growthRatio > 1.5) { // 50% growth threshold
        leaks.push({
          id: `memory_growth_${Date.now()}`,
          type: 'memory',
          severity: growthRatio > 2 ? 'critical' : 'high',
          description: `Memory usage has grown ${Math.round((growthRatio - 1) * 100)}% over recent samples`,
          location: 'MemoryPerformanceProfiler',
          timestamp: lastProfile.timestamp,
          size: lastProfile.heapUsed,
        });
      }
    }

    // Check for absolute memory threshold violations
    const currentProfile = this.profiles[this.profiles.length - 1];
    if (currentProfile && currentProfile.heapUsed > this.config.memoryWarningThreshold) {
      leaks.push({
        id: `memory_threshold_${Date.now()}`,
        type: 'memory',
        severity: 'critical',
        description: `Memory usage exceeded threshold: ${this.formatBytes(currentProfile.heapUsed)}`,
        location: 'MemoryPerformanceProfiler',
        timestamp: currentProfile.timestamp,
        size: currentProfile.heapUsed,
      });
    }

    return leaks;
  }

  getProfiles(limit?: number): MemoryProfile[] {
    if (!limit) {
      return [...this.profiles];
    }
    return this.profiles.slice(-limit);
  }

  getMemoryStats(): {
    currentMemoryUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    memoryGrowthTrend: number;
  } {
    if (this.profiles.length === 0) {
      return {
        currentMemoryUsage: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        memoryGrowthTrend: 0,
      };
    }

    const currentProfile = this.profiles[this.profiles.length - 1];
    const totalMemory = this.profiles.reduce((sum, profile) => sum + profile.heapUsed, 0);
    const averageMemory = totalMemory / this.profiles.length;
    const peakMemory = Math.max(...this.profiles.map(p => p.heapUsed));
    
    // Calculate growth trend
    let growthTrend = 0;
    if (this.profiles.length >= 2) {
      const firstProfile = this.profiles[0];
      const lastProfile = this.profiles[this.profiles.length - 1];
      growthTrend = (lastProfile.heapUsed - firstProfile.heapUsed) / firstProfile.heapUsed;
    }

    return {
      currentMemoryUsage: currentProfile.heapUsed,
      averageMemoryUsage: averageMemory,
      peakMemoryUsage: peakMemory,
      memoryGrowthTrend: growthTrend,
    };
  }

  clearProfiles(): void {
    this.profiles.length = 0;
    this.logger.debug('Cleared memory profiles');
  }

  private captureMemoryProfile(): void {
    try {
      const memoryUsage = process.memoryUsage();
      
      const profile: MemoryProfile = {
        timestamp: Date.now(),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      };

      this.profiles.push(profile);

      // Keep only the most recent profiles
      if (this.profiles.length > this.config.maxProfileHistory) {
        this.profiles.shift();
      }

      // Check for memory warnings
      this.checkMemoryWarnings(profile);

      this.logger.debug(`Memory profile captured: ${this.formatBytes(profile.heapUsed)} heap used`);
    } catch (error) {
      this.logger.error('Failed to capture memory profile:', error);
    }
  }

  private checkMemoryWarnings(profile: MemoryProfile): void {
    if (profile.heapUsed > this.config.memoryWarningThreshold) {
      this.logger.warn(`High heap usage detected: ${this.formatBytes(profile.heapUsed)}`);
    }

    // Check for significant growth
    if (this.profiles.length >= 2) {
      const previousProfile = this.profiles[this.profiles.length - 2];
      const growthRatio = profile.heapUsed / previousProfile.heapUsed;
      
      if (growthRatio > 1.2) { // 20% growth in one sample
        this.logger.warn(`Significant memory growth detected: ${Math.round((growthRatio - 1) * 100)}%`);
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async onDestroy(): Promise<void> {
    await this.stopProfiling();
    this.logger.log('MemoryPerformanceProfiler destroyed');
  }
}