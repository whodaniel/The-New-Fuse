// Redis service interface import { Redis as RedisClient } from "ioredis";

// Use a more generic type to avoid exposing private names
export interface RedisService {
  client: unknown; // Changed from Redis to any

  getClient(): unknown; // Changed from Redis to any

  // Basic key-value operations
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  rename(source: string, destination: string): Promise<"OK">;
  type(key: string): Promise<string>;
  dbsize(): Promise<number>;

  // Hash operations
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string): Promise<number>;
  hexists(key: string, field: string): Promise<number>;

  // List operations
  lpush(key: string, value: string | string[]): Promise<number>;
  rpush(key: string, value: string | string[]): Promise<number>;
  lpop(key: string): Promise<string | null>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;

  // Set operations
  sadd(key: string, member: string | string[]): Promise<number>;
  srem(key: string, member: string | string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;

  // Sorted set operations
  zadd(key: string, score: number, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]>;
  zrem(key: string, member: string | string[]): Promise<number>;

  // Stream operations
  xadd(key: string, id: string, fields: Record<string, string>): Promise<string>;
  xdel(key: string, id: string): Promise<number>;
  xrange(key: string, start: string, end: string, count?: number): Promise<Array<[string, string[]]>>;

  // Pub/Sub operations
  publish(channel: string, message: string | Record<string, unknown>): Promise<number>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;

  // JSON operations (requires RedisJSON module)
  json_get(key: string, path?: string): Promise<string | null>;
  json_set(key: string, path: string, json: string | object): Promise<"OK">;
  json_del(key: string, path?: string): Promise<number>;

  // Vector operations (requires RedisSearch module)
  set_vector_in_hash(key: string, field: string, vector: number[]): Promise<number>;
  get_vector_from_hash(key: string, field: string): Promise<number[] | null>;
  vector_search_hash(indexName: string, query: string, options?: Record<string, any>): Promise<any[]>;
  create_vector_index_hash(indexName: string, schema: Record<string, any>): Promise<"OK">;

  // Index operations
  get_indexes(): Promise<string[]>;
  get_index_info(indexName: string): Promise<Record<string, any>>;
  get_indexed_keys_number(indexName: string): Promise<number>;

  // Utility operations
  client_list(): Promise<string>;
  info(section?: string): Promise<string>;
  pipeline(): any;

  // Task-specific methods
  scheduleTask(task: Record<string, unknown>): Promise<string>;
  getRunningTaskIds(): Promise<string[]>;
  scheduleTaskOptimization(options: Record<string, unknown>): Promise<void>;
  getTask(id: string): Promise<Record<string, unknown> | null>;
  cancelTask(id: string): Promise<boolean>;
  getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]>;
}
