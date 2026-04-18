import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdvancedCacheManager } from './advanced-cache.manager.js';

export interface WarmupTask {
  name: string;
  key: string;
  fetcher: () => Promise<any>;
  ttl?: number;
  priority?: number; // Higher priority tasks run first
  schedule?: string; // Cron expression
  enabled?: boolean;
  tags?: string[];
  prefix?: string;
}

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);
  private warmupTasks: Map<string, WarmupTask> = new Map();
  private isWarming = false;

  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // Warm critical caches on startup
    this.logger.log('Initializing cache warming...');
    await this.warmupCriticalCaches();
  }

  /**
   * Register a warmup task
   */
  registerTask(task: WarmupTask): void {
    if (task.enabled === false) {
      return;
    }

    this.warmupTasks.set(task.name, {
      ...task,
      priority: task.priority || 0,
      enabled: task.enabled ?? true,
    });

    this.logger.debug(`Registered warmup task: ${task.name}`);
  }

  /**
   * Unregister a warmup task
   */
  unregisterTask(name: string): void {
    this.warmupTasks.delete(name);
    this.logger.debug(`Unregistered warmup task: ${name}`);
  }

  /**
   * Execute a specific warmup task
   */
  async executeTask(name: string): Promise<void> {
    const task = this.warmupTasks.get(name);

    if (!task) {
      this.logger.warn(`Warmup task not found: ${name}`);
      return;
    }

    try {
      this.logger.debug(`Executing warmup task: ${name}`);

      const data = await task.fetcher();

      await this.cacheManager.set(task.key, data, {
        ttl: task.ttl,
        prefix: task.prefix,
        tags: task.tags,
      });

      this.logger.log(`Warmup task completed: ${name}`);
    } catch (error) {
      this.logger.error(`Warmup task failed: ${name}`, error);
    }
  }

  /**
   * Execute all warmup tasks
   */
  async executeAllTasks(): Promise<void> {
    if (this.isWarming) {
      this.logger.warn('Cache warming already in progress');
      return;
    }

    this.isWarming = true;

    try {
      const tasks = Array.from(this.warmupTasks.values())
        .filter((task) => task.enabled !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      this.logger.log(`Starting cache warming: ${tasks.length} tasks`);

      for (const task of tasks) {
        await this.executeTask(task.name);
      }

      this.logger.log('Cache warming completed');
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Execute warmup tasks in parallel
   */
  async executeAllTasksParallel(concurrency: number = 5): Promise<void> {
    if (this.isWarming) {
      this.logger.warn('Cache warming already in progress');
      return;
    }

    this.isWarming = true;

    try {
      const tasks = Array.from(this.warmupTasks.values())
        .filter((task) => task.enabled !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      this.logger.log(`Starting parallel cache warming: ${tasks.length} tasks`);

      // Execute tasks in batches
      for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = tasks.slice(i, i + concurrency);
        await Promise.all(batch.map((task) => this.executeTask(task.name)));
      }

      this.logger.log('Parallel cache warming completed');
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm critical caches on startup
   */
  private async warmupCriticalCaches(): Promise<void> {
    const criticalTasks = Array.from(this.warmupTasks.values())
      .filter((task) => (task.priority || 0) >= 100)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (criticalTasks.length === 0) {
      return;
    }

    this.logger.log(`Warming ${criticalTasks.length} critical caches`);

    for (const task of criticalTasks) {
      await this.executeTask(task.name);
    }
  }

  /**
   * Schedule periodic cache warming
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledWarmup(): Promise<void> {
    this.logger.log('Running scheduled cache warmup');
    await this.executeAllTasksParallel();
  }

  /**
   * Warm cache for a specific key if not exists
   */
  async warmIfMissing(
    key: string,
    fetcher: () => Promise<any>,
    options: {
      ttl?: number;
      prefix?: string;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const exists = await this.cacheManager.exists(key, { prefix: options.prefix });

    if (!exists) {
      const data = await fetcher();

      await this.cacheManager.set(key, data, {
        ttl: options.ttl,
        prefix: options.prefix,
        tags: options.tags,
      });

      this.logger.debug(`Warmed missing cache: ${key}`);
    }
  }

  /**
   * Warm cache for multiple keys
   */
  async warmMultiple(
    entries: Array<{
      key: string;
      fetcher: () => Promise<any>;
      ttl?: number;
      prefix?: string;
      tags?: string[];
    }>
  ): Promise<void> {
    this.logger.log(`Warming ${entries.length} cache entries`);

    await Promise.all(
      entries.map(async (entry) => {
        try {
          const data = await entry.fetcher();

          await this.cacheManager.set(entry.key, data, {
            ttl: entry.ttl,
            prefix: entry.prefix,
            tags: entry.tags,
          });
        } catch (error) {
          this.logger.error(`Failed to warm cache for key ${entry.key}:`, error);
        }
      })
    );

    this.logger.log('Multiple cache warming completed');
  }

  /**
   * Refresh cache before expiration (proactive refresh)
   */
  async refreshBeforeExpiry(
    key: string,
    fetcher: () => Promise<any>,
    options: {
      ttl?: number;
      prefix?: string;
      tags?: string[];
      refreshThreshold?: number; // Refresh when TTL < this value (seconds)
    } = {}
  ): Promise<void> {
    const ttl = await this.cacheManager.getTTL(key, { prefix: options.prefix });
    const threshold = options.refreshThreshold || 300; // Default 5 minutes

    if (ttl > 0 && ttl < threshold) {
      this.logger.debug(`Proactively refreshing cache: ${key} (TTL: ${ttl}s)`);

      const data = await fetcher();

      await this.cacheManager.set(key, data, {
        ttl: options.ttl,
        prefix: options.prefix,
        tags: options.tags,
      });
    }
  }

  /**
   * Get warmup status
   */
  getStatus(): {
    isWarming: boolean;
    totalTasks: number;
    enabledTasks: number;
    tasks: Array<{
      name: string;
      priority: number;
      enabled: boolean;
    }>;
  } {
    const tasks = Array.from(this.warmupTasks.values());

    return {
      isWarming: this.isWarming,
      totalTasks: tasks.length,
      enabledTasks: tasks.filter((t) => t.enabled !== false).length,
      tasks: tasks.map((t) => ({
        name: t.name,
        priority: t.priority || 0,
        enabled: t.enabled !== false,
      })),
    };
  }

  /**
   * Example: Register common warmup tasks
   */
  registerCommonTasks(tasks: {
    popularUsers?: () => Promise<any>;
    popularProducts?: () => Promise<any>;
    siteConfig?: () => Promise<any>;
    navigationMenu?: () => Promise<any>;
  }): void {
    if (tasks.popularUsers) {
      this.registerTask({
        name: 'popular-users',
        key: 'popular-users',
        fetcher: tasks.popularUsers,
        ttl: 3600,
        priority: 50,
        tags: ['users', 'popular'],
      });
    }

    if (tasks.popularProducts) {
      this.registerTask({
        name: 'popular-products',
        key: 'popular-products',
        fetcher: tasks.popularProducts,
        ttl: 1800,
        priority: 75,
        tags: ['products', 'popular'],
      });
    }

    if (tasks.siteConfig) {
      this.registerTask({
        name: 'site-config',
        key: 'site-config',
        fetcher: tasks.siteConfig,
        ttl: 7200,
        priority: 100, // Critical
        tags: ['config'],
      });
    }

    if (tasks.navigationMenu) {
      this.registerTask({
        name: 'navigation-menu',
        key: 'navigation-menu',
        fetcher: tasks.navigationMenu,
        ttl: 3600,
        priority: 90,
        tags: ['navigation'],
      });
    }
  }
}
