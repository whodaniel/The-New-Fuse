import { Redis } from 'ioredis'; // Assuming ioredis, replace if using a different client

// Define a basic structure for the config type
interface RateLimitConfigType {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private readonly redis: Redis;
  private readonly config: RateLimitConfigType;

  constructor(redis: Redis, config: RateLimitConfigType) {
    this.redis = redis;
    this.config = config;
  }

  private getKey(identifier: string): string {
    return `${this.config.keyPrefix}:${identifier}`; // Use colon as separator typically
  }

  /**
   * Checks if the identifier is rate-limited and increments the count.
   * Returns true if limited, false otherwise.
   */
  async isRateLimited(identifier: string): Promise<boolean> {
    const key = this.getKey(identifier);
    const currentCount = await this.redis.incr(key);

    // If this is the first request in the window, set the expiry
    if (currentCount === 1) {
      // Use pexpire for milliseconds precision if windowMs is in ms
      await this.redis.pexpire(key, this.config.windowMs);
    }

    return currentCount > this.config.maxRequests;
  }

   /**
   * Gets the number of remaining requests for the identifier in the current window.
   */
  async getRemainingRequests(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const currentCountStr = await this.redis.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    return Math.max(0, this.config.maxRequests - currentCount);
  }


  /**
   * Resets the rate limit count for the identifier.
   */
  async reset(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.redis.del(key);
    console.log(`Rate limit reset for identifier: ${identifier}`);
  }
}