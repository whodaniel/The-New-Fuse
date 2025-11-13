/**
 * API utilities
 */
/**
 * Format error response consistent with API standards
 */
export declare function formatError(error: Error | string): {
    success: boolean;
    error: string;
    stack?: string;
};
/**
 * Format success response consistent with API standards
 */
export declare function formatSuccess<T>(data: T, meta?: Record<string, unknown>): {
    success: boolean;
    data: T;
    meta?: Record<string, unknown>;
};
//# sourceMappingURL=index.d.ts.map