/**
 * API Types
 *
 * This file contains type definitions for the API package.
 */
import { BaseResponse } from './response';
/**
 * API Client configuration options
 */
export interface ApiClientOptions {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}
/**
 * API Error response
 */
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}
/**
 * API Response wrapper
 */
export type ApiResponse<T> = BaseResponse<T, ApiError>;
//# sourceMappingURL=types.d.ts.map