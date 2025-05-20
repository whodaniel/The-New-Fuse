import { Injectable } from '@nestjs/common';
import { PerformanceProfile, ProfileSample } from './types.js';
import { RedisService } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
import * as v8 from 'v8';
import * as os from 'os';

@Injectable()
export class PerformanceProfiler {
  private readonly profiles: Map<string, PerformanceProfile>;
  private readonly profilingInterval: number;
  private readonly retentionPeriod: number;
  private profilingTimer: NodeJS.Timer;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricCollector: MetricCollector,
  ) {
    this.profiles = new Map();
    this.profilingInterval = this.configService.get<number>('PROFILING_INTERVAL', 60000);
    this.retentionPeriod = this.configService.get<number>('PROFILE_RETENTION_PERIOD', 86400);
    this.startProfiling();
  }

  private startProfiling(): void {
    if (this.profilingTimer) {
      return;
    }

    this.profilingTimer = setInterval(() => {
      this.collectCPUProfile();
      this.collectMemoryProfile();
      this.collectIOProfile();
      this.collectNetworkProfile();
    }, this.profilingInterval);
  }

  private stopProfiling(): void {
    if (this.profilingTimer) {
      clearInterval(this.profilingTimer);
      this.profilingTimer = null;
    }
  }

  private async collectCPUProfile(): Promise<void> {
    const samples: ProfileSample[] = [];
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const usage = process.cpuUsage();
      const totalUsage = (usage.user + usage.system) / 1000; // Convert to ms

      samples.push({
        timestamp: new Date(),
        value: totalUsage,
        labels: {
          type: 'cpu',
          user: usage.user.toString(),
          system: usage.system.toString(),
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const profile: PerformanceProfile = {
      id: `cpu_${Date.now()}`,
      timestamp: new Date(startTime),
      duration: Date.now() - startTime,
      type: 'cpu',
      data: {
        samples,
        summary: this.calculateSummary(samples.map(s => s.value)),
      },
      metadata: {
        environment: this.configService.get('NODE_ENV'),
        version: process.version,
        trigger: 'scheduled',
        tags: ['cpu', 'performance'],
      },
    };

    await this.storeProfile(profile);
    this.recordMetrics(profile);
  }

  private async collectMemoryProfile(): Promise<void> {
    const samples: ProfileSample[] = [];
    const startTime = Date.now();

    // Enhanced memory statistics
    const heapStats = v8.getHeapStatistics();
    const memoryUsage = process.memoryUsage();
    const gcStats = await this.getGCMetrics();

    // Collect detailed heap information
    const heapInfo = {
      heapSizeLimit: heapStats.heap_size_limit,
      totalHeapSize: heapStats.total_heap_size,
      usedHeapSize: heapStats.used_heap_size,
      heapSizeExecutable: heapStats.heap_size_executable,
      totalPhysicalSize: heapStats.total_physical_size,
      totalAvailableSize: heapStats.total_available_size,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory
    };

    samples.push({
      timestamp: new Date(),
      value: memoryUsage.heapUsed,
      labels: {
        type: 'memory',
        heapTotal: memoryUsage.heapTotal.toString(),
        external: memoryUsage.external.toString(),
        rss: memoryUsage.rss.toString(),
        arrayBuffers: memoryUsage.arrayBuffers?.toString() || '0',
        gcType: gcStats.type,
        gcDuration: gcStats.duration?.toString()
      },
    });

    const profile: PerformanceProfile = {
      id: `memory_${Date.now()}`,
      timestamp: new Date(startTime),
      duration: Date.now() - startTime,
      type: 'memory',
      data: {
        samples,
        summary: {
          min: Math.min(...samples.map(s => s.value)),
          max: Math.max(...samples.map(s => s.value)),
          avg: samples.reduce((sum, s) => sum + s.value, 0) / samples.length,
          p50: this.calculatePercentile(samples.map(s => s.value), 50),
          p90: this.calculatePercentile(samples.map(s => s.value), 90),
          p95: this.calculatePercentile(samples.map(s => s.value), 95),
          p99: this.calculatePercentile(samples.map(s => s.value), 99),
        },
        heapInfo,
        gcMetrics: gcStats
      },
      metadata: {
        environment: this.configService.get('NODE_ENV'),
        version: process.version,
        trigger: 'scheduled',
        tags: ['memory', 'performance', 'heap', 'gc'],
      },
    };

    await this.storeProfile(profile);
    this.recordMetrics(profile);
    await this.checkMemoryThresholds(profile);
  }

  private async getGCMetrics(): Promise<{ type: string; duration?: number }> {
    // This is a placeholder - in production, you'd use the gc-stats module
    // or a similar solution to get real GC metrics
    return {
      type: 'unknown',
      duration: 0
    };
  }

  private async collectIOProfile(): Promise<void> {
    const samples: ProfileSample[] = [];
    const startTime = Date.now();

    // Collect disk I/O statistics
    const diskStats = await this.getDiskStats();

    samples.push({
      timestamp: new Date(),
      value: diskStats.bytesRead + diskStats.bytesWritten,
      labels: {
        type: 'io',
        bytesRead: diskStats.bytesRead.toString(),
        bytesWritten: diskStats.bytesWritten.toString(),
      },
    });

    const profile: PerformanceProfile = {
      id: `io_${Date.now()}`,
      timestamp: new Date(startTime),
      duration: Date.now() - startTime,
      type: 'io',
      data: {
        samples,
        summary: this.calculateSummary(samples.map(s => s.value)),
      },
      metadata: {
        environment: this.configService.get('NODE_ENV'),
        version: process.version,
        trigger: 'scheduled',
        tags: ['io', 'performance'],
      },
    };

    await this.storeProfile(profile);
    this.recordMetrics(profile);
  }

  private async collectNetworkProfile(): Promise<void> {
    const samples: ProfileSample[] = [];
    const startTime = Date.now();
    const networkStats = os.networkInterfaces();
    let totalBytes = 0;

    for (const [, interfaces] of Object.entries(networkStats)) {
      for (const iface of interfaces) {
        if (iface.internal) {
          continue;
        }

        // This is a simplified example. In reality, you'd want to track actual network usage
        totalBytes += iface.family === 'IPv4' ? 4 : 16;
      }
    }

    samples.push({
      timestamp: new Date(),
      value: totalBytes,
      labels: {
        type: 'network',
      },
    });

    const profile: PerformanceProfile = {
      id: `network_${Date.now()}`,
      timestamp: new Date(startTime),
      duration: Date.now() - startTime,
      type: 'network',
      data: {
        samples,
        summary: this.calculateSummary(samples.map(s => s.value)),
      },
      metadata: {
        environment: this.configService.get('NODE_ENV'),
        version: process.version,
        trigger: 'scheduled',
        tags: ['network', 'performance'],
      },
    };

    await this.storeProfile(profile);
    this.recordMetrics(profile);
  }

  private async getDiskStats(): Promise<{ bytesRead: number; bytesWritten: number }> {
    // This is a placeholder. In reality, you'd want to use a library like `diskusage`
    // or read from /proc/diskstats on Linux
    return {
      bytesRead: 0,
      bytesWritten: 0,
    };
  }

  private calculateSummary(values: number[]): ProfileSample['summary'] {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0],
      max: sorted[len - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private async storeProfile(profile: PerformanceProfile): Promise<void> {
    const key = `profile:${profile.type}:${profile.id}`;
    
    // Store in memory
    this.profiles.set(profile.id, profile);

    // Store in Redis with expiration
    await this.redisService.set(
      key,
      JSON.stringify(profile),
      'PX',
      this.retentionPeriod * 1000,
    );

    this.eventEmitter.emit('profile.collected', {
      id: profile.id,
      type: profile.type,
      timestamp: profile.timestamp,
    });
  }

  private recordMetrics(profile: PerformanceProfile): void {
    // Record summary metrics
    this.metricCollector.gauge(
      `profile_${profile.type}_value`,
      profile.data.summary.avg,
      'count',
      [
        { name: 'type', value: profile.type },
        { name: 'environment', value: profile.metadata.environment },
      ],
    );

    // Record percentile metrics
    ['p50', 'p90', 'p95', 'p99'].forEach(percentile => {
      this.metricCollector.gauge(
        `profile_${profile.type}_${percentile}`,
        profile.data.summary[percentile],
        'count',
        [
          { name: 'type', value: profile.type },
          { name: 'environment', value: profile.metadata.environment },
        ],
      );
    });
  }

  private async checkMemoryThresholds(profile: PerformanceProfile): Promise<void> {
    const heapInfo = profile.data.heapInfo;
    const heapUsagePercent = (heapInfo.usedHeapSize / heapInfo.heapSizeLimit) * 100;

    if (heapUsagePercent > 85) {
      this.logger.warn('High heap usage detected', {
        usagePercent: heapUsagePercent,
        usedHeapSize: heapInfo.usedHeapSize,
        heapSizeLimit: heapInfo.heapSizeLimit
      });

      this.eventEmitter.emit('memory.threshold.exceeded', {
        type: 'heap_usage',
        value: heapUsagePercent,
        threshold: 85,
        timestamp: new Date()
      });
    }

    // Check for memory fragmentation
    const fragmentationIndex = 1 - (heapInfo.usedHeapSize / heapInfo.totalPhysicalSize);
    if (fragmentationIndex > 0.3) { // More than 30% fragmentation
      this.logger.warn('High memory fragmentation detected', {
        fragmentationIndex,
        usedHeapSize: heapInfo.usedHeapSize,
        totalPhysicalSize: heapInfo.totalPhysicalSize
      });
    }
  }

  async getProfile(id: string): Promise<PerformanceProfile | null> {
    // Check memory cache
    if (this.profiles.has(id)) {
      return this.profiles.get(id);
    }

    // Check Redis
    const keys = await this.redisService.client.keys(`profile:*:${id}`);
    if (keys.length === 0) {
      return null;
    }

    const data = await this.redisService.get(keys[0]);
    if (!data) {
      return null;
    }

    const profile = JSON.parse(data) as PerformanceProfile;
    return profile;
  }

  async queryProfiles(options: {
    type?: 'cpu' | 'memory' | 'io' | 'network';
    startTime?: Date;
    endTime?: Date;
    environment?: string;
    tags?: string[];
  }): Promise<PerformanceProfile[]> {
    const pattern = options.type ? `profile:${options.type}:*` : 'profile:*';
    
    const keys = await this.redisService.client.keys(pattern);
    const profiles: PerformanceProfile[] = [];

    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (!data) {
        continue;
      }

      const profile = JSON.parse(data) as PerformanceProfile;

      if (this.matchesFilter(profile, options)) {
        profiles.push(profile);
      }
    }

    return profiles;
  }

  private matchesFilter(
    profile: PerformanceProfile,
    filter: {
      startTime?: Date;
      endTime?: Date;
      environment?: string;
      tags?: string[];
    },
  ): boolean {
    if (filter.startTime && profile.timestamp < filter.startTime) {
      return false;
    }

    if (filter.endTime && profile.timestamp > filter.endTime) {
      return false;
    }

    if (
      filter.environment &&
      (profile as any).metadata.environment !== filter.environment
    ) {
      return false;
    }

    if (
      filter.tags &&
      !(filter as any).metadata.tags?.every(tag => filter.tags.includes(tag))
    ) {
      return false;
    }

    return true;
  }

  async deleteMetrics(pattern: string): Promise<void> {
    const keys = await this.redisService.client.keys(pattern);
    if (keys.length > 0) {
      await this.redisService.client.del(...keys);
    }
  }

  onModuleDestroy() {
    this.stopProfiling();
  }
}
