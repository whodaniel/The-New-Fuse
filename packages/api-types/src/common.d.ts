/**
 * Common type definitions shared across the API
 * Re-exports common types from @the-new-fuse/types
 */
export type UUID = string;
export type ISODateTime = string;
export interface Pagination {
    page: number;
    limit: number;
    total?: number;
    offset?: number;
}
export interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}
export interface FilterOptions {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
    value: unknown;
}
export interface QueryOptions {
    pagination?: Pagination;
    sort?: SortOptions[];
    filters?: FilterOptions[];
    search?: string;
    include?: string[];
}
export interface HealthCheck {
    status: 'ok' | 'error';
    timestamp: ISODateTime;
    version: string;
    services?: {
        [key: string]: {
            status: 'ok' | 'error';
            message?: string;
        };
    };
}
export interface HealthIndicatorResult {
    [key: string]: {
        status: string;
        message?: string;
    };
}
export declare class HealthCheckError extends Error {
    causes: HealthIndicatorResult;
    constructor(message: string, causes: HealthIndicatorResult);
}
export interface BaseResponse<T, E = unknown> {
    success: boolean;
    data?: T;
    error?: E;
    message?: string;
    meta?: Record<string, unknown>;
}
export interface ApiResponse<T> extends BaseResponse<T, string> {
    meta?: {
        pagination?: Pagination;
        [key: string]: unknown;
    };
}
export declare enum MessageType {
    COMMAND = "command",
    TASK_ASSIGNMENT = "task_assignment",
    NOTIFICATION = "notification"
}
export interface Message {
    id: UUID;
    type: MessageType;
    payload: any;
}
