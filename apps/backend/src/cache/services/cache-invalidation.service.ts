import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AdvancedCacheManager } from './advanced-cache.manager';

export interface InvalidationRule {
  name: string;
  event: string;
  handler: (payload: any) => Promise<void> | void;
  enabled?: boolean;
}

export interface InvalidationStrategy {
  keys?: string[];
  patterns?: string[];
  tags?: string[];
  prefix?: string;
}

@Injectable()
export class CacheInvalidationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheInvalidationService.name);
  private invalidationRules: Map<string, InvalidationRule> = new Map();
  private scheduledInvalidations: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.registerDefaultInvalidationRules();
    this.logger.log('Cache invalidation service initialized');
  }

  async onModuleDestroy() {
    // Clear all scheduled invalidations
    for (const timeout of this.scheduledInvalidations.values()) {
      clearTimeout(timeout);
    }
    this.scheduledInvalidations.clear();
  }

  /**
   * Register an invalidation rule
   */
  registerRule(rule: InvalidationRule): void {
    if (rule.enabled === false) {
      return;
    }

    this.invalidationRules.set(rule.name, {
      ...rule,
      enabled: rule.enabled !== false,
    });

    this.logger.debug(`Registered invalidation rule: ${rule.name} for event: ${rule.event}`);
  }

  /**
   * Unregister an invalidation rule
   */
  unregisterRule(name: string): void {
    this.invalidationRules.delete(name);
    this.logger.debug(`Unregistered invalidation rule: ${name}`);
  }

  /**
   * Invalidate cache by strategy
   */
  async invalidate(strategy: InvalidationStrategy): Promise<number> {
    let totalInvalidated = 0;

    try {
      // Invalidate by specific keys
      if (strategy.keys && strategy.keys.length > 0) {
        for (const key of strategy.keys) {
          await this.cacheManager.delete(key, { prefix: strategy.prefix });
          totalInvalidated++;
        }
      }

      // Invalidate by patterns
      if (strategy.patterns && strategy.patterns.length > 0) {
        for (const pattern of strategy.patterns) {
          const count = await this.cacheManager.deletePattern(pattern, {
            prefix: strategy.prefix,
          });
          totalInvalidated += count;
        }
      }

      // Invalidate by tags
      if (strategy.tags && strategy.tags.length > 0) {
        const count = await this.cacheManager.invalidateByTags(strategy.tags);
        totalInvalidated += count;
      }

      if (totalInvalidated > 0) {
        this.logger.debug(`Invalidated ${totalInvalidated} cache entries`);
      }

      return totalInvalidated;
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
      throw error;
    }
  }

  /**
   * Schedule cache invalidation after a delay
   */
  scheduleInvalidation(
    name: string,
    strategy: InvalidationStrategy,
    delayMs: number,
  ): void {
    // Clear existing scheduled invalidation
    if (this.scheduledInvalidations.has(name)) {
      clearTimeout(this.scheduledInvalidations.get(name));
    }

    const timeout = setTimeout(async () => {
      try {
        await this.invalidate(strategy);
        this.scheduledInvalidations.delete(name);
        this.logger.debug(`Executed scheduled invalidation: ${name}`);
      } catch (error) {
        this.logger.error(`Scheduled invalidation failed: ${name}`, error);
      }
    }, delayMs);

    this.scheduledInvalidations.set(name, timeout);
    this.logger.debug(`Scheduled invalidation: ${name} in ${delayMs}ms`);
  }

  /**
   * Cancel a scheduled invalidation
   */
  cancelScheduledInvalidation(name: string): boolean {
    const timeout = this.scheduledInvalidations.get(name);

    if (timeout) {
      clearTimeout(timeout);
      this.scheduledInvalidations.delete(name);
      this.logger.debug(`Cancelled scheduled invalidation: ${name}`);
      return true;
    }

    return false;
  }

  /**
   * Event-based invalidation: User updated
   */
  @OnEvent('user.updated')
  async onUserUpdated(payload: { userId: string }): Promise<void> {
    await this.invalidate({
      tags: [`user:${payload.userId}`],
      patterns: [`user:${payload.userId}:*`],
    });

    this.logger.debug(`Invalidated cache for user: ${payload.userId}`);
  }

  /**
   * Event-based invalidation: User deleted
   */
  @OnEvent('user.deleted')
  async onUserDeleted(payload: { userId: string }): Promise<void> {
    await this.invalidate({
      tags: [`user:${payload.userId}`, 'users'],
      patterns: [`user:${payload.userId}:*`],
    });

    this.logger.debug(`Invalidated cache for deleted user: ${payload.userId}`);
  }

  /**
   * Event-based invalidation: User created
   */
  @OnEvent('user.created')
  async onUserCreated(): Promise<void> {
    await this.invalidate({
      tags: ['users'],
      patterns: ['users:list:*', 'users:count:*'],
    });

    this.logger.debug('Invalidated user lists cache');
  }

  /**
   * Event-based invalidation: Product updated
   */
  @OnEvent('product.updated')
  async onProductUpdated(payload: { productId: string }): Promise<void> {
    await this.invalidate({
      tags: [`product:${payload.productId}`, 'products'],
      patterns: [`product:${payload.productId}:*`, 'products:*'],
    });

    this.logger.debug(`Invalidated cache for product: ${payload.productId}`);
  }

  /**
   * Event-based invalidation: Order created
   */
  @OnEvent('order.created')
  async onOrderCreated(payload: { userId: string; productIds: string[] }): Promise<void> {
    const tags = [
      `user:${payload.userId}`,
      ...payload.productIds.map((id) => `product:${id}`),
    ];

    await this.invalidate({
      tags,
      patterns: [`orders:user:${payload.userId}:*`, 'orders:recent:*'],
    });

    this.logger.debug('Invalidated cache for new order');
  }

  /**
   * Event-based invalidation: Configuration changed
   */
  @OnEvent('config.changed')
  async onConfigChanged(): Promise<void> {
    await this.invalidate({
      tags: ['config'],
      patterns: ['config:*', 'settings:*'],
    });

    this.logger.log('Invalidated configuration cache');
  }

  /**
   * Event-based invalidation: Cache clear all
   */
  @OnEvent('cache.clear')
  async onCacheClear(payload?: { pattern?: string }): Promise<void> {
    if (payload?.pattern) {
      await this.invalidate({ patterns: [payload.pattern] });
      this.logger.warn(`Cleared cache pattern: ${payload.pattern}`);
    } else {
      await this.cacheManager.clear();
      this.logger.warn('Cleared all cache');
    }
  }

  /**
   * Invalidate related caches
   */
  async invalidateRelated(
    entityType: string,
    entityId: string,
    relations: string[] = [],
  ): Promise<void> {
    const tags = [
      `${entityType}:${entityId}`,
      entityType,
      ...relations.map((r) => `${r}:${entityId}`),
    ];

    await this.invalidate({ tags });

    this.logger.debug(
      `Invalidated related cache for ${entityType}:${entityId} with ${relations.length} relations`,
    );
  }

  /**
   * Batch invalidation
   */
  async batchInvalidate(strategies: InvalidationStrategy[]): Promise<number> {
    let total = 0;

    for (const strategy of strategies) {
      total += await this.invalidate(strategy);
    }

    this.logger.debug(`Batch invalidated ${total} cache entries across ${strategies.length} strategies`);

    return total;
  }

  /**
   * Conditional invalidation
   */
  async conditionalInvalidate(
    condition: () => boolean | Promise<boolean>,
    strategy: InvalidationStrategy,
  ): Promise<number> {
    const shouldInvalidate = await Promise.resolve(condition());

    if (shouldInvalidate) {
      return this.invalidate(strategy);
    }

    return 0;
  }

  /**
   * Register default invalidation rules
   */
  private registerDefaultInvalidationRules(): void {
    // User-related invalidations
    this.registerRule({
      name: 'user-profile-update',
      event: 'user.profile.updated',
      handler: async (payload) => {
        await this.invalidate({
          tags: [`user:${payload.userId}`],
          patterns: [`user:${payload.userId}:profile:*`],
        });
      },
    });

    // Authentication invalidations
    this.registerRule({
      name: 'user-logout',
      event: 'user.logged.out',
      handler: async (payload) => {
        await this.invalidate({
          patterns: [`session:${payload.sessionId}`, `user:${payload.userId}:sessions:*`],
          prefix: 'auth:',
        });
      },
    });

    // Data modification invalidations
    this.registerRule({
      name: 'entity-bulk-update',
      event: 'entity.bulk.updated',
      handler: async (payload) => {
        await this.invalidate({
          tags: [payload.entityType],
          patterns: [`${payload.entityType}:*`],
        });
      },
    });

    this.logger.debug('Registered default invalidation rules');
  }

  /**
   * Get invalidation statistics
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    scheduledInvalidations: number;
    rules: Array<{ name: string; event: string; enabled: boolean }>;
  } {
    const rules = Array.from(this.invalidationRules.values());

    return {
      totalRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled !== false).length,
      scheduledInvalidations: this.scheduledInvalidations.size,
      rules: rules.map((r) => ({
        name: r.name,
        event: r.event,
        enabled: r.enabled !== false,
      })),
    };
  }

  /**
   * Emit invalidation event
   */
  emitInvalidationEvent(event: string, payload?: any): void {
    this.eventEmitter.emit(event, payload);
    this.logger.debug(`Emitted invalidation event: ${event}`);
  }
}
