#!/bin/bash

set -e

echo "Fixing Redis-related TypeScript issues..."

# Create Redis connection helper
mkdir -p src/utils/redis

cat > src/utils/redis/connection.ts << 'EOL'
// filepath: src/utils/redis/connection.ts
import Redis from 'ioredis';

// Standardize Redis connection options type
export interface RedisConnectionOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  db?: number;
  tls?: boolean;
}

export function createRedisClient(options?: RedisConnectionOptions | string): Redis {
  // Add channel configuration for multi-agent coordination
  const client = typeof options === 'string' ? new Redis(options) : new Redis({
    host: options?.host || '127.0.0.1',
    port: options?.port || 6379,
    password: options?.password,
    db: options?.db || 0,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000
  });

  // Configure keyspace notifications for workflow tracking
  client.config('SET', 'notify-keyspace-events', 'KEA');
  return client;
  // Handle string URL
  if (typeof options === 'string') {
    return new Redis(options);
  }
  
  // Handle undefined options
  if (!options) {
    return new Redis();
  }
  
  // Handle connection object
  if (options.url) {
    return new Redis(options.url);
  } else {
    return new Redis({
      host: options.host || '127.0.0.1',
      port: options.port || 6379,
      password: options.password,
      username: options.username,
      db: options.db || 0,
      tls: options.tls ? { rejectUnauthorized: false } : undefined
    });
  }
}
EOL

# Create Redis service type definitions
mkdir -p src/types/redis
cat > src/types/redis/service.ts << 'EOL'
// filepath: src/types/redis/service.ts
import Redis from 'ioredis';

export interface RedisService {
  client: Redis;
  
  getClient(): Redis;
  publish(channel: string, message: string | Record<string, unknown>): Promise<number>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  
  // Task-specific methods
  scheduleTask(task: Record<string, unknown>): Promise<string>;
  getRunningTaskIds(): Promise<string[]>;
  scheduleTaskOptimization(options: Record<string, unknown>): Promise<void>;
  getTask(id: string): Promise<Record<string, unknown> | null>;
  cancelTask(id: string): Promise<boolean>;
  getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]>;

  // Additional utility methods
  lpush(key: string, value: string): Promise<number>;
  pipeline(): Redis.Pipeline;
}
EOL

# Create Redis implementation stub
mkdir -p src/redis
cat > src/redis/redis.service.ts << 'EOL'
// filepath: src/redis/redis.service.ts
import Redis from 'ioredis';
import { createRedisClient, RedisConnectionOptions } from '../utils/redis/connection';
import { RedisService } from '../types/redis/service';

export class RedisServiceImpl implements RedisService {
  client: Redis;
  
  constructor(options?: RedisConnectionOptions | string) {
    this.client = createRedisClient(options);
  }

  getClient(): Redis {
    return this.client;
  }

  async publish(channel: string, message: string | Record<string, unknown>): Promise<number> {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    return await this.client.publish(channel, messageStr);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.client.subscribe(channel);
    this.client.on('message', (ch: string, msg: string) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.client.unsubscribe(channel);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return await this.client.set(key, value, 'EX', ttl);
    }
    return await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Task-specific methods
  async scheduleTask(task: Record<string, unknown>): Promise<string> {
    const taskId = String(task.id || Date.now());
    await this.set(`task:${taskId}`, JSON.stringify(task));
    await this.lpush('tasks:pending', taskId);
    return taskId;
  }

  async getRunningTaskIds(): Promise<string[]> {
    const result = await this.get('tasks:running');
    if (!result) return [];
    return JSON.parse(result);
  }

  async scheduleTaskOptimization(options: Record<string, unknown>): Promise<void> {
    await this.set('tasks:optimization', JSON.stringify(options));
  }

  async getTask(id: string): Promise<Record<string, unknown> | null> {
    const result = await this.get(`task:${id}`);
    if (!result) return null;
    return JSON.parse(result);
  }

  async cancelTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;
    
    task.status = 'cancelled';
    await this.set(`task:${id}`, JSON.stringify(task));
    return true;
  }

  async getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]> {
    // This is just a stub implementation
    return [];
  }

  async lpush(key: string, value: string): Promise<number> {
    return await this.client.lpush(key, value);
  }

  pipeline(): Redis.Pipeline {
    return this.client.pipeline();
  }
}

export const createRedisService = (options?: RedisConnectionOptions | string): RedisService => {
  return new RedisServiceImpl(options);
};
