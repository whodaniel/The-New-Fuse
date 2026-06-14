/**
 * Health check service
 * Monitors the health of application dependencies
 * Updated to use Drizzle ORM instead of Drizzle
 */
import { DatabaseService } from './database.service.js';
import { HealthIndicator } from '@nestjs/terminus';
interface HealthIndicatorResult {
    [key: string]: {
        status: string;
        message?: string;
    };
}
export declare class HealthService extends HealthIndicator {
    private readonly database;
    private readonly logger;
    constructor(database: DatabaseService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
/**
 * Service health information
 */
export interface ServiceHealth {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    message: string;
}
/**
 * Overall health check result
 */
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        [key: string]: ServiceHealth;
    };
}
export {};
//# sourceMappingURL=health.service.d.ts.map