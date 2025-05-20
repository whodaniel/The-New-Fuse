import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Logger } from './utils/logger.js';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
}

@Injectable()
export class RedisManager {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisManager.name);

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix,
      tls: config.tls ? {} : undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.client.on('connect', () => {
      this.logger.info('Connected to Redis');
    }); 
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if(ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting Redis key ${key}:`, error);
      throw error;
    }
  }
  
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting Redis key ${key}:`, error);
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting Redis key ${key}:`, error);
      throw error;
    }
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of Redis key ${key}:`, error);
      throw error;
    }
  }
  
  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Error setting Redis hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }
  
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting Redis hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }
  
  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hdel(key, field);
    } catch (error) {
      this.logger.error(`Error deleting Redis hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }
  
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      const result = await this.client.hgetall(key);
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      this.logger.error(`Error getting all Redis hash fields for key ${key}:`, error);
      throw error;
    }
  }
  
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      this.logger.error(`Error publishing message to Redis channel ${channel}:`, error);
      throw error;
    }
  }
  
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.client.subscribe(channel);
      this.client.on('message', (ch: string, message: string) => {
        if(ch === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error(`Error subscribing to Redis channel ${channel}:`, error);
      throw error;
    }
  }
  
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.client.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Error unsubscribing from Redis channel ${channel}:`, error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }
}
