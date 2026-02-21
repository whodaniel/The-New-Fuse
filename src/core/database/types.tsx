import { BaseEntity } from "@the-new-fuse/types";

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface QueryOptions {
  where?: Record<string, unknown>;
  select?: string[];
  relations?: string[];
  order?: Record<string, "ASC" | "DESC">;
  skip?: number;
  take?: number;
}

export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface Repository<T extends BaseEntity> {
  find(options?: QueryOptions): Promise<T[]>;
  findOne(id: string, options?: QueryOptions): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
