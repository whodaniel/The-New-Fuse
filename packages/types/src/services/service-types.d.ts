export interface BaseServiceConfig {
    enabled?: boolean;
    debug?: boolean;
}
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
}
export interface AsyncServiceResult<T> extends Promise<ServiceResult<T>> {
}
export declare enum ServiceStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
}
export type ServiceStatusType = 'pending' | 'running' | 'completed' | 'failed';
//# sourceMappingURL=service-types.d.ts.map