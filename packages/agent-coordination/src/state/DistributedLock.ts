import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

/**
 * Distributed lock implementation using Redis
 */
export class DistributedLock extends EventEmitter {
  private redisService: UnifiedRedisService;
  private locks: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(redisService: UnifiedRedisService) {
    super();
    this.redisService = redisService;
  }

  /**
   * Acquire a lock
   */
  async acquire(
    key: string,
    ttl: number = 30000,
    retries: number = 3,
    retryDelay: number = 100
  ): Promise<string | null> {
    const token = this.generateToken();

    for (let i = 0; i < retries; i++) {
      const acquired = await this.tryAcquire(key, token, ttl);

      if (acquired) {
        const expiresAt = Date.now() + ttl;
        this.locks.set(key, { token, expiresAt });
        this.emit('lock:acquired', key, token);
        return token;
      }

      // Wait before retry
      if (i < retries - 1) {
        await this.delay(retryDelay * Math.pow(2, i));
      }
    }

    this.emit('lock:failed', key);
    return null;
  }

  /**
   * Try to acquire lock (single attempt)
   */
  private async tryAcquire(key: string, token: string, ttl: number): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // SET NX: only set if key doesn't exist
    // PX: set expiry in milliseconds
    const result = await this.redisService.set(lockKey, token, ttl, 'NX', 'PX');

    return result === 'OK';
  }

  /**
   * Release a lock
   */
  async release(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Use Lua script to ensure atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redisService.eval(script, [lockKey], [token]);

    if (result === 1) {
      this.locks.delete(key);
      this.emit('lock:released', key, token);
      return true;
    }

    return false;
  }

  /**
   * Extend lock TTL
   */
  async extend(key: string, token: string, ttl: number): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Use Lua script for atomic check-and-extend
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    const result = await this.redisService.eval(script, [lockKey], [token, ttl]);

    if (result === 1) {
      const lock = this.locks.get(key);
      if (lock && lock.token === token) {
        lock.expiresAt = Date.now() + ttl;
      }
      this.emit('lock:extended', key, token);
      return true;
    }

    return false;
  }

  /**
   * Check if lock is held
   */
  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    return await this.redisService.exists(lockKey);
  }

  /**
   * Get lock TTL
   */
  async getTTL(key: string): Promise<number> {
    const lockKey = `lock:${key}`;
    return await this.redisService.pttl(lockKey);
  }

  /**
   * Execute function with lock
   */
  async withLock<T>(key: string, fn: () => Promise<T>, ttl: number = 30000): Promise<T> {
    const token = await this.acquire(key, ttl);

    if (!token) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(key, token);
    }
  }

  /**
   * Generate unique token
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all locks
   */
  getAllLocks(): Array<{ key: string; token: string; expiresAt: number }> {
    return Array.from(this.locks.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  /**
   * Clean up expired locks from local cache
   */
  cleanExpiredLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (lock.expiresAt < now) {
        this.locks.delete(key);
        this.emit('lock:expired', key);
      }
    }
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    this.locks.clear();
    this.removeAllListeners();
  }
}
