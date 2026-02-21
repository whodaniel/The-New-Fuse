// filepath: src/core/di/types.ts
const TYPES = {
  ConfigService: Symbol.for("ConfigService"),
  DatabaseService: Symbol.for("DatabaseService"),
  LoggingService: Symbol.for("LoggingService"),
  CacheService: Symbol.for("CacheService"),
  EventBus: Symbol.for("EventBus"),
  SecurityService: Symbol.for("SecurityService"),
  TimeService: Symbol.for("TimeService"),
  MetricsCollector: Symbol.for("MetricsCollector"),
  SessionManager: Symbol.for("SessionManager"),

  // Aliases for service names (to fix the errors)
  Config: Symbol.for("ConfigService"),
  Logger: Symbol.for("LoggingService"),
  Cache: Symbol.for("CacheService"),
  Time: Symbol.for("TimeService"),
  ErrorHandler: Symbol.for("ErrorHandler"),
  AuthService: Symbol.for("AuthService"),
};

export default TYPES;

// Logger interface
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  log(level: string, message: string, context?: Record<string, any>): void;
}

// Config service interface
export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
  set(key: string, value: unknown): void;
  load(): Promise<void>;
}

// Event bus interface
export interface IEventBus {
  publish<T>(eventName: string, payload: T): void;
  subscribe<T>(eventName: string, handler: (payload: T) => void): () => void;
  unsubscribe(eventName: string, handler: Function): void;
}

// Cache service interface
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
