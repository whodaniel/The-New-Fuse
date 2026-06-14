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
/**
 * API Response Builder Class
 * Provides fluent API for building standardized responses
 */
export class ApiResponseBuilder {
    constructor() {
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
    static success() {
        return new ApiResponseBuilder();
    }
    /**
     * Set the response data
     */
    data(data) {
        this.response.data = data;
        return this;
    }
    /**
     * Set a success message
     */
    message(message) {
        this.response.message = message;
        return this;
    }
    /**
     * Set request ID for tracing
     */
    requestId(id) {
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
    version(version) {
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
    build() {
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
    success(data, message) {
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
    error(message, code = 'ERROR', _statusCode = 500, details) {
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
    notFound(message = 'Resource not found') {
        return this.error(message, 'NOT_FOUND', 404);
    },
    /**
     * Create an unauthorized response
     */
    unauthorized(message = 'Unauthorized') {
        return this.error(message, 'UNAUTHORIZED', 401);
    },
    /**
     * Create a forbidden response
     */
    forbidden(message = 'Forbidden') {
        return this.error(message, 'FORBIDDEN', 403);
    },
    /**
     * Create a bad request response
     */
    badRequest(message, details) {
        return this.error(message, 'BAD_REQUEST', 400, details);
    },
    /**
     * Create a paginated response
     */
    paginated(data, pagination) {
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
    validationError(errors) {
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
export function isApiSuccess(response) {
    return response.success === true;
}
/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse(response) {
    return 'pagination' in response && response.pagination !== undefined;
}
/**
 * Helper to extract data from response or throw
 */
export function getDataOrThrow(response) {
    if (!response.success) {
        throw new Error(response.error?.message || 'Unknown error');
    }
    if (!response.data) {
        throw new Error('No data in response');
    }
    return response.data;
}
//# sourceMappingURL=api-response.js.map