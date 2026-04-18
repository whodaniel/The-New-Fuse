/**
 * Response-related type definitions
 */

import { Pagination, BaseResponse as CommonBaseResponse } from './common.js';

/**
 * Base response interface
 * Uses BaseResponse from common.ts
 */
export type BaseResponse<T, E = unknown> = CommonBaseResponse<T, E>;

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  meta: {
    pagination: Pagination;
  };
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}
