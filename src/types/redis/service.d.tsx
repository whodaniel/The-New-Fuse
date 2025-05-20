// Import Redis or define the necessary types to avoid private name errors
import * as Redis from 'redis';

// If the redis import doesn't work, uncomment this type declaration
// export namespace Redis {
//   export interface Pipeline {
//     exec(): Promise<any[]>;
//     get(key: string): Pipeline;
//     set(key: string, value: string, mode?: string, duration?: number): Pipeline;
//     del(key: string): Pipeline;
//   }
// }

export interface RedisService {
  client: unknown;
  getClient(): unknown;
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
