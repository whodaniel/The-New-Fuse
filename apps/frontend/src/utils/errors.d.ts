export declare class AppError extends Error {
    code: string;
    status?: number;
    details?: Record<string, any>;
    constructor(message: string, code?: string, status?: number, details?: Record<string, any>);
    toJSON(): Record<string, any>;
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class NetworkError extends AppError {
    constructor(message?: string);
}
export interface ErrorHandlerOptions {
    silent?: boolean;
    throwError?: boolean;
    context?: Record<string, any>;
}
export declare function handleError(error: Error | AppError | unknown, options?: ErrorHandlerOptions): AppError;
export declare function isAppError(error: unknown): error is AppError;
export declare function getErrorMessage(error: unknown): string;
export declare function createErrorFromResponse(response: Response): AppError;
export declare function tryAsync<T>(promise: Promise<T>, options?: ErrorHandlerOptions): Promise<[T | null, AppError | null]>;
