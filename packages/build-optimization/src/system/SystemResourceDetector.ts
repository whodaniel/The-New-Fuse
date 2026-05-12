/**
 * System resource detection for build optimization
 */

import * as os from 'os';
import process from 'process';
import { ISystemResourceDetector } from '../interfaces/index.js';
import { MemoryUsage, SystemResources } from '../types/index.js';

/**
 * Detects system resources including memory, CPU, and platform information
 */
export class SystemResourceDetector implements ISystemResourceDetector {
  private static instance: SystemResourceDetector;

  /**
   * Get singleton instance
   */
  public static getInstance(): SystemResourceDetector {
    if (!SystemResourceDetector.instance) {
      SystemResourceDetector.instance = new SystemResourceDetector();
    }
    return SystemResourceDetector.instance;
  }

  /**
   * Get current system resources
   */
  public async getSystemResources(): Promise<SystemResources> {
    const totalMemory = this.getTotalMemoryMB();
    const availableMemory = this.getAvailableMemoryMB();
    const cpuCores = os.cpus().length;
    const platform = os.platform();
    const nodeVersion = process.version;

    return {
      totalMemory,
      availableMemory,
      cpuCores,
      platform,
      nodeVersion,
    };
  }

  /**
   * Get current memory usage using Node.js process.memoryUsage()
   */
  public getCurrentMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    const totalMemory = this.getTotalMemoryMB();

    // Convert bytes to MB
    const currentMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const percentage = Math.round((currentMB / totalMemory) * 100);

    return {
      current: currentMB,
      peak: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if system has sufficient resources for build
   */
  public hasSufficientResources(requiredMemory: number): boolean {
    const availableMemory = this.getAvailableMemoryMB();
    const currentUsage = this.getCurrentMemoryUsage();

    // Consider current usage and leave 20% buffer
    const usableMemory = availableMemory - currentUsage.current;
    const memoryWithBuffer = usableMemory * 0.8;

    return memoryWithBuffer >= requiredMemory;
  }

  /**
   * Get total system memory in MB
   */
  private getTotalMemoryMB(): number {
    return Math.round(os.totalmem() / 1024 / 1024);
  }

  /**
   * Get available system memory in MB
   */
  private getAvailableMemoryMB(): number {
    return Math.round(os.freemem() / 1024 / 1024);
  }

  /**
   * Get detailed memory information for debugging
   */
  public getDetailedMemoryInfo(): {
    system: { total: number; free: number; used: number };
    process: NodeJS.MemoryUsage;
    platform: string;
  } {
    const totalMB = this.getTotalMemoryMB();
    const freeMB = this.getAvailableMemoryMB();
    const usedMB = totalMB - freeMB;

    return {
      system: {
        total: totalMB,
        free: freeMB,
        used: usedMB,
      },
      process: process.memoryUsage(),
      platform: os.platform(),
    };
  }

  /**
   * Get CPU information
   */
  public getCPUInfo(): {
    cores: number;
    model: string;
    speed: number;
    architecture: string;
  } {
    const cpus = os.cpus();
    return {
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      architecture: os.arch(),
    };
  }

  /**
   * Get platform-specific memory limits
   */
  public getPlatformMemoryLimits(): {
    maxHeapSize: number;
    recommendedMaxConcurrency: number;
  } {
    const totalMemory = this.getTotalMemoryMB();
    const platform = os.platform();

    // Platform-specific adjustments
    let maxHeapSize: number;
    let recommendedMaxConcurrency: number;

    switch (platform) {
      case 'darwin': // macOS
        maxHeapSize = Math.min(totalMemory * 0.7, 8192); // Max 8GB or 70% of total
        recommendedMaxConcurrency = Math.max(1, Math.floor(os.cpus().length / 2));
        break;
      case 'linux':
        maxHeapSize = Math.min(totalMemory * 0.8, 16384); // Max 16GB or 80% of total
        recommendedMaxConcurrency = Math.max(1, Math.floor(os.cpus().length / 1.5));
        break;
      case 'win32': // Windows
        maxHeapSize = Math.min(totalMemory * 0.6, 6144); // Max 6GB or 60% of total
        recommendedMaxConcurrency = Math.max(1, Math.floor(os.cpus().length / 2));
        break;
      default:
        maxHeapSize = Math.min(totalMemory * 0.5, 4096); // Conservative default
        recommendedMaxConcurrency = Math.max(1, Math.floor(os.cpus().length / 2));
    }

    return {
      maxHeapSize,
      recommendedMaxConcurrency,
    };
  }

  /**
   * Check if running in CI environment
   */
  public isRunningInCI(): boolean {
    return !!(
      process.env.CI ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.BUILD_NUMBER ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.TRAVIS ||
      process.env.JENKINS_URL
    );
  }

  /**
   * Get environment-specific resource recommendations
   */
  public getEnvironmentRecommendations(): {
    maxConcurrency: number;
    memoryThreshold: number;
    enableIncrementalBuilds: boolean;
    stageSize: number;
  } {
    const isCI = this.isRunningInCI();
    const totalMemory = this.getTotalMemoryMB();
    const cpuCores = os.cpus().length;

    if (isCI) {
      // Conservative settings for CI
      return {
        maxConcurrency: Math.max(1, Math.floor(cpuCores / 2)),
        memoryThreshold: 70, // 70% threshold in CI
        enableIncrementalBuilds: true,
        stageSize: Math.max(2, Math.floor(totalMemory / 1024)), // 1 package per GB
      };
    } else {
      // More aggressive settings for local development
      return {
        maxConcurrency: Math.max(2, Math.floor(cpuCores * 0.75)),
        memoryThreshold: 80, // 80% threshold locally
        enableIncrementalBuilds: true,
        stageSize: Math.max(3, Math.floor(totalMemory / 512)), // More packages per stage
      };
    }
  }
}
