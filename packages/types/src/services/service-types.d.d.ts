export declare enum ServiceStatusType {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    ERROR = "ERROR",
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELED = "CANCELED",
    PAUSED = "PAUSED"
}
export interface BaseServiceConfig {
    id?: string;
    name: string;
    version: string;
    description?: string;
    status?: ServiceStatusType;
    config?: Record<string, unknown>;
}
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
}
export type AsyncServiceResult<T> = Promise<ServiceResult<T>>;
export type _ServiceStatus = ServiceStatusType;
export interface BaseService {
    initialize(): Promise<void>;
    healthCheck(): Promise<ServiceResult<boolean>>;
    getStatus(): ServiceStatusType;
    getMetrics(): Promise<Record<string, unknown>>;
    shutdown(): Promise<void>;
}
export interface ServiceError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface ServiceEventMap {
    'status-change': ServiceStatusType;
    'error': ServiceError;
    'metrics': Record<string, unknown>;
}
//# sourceMappingURL=service-types.d.d.ts.map