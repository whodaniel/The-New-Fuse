/**
 * Common type definitions shared across the application
 */

// Re-export basic types from base-types
import { UUID, ISODateTime } from './base-types.js';
export type { UUID, ISODateTime };

/**
 * Pagination interface for API requests and responses
 */
export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  offset?: number;
}

/**
 * Sorting options for API requests
 */
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Filter options for API requests
 */
export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
  value: unknown;
}

/**
 * Query options for API requests
 */
export interface QueryOptions {
  pagination?: Pagination;
  sort?: SortOptions[];
  filters?: FilterOptions[];
  search?: string;
  include?: string[];
}

/**
 * Health check response
 */
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
