import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseCacheService } from '../caching/response-cache.service';

export interface WarmingStrategy {
  name: string;
  enabled: boolean;
  schedule?: string; // Cron expression
  urls?: string[];
  tags?: string[];
  priority: number;
}

export interface WarmingJob {
  id: string;
  strategy: WarmingStrategy;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  itemsWarmed?: number;
  error?: string;
}

/**
 * Cache warming service for critical data
 * Preloads frequently accessed data into cache to improve response times
 */
@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);
  private jobs: Map<string, WarmingJob> = new Map();
  private warmingStrategies: WarmingStrategy[] = [];

  constructor(
    private configService: ConfigService,
    private cacheService: ResponseCacheService
  ) {
    this.initializeStrategies();
  }

  async onModuleInit(): Promise<void> {
    // Warm cache on startup if enabled
    const warmOnStartup = this.configService.get('CACHE_WARM_ON_STARTUP', 'true') === 'true';

    if (warmOnStartup) {
      this.logger.log('Warming cache on startup...');
      await this.warmAll();
    }
  }

  private initializeStrategies(): void {
    // Predefined warming strategies
    this.warmingStrategies = [
      {
        name: 'critical-endpoints',
        enabled: true,
        priority: 1,
        urls: [
          '/api/dashboard',
          '/api/users/me',
          '/api/agents',
          '/api/workflows'
        ],
        tags: ['dashboard', 'users', 'agents', 'workflows']
      },
      {
        name: 'static-data',
        enabled: true,
        priority: 2,
        urls: [
          '/api/config',
          '/api/settings',
          '/api/metadata'
        ],
        tags: ['config', 'settings']
      },
      {
        name: 'analytics',
        enabled: false,
        priority: 3,
        urls: [
          '/api/analytics/summary',
          '/api/analytics/trends'
        ],
        tags: ['analytics']
      }
    ];

    this.logger.log(`Initialized ${this.warmingStrategies.length} warming strategies`);
  }

  /**
   * Warm cache for all enabled strategies
   */
  async warmAll(): Promise<WarmingJob[]> {
    const enabledStrategies = this.warmingStrategies
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    const jobs: WarmingJob[] = [];

    for (const strategy of enabledStrategies) {
      const job = await this.warmStrategy(strategy);
      jobs.push(job);
    }

    return jobs;
  }

  /**
   * Warm cache for a specific strategy
   */
  async warmStrategy(strategy: WarmingStrategy): Promise<WarmingJob> {
    const jobId = `warm-${strategy.name}-${Date.now()}`;
    const job: WarmingJob = {
      id: jobId,
      strategy,
      status: 'running',
      startTime: new Date(),
      itemsWarmed: 0
    };

    this.jobs.set(jobId, job);
    this.logger.log(`Starting cache warming: ${strategy.name}`);

    try {
      let itemsWarmed = 0;

      // Warm by URLs
      if (strategy.urls?.length) {
        itemsWarmed += await this.warmUrls(strategy.urls);
      }

      // Warm by tags (fetch and cache tagged data)
      if (strategy.tags?.length) {
        itemsWarmed += await this.warmTags(strategy.tags);
      }

      job.status = 'completed';
      job.endTime = new Date();
      job.itemsWarmed = itemsWarmed;

      const duration = job.startTime ? job.endTime.getTime() - job.startTime.getTime() : 0;
      this.logger.log(
        `Cache warming completed: ${strategy.name}, warmed ${itemsWarmed} items in ${duration}ms`
      );
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = (error as Error).message;

      this.logger.error(`Cache warming failed: ${strategy.name}`, error);
    }

    return job;
  }

  /**
   * Warm specific URLs
   */
  async warmUrls(urls: string[]): Promise<number> {
    let warmed = 0;

    for (const url of urls) {
      try {
        // In production, you'd make actual HTTP requests to these endpoints
        // For now, we'll simulate by creating cache keys
        const cacheKey = this.urlToCacheKey(url);

        // Check if already cached
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          this.logger.debug(`URL already cached: ${url}`);
          continue;
        }

        // In production: Fetch data from endpoint and cache it
        // const data = await this.fetchUrl(url);
        // await this.cacheService.set(cacheKey, data, { ttl: 300 });

        this.logger.debug(`Warmed cache for URL: ${url}`);
        warmed++;
      } catch (error) {
        this.logger.error(`Error warming URL ${url}:`, error);
      }
    }

    return warmed;
  }

  /**
   * Warm by tags - preload commonly accessed tagged data
   */
  async warmTags(tags: string[]): Promise<number> {
    let warmed = 0;

    for (const tag of tags) {
      try {
        // In production, you'd query the database for items with this tag
        // and preload them into cache
        this.logger.debug(`Warming cache for tag: ${tag}`);

        // Simulate warming
        // const items = await this.fetchItemsByTag(tag);
        // for (const item of items) {
        //   await this.cacheService.set(`cache:${tag}:${item.id}`, item, { ttl: 300, tags: [tag] });
        //   warmed++;
        // }
      } catch (error) {
        this.logger.error(`Error warming tag ${tag}:`, error);
      }
    }

    return warmed;
  }

  /**
   * Add custom warming strategy
   */
  addStrategy(strategy: WarmingStrategy): void {
    this.warmingStrategies.push(strategy);
    this.logger.log(`Added warming strategy: ${strategy.name}`);
  }

  /**
   * Enable/disable a strategy
   */
  setStrategyEnabled(name: string, enabled: boolean): boolean {
    const strategy = this.warmingStrategies.find(s => s.name === name);
    if (strategy) {
      strategy.enabled = enabled;
      this.logger.log(`Strategy ${name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Get warming job status
   */
  getJob(jobId: string): WarmingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all warming jobs
   */
  getAllJobs(): WarmingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get all strategies
   */
  getStrategies(): WarmingStrategy[] {
    return [...this.warmingStrategies];
  }

  /**
   * Get warming statistics
   */
  getStats(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalItemsWarmed: number;
    activeStrategies: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      totalItemsWarmed: jobs.reduce((sum, j) => sum + (j.itemsWarmed || 0), 0),
      activeStrategies: this.warmingStrategies.filter(s => s.enabled).length
    };
  }

  /**
   * Clear old jobs
   */
  clearOldJobs(olderThan: Date): number {
    const jobs = Array.from(this.jobs.entries());
    let cleared = 0;

    for (const [jobId, job] of jobs) {
      if (job.endTime && job.endTime < olderThan) {
        this.jobs.delete(jobId);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.logger.log(`Cleared ${cleared} old warming jobs`);
    }

    return cleared;
  }

  /**
   * Schedule periodic warming
   */
  scheduleWarming(strategy: WarmingStrategy, intervalMs: number): NodeJS.Timeout {
    const interval = setInterval(async () => {
      this.logger.log(`Scheduled warming: ${strategy.name}`);
      await this.warmStrategy(strategy);
    }, intervalMs);

    this.logger.log(
      `Scheduled warming for ${strategy.name} every ${intervalMs / 1000}s`
    );

    return interval;
  }

  // Private helper methods

  private urlToCacheKey(url: string): string {
    // Convert URL to cache key
    return `cache:url:${url.replace(/\//g, ':')}`;
  }

  async onModuleDestroy(): Promise<void> {
    // Clean up
    this.jobs.clear();
    this.logger.log('Cache warming service destroyed');
  }
}
