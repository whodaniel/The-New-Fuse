/**
 * Types related to health checks
 * This is a partial implementation to resolve TypeScript errors
 */
export interface HealthIndicatorResult {
    status: string;
    [key: string]: any;
}
export interface HealthCheckResult {
    status: string;
    info?: Record<string, unknown>;
    error?: Record<string, unknown>;
    details: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map