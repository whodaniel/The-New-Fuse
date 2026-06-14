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
export declare class ApiResponseBuilder<T> {
    private response;
    private constructor();
    /**
     * Create a new builder instance
     */
    static success<T>(): ApiResponseBuilder<T>;
    /**
     * Set the response data
     */
    data(data: T): ApiResponseBuilder<T>;
    /**
     * Set a success message
     */
    message(message: string): ApiResponseBuilder<T>;
    /**
     * Set request ID for tracing
     */
    requestId(id: string): ApiResponseBuilder<T>;
    /**
     * Set API version
     */
    version(version: string): ApiResponseBuilder<T>;
    /**
     * Build the response
     */
    build(): ApiResponse<T>;
}
/**
 * Factory functions for common response types
 */
export declare const ApiResponse: {
    /**
     * Create a success response
     */
    success<T>(data?: T, message?: string): ApiResponse<T>;
    /**
     * Create an error response
     */
    error<T>(message: string, code?: string, _statusCode?: number, details?: Record<string, unknown>): ApiResponse<T>;
    /**
     * Create a not found response
     */
    notFound<T>(message?: string): ApiResponse<T>;
    /**
     * Create an unauthorized response
     */
    unauthorized<T>(message?: string): ApiResponse<T>;
    /**
     * Create a forbidden response
     */
    forbidden<T>(message?: string): ApiResponse<T>;
    /**
     * Create a bad request response
     */
    badRequest<T>(message: string, details?: Record<string, unknown>): ApiResponse<T>;
    /**
     * Create a paginated response
     */
    paginated<T>(data: T[], pagination: PaginationInfo): PaginatedApiResponse<T[]>;
    /**
     * Create a validation error response
     */
    validationError<T>(errors: ApiError[]): ApiResponse<T>;
};
/**
 * Type guard to check if response is successful
 */
export declare function isApiSuccess<T>(response: ApiResponse<T>): boolean;
/**
 * Type guard to check if response is paginated
 */
export declare function isPaginatedResponse<T>(response: ApiResponse<T> | PaginatedApiResponse<T>): response is PaginatedApiResponse<T>;
/**
 * Helper to extract data from response or throw
 */
export declare function getDataOrThrow<T>(response: ApiResponse<T>): T;
//# sourceMappingURL=api-response.d.ts.map