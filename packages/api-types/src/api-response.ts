/**
 * Standardized API Response Types
 *
 * Provides consistent response wrapper patterns across the entire TNF API.
 * This ensures all endpoints return data in a consistent format,
 * making it easier for frontend consumers to handle responses.
 *
 * Usage:
 * ```typescript
 * // In your controller
 * return ApiResponse.success(data);
 * return ApiResponse.error('Something went wrong', 500);
 * return ApiResponse.paginated(items, { page: 1, limit: 10, total: 100 });
 * ```
 */

export interface ApiResponseMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

/**
 * Standard API response wrapper interface
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  error?: ApiError;
  metadata?: ApiResponseMetadata;
}

/**
 * Paginated API response interface
 */
export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T> {
  pagination: PaginationInfo;
}

/**
 * API Response Builder Class
 * Provides fluent API for building standardized responses
 */
export class ApiResponseBuilder<T> {
  private response: ApiResponse<T>;

  private constructor() {
    this.response = {
      success: true,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a new builder instance
   */
  static success<T>(): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>();
  }

  /**
   * Set the response data
   */
  data(data: T): ApiResponseBuilder<T> {
    this.response.data = data;
    return this;
  }

  /**
   * Set a success message
   */
  message(message: string): ApiResponseBuilder<T> {
    this.response.message = message;
    return this;
  }

  /**
   * Set request ID for tracing
   */
  requestId(id: string): ApiResponseBuilder<T> {
    this.response.metadata = {
      ...this.response.metadata,
      requestId: id,
      timestamp: this.response.metadata?.timestamp || new Date().toISOString(),
    };
    return this;
  }

  /**
   * Set API version
   */
  version(version: string): ApiResponseBuilder<T> {
    this.response.metadata = {
      ...this.response.metadata,
      version,
      timestamp: this.response.metadata?.timestamp || new Date().toISOString(),
    };
    return this;
  }

  /**
   * Build the response
   */
  build(): ApiResponse<T> {
    return this.response;
  }
}

/**
 * Factory functions for common response types
 */
export const ApiResponse = {
  /**
   * Create a success response
   */
  success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Create an error response
   */
  error<T>(message: string, code: string = 'ERROR', _statusCode: number = 500, details?: Record<string, unknown>): ApiResponse<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Create a not found response
   */
  notFound<T>(message: string = 'Resource not found'): ApiResponse<T> {
    return this.error(message, 'NOT_FOUND', 404);
  },

  /**
   * Create an unauthorized response
   */
  unauthorized<T>(message: string = 'Unauthorized'): ApiResponse<T> {
    return this.error(message, 'UNAUTHORIZED', 401);
  },

  /**
   * Create a forbidden response
   */
  forbidden<T>(message: string = 'Forbidden'): ApiResponse<T> {
    return this.error(message, 'FORBIDDEN', 403);
  },

  /**
   * Create a bad request response
   */
  badRequest<T>(message: string, details?: Record<string, unknown>): ApiResponse<T> {
    return this.error(message, 'BAD_REQUEST', 400, details);
  },

  /**
   * Create a paginated response
   */
  paginated<T>(
    data: T[],
    pagination: PaginationInfo
  ): PaginatedApiResponse<T[]> {
    return {
      success: true,
      data,
      pagination,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Create a validation error response
   */
  validationError<T>(errors: ApiError[]): ApiResponse<T> {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors },
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
};

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): boolean {
  return response.success === true;
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: ApiResponse<T> | PaginatedApiResponse<T>): response is PaginatedApiResponse<T> {
  return 'pagination' in response && response.pagination !== undefined;
}

/**
 * Helper to extract data from response or throw
 */
export function getDataOrThrow<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'Unknown error');
  }
  if (!response.data) {
    throw new Error('No data in response');
  }
  return response.data;
}
