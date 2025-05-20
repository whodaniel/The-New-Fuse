declare const TYPES: {
  ConfigService: unknown;
  DatabaseService: unknown;
  LoggingService: unknown;
  CacheService: unknown;
  EventBus: unknown;
  SecurityService: unknown;
  TimeService: unknown;
  MetricsCollector: unknown;
  SessionManager: unknown;
  Config: unknown;
  Logger: unknown;
  Cache: unknown;
  Time: unknown;
  ErrorHandler: unknown;
  AuthService: unknown;
};
export default TYPES;
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  log(level: string, message: string, context?: Record<string, any>): void;
}
export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
  set(key: string, value: unknown): void;
  load(): Promise<void>;
}
export interface IEventBus {
  publish<T>(eventName: string, payload: T): void;
  subscribe<T>(eventName: string, handler: (payload: T) => void): () => void;
  unsubscribe(eventName: string, handler: Function): void;
}
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
