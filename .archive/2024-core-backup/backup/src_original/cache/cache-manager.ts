import { createClient, RedisClientType } from 'redis';
      url: process.env.REDIS_URL || 'redis://localhost:6379'
  async set(key: string, value: unknown, ttl?: number): Promise<void> { const options = ttl ? { EX: '';