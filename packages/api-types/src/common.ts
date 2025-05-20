/**
 * Common type definitions shared across the API
 * Re-exports common types from @the-new-fuse/types
 */

// Define our own types for now to avoid import issues
export type UUID = string;
export type ISODateTime = string;

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
  value: unknown;
}

export interface QueryOptions {
  pagination?: Pagination;
  sort?: SortOptions[];
  filters?: FilterOptions[];
  search?: string;
  include?: string[];
}

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: ISODateTime;
  version: string;
  services?: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
}

export interface BaseResponse<T, E = unknown> {
  success: boolean;
  data?: T;
  error?: E;
  message?: string;
  meta?: Record<string, unknown>;
}

// API-specific response type
export interface ApiResponse<T> extends BaseResponse<T, string> {
  meta?: {
    pagination?: Pagination;
    [key: string]: unknown;
  };
}