import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    // Check if we're using Railway Redis (doesn't support database selection)
    const redisUrl = process.env.REDIS_URL || '';
    const isRailway = redisUrl.includes('railway.internal') || redisUrl.includes('railway.app');

    // Safe parsing of database index - handle empty strings and ensure valid integer
    const parseDbIndex = (): number | undefined => {
      if (isRailway) {
        this.logger.log('🚂 Railway Redis detected - skipping database selection');
        return undefined; // Railway Redis doesn't support database selection
      }

      const dbEnv = process.env.REDIS_DB || '0';
      const parsed = parseInt(dbEnv, 10);

      if (isNaN(parsed) || parsed < 0) {
        this.logger.warn(`Invalid REDIS_DB value: "${dbEnv}", defaulting to 0`);
        return 0;
      }

      return parsed;
    };

    // Optimized Redis connection pool configuration
    const redisConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      // Connection pooling settings
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      // Connection pool optimization
      lazyConnect: false,
      keepAlive: 30000,
      // Performance settings
      enableAutoPipelining: true, // Automatic command batching
      autoResendUnfulfilledCommands: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };

    // Only add db parameter if not Railway
    const dbIndex = parseDbIndex();
    if (dbIndex !== undefined) {
      redisConfig.db = dbIndex;
    }

    this.client = new Redis(redisConfig);

    this.subscriber = new Redis({
      ...redisConfig,
      // Subscriber should not use pipelining
      enableAutoPipelining: false,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis with optimized connection pool');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis subscriber error:', error);
    });
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    this.subscriber.unsubscribe(channel);
  }

  async getTasks(): Promise<any[]> {
    const tasks = await this.client.lrange('tasks', 0, -1);
    return tasks.map((task) => JSON.parse(task));
  }

  async addTask(task: any): Promise<void> {
    await this.client.lpush('tasks', JSON.stringify(task));
  }

  async getQueueLength(queueName: string): Promise<number> {
    return this.client.llen(queueName);
  }

  async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  getSubClient(): Redis {
    return this.subscriber;
  }

  async sendToComposer(message: any): Promise<void> {
    await this.publish('composer:messages', JSON.stringify(message));
  }

  async sendToRooCoder(message: any): Promise<void> {
    await this.publish('roocoder:messages', JSON.stringify(message));
  }

  async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscribe(channel, callback);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    await this.subscriber.disconnect();
  }
}
