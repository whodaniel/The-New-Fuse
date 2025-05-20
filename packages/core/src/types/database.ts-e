import { Task, TaskMetadata, TaskStatusType } from '@the-new-fuse/types';

export interface DatabaseConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface TaskFilter {
  status?: TaskStatusType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  metadata?: Partial<TaskMetadata>;
}

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findAll(filter?: TaskFilter, options?: QueryOptions): Promise<Task[]>;
  create(task: Partial<Task>): Promise<Task>;
  update(id: string, task: Partial<Task>): Promise<Task>;
  delete(id: string): Promise<void>;
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  queryLatency: number;
  errorRate: number;
  cacheHitRate?: number;
}