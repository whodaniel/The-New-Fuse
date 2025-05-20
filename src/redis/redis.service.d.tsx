import Redis from "ioredis";
import { RedisConnectionOptions } from '../utils/redis/connection.js';
import { RedisService } from '../types/redis/service.js';
export declare class RedisServiceImpl implements RedisService {
  client: Redis;
  constructor(options?: RedisConnectionOptions | string);
  getClient(): Redis;
  publish(
    channel: string,
    message: string | Record<string, unknown>,
  ): Promise<number>;
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  scheduleTask(task: Record<string, unknown>): Promise<string>;
  getRunningTaskIds(): Promise<string[]>;
  scheduleTaskOptimization(options: Record<string, unknown>): Promise<void>;
  getTask(id: string): Promise<Record<string, unknown> | null>;
  cancelTask(id: string): Promise<boolean>;
  getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]>;
  lpush(key: string, value: string): Promise<number>;
  pipeline(): Redis.Pipeline;
}
export declare const createRedisService: (
  options?: RedisConnectionOptions | string,
) => RedisService;
