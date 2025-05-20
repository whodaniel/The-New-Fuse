import { Redis } from 'ioredis';
import { Logger } from 'winston';
export declare class SecurityManager {
    private redis;
    private logger;
    private config;
    private tokenValidator;
    private accessControl;
    private auditLogger;
    constructor(redis: Redis, logger: Logger, config: {
        jwtSecret: string;
        rateLimit: {
            windowMs: number;
            max: number;
        };
        cors: {
            origin: string[];
            methods: string[];
        };
    }, tokenValidator: TokenValidator, accessControl: AccessControl, auditLogger: AuditLogger);
    setupSecurity(app: unknown): void;
    private corsMiddleware;
    private rateLimitMiddleware;
}
