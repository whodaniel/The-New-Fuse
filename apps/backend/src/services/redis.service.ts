import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });

    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
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
    return tasks.map(task => JSON.parse(task));
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
