import { Request, Response, NextFunction } from 'express';
/**
 * Error response structure
 */
export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}
/**
 * Custom error class for API errors
 */
export declare class ApiError extends Error {
    statusCode: number;
    code?: string;
    details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, details?: unknown);
}
/**
 * Global error handling middleware
 */
export declare function errorMiddleware(err: Error | ApiError, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map