export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        timestamp?: number;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface ApiError extends Error {
    code: string;
    details?: any;
    statusCode?: number;
}
export declare class ApiErrorFactory {
    static create(message: string, code: string, details?: any, statusCode?: number): ApiError;
}
export interface ApiConfig {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    withCredentials?: boolean;
}
export interface ApiRequestOptions {
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
}
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface ApiRequest {
    method: HttpMethod;
    endpoint: string;
    data?: any;
    options?: ApiRequestOptions;
}
