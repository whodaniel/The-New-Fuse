/**
 * Request-related type definitions
 */

import { UUID, ISODateTime, SortOptions, FilterOptions, QueryOptions } from './common.js';

/**
 * Base request interface
 */
export interface BaseRequest {
  requestId?: UUID;
  timestamp?: ISODateTime;
}

/**
 * Pagination request parameters
 */
export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sorting request parameters
 * Alias for SortOptions with a different field name for backward compatibility
 */
export interface SortRequest {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter request parameters
 * Extends FilterOptions from core types
 */
export interface FilterRequest extends Omit<FilterOptions, 'value'> {
  value: unknown;
}

/**
 * List request parameters
 * Similar to QueryOptions but with specific request types
 */
export interface ListRequestParams {
  pagination?: PaginationRequest;
  sort?: SortRequest[];
  filters?: FilterRequest[];
  search?: string;
  include?: string[];
}
