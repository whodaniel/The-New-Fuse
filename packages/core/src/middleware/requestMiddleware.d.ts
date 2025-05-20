import { Request } from 'express';
import { MetricsCollector } from '../monitoring/metricsCollector.js';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        permissions: string[];
    };
}
export interface RequestContext {
    startTime: number;
    requestId: string;
    userId?: string;
    route: string;
}
export declare class RequestMiddleware {
    private readonly metricsCollector;
    private readonly rateLimiter;
    private readonly jwtSecret;
    private readonly excludedPaths;
    constructor(metricsCollector: MetricsCollector, options: {
        jwtSecret: string;
        rateLimit?: {
            windowMs: number;
            maxRequests: number;
        };
        excludedPaths?: string[];
    });
    authenticate: number;
    logger: any;
    info(: any, { method, async }: {
        method: any;
        async: any;
    }): any;
}
