import { Injectable, Logger } from '@nestjs/common';
import { ResponseCacheService } from './response-cache.service';
import { CDNConfigService } from '../cdn/cdn-config.service';

export interface InvalidationStrategy {
  type: 'tag' | 'pattern' | 'time' | 'event';
  value: string | number;
  targets?: ('cache' | 'cdn')[];
}

export interface InvalidationResult {
  cache: {
    invalidated: number;
    success: boolean;
  };
  cdn?: {
    success: boolean;
    message: string;
  };
}

/**
 * Advanced cache invalidation service
 * Supports multiple invalidation strategies and targets
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  // Scheduled invalidation jobs
  private scheduledJobs = new Map<string, NodeJS.Timeout>();

  constructor(
    private cacheService: ResponseCacheService,
    private cdnService: CDNConfigService
  ) {}

  /**
   * Invalidate cache using a strategy
   */
  async invalidate(strategy: InvalidationStrategy): Promise<InvalidationResult> {
    const targets = strategy.targets || ['cache'];
    const result: InvalidationResult = {
      cache: { invalidated: 0, success: false }
    };

    try {
      // Invalidate application cache
      if (targets.includes('cache')) {
        result.cache = await this.invalidateCache(strategy);
      }

      // Invalidate CDN cache
      if (targets.includes('cdn')) {
        result.cdn = await this.invalidateCDN(strategy);
      }

      this.logger.log(
        `Cache invalidated: ${strategy.type} = ${strategy.value}, ` +
        `cache: ${result.cache.invalidated} entries, ` +
        `cdn: ${result.cdn?.success ? 'success' : 'skipped'}`
      );

      return result;
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
      throw error;
    }
  }

  /**
   * Invalidate by tag (most common use case)
   */
  async invalidateByTag(
    tag: string,
    targets: ('cache' | 'cdn')[] = ['cache']
  ): Promise<InvalidationResult> {
    return this.invalidate({
      type: 'tag',
      value: tag,
      targets
    });
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(
    pattern: string,
    targets: ('cache' | 'cdn')[] = ['cache']
  ): Promise<InvalidationResult> {
    return this.invalidate({
      type: 'pattern',
      value: pattern,
      targets
    });
  }

  /**
   * Schedule cache invalidation
   */
  scheduleInvalidation(
    id: string,
    strategy: InvalidationStrategy,
    delayMs: number
  ): void {
    // Clear existing job if any
    this.cancelScheduledInvalidation(id);

    const timeout = setTimeout(async () => {
      await this.invalidate(strategy);
      this.scheduledJobs.delete(id);
    }, delayMs);

    this.scheduledJobs.set(id, timeout);

    this.logger.log(
      `Scheduled cache invalidation: ${id}, delay: ${delayMs}ms, strategy: ${strategy.type}`
    );
  }

  /**
   * Cancel scheduled invalidation
   */
  cancelScheduledInvalidation(id: string): boolean {
    const job = this.scheduledJobs.get(id);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(id);
      this.logger.log(`Cancelled scheduled invalidation: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Invalidate on specific events
   */
  async invalidateOnEvent(
    event: string,
    strategies: InvalidationStrategy[]
  ): Promise<InvalidationResult[]> {
    this.logger.log(`Invalidating cache on event: ${event}`);

    const results = await Promise.all(
      strategies.map(strategy => this.invalidate(strategy))
    );

    return results;
  }

  /**
   * Bulk invalidation - invalidate multiple tags/patterns at once
   */
  async bulkInvalidate(
    items: Array<{ type: 'tag' | 'pattern'; value: string }>,
    targets: ('cache' | 'cdn')[] = ['cache']
  ): Promise<InvalidationResult[]> {
    this.logger.log(`Bulk invalidating ${items.length} items`);

    const results = await Promise.all(
      items.map(item =>
        this.invalidate({
          type: item.type,
          value: item.value,
          targets
        })
      )
    );

    return results;
  }

  /**
   * Smart invalidation - invalidate related caches based on entity type
   */
  async invalidateEntity(
    entityType: string,
    entityId: string,
    targets: ('cache' | 'cdn')[] = ['cache']
  ): Promise<InvalidationResult[]> {
    const strategies = this.getEntityInvalidationStrategies(entityType, entityId);

    const results = await Promise.all(
      strategies.map(strategy => this.invalidate({ ...strategy, targets }))
    );

    this.logger.log(
      `Smart invalidation for ${entityType}:${entityId}, ` +
      `invalidated ${strategies.length} cache groups`
    );

    return results;
  }

  /**
   * Get invalidation statistics
   */
  getStats() {
    return {
      scheduledJobs: this.scheduledJobs.size,
      cacheStats: this.cacheService.getStats()
    };
  }

  // Private helper methods

  private async invalidateCache(
    strategy: InvalidationStrategy
  ): Promise<{ invalidated: number; success: boolean }> {
    let invalidated = 0;

    try {
      switch (strategy.type) {
        case 'tag':
          invalidated = await this.cacheService.invalidateByTag(
            strategy.value as string
          );
          break;

        case 'pattern':
          invalidated = await this.cacheService.invalidateByPattern(
            strategy.value as string
          );
          break;

        case 'time':
          // Not applicable for cache invalidation
          break;

        case 'event':
          // Event-based invalidation handled by caller
          break;
      }

      return {
        invalidated,
        success: true
      };
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
      return {
        invalidated: 0,
        success: false
      };
    }
  }

  private async invalidateCDN(strategy: InvalidationStrategy): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.cdnService.isEnabled()) {
      return {
        success: false,
        message: 'CDN not enabled'
      };
    }

    try {
      switch (strategy.type) {
        case 'tag':
        case 'pattern':
          // For CDN, we need to convert tags/patterns to URLs
          // This is a simplified implementation
          const urls = this.convertToUrls(strategy.value as string);
          const result = await this.cdnService.purgeUrls(urls);
          return {
            success: result.success,
            message: result.message
          };

        default:
          return {
            success: false,
            message: `CDN invalidation not supported for type: ${strategy.type}`
          };
      }
    } catch (error) {
      this.logger.error('CDN invalidation error:', error);
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  private convertToUrls(tagOrPattern: string): string[] {
    // This is a simplified implementation
    // In production, you'd maintain a mapping of tags to URLs
    // or use CDN-specific tag purging if available
    return [`https://yourdomain.com/${tagOrPattern}/*`];
  }

  private getEntityInvalidationStrategies(
    entityType: string,
    entityId: string
  ): InvalidationStrategy[] {
    // Define invalidation strategies for different entity types
    const strategies: Record<string, InvalidationStrategy[]> = {
      user: [
        { type: 'tag', value: 'users' },
        { type: 'tag', value: `user:${entityId}` },
        { type: 'pattern', value: `cache:*user:${entityId}*` }
      ],
      agent: [
        { type: 'tag', value: 'agents' },
        { type: 'tag', value: `agent:${entityId}` },
        { type: 'pattern', value: `cache:*agent:${entityId}*` },
        { type: 'tag', value: 'dashboard' } // Agents appear on dashboard
      ],
      workflow: [
        { type: 'tag', value: 'workflows' },
        { type: 'tag', value: `workflow:${entityId}` },
        { type: 'pattern', value: `cache:*workflow:${entityId}*` }
      ],
      task: [
        { type: 'tag', value: 'tasks' },
        { type: 'tag', value: `task:${entityId}` },
        { type: 'pattern', value: `cache:*task:${entityId}*` }
      ]
    };

    return strategies[entityType] || [
      { type: 'tag', value: entityType },
      { type: 'pattern', value: `cache:*${entityType}:${entityId}*` }
    ];
  }

  async onModuleDestroy(): Promise<void> {
    // Clear all scheduled jobs
    for (const [id, timeout] of this.scheduledJobs) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();

    this.logger.log('Cache invalidation service destroyed');
  }
}
