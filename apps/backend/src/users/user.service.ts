import { Injectable } from '@nestjs/common';
import { RedisService } from '@core/redis/redis.service.ts';

@Injectable()
export class UserService {
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'user:';

  constructor(private readonly redis: RedisService) {}

  async getUserById(id: string): Promise<any> {
    // Try to get from cache first
    const cached = await this.redis.get(`${this.CACHE_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch from database
    const user = await this.fetchUserFromDb(id);
    if (user) {
      // Store in cache
      await this.redis.set(
        `${this.CACHE_PREFIX}${id}`,
        JSON.stringify(user),
        this.CACHE_TTL
      );
    }

    return user;
  }

  async invalidateUserCache(id: string): Promise<void> {
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);
  }

  private async fetchUserFromDb(id: string): Promise<any> {
    // Your database query logic here
  }
}