export declare class BaseError extends Error {
    code: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    timestamp: Date;
    constructor(message: string, statusCode?: number, code?: string, details?: Record<string, unknown>);
}
export declare class FileUploadError extends BaseError {
    fileName?: string;
    reason?: string;
    constructor(message?: string, statusCode?: number, fileName?: string, reason?: string, code?: string, details?: Record<string, unknown>);
}
export declare class AuthenticationError extends BaseError {
    userId?: string;
    action?: string;
    constructor(message?: string, statusCode?: number, userId?: string, action?: string, code?: string, details?: Record<string, unknown>);
}
export interface ValidationError extends BaseError {
    field: string;
    value: unknown;
    constraints: Record<string, string>;
}
export interface DatabaseError extends BaseError {
    query?: string;
    parameters?: unknown[];
    entity?: string;
}
export interface ApiError extends BaseError {
    path: string;
    method: string;
    requestId?: string;
}
export interface ErrorResponse {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
    timestamp: Date;
}
export interface ErrorHandlerOptions {
    logErrors?: boolean;
    includeStackTrace?: boolean;
    maskSensitiveData?: boolean;
}
export interface ErrorLogEntry {
    id: string;
    error: BaseError;
    context?: Record<string, unknown>;
    timestamp: Date;
    handled: boolean;
    resolution?: string;
}
//# sourceMappingURL=error.d.ts.map