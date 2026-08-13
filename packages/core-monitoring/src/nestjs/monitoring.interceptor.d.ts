/**
 * NestJS Monitoring Interceptor
 * Intercepts HTTP requests for logging and metrics
 */
export interface RequestMetadata {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
}
/**
 * Monitoring interceptor implementation
 * This is a template that can be used in NestJS services
 */
export declare class MonitoringInterceptorTemplate {
    /**
     * Intercept method that can be used in NestJS CallHandler
     */
    static intercept(context: any, next: any, services: {
        logger?: any;
        metrics?: any;
        sentry?: any;
    }): Promise<any>;
}
/**
 * Error filter template for NestJS
 */
export declare class ErrorFilterTemplate {
    static catch(exception: any, host: any, services: {
        logger?: any;
        sentry?: any;
    }): void;
}
//# sourceMappingURL=monitoring.interceptor.d.ts.map