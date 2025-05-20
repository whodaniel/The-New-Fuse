import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class ComponentAnalysisStorage {
  private readonly HISTORY_KEY = 'component-analysis:history';
  private readonly MAX_HISTORY = 90; // Keep 90 days of history

  constructor(private readonly redisService: RedisService) {}

  async storeResults(results: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      results,
    };

    // Store in Redis as a sorted set with timestamp as score
    await this.redisService.zadd(
      this.HISTORY_KEY,
      new Date().getTime(),
      JSON.stringify(entry)
    );

    // Trim history to keep only last 90 entries
    await this.redisService.zremrangebyrank(
      this.HISTORY_KEY,
      0,
      -(this.MAX_HISTORY + 1)
    );
  }

  async getHistory(days: number = 30) {
    const minScore = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
    const results = await this.redisService.zrangebyscore(
      this.HISTORY_KEY,
      minScore,
      '+inf'
    );
    
    return results.map(r => JSON.parse(r));
  }

  async getLatestResults() {
    const results = await this.redisService.zrange(
      this.HISTORY_KEY,
      -1,
      -1
    );
    return results.length ? JSON.parse(results[0]) : null;
  }

  async getTrends() {
    const history = await this.getHistory();
    if (history.length < 2) return null;

    const first = history[0].results.stats;
    const last = history[history.length - 1].results.stats;

    return {
      period: {
        start: history[0].timestamp,
        end: history[history.length - 1].timestamp
      },
      trends: {
        totalComponents: {
          start: first.totalComponents,
          end: last.totalComponents,
          change: last.totalComponents - first.totalComponents
        },
        potentiallyLost: {
          start: first.potentiallyLostCount,
          end: last.potentiallyLostCount,
          change: last.potentiallyLostCount - first.potentiallyLostCount
        },
        unusedPercentage: {
          start: (first.potentiallyLostCount / first.totalComponents) * 100,
          end: (last.potentiallyLostCount / last.totalComponents) * 100,
          change: ((last.potentiallyLostCount / last.totalComponents) - 
                  (first.potentiallyLostCount / first.totalComponents)) * 100
        }
      }
    };
  }
}