import { BaseEntity } from './index.js';
export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
  subscribers?: string[];
}
export interface QueryOptions {
  select?: string[];
  where?: Record<string, unknown>;
  order?: Record<string, "ASC" | "DESC">;
  skip?: number;
  take?: number;
  relations?: string[];
}
export interface DatabaseServiceInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}
export interface RepositoryInterface<T extends BaseEntity> {
  findOne(id: string): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: Record<string, unknown>): Promise<number>;
}
export interface MigrationInterface {
  name: string;
  timestamp: number;
  up(): Promise<void>;
  down(): Promise<void>;
}
export interface ConnectionOptions {
  poolSize?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
