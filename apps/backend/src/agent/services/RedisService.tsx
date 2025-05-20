import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscribers: Map<string, (message: any) => void> = new Map();
  private pubSubClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });

    this.pubSubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });

    // Set up message handler for pubsub
    this.pubSubClient.on('message', (channel, message) => {
      const handler = this.subscribers.get(channel);
      if (handler) {
        try {
          const parsedMessage = JSON.parse(message);
          handler(parsedMessage);
        } catch (error) {
          console.error(`Error parsing message from channel ${channel}:`, error);
        }
      }
    });
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    
    if (this.pubSubClient) {
      await this.pubSubClient.quit();
    }
  }

  /**
   * Get Redis client
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set a value in Redis
   */
  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    if (expireSeconds) {
      await this.client.set(key, serializedValue, 'EX', expireSeconds);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: any): Promise<void> {
    const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    await this.client.publish(channel, serializedMessage);
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    this.subscribers.set(channel, callback);
    await this.pubSubClient.subscribe(channel);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    this.subscribers.delete(channel);
    await this.pubSubClient.unsubscribe(channel);
  }

  /**
   * Check Redis connection health
   */
  async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      const pingResult = await this.client.ping();
      return {
        status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message,
      };
    }
  }
}