import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AdvancedCacheManager } from './services/advanced-cache.manager';
import { CacheInvalidationService } from './services/cache-invalidation.service';
import { CacheMonitoringService } from './services/cache-monitoring.service';
import { CacheWarmingService } from './services/cache-warming.service';

@Controller('cache')
export class CacheController {
  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly monitoringService: CacheMonitoringService,
    private readonly warmingService: CacheWarmingService,
    private readonly invalidationService: CacheInvalidationService
  ) {}

  /**
   * Get cache statistics
   */
  @Get('stats')
  async getStats() {
    const [cacheStats, monitoringStats, warmingStatus, invalidationStats] = await Promise.all([
      this.cacheManager.getStats(),
      this.monitoringService.exportMetrics(),
      this.warmingService.getStatus(),
      this.invalidationService.getStats(),
    ]);

    return {
      cache: cacheStats,
      monitoring: monitoringStats,
      warming: warmingStatus,
      invalidation: invalidationStats,
    };
  }

  /**
   * Get detailed monitoring metrics
   */
  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getDetailedMetrics();
  }

  /**
   * Get top cache keys by access count
   */
  @Get('metrics/top-keys')
  async getTopKeys(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 10;
    return this.monitoringService.getTopKeys(n);
  }

  /**
   * Get keys with low hit rates
   */
  @Get('metrics/low-hit-rate')
  async getLowHitRateKeys(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 10;
    return this.monitoringService.getLowHitRateKeys(n);
  }

  /**
   * Get cache value by key
   */
  @Get('key/:key')
  async getCacheValue(@Param('key') key: string, @Query('prefix') prefix?: string) {
    const value = await this.cacheManager.get(key, { prefix });

    if (value === null) {
      return {
        exists: false,
        key,
        value: null,
        ttl: -1,
      };
    }

    const ttl = await this.cacheManager.getTTL(key, { prefix });

    return {
      exists: true,
      key,
      value,
      ttl,
    };
  }

  /**
   * Set cache value
   */
  @Post('key/:key')
  @HttpCode(HttpStatus.CREATED)
  async setCacheValue(
    @Param('key') key: string,
    @Body() body: { value: any; ttl?: number; prefix?: string; tags?: string[] }
  ) {
    await this.cacheManager.set(key, body.value, {
      ttl: body.ttl,
      prefix: body.prefix,
      tags: body.tags,
    });

    return {
      success: true,
      key,
      ttl: body.ttl,
    };
  }

  /**
   * Delete cache key
   */
  @Delete('key/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCacheKey(@Param('key') key: string, @Query('prefix') prefix?: string) {
    await this.cacheManager.delete(key, { prefix });
  }

  /**
   * Delete cache keys by pattern
   */
  @Delete('pattern/:pattern')
  async deleteCachePattern(@Param('pattern') pattern: string, @Query('prefix') prefix?: string) {
    const count = await this.cacheManager.deletePattern(pattern, { prefix });

    return {
      success: true,
      deletedCount: count,
      pattern,
    };
  }

  /**
   * Invalidate cache by tag
   */
  @Delete('tag/:tag')
  async invalidateByTag(@Param('tag') tag: string) {
    const count = await this.cacheManager.invalidateByTag(tag);

    return {
      success: true,
      invalidatedCount: count,
      tag,
    };
  }

  /**
   * Invalidate cache by multiple tags
   */
  @Delete('tags')
  async invalidateByTags(@Body() body: { tags: string[] }) {
    const count = await this.cacheManager.invalidateByTags(body.tags);

    return {
      success: true,
      invalidatedCount: count,
      tags: body.tags,
    };
  }

  /**
   * Clear all cache (use with caution!)
   */
  @Delete('clear-all')
  async clearAllCache() {
    await this.cacheManager.clear();

    return {
      success: true,
      message: 'All cache cleared',
    };
  }

  /**
   * Warm specific cache task
   */
  @Post('warm/:taskName')
  async warmCache(@Param('taskName') taskName: string) {
    await this.warmingService.executeTask(taskName);

    return {
      success: true,
      task: taskName,
    };
  }

  /**
   * Warm all cache tasks
   */
  @Post('warm-all')
  async warmAllCache(@Query('parallel') parallel?: string) {
    if (parallel === 'true') {
      await this.warmingService.executeAllTasksParallel();
    } else {
      await this.warmingService.executeAllTasks();
    }

    return {
      success: true,
      message: 'Cache warming initiated',
    };
  }

  /**
   * Get warming status
   */
  @Get('warming/status')
  async getWarmingStatus() {
    return this.warmingService.getStatus();
  }

  /**
   * Get invalidation rules
   */
  @Get('invalidation/rules')
  async getInvalidationRules() {
    return this.invalidationService.getStats();
  }

  /**
   * Trigger manual invalidation
   */
  @Post('invalidate')
  async triggerInvalidation(
    @Body()
    body: {
      keys?: string[];
      patterns?: string[];
      tags?: string[];
      prefix?: string;
    }
  ) {
    const count = await this.invalidationService.invalidate(body);

    return {
      success: true,
      invalidatedCount: count,
    };
  }

  /**
   * Reset monitoring metrics
   */
  @Post('metrics/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetMetrics() {
    this.monitoringService.reset();
  }

  /**
   * Health check for cache system
   */
  @Get('health')
  async healthCheck() {
    try {
      const client = this.cacheManager.getClient();
      const pong = await client.ping();

      return {
        status: 'healthy',
        redis: pong === 'PONG' ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
