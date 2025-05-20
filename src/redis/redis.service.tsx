import Redis from "ioredis";
import {
  createRedisClient,
  RedisConnectionOptions,
} from '../utils/redis/connection.js';
import { RedisService } from '../types/redis/service.js';

export class RedisServiceImpl implements RedisService {
  client: Redis;

  constructor(options?: RedisConnectionOptions | string) {
    this.client = createRedisClient(options);
  }

  getClient(): Redis {
    return this.client;
  }

  // Basic key-value operations
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return await this.client.set(key, value, "EX", ttl);
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

  async rename(source: string, destination: string): Promise<"OK"> {
    return await this.client.rename(source, destination);
  }

  async type(key: string): Promise<string> {
    return await this.client.type(key);
  }

  async dbsize(): Promise<number> {
    return await this.client.dbsize();
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.client.hdel(key, field);
  }

  async hexists(key: string, field: string): Promise<number> {
    return await this.client.hexists(key, field);
  }

  // List operations
  async lpush(key: string, value: string | string[]): Promise<number> {
    if (Array.isArray(value)) {
      return await this.client.lpush(key, ...value);
    }
    return await this.client.lpush(key, value);
  }

  async rpush(key: string, value: string | string[]): Promise<number> {
    if (Array.isArray(value)) {
      return await this.client.rpush(key, ...value);
    }
    return await this.client.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  // Set operations
  async sadd(key: string, member: string | string[]): Promise<number> {
    if (Array.isArray(member)) {
      return await this.client.sadd(key, ...member);
    }
    return await this.client.sadd(key, member);
  }

  async srem(key: string, member: string | string[]): Promise<number> {
    if (Array.isArray(member)) {
      return await this.client.srem(key, ...member);
    }
    return await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    if (withScores) {
      return await this.client.zrange(key, start, stop, "WITHSCORES");
    }
    return await this.client.zrange(key, start, stop);
  }

  async zrem(key: string, member: string | string[]): Promise<number> {
    if (Array.isArray(member)) {
      return await this.client.zrem(key, ...member);
    }
    return await this.client.zrem(key, member);
  }

  // Stream operations
  async xadd(key: string, id: string, fields: Record<string, string>): Promise<string> {
    const args: string[] = [];
    for (const [field, value] of Object.entries(fields)) {
      args.push(field, value);
    }
    return await this.client.xadd(key, id, ...args);
  }

  async xdel(key: string, id: string): Promise<number> {
    return await this.client.xdel(key, id);
  }

  async xrange(key: string, start: string, end: string, count?: number): Promise<Array<[string, string[]]>> {
    if (count !== undefined) {
      return await this.client.xrange(key, start, end, "COUNT", count);
    }
    return await this.client.xrange(key, start, end);
  }

  // Pub/Sub operations
  async publish(
    channel: string,
    message: string | Record<string, unknown>
  ): Promise<number> {
    const messageStr = typeof message === "string" ? message : JSON.stringify(message);
    return await this.client.publish(channel, messageStr);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    await this.client.subscribe(channel);
    this.client.on("message", (ch: string, msg: string) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.client.unsubscribe(channel);
  }

  // JSON operations (requires RedisJSON module)
  async json_get(key: string, path?: string): Promise<string | null> {
    try {
      if (path) {
        return await this.client.call('JSON.GET', key, path) as string;
      }
      return await this.client.call('JSON.GET', key) as string;
    } catch (error) {
      // Handle case where RedisJSON module is not loaded
      console.error('Error in json_get:', error);
      return null;
    }
  }

  async json_set(key: string, path: string, json: string | object): Promise<"OK"> {
    try {
      const jsonStr = typeof json === 'string' ? json : JSON.stringify(json);
      return await this.client.call('JSON.SET', key, path, jsonStr) as "OK";
    } catch (error) {
      // Handle case where RedisJSON module is not loaded
      console.error('Error in json_set:', error);
      throw error;
    }
  }

  async json_del(key: string, path?: string): Promise<number> {
    try {
      if (path) {
        return await this.client.call('JSON.DEL', key, path) as number;
      }
      return await this.client.call('JSON.DEL', key) as number;
    } catch (error) {
      // Handle case where RedisJSON module is not loaded
      console.error('Error in json_del:', error);
      return 0;
    }
  }

  // Vector operations (requires RedisSearch module)
  async set_vector_in_hash(key: string, field: string, vector: number[]): Promise<number> {
    try {
      const vectorStr = vector.join(',');
      return await this.hset(key, field, vectorStr);
    } catch (error) {
      console.error('Error in set_vector_in_hash:', error);
      throw error;
    }
  }

  async get_vector_from_hash(key: string, field: string): Promise<number[] | null> {
    try {
      const vectorStr = await this.hget(key, field);
      if (!vectorStr) return null;
      return vectorStr.split(',').map(Number);
    } catch (error) {
      console.error('Error in get_vector_from_hash:', error);
      return null;
    }
  }

  async vector_search_hash(indexName: string, query: string, options?: Record<string, any>): Promise<any[]> {
    try {
      const args = [indexName, query];

      if (options) {
        if (options.return) args.push('RETURN', options.return);
        if (options.limit) args.push('LIMIT', options.limit.offset, options.limit.count);
        if (options.sortBy) args.push('SORTBY', options.sortBy.field, options.sortBy.order);
        if (options.filter) args.push('FILTER', options.filter);
      }

      return await this.client.call('FT.SEARCH', ...args) as any[];
    } catch (error) {
      console.error('Error in vector_search_hash:', error);
      return [];
    }
  }

  async create_vector_index_hash(indexName: string, schema: Record<string, any>): Promise<"OK"> {
    try {
      const args = [indexName, 'SCHEMA'];

      for (const [field, def] of Object.entries(schema)) {
        args.push(field, def.type);
        if (def.options) {
          for (const [option, value] of Object.entries(def.options)) {
            args.push(option, value);
          }
        }
      }

      return await this.client.call('FT.CREATE', ...args) as "OK";
    } catch (error) {
      console.error('Error in create_vector_index_hash:', error);
      throw error;
    }
  }

  // Index operations
  async get_indexes(): Promise<string[]> {
    try {
      return await this.client.call('FT._LIST') as string[];
    } catch (error) {
      console.error('Error in get_indexes:', error);
      return [];
    }
  }

  async get_index_info(indexName: string): Promise<Record<string, any>> {
    try {
      const info = await this.client.call('FT.INFO', indexName) as string[];
      const result: Record<string, any> = {};

      for (let i = 0; i < info.length; i += 2) {
        result[info[i]] = info[i + 1];
      }

      return result;
    } catch (error) {
      console.error('Error in get_index_info:', error);
      return {};
    }
  }

  async get_indexed_keys_number(indexName: string): Promise<number> {
    try {
      const info = await this.get_index_info(indexName);
      return info.num_docs || 0;
    } catch (error) {
      console.error('Error in get_indexed_keys_number:', error);
      return 0;
    }
  }

  // Utility operations
  async client_list(): Promise<string> {
    return await this.client.client('LIST');
  }

  async info(section?: string): Promise<string> {
    if (section) {
      return await this.client.info(section);
    }
    return await this.client.info();
  }

  // Task-specific methods
  async scheduleTask(task: Record<string, unknown>): Promise<string> {
    const taskId = String(task.id || Date.now());
    await this.set(`tasks:${taskId}`, JSON.stringify(task));
    await this.client.sadd("tasks:pending", taskId);
    return taskId;
  }

  async getRunningTaskIds(): Promise<string[]> {
    const result = await this.client.smembers("tasks:running");
    if (!result) {
      return [];
    }
    return result;
  }

  async scheduleTaskOptimization(options: Record<string, unknown>): Promise<void> {
    await this.set("tasks:optimization", JSON.stringify(options));
  }

  async getTask(id: string): Promise<Record<string, unknown> | null> {
    const result = await this.get(`tasks:${id}`);
    if (!result) {
      return null;
    }
    return JSON.parse(result);
  }

  async cancelTask(id: string): Promise<boolean> {
    try {
      await this.client.srem("tasks:pending", id);
      await this.client.srem("tasks:running", id);
      await this.del(`tasks:${id}`);
      return true;
    } catch (error) {
      console.error('Error canceling task:', error);
      return false;
    }
  }

  async getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]> {
    try {
      const pendingTaskIds = await this.client.smembers("tasks:pending");
      if (!pendingTaskIds || pendingTaskIds.length === 0) {
        return [];
      }

      const tasks: Record<string, unknown>[] = [];
      const idsToProcess = pendingTaskIds.slice(0, limit);

      for (const id of idsToProcess) {
        const task = await this.getTask(id);
        if (task) {
          tasks.push(task);
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error getting pending tasks:', error);
      return [];
    }
  }

  pipeline(): Redis.Pipeline {
    return this.client.pipeline();
  }
}

export const createRedisService = (
  options?: RedisConnectionOptions | string
): RedisService => {
  return new RedisServiceImpl(options);
};
