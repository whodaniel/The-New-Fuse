/**
 * Type definitions for the API package
 */

import type { Agent, Workflow, WorkflowExecution } from '@the-new-fuse/types';

// Re-export the types from the types package
export type { Agent, Workflow, WorkflowExecution };

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Metadata for paginated responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse {
  data: T[];
  meta: PaginationMeta & Record<string, unknown>;
}

/**
 * Base filter parameters for API requests
 */
export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string | string[];
  [key: string]: unknown;
}