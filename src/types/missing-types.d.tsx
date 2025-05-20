// Add common type definitions for workflow templates
interface WorkflowContext {
  [key: string]: unknown;
}

// Authentication related types
interface AuthToken {
  token: string;
  expiresAt: Date;
}

interface Credentials {
  email: string;
  password: string;
}

interface TokenManager {
  createToken(userId: string): Promise<AuthToken>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<AuthToken>;
}

// Add common type definitions for integrators
interface IntegratorConfig {
  [key: string]: unknown;
}

// NestJS related types
declare module "@nestjs/config" {
  export class ConfigService {
    get<T>(key: string): T;
    get<T>(key: string, defaultValue: T): T;
  }

  export class ConfigModule {
    static forRoot(options?: unknown): unknown;
  }
}

declare module "@nestjs/typeorm" {
  export interface TypeOrmModuleOptions {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: unknown[];
    synchronize: boolean;
    logging?:
      | boolean
      | "all"
      | (
          | "query"
          | "schema"
          | "error"
          | "warn"
          | "info"
          | "log"
          | "migration"
        )[];
  }

  export class TypeOrmModule {
    static forRoot(options: TypeOrmModuleOptions): unknown;
    static forFeature(entities: unknown[]): unknown;
  }
}

// React component library types
declare module "react-variant" {
  import { ComponentType } from "react";

  export type VariantProps<C extends ComponentType<any>> = {
    variant?: string;
    size?: string;
    [key: string]: unknown;
  };
}

// Express request augmentation
declare namespace Express {
  export interface Request {
    user?: import("@the-new-fuse/database/client").User;
  }
}

// Error handling types
interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  details?: Record<string, any>;
}

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: Record<string, any>;
  };
  timestamp: string;
  path?: string;
}

// Module declarations for project-specific modules
declare module "@the-new-fuse/types" {
  export * from '../task.js';

  export interface CreateAgentDto {
    name: string;
    description?: string;
    capabilities?: string[];
    metadata?: Record<string, any>;
  }

  export interface UpdateAgentDto {
    name?: string;
    description?: string;
    capabilities?: string[];
    metadata?: Record<string, any>;
  }
}

// Core DI types
declare module "../core/di/types" {
  const TYPES: {
    AuthService: symbol;
    UserService: symbol;
    ConfigService: symbol;
    DatabaseService: symbol;
    [key: string]: symbol;
  };

  export default TYPES;
}

// Add module augmentations for commonly used modules that might be missing types
declare module "*" {
  const content: unknown;
  export default content;
}

// Common service interfaces
interface BaseService<T = any> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string | number): Promise<T | null>;
  update(id: string | number, data: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<boolean>;
}

// Common repository interfaces
interface BaseRepository<T = any> {
  findOne(conditions: Partial<T>): Promise<T | null>;
  findMany(conditions: Partial<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(conditions: Partial<T>, data: Partial<T>): Promise<T>;
  delete(conditions: Partial<T>): Promise<boolean>;
}

// Common monitoring interfaces
interface MonitoringMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

interface MonitoringService {
  recordMetric(metric: MonitoringMetric): Promise<void>;
  getMetrics(query: Partial<MonitoringMetric>): Promise<MonitoringMetric[]>;
}

// Common cache interfaces
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Common queue interfaces
interface QueueMessage<T = any> {
  id: string;
  data: T;
  priority?: number;
  timestamp: Date;
}

interface QueueService {
  enqueue<T>(message: QueueMessage<T>): Promise<void>;
  dequeue<T>(): Promise<QueueMessage<T> | null>;
  peek<T>(): Promise<QueueMessage<T> | null>;
}

// Common WebSocket interfaces
interface WebSocketClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: unknown): Promise<void>;
  onMessage(handler: (message: unknown) => void): void;
  onError(handler: (error: Error) => void): void;
}

// Common LLM interfaces
interface LLMProvider {
  generateText(prompt: string, options?: unknown): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
  tokenize(text: string): Promise<string[]>;
}
