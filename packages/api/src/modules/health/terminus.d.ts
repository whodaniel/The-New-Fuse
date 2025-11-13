/**
 * Decorators for health checks
 */
export declare function HealthCheck(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Service for running health checks
 */
export declare class HealthCheckService {
    check(checks: Array<() => Promise<any> | any>): Promise<{
        status: string;
        info: {};
        error: {};
        details: any;
    } | {
        status: string;
        info: {};
        error: {
            message: string;
        };
        details: {
            error: string;
        };
    }>;
}
/**
 * Base class for all health indicators
 */
export declare class HealthIndicator {
    protected getStatus(key: string, isHealthy: boolean, data?: {
        [key: string]: any;
    }): Promise<Record<string, any>>;
}
/**
 * Prisma health indicator
 */
export declare class PrismaHealthIndicator extends HealthIndicator {
    constructor();
    pingCheck(key: string, prismaService: any): Promise<Record<string, any>>;
}
/**
 * Error thrown when a health check fails
 */
export declare class HealthCheckError extends Error {
    causes: any;
    constructor(message: string, causes: any);
}
//# sourceMappingURL=terminus.d.ts.map