export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectionTimeout?: number;
  maxRetriesPerRequest?: number;
}
export interface RedisOptions {
  ttl?: number;
  namespace?: string;
  serializer?: "json" | "string";
}
export interface RedisCacheEntry<T> {
  value: T;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}
export interface RedisServiceInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: RedisOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;
  getKeys(pattern?: string): Promise<string[]>;
}
export interface RedisSubscriptionOptions {
  channel: string;
  onMessage: (message: string) => void;
  onError?: (error: Error) => void;
}
export interface RedisPubSubInterface {
  subscribe(options: RedisSubscriptionOptions): Promise<void>;
  publish(channel: string, message: string): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}
